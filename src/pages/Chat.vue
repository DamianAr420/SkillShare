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
import type { Conversation } from "@/types/chat";
import type { User } from "@/types/user";
import {
  PaperAirplaneIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from "@heroicons/vue/24/solid";
import { getSocket } from "@/utils/socket";

const { isMobile } = useBreakpoints();
const chatStore = useChatStore();
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

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

const conversationList = computed(() =>
  chatStore.conversations.map((c) => ({
    ...c,
    lastMessage:
      c.lastMessage ||
      (c.messages.length > 0 ? c.messages[c.messages.length - 1] : null),
  }))
);

const selectedConversation = computed<Conversation | null>(
  () =>
    chatStore.conversations.find(
      (c) => c._id === selectedConversationId.value
    ) || null
);

const getOtherParticipant = (conv: Conversation | null): User | undefined =>
  conv?.participants.find((p) => p._id !== auth.user?._id);

const otherUser = computed(() =>
  getOtherParticipant(selectedConversation.value)
);

const otherParticipantId = computed(() => otherUser.value?._id);

const otherUserIsOnline = computed(() => {
  if (!otherUser.value?.lastSeen) return false;
  const diff =
    (new Date().getTime() - new Date(otherUser.value.lastSeen).getTime()) /
    1000;
  return otherUser.value.isOnline || diff < 60;
});

const formatTime = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

onMounted(() => {
  chatStore.setScrollFunction(scrollToEnd);
});

onUnmounted(() => {
  chatStore.setScrollFunction(null);
});

const handleBackToConversations = () => {
  selectedConversationId.value = null;
  router.replace({ name: "chat" });
};

const sendMessage = async () => {
  if (!selectedConversationId.value || !newMessage.value.trim()) return;
  const messageToSend = newMessage.value;
  newMessage.value = "";
  resetTextareaHeight();
  await chatStore.sendMessage(selectedConversationId.value, messageToSend);
  scrollToEnd(true);
};

const resetTextareaHeight = () => {
  if (!textareaRef.value) return;
  textareaRef.value.style.height = "auto";
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

const confirmDelete = async () => {
  if (!conversationToDelete.value) return;
  await chatStore.deleteConversation(conversationToDelete.value);
  if (selectedConversationId.value === conversationToDelete.value) {
    selectedConversationId.value = null;
    router.replace({ name: "chat" });
  }
  confirmDeleteVisible.value = false;
  conversationToDelete.value = null;
};

watch(
  () => selectedConversation.value?.messages.length,
  (newVal, oldVal) => {
    if (newVal && (!oldVal || newVal > oldVal)) {
      if (!initialLoadDone.value) {
        scrollToEnd(false);
      } else {
        if (newVal > oldVal!) {
          scrollToEnd(true);
        }
      }
    }
  }
);

watch(selectedConversationId, (newId) => {
  if (newId) {
    router.replace({ name: "chat", query: { id: newId } });
    scrollToEnd();
  } else {
    router.replace({ name: "chat" });
  }
});

onMounted(async () => {
  const convId = route.query.id as string;

  if (!getSocket() && auth.isAuthenticated && auth.token) {
    await chatStore.initializeChat(auth.token);
  }

  if (chatStore.conversations.length === 0) {
    await chatStore.fetchConversations();
  }

  if (convId) {
    chatStore.setActiveConversation(convId);

    if (!chatStore.conversations.find((c) => c._id === convId)) {
      await chatStore.fetchConversation(convId);
    }
  }

  initialLoadDone.value = true;

  if (selectedConversation.value) {
    scrollToEnd(true);
  }
});

const lastReadMessageIndex = computed(() => {
  if (!selectedConversation.value || !auth.user || !otherParticipantId.value) {
    return -1;
  }

  const messages = selectedConversation.value.messages;

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];

    if (!msg) continue;

    if (
      msg.senderId === auth.user._id &&
      msg.readBy.includes(otherParticipantId.value)
    ) {
      return i;
    }
  }
  return -1;
});

const lastSentMessageIndex = computed(() => {
  if (!selectedConversation.value || !auth.user || !otherParticipantId.value) {
    return -1;
  }

  if (lastReadMessageIndex.value === -1) {
    return -1;
  }

  const messages = selectedConversation.value.messages;

  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];

    if (!msg) continue;

    if (
      msg.senderId === auth.user._id &&
      !msg.readBy.includes(otherParticipantId.value)
    ) {
      return i;
    }
  }
  return -1;
});
</script>

<template>
  <div
    class="h-[80vh] w-full max-w-7xl mx-auto flex bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
  >
    <div
      class="flex flex-col border-r border-gray-100 bg-gray-50/50 transition-all duration-300 absolute md:relative z-20 w-full md:w-80 lg:w-96 h-full"
      :class="[
        isMobile && selectedConversationId
          ? '-translate-x-full'
          : 'translate-x-0',
      ]"
    >
      <div
        class="p-4 border-b border-gray-100 flex justify-between items-center bg-white"
      >
        <h2 class="text-xl font-bold text-gray-800">
          {{ t("chat.conversations") }}
        </h2>
      </div>

      <div class="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
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
          class="group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200"
          :class="
            selectedConversationId === c._id
              ? 'bg-orange-50 ring-1 ring-[#F77821]/20'
              : 'hover:bg-white hover:shadow-sm'
          "
        >
          <div class="relative">
            <img
              :src="getOtherParticipant(c)?.avatarUrl || '/default-avatar.png'"
              class="w-12 h-12 rounded-full object-cover border border-gray-200"
            />

            <span
              v-if="getOtherParticipant(c)?.isOnline"
              class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"
            ></span>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-baseline mb-0.5">
              <span
                class="font-semibold text-gray-900 truncate"
                :class="{ 'font-bold': c.unreadCount > 0 }"
              >
                {{ getOtherParticipant(c)?.name || t("chat.unknownUser") }}
              </span>

              <span class="text-xs text-gray-400 whitespace-nowrap ml-2">
                {{ timeAgo(c.lastActivity) }}
              </span>
            </div>

            <div class="flex justify-between items-center">
              <p
                class="text-sm truncate w-full"
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
                class="ml-2 bg-[#F77821] text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[1.25rem] text-center"
              >
                {{ c.unreadCount }}
              </span>

              <button
                @click="(e) => onDelete(e, c._id)"
                class="ml-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"
                :title="t('chat.delete')"
              >
                <TrashIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      class="flex-1 flex flex-col h-full bg-[#f8f9fa] transition-transform duration-300 absolute md:relative w-full"
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
          class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"
        >
          <PaperAirplaneIcon class="w-10 h-10 text-gray-300" />
        </div>

        <h3 class="text-lg font-medium text-gray-600">
          {{ t("chat.selectToStart") }}
        </h3>

        <p class="text-sm mt-1">{{ t("chat.startTip") }}</p>
      </div>

      <template v-else-if="selectedConversation">
        <div
          class="h-16 px-4 bg-white border-b border-gray-100 flex items-center justify-between shrink-0 shadow-sm z-10"
        >
          <div class="flex items-center gap-3">
            <button
              v-if="isMobile"
              @click="handleBackToConversations"
              class="mr-1 p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeftIcon class="w-5 h-5" />
            </button>

            <img
              :src="
                getOtherParticipant(selectedConversation)?.avatarUrl ||
                '/default-avatar.png'
              "
              class="w-10 h-10 rounded-full object-cover border border-gray-100"
            />

            <div class="flex flex-col">
              <span class="font-bold text-gray-800 leading-tight">
                {{ getOtherParticipant(selectedConversation)?.name }}
              </span>

              <span
                class="text-xs"
                :class="
                  otherUserIsOnline
                    ? 'text-green-600 font-medium'
                    : 'text-gray-400'
                "
              >
                {{
                  otherUserIsOnline
                    ? t("chat.online")
                    : timeAgo(otherUser?.lastSeen)
                }}
              </span>
            </div>
          </div>

          <button
            @click="(e) => onDelete(e, selectedConversation!._id)"
            class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <TrashIcon class="w-5 h-5" />
          </button>
        </div>

        <div
          ref="messagesContainer"
          class="flex-1 overflow-y-auto p-4 pt-6 space-y-4 bg-repeat"
          style="
            background-image: radial-gradient(#e5e7eb 1px, transparent 1px);
            background-size: 20px 20px;
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
              class="max-w-[75%] md:max-w-[65%] px-4 py-3 text-[15px] shadow-md relative group"
              :class="[
                msg.senderId === auth.user?._id
                  ? 'bg-[#F77821] text-white rounded-2xl rounded-tr-sm'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm',
              ]"
            >
              <div class="break-words leading-relaxed whitespace-pre-wrap">
                {{ msg.content }}
              </div>

              <div
                class="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-80"
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
              class="flex flex-row justify-center items-center gap-1 text-[10px] text-gray-500 font-medium mt-1 pr-1"
            >
              {{ t("chat.mess.read") }}
              <CheckCircleIcon class="h-3 w-3" />
            </div>
            <div
              v-else-if="index === lastSentMessageIndex"
              class="text-[10px] text-gray-400 mt-1 pr-1"
            >
              {{ t("chat.mess.sent") }}
            </div>
          </div>
        </div>

        <div class="p-4 bg-white border-t border-gray-100 shrink-0">
          <div
            class="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-[#F77821]/20 focus-within:border-[#F77821] transition-all"
          >
            <textarea
              ref="textareaRef"
              v-model="newMessage"
              @keydown.enter.prevent="sendMessage"
              @input="autoResize"
              :placeholder="t('chat.writeMessage')"
              class="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[24px] py-2 px-2 text-gray-700 placeholder-gray-400"
              rows="1"
            ></textarea>

            <button
              @click="sendMessage"
              :disabled="!newMessage.trim()"
              class="p-2 rounded-xl transition-all duration-200 flex items-center justify-center shrink-0 mb-0.5"
              :class="
                newMessage.trim()
                  ? 'bg-[#F77821] text-white hover:bg-[#e06915] shadow-md hover:shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              "
            >
              <PaperAirplaneIcon
                class="w-5 h-5 -rotate-45 translate-x-px -translate-y-px"
              />
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
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 20px;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
}
</style>
