<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from "vue";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { useRoute, useRouter } from "vue-router";
import Loader from "@/components/ui/Loader.vue";
import { useBreakpoints } from "@/composables/useBreakpoints";
import { timeAgo } from "@/utils/time";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog.vue";
import { useI18n } from "vue-i18n";
import {
  PaperAirplaneIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from "@heroicons/vue/24/solid";
import { getSocket } from "@/utils/socket";
import { useToast } from "@/composables/useToast";

const { isMobile } = useBreakpoints();
const chatStore = useChatStore();
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { showToast } = useToast();

const newMessage = ref("");
const messagesContainer = ref<HTMLElement | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const confirmDeleteVisible = ref(false);
let conversationToDelete = ref<string | null>(null);
const initialLoadDone = ref(false);

const selectedConversationId = computed({
  get: () => chatStore.activeConversationId,
  set: (id) => chatStore.setActiveConversation(id),
});

const conversationList = computed(() => {
  const mapped = chatStore.conversations.map((c) => ({
    ...c,
    otherParticipant: c.participants.find((p) => p._id !== auth.user?._id),
    lastMessage:
      c.lastMessage ||
      (c.messages.length > 0 ? c.messages[c.messages.length - 1] : null),
  }));

  return mapped.sort((a, b) => {
    const timeA = new Date(
      a.lastMessage?.createdAt || a.lastActivity || 0
    ).getTime();
    const timeB = new Date(
      b.lastMessage?.createdAt || b.lastActivity || 0
    ).getTime();

    return timeB - timeA;
  });
});

const selectedConversation = computed(
  () =>
    conversationList.value.find(
      (c) => c._id === selectedConversationId.value
    ) || null
);

const otherUser = computed(() => selectedConversation.value?.otherParticipant);

const otherUserIsOnline = computed(() => {
  if (!otherUser.value) return false;
  if (otherUser.value.isOnline) return true;
  if (!otherUser.value.lastSeen) return false;

  const diff =
    (new Date().getTime() - new Date(otherUser.value.lastSeen).getTime()) /
    1000;
  return diff < 60;
});

const formatTime = (dateString: string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const scrollToEnd = async (smooth: boolean = false) => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: smooth ? "smooth" : "instant",
    });
  }
};

const sendMessage = async () => {
  if (!selectedConversationId.value || !newMessage.value.trim()) return;

  const content = newMessage.value;
  const convId = selectedConversationId.value;

  newMessage.value = "";
  resetTextareaHeight();

  try {
    await chatStore.sendMessage(convId, content);
    scrollToEnd(true);
  } catch (error) {
    newMessage.value = content;
    showToast(t("chat.chatError"), "error");
  }
};

const confirmDelete = async () => {
  if (!conversationToDelete.value) return;
  try {
    await chatStore.deleteConversation(conversationToDelete.value);
    if (selectedConversationId.value === conversationToDelete.value) {
      selectedConversationId.value = null;
      router.replace({ name: "chat" });
    }
    showToast(t("chat.chatDel.success"), "success");
  } catch (error) {
    showToast(t("chat.chatDel.error"), "error");
  } finally {
    confirmDeleteVisible.value = false;
    conversationToDelete.value = null;
  }
};

onMounted(async () => {
  chatStore.setScrollFunction(scrollToEnd);
  const convId = route.query.id as string;

  try {
    if (!getSocket() && auth.isAuthenticated && auth.token) {
      await chatStore.initializeChat(auth.token);
    }
    if (chatStore.conversations.length === 0) {
      await chatStore.fetchConversations();
    }
    if (convId) {
      chatStore.setActiveConversation(convId);
      if (!chatStore.conversations.find((c) => c._id === convId)) {
        await chatStore.fetchConversations();
      }
    }
  } catch (error) {
    showToast(t("chat.chatErrorInit"), "error");
  }

  initialLoadDone.value = true;
  if (selectedConversation.value) scrollToEnd(true);
});

onUnmounted(() => {
  chatStore.setScrollFunction(null);
  if (selectedConversationId.value) chatStore.setActiveConversation(null);
});

watch(
  () => selectedConversation.value?.messages.length,
  (newVal, oldVal) => {
    if (newVal && (!oldVal || newVal > oldVal)) {
      scrollToEnd(initialLoadDone.value && oldVal !== undefined);
    }
  }
);

watch(selectedConversationId, (newId) => {
  router.replace({ name: "chat", query: newId ? { id: newId } : {} });
  if (newId) scrollToEnd();
});

const handleBackToConversations = () => {
  selectedConversationId.value = null;
};

const resetTextareaHeight = () => {
  if (textareaRef.value) textareaRef.value.style.height = "auto";
};

const autoResize = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  target.style.height = "auto";
  target.style.height = Math.min(target.scrollHeight, 120) + "px";
};

const onDelete = (e: Event, _id: string) => {
  e.stopPropagation();
  conversationToDelete.value = _id;
  confirmDeleteVisible.value = true;
};

const lastReadMessageIndex = computed(() => {
  const messages = selectedConversation.value?.messages || [];
  const otherId = otherUser.value?._id;

  if (!auth.user || !otherId) return -1;

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg && msg.senderId === auth.user._id && msg.readBy.includes(otherId)) {
      return i;
    }
  }
  return -1;
});

const lastSentMessageIndex = computed(() => {
  const messages = selectedConversation.value?.messages || [];
  const otherId = otherUser.value?._id;

  if (!auth.user || !otherId) return -1;

  const lastRead = lastReadMessageIndex.value;

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (
      msg &&
      msg.senderId === auth.user._id &&
      !msg.readBy.includes(otherId) &&
      i > lastRead
    ) {
      return i;
    }
  }
  return -1;
});
</script>

<template>
  <div
    class="relative w-full max-w-7xl mx-auto bg-white md:rounded-3xl shadow-2xl overflow-hidden md:border border-gray-100 flex"
    :class="[
      isMobile
        ? 'h-[calc(100dvh-5rem)] rounded-none border-0'
        : 'h-[82vh] rounded-3xl',
    ]"
  >
    <div
      class="flex flex-col border-r border-gray-100 bg-white transition-all duration-300 absolute md:relative z-20 w-full md:w-80 lg:w-96 h-full"
      :class="[
        isMobile && selectedConversationId
          ? '-translate-x-full'
          : 'translate-x-0',
      ]"
    >
      <div
        @click="!isMobile && handleBackToConversations()"
        class="h-20 px-6 border-b border-gray-100 flex justify-between items-center bg-white"
      >
        <h2
          class="text-2xl font-bold text-gray-800 transition duration-150"
          :class="{ 'cursor-pointer hover:text-[#F77821]': !isMobile }"
        >
          {{ t("chat.conversations") }}
        </h2>
      </div>

      <div class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        <Loader v-if="chatStore.loading" class="mt-4" />

        <div
          v-else-if="conversationList.length === 0"
          class="text-center text-gray-400 mt-10 p-4"
        >
          {{ t("chat.noConversations") }}
        </div>

        <div
          v-for="c in conversationList"
          :key="c._id"
          @click="selectedConversationId = c._id"
          class="group flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200"
          :class="
            selectedConversationId === c._id
              ? 'bg-orange-50 ring-1 ring-[#F77821]/20'
              : 'hover:bg-gray-50'
          "
        >
          <div class="relative shrink-0">
            <img
              v-if="c.otherParticipant?.avatarUrl"
              :src="c.otherParticipant.avatarUrl"
              class="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border border-gray-200"
            />
            <div
              v-else
              class="w-12 h-12 md:w-14 md:h-14 bg-orange-100 text-[#F77821] text-2xl rounded-full flex items-center justify-center font-bold object-cover border border-gray-200"
            >
              {{ c.otherParticipant?.name?.[0]?.toUpperCase() || "?" }}
            </div>
            <span
              v-if="c.otherParticipant?.isOnline"
              class="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"
            ></span>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-baseline mb-1">
              <span
                class="text-[15px] text-gray-900 truncate"
                :class="c.unreadCount > 0 ? 'font-bold' : 'font-semibold'"
              >
                {{ c.otherParticipant?.name || t("chat.unknownUser") }}
              </span>

              <span
                class="text-xs text-gray-400 whitespace-nowrap ml-2 font-medium"
              >
                {{
                  t(timeAgo(c.lastMessage?.createdAt || c.lastActivity).key, {
                    n: timeAgo(c.lastMessage?.createdAt || c.lastActivity)
                      .value,
                  })
                }}
              </span>
            </div>

            <div class="flex justify-between items-center">
              <p
                class="text-sm truncate w-full pr-2"
                :class="
                  c.unreadCount > 0
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-500'
                "
              >
                <span
                  v-if="c.lastMessage?.senderId === auth.user?._id"
                  class="mr-1 text-gray-400"
                  >{{ t("chat.you") }}:</span
                >

                {{ c.lastMessage?.content || t("chat.startedConversation") }}
              </p>

              <span
                v-if="c.unreadCount > 0"
                class="ml-2 bg-[#F77821] text-white text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[1.25rem] text-center shadow-sm shadow-orange-200"
              >
                {{ c.unreadCount }}
              </span>

              <button
                @click="(e) => onDelete(e, c._id)"
                class="ml-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
                :title="t('chat.delete')"
              >
                <TrashIcon class="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="flex-1 flex flex-col h-full bg-[#f8f9fa] transition-transform duration-300 absolute md:relative w-full z-10"
      :class="[
        isMobile && !selectedConversationId
          ? 'translate-x-full'
          : 'translate-x-0',
      ]"
    >
      <div
        v-if="!selectedConversationId && !isMobile"
        class="flex-1 flex flex-col items-center justify-center text-gray-400 p-8"
      >
        <div
          class="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100"
        >
          <PaperAirplaneIcon class="w-10 h-10 text-gray-300 ml-1" />
        </div>

        <h3 class="text-xl font-bold text-gray-600 mb-2">
          {{ t("chat.selectToStart") }}
        </h3>

        <p class="text-sm text-gray-500">{{ t("chat.startTip") }}</p>
      </div>

      <template v-else-if="selectedConversation">
        <div
          class="h-20 px-6 bg-white/95 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between shrink-0 shadow-sm z-20"
        >
          <div class="flex items-center gap-4">
            <button
              v-if="isMobile"
              @click="handleBackToConversations"
              class="mr-1 p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeftIcon class="w-6 h-6" />
            </button>

            <img
              v-if="otherUser?.avatarUrl"
              :src="otherUser.avatarUrl"
              class="w-12 h-12 rounded-full object-cover border border-gray-100"
            />
            <div
              v-else
              class="w-12 h-12 bg-orange-100 text-[#F77821] rounded-full flex items-center justify-center font-bold object-cover border border-gray-200"
            >
              {{ otherUser?.name?.[0]?.toUpperCase() }}
            </div>

            <div class="flex flex-col">
              <span class="text-lg font-bold text-gray-800 leading-tight">{{
                otherUser?.name
              }}</span>
              <span
                class="text-xs font-medium"
                :class="otherUserIsOnline ? 'text-green-600' : 'text-gray-400'"
              >
                {{
                  otherUserIsOnline
                    ? t("chat.online")
                    : t(timeAgo(otherUser?.lastSeen).key, {
                        n: timeAgo(otherUser?.lastSeen).value,
                      })
                }}
              </span>
            </div>
          </div>

          <button
            @click="(e) => onDelete(e, selectedConversation!._id)"
            class="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <TrashIcon class="w-6 h-6" />
          </button>
        </div>

        <div
          ref="messagesContainer"
          class="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6"
          style="
            background-image: radial-gradient(#e5e7eb 1px, transparent 1px);
            background-size: 24px 24px;
          "
        >
          <div
            v-for="(msg, index) in selectedConversation.messages"
            :key="msg._id"
            class="flex flex-col"
            :class="{
              'items-end': msg.senderId === auth.user?._id,
              'items-start': msg.senderId !== auth.user?._id,
            }"
          >
            <div
              class="max-w-[85%] md:max-w-[70%] px-5 py-3 text-[15px] md:text-base shadow-sm relative group"
              :class="[
                msg.senderId === auth.user?._id
                  ? 'bg-[#F77821] text-white rounded-2xl rounded-tr-none shadow-orange-100'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-none shadow-gray-100',
              ]"
            >
              <div class="break-words leading-relaxed whitespace-pre-wrap">
                {{ msg.content }}
              </div>

              <div
                class="flex items-center justify-end gap-1 mt-1.5 text-[11px] opacity-80 select-none"
                :class="
                  msg.senderId === auth.user?._id
                    ? 'text-white/90'
                    : 'text-gray-400'
                "
              >
                <span>{{ formatTime(msg.createdAt) }}</span>
              </div>
            </div>

            <div
              v-if="index === lastReadMessageIndex"
              class="flex flex-row justify-center items-center gap-1 text-[11px] text-gray-400 font-medium mt-1 pr-1"
            >
              {{ t("chat.mess.read") }}
              <CheckCircleIcon class="h-3.5 w-3.5 text-green-500" />
            </div>
            <div
              v-else-if="index === lastSentMessageIndex"
              class="text-[11px] text-gray-400 mt-1 pr-1"
            >
              {{ t("chat.mess.sent") }}
            </div>
          </div>
        </div>

        <div class="p-4 md:p-5 bg-white border-t border-gray-100 shrink-0 z-20">
          <div
            class="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-3xl p-3 focus-within:ring-2 focus-within:ring-[#F77821]/20 focus-within:border-[#F77821] transition-all shadow-sm"
          >
            <textarea
              ref="textareaRef"
              v-model="newMessage"
              @keydown.enter.prevent="sendMessage"
              @input="autoResize"
              :placeholder="t('chat.writeMessage')"
              class="flex-1 outline-none bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[24px] py-1 px-2 text-gray-700 placeholder-gray-400 text-base"
              rows="1"
            ></textarea>

            <button
              @click="sendMessage"
              :disabled="!newMessage.trim()"
              class="p-2.5 rounded-xl transition-all"
              :class="
                newMessage.trim()
                  ? 'bg-[#F77821] text-white shadow-md'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              "
            >
              <PaperAirplaneIcon class="w-5 h-5 -rotate-45" />
            </button>
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
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 20px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
</style>
