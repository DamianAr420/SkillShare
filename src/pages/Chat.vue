<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from "vue";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { useRoute, useRouter } from "vue-router";
import Loader from "@/components/ui/Loader.vue";
import { io } from "socket.io-client";
import { useBreakpoints } from "@/composables/useBreakpoints";
import ArrowLeft from "@/assets/icons/ArrowLeft.vue";
import { timeAgo } from "@/utils/time";
import { type User } from "@/types/user";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog.vue";
import { useI18n } from "vue-i18n";

const { isMobile } = useBreakpoints();

const chatStore = useChatStore();
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const socket = io("https://skillshare-tgfy.onrender.com", {
  transports: ["websocket"],
});

const selectedConversationId = ref<string | null>(null);
const newMessage = ref("");
const messagesContainer = ref<HTMLElement | null>(null);
const showMobileChat = ref(false);
const onlineCheckInterval = ref<number | null>(null);
const confirmDeleteVisible = ref(false);
let conversationToDelete = ref<string | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

onMounted(async () => {
  await chatStore.fetchConversations();

  const convId = route.query.id as string;
  if (convId) {
    selectedConversationId.value = convId;
    await chatStore.fetchConversation(convId);
  }

  await nextTick();
  scrollToEnd();
});

const scrollToEnd = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

watch(
  () => [
    selectedConversationId.value,
    chatStore.conversations.map((c) => c.messages.length),
  ],
  scrollToEnd
);

watch(selectedConversationId, (id) => {
  if (id) {
    socket.emit("joinRoom", id);
    if (isMobile.value) showMobileChat.value = true;
  }
});

watch(selectedConversationId, (newVal) => {
  if (!newVal) return;

  router.replace({
    name: "chat",
    query: {
      id: newVal,
    },
  });
});

socket.on("newMessage", (msg) => {
  const conv = chatStore.conversations.find(
    (c) => c._id === msg.conversationId
  );
  if (conv) {
    if (!conv.messages) conv.messages = [];
    conv.messages.push(msg);
    nextTick(() => scrollToEnd());
  }
});

socket.on("userOnlineStatus", (user: User) => {
  chatStore.conversations.forEach((conv) => {
    conv.participants.forEach((p: any) => {
      if (p._id === user._id) {
        p.lastSeen = user.lastSeen;
      }
    });
  });
});

const sendMessage = async () => {
  if (!selectedConversationId.value || !newMessage.value.trim()) return;

  const msg = await chatStore.sendMessage(
    selectedConversationId.value,
    newMessage.value
  );

  socket.emit("sendMessage", {
    conversationId: selectedConversationId.value,
    message: msg,
  });

  newMessage.value = "";

  await nextTick();
  resetTextareaHeight();
  scrollToEnd();
};

const resetTextareaHeight = () => {
  if (!textareaRef.value) return;
  const el = textareaRef.value;
  el.style.height = "auto";
};

const selectedConversation = computed(() => {
  return (
    chatStore.conversations.find(
      (c) => c._id === selectedConversationId.value
    ) || null
  );
});

const getOtherParticipant = (conversation: any) => {
  return conversation.participants.find((p: any) => p._id !== auth.user?._id);
};

const otherUser = computed(() =>
  getOtherParticipant(selectedConversation.value)
);

const otherUserIsOnline = computed(() => {
  if (!otherUser.value?.lastSeen) return false;

  const lastSeen = new Date(otherUser.value.lastSeen);
  const now = new Date();
  const diff = (now.getTime() - lastSeen.getTime()) / 1000;

  return diff < 60;
});

const menuState = ref<{ id: string | null; type: "list" | "chat" | null }>({
  id: null,
  type: null,
});

const toggleMenu = (id: string, type: "list" | "chat") => {
  if (menuState.value.id === id && menuState.value.type === type) {
    menuState.value = { id: null, type: null };
  } else {
    menuState.value = { id, type };
  }
};

const closeMenu = () => {
  menuState.value = { id: null, type: null };
};

document.addEventListener("click", closeMenu);

const onArchive = (id: string) => {
  console.log("archive", id);
};

const onMarkAsRead = (id: string) => {
  console.log("markAsRead", id);
};

const onDelete = (id: string) => {
  conversationToDelete.value = id;
  confirmDeleteVisible.value = true;
};

document.addEventListener("click", closeMenu);

const confirmDelete = async () => {
  if (!conversationToDelete.value) return;

  await chatStore.deleteConversation(conversationToDelete.value);

  if (selectedConversationId.value === conversationToDelete.value) {
    selectedConversationId.value = null;
    router.replace({ name: "chat", query: {} });
  }

  confirmDeleteVisible.value = false;
  conversationToDelete.value = null;
};

const getLastMessage = (conversation: any) => {
  return conversation.messages.length
    ? conversation.messages[conversation.messages.length - 1]
    : null;
};

onMounted(() => {
  socket.emit("heartbeat", { userId: auth.user?._id });
  setInterval(() => {
    socket.emit("heartbeat", { userId: auth.user?._id });
  }, 30000);

  onlineCheckInterval.value = window.setInterval(() => {}, 1000);
});

onUnmounted(() => {
  if (onlineCheckInterval.value) clearInterval(onlineCheckInterval.value);
});

const autoResize = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  target.style.height = "auto";
  target.style.height = target.scrollHeight + "px";
  scrollToEnd();
};
</script>

<template>
  <div class="h-[80vh] min-h-[400px] max-w-6xl mx-auto">
    <!-- ============ MOBILE ============ -->
    <template v-if="isMobile">
      <!-- LISTA ROZMÓW -->
      <div
        v-if="!showMobileChat"
        class="bg-white shadow-md rounded-xl p-4 overflow-y-auto h-full"
      >
        <h3 class="font-bold mb-4 text-xl">{{ t("chat.conversations") }}</h3>
        <Loader
          v-if="chatStore.loading"
          :text="t('chat.loadingConversations')"
        />

        <div v-else>
          <div
            v-for="c in chatStore.conversations"
            :key="c._id"
            class="flex items-center gap-3 my-2 p-3 rounded-xl cursor-pointer active:scale-[0.97] transition bg-white border border-gray-100 shadow-sm hover:shadow-md relative"
            @click="selectedConversationId = c._id"
          >
            <img
              v-if="getOtherParticipant(c)?.avatarUrl"
              :src="getOtherParticipant(c)?.avatarUrl"
              class="w-12 h-12 rounded-full object-cover shadow-sm"
            />

            <div class="flex-1 min-w-0">
              <div class="font-semibold text-base truncate">
                {{ getOtherParticipant(c)?.name || t("chat.unknownUser") }}
              </div>
              <div class="text-gray-500 text-sm truncate">
                <span v-if="getLastMessage(c)">
                  <strong>
                    {{
                      getLastMessage(c)?.senderId === auth.user?._id
                        ? t("chat.you")
                        : getOtherParticipant(c)?.name || t("chat.unknownUser")
                    }}
                  </strong>
                  {{ getLastMessage(c)?.content }}
                </span>
                <span v-else class="italic">{{ t("chat.noMessages") }}</span>
              </div>
            </div>

            <!-- MENU TRZY KROPKI -->
            <div @click.stop class="relative">
              <button
                @click.stop="toggleMenu(c._id, 'list')"
                class="text-xl px-2 py-1 rounded hover:bg-gray-200"
              >
                ⋮
              </button>

              <div
                v-if="menuState.id === c._id && menuState.type === 'list'"
                class="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-md z-20"
              >
                <button
                  @click.stop="onArchive(c._id)"
                  class="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  {{ t("chat.archive") }}
                </button>
                <button
                  @click.stop="onMarkAsRead(c._id)"
                  class="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  {{ t("chat.markAsRead") }}
                </button>
                <button
                  @click.stop="onDelete(c._id)"
                  class="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                >
                  {{ t("chat.deleteChat") }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- OKNO CZATU -->
      <div
        class="bg-white shadow-md rounded-xl p-0 flex flex-col h-full overflow-hidden"
        v-else
      >
        <!-- HEADER -->
        <div
          class="flex items-center h-16 px-4 mb-2 shadow-md bg-white z-10 relative"
        >
          <button
            class="flex items-center justify-center w-10 h-10 bg-[#F77821] rounded-xl text-white active:scale-95 transition"
            @click="(showMobileChat = false), (selectedConversationId = null)"
          >
            <ArrowLeft class="w-6 h-6" />
          </button>

          <div class="flex items-center gap-3 ml-4">
            <img
              :src="getOtherParticipant(selectedConversation)?.avatarUrl"
              alt="avatar"
              class="w-11 h-11 rounded-full object-cover shadow-sm"
            />

            <div class="flex flex-col leading-tight">
              <span class="font-semibold text-[15px]">
                {{ getOtherParticipant(selectedConversation)?.name }}
              </span>

              <div class="flex items-center gap-1 text-xs text-gray-500">
                <span
                  :class="[
                    'inline-block w-2 h-2 rounded-full',
                    otherUserIsOnline ? 'bg-green-500' : 'bg-gray-400',
                  ]"
                ></span>
                <span>
                  {{
                    otherUserIsOnline
                      ? t("chat.online")
                      : timeAgo(otherUser?.lastSeen)
                  }}
                </span>
              </div>
            </div>
            <div class="relative" @click.stop>
              <button
                @click.stop="
                  toggleMenu(
                    selectedConversationId ? selectedConversationId : '',
                    'chat'
                  )
                "
                class="text-2xl px-2 py-1 rounded hover:bg-gray-200"
              >
                ⋮
              </button>

              <div
                v-if="
                  menuState.id === selectedConversationId &&
                  menuState.type === 'chat'
                "
                class="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-md z-20"
              >
                <button
                  @click.stop="onArchive(selectedConversationId!)"
                  class="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  {{ t("chat.archive") }}
                </button>
                <button
                  @click.stop="onMarkAsRead(selectedConversationId!)"
                  class="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  {{ t("chat.markAsRead") }}
                </button>
                <button
                  @click.stop="onDelete(selectedConversationId!)"
                  class="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                >
                  {{ t("chat.deleteChat") }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- WIADOMOŚCI -->
        <div
          ref="messagesContainer"
          class="flex-1 overflow-y-auto px-3 space-y-2 pb-2"
        >
          <div
            v-for="msg in selectedConversation?.messages || []"
            :key="msg._id"
            class="flex"
            :class="{
              'justify-end': msg.senderId === auth.user?._id,
              'justify-start': msg.senderId !== auth.user?._id,
            }"
          >
            <div
              :class="{
                'bg-[#F77821] text-white': msg.senderId === auth.user?._id,
                'bg-gray-200 text-gray-800': msg.senderId !== auth.user?._id,
              }"
              class="px-4 py-2 rounded-2xl max-w-[75%] text-[15px] leading-snug shadow-sm break-words break-all"
            >
              {{ msg.content }}
            </div>
          </div>
        </div>

        <!-- MOBILE INPUT -->
        <div
          class="flex gap-2 mt-2 w-full items-end p-3 bg-white shadow-[0px_0px_6px_-1px_rgba(0,0,0,0.5)]"
        >
          <div class="flex-1 relative w-full flex items-end">
            <textarea
              ref="textareaRef"
              v-model="newMessage"
              @keyup.enter="sendMessage"
              @input="autoResize"
              :placeholder="t('chat.writeMessage')"
              maxlength="500"
              class="w-full border border-gray-300 rounded-lg px-2 pt-2 pb-3 focus:outline-none focus:ring-2 focus:ring-[#F77821] resize-none overflow-y-auto text-[15px] max-h-50"
              rows="1"
            ></textarea>
            <span class="absolute right-3 bottom-0 text-xs text-gray-400">
              {{ newMessage.length }}/500
            </span>
          </div>

          <button
            @click="sendMessage"
            class="w-16 bg-[#F77821] text-center text-xs text-white px-4 py-2 rounded-lg hover:bg-[#EA580C] transition cursor-pointer"
          >
            {{ t("chat.send") }}
          </button>
        </div>
      </div>
    </template>

    <!-- ============ DESKTOP ============ -->
    <template v-else>
      <div class="flex flex-row h-full gap-4">
        <!-- lista -->
        <div class="w-1/3 bg-white shadow rounded p-4 overflow-y-auto">
          <h3 class="font-bold mb-3 text-lg">{{ t("chat.conversations") }}</h3>

          <Loader
            v-if="chatStore.loading"
            :text="t('chat.loadingConversations')"
          />

          <div v-else>
            <div
              v-for="c in chatStore.conversations"
              :key="c._id"
              class="flex items-center gap-3 my-2 p-2 rounded cursor-pointer hover:bg-gray-100 transition relative"
              @click="selectedConversationId = c._id"
              :class="{ 'bg-gray-100': selectedConversationId === c._id }"
            >
              <img
                v-if="getOtherParticipant(c)?.avatarUrl"
                :src="getOtherParticipant(c)?.avatarUrl"
                class="w-10 h-10 rounded-full object-cover"
              />

              <div class="flex-1 min-w-0">
                <div class="font-semibold truncate">
                  {{ getOtherParticipant(c)?.name || t("chat.unknownUser") }}
                </div>
                <div class="text-gray-500 text-sm truncate">
                  <span v-if="getLastMessage(c)">
                    <strong>
                      {{
                        getLastMessage(c)?.senderId === auth.user?._id
                          ? t("chat.you")
                          : getOtherParticipant(c)?.name ||
                            t("chat.unknownUser")
                      }}
                    </strong>
                    {{ getLastMessage(c)?.content }}
                  </span>
                  <span v-else class="italic">{{ t("chat.noMessages") }}</span>
                </div>
              </div>

              <!-- === MENU TRZY KROPKI === -->
              <div @click.stop class="relative">
                <button
                  @click.stop="toggleMenu(c._id, 'list')"
                  class="text-xl px-2 py-1 rounded hover:bg-gray-200"
                >
                  ⋮
                </button>

                <div
                  v-if="menuState.id === c._id && menuState.type === 'list'"
                  class="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-md z-20"
                >
                  <button
                    @click.stop="onArchive(c._id)"
                    class="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    {{ t("chat.archive") }}
                  </button>
                  <button
                    @click.stop="onMarkAsRead(c._id)"
                    class="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    {{ t("chat.markAsRead") }}
                  </button>
                  <button
                    @click.stop="onDelete(c._id)"
                    class="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                  >
                    {{ t("chat.deleteChat") }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- okno czatu -->
        <div
          class="flex-1 bg-white shadow rounded p-4 flex flex-col max-w-[70vw]"
        >
          <div
            v-if="selectedConversation"
            class="flex items-center h-16 px-4 mb-3 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] bg-white sticky top-0 z-0"
          >
            <!-- User info -->
            <div class="flex items-center gap-3">
              <img
                :src="getOtherParticipant(selectedConversation)?.avatarUrl"
                alt="avatar"
                class="w-11 h-11 rounded-full object-cover shadow"
              />

              <div class="flex flex-col leading-tight">
                <span class="font-semibold text-base">
                  {{ getOtherParticipant(selectedConversation)?.name }}
                </span>

                <div class="flex items-center gap-1 text-xs text-gray-500">
                  <span
                    :class="[
                      'inline-block w-2 h-2 rounded-full',
                      otherUserIsOnline ? 'bg-green-500' : 'bg-gray-400',
                    ]"
                  ></span>
                  <span>
                    {{
                      otherUserIsOnline
                        ? t("chat.online")
                        : timeAgo(otherUser?.lastSeen)
                    }}
                  </span>
                </div>
              </div>
            </div>
            <div class="ml-auto relative" @click.stop>
              <button
                @click.stop="
                  toggleMenu(
                    selectedConversationId ? selectedConversationId : '',
                    'chat'
                  )
                "
                class="text-2xl px-2 py-1 rounded hover:bg-gray-200 cursor-pointer"
              >
                ⋮
              </button>

              <div
                v-if="
                  menuState.id === selectedConversationId &&
                  menuState.type === 'chat'
                "
                class="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-md z-20"
              >
                <button
                  @click.stop="onArchive(selectedConversationId!)"
                  class="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  {{ t("chat.archive") }}
                </button>
                <button
                  @click.stop="onMarkAsRead(selectedConversationId!)"
                  class="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  {{ t("chat.markAsRead") }}
                </button>
                <button
                  @click.stop="onDelete(selectedConversationId!)"
                  class="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                >
                  {{ t("chat.deleteChat") }}
                </button>
              </div>
            </div>
          </div>
          <div
            ref="messagesContainer"
            class="flex-1 overflow-y-auto mb-2 space-y-2"
          >
            <div
              v-for="msg in selectedConversation?.messages || []"
              :key="msg._id"
              class="messBox flex"
              :class="{
                'justify-end': msg.senderId === auth.user?._id,
                'justify-start': msg.senderId !== auth.user?._id,
              }"
            >
              <div
                :class="{
                  'bg-[#F77821] text-white': msg.senderId === auth.user?._id,
                  'bg-gray-200 text-gray-800': msg.senderId !== auth.user?._id,
                }"
                class="mess px-4 py-2 rounded-lg max-w-[80%] break-words break-all"
              >
                {{ msg.content }}
              </div>
            </div>
          </div>

          <div class="flex gap-2 mt-2 w-full items-end">
            <div class="flex-1 relative w-full flex items-end">
              <textarea
                ref="textareaRef"
                v-model="newMessage"
                @keyup.enter="sendMessage"
                @input="autoResize"
                :placeholder="t('chat.writeMessage')"
                maxlength="500"
                class="w-full border border-gray-300 rounded-lg px-4 pt-2 pb-3 focus:outline-none focus:ring-2 focus:ring-[#F77821] resize-none overflow-hidden text-[15px]"
                rows="1"
              ></textarea>
              <span class="absolute right-3 bottom-0 text-xs text-gray-400">
                {{ newMessage.length }}/500
              </span>
            </div>

            <button
              @click="sendMessage"
              class="w-24 bg-[#F77821] text-white px-4 py-2 rounded-lg hover:bg-[#EA580C] transition cursor-pointer"
            >
              {{ t("chat.send") }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>

  <ConfirmDialog
    :visible="confirmDeleteVisible"
    :title="t('chat.deleteConversationTitle')"
    :message="t('chat.deleteConversationMessage')"
    :confirmText="t('chat.confirm')"
    :cancelText="t('chat.cancel')"
    @cancel="confirmDeleteVisible = false"
    @confirm="confirmDelete"
  />
</template>

<style scoped>
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}
::-webkit-scrollbar-track {
  background-color: transparent;
}

button:active {
  transform: scale(0.97);
}

.messBox:last-child .mess:last-child {
  margin-bottom: 8px;
}
</style>
