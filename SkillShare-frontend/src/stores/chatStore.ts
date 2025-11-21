import { defineStore } from "pinia";
import { ref } from "vue";
import type { Conversation, Message } from "@/types/chat";
import {
  fetchConversationsApi,
  fetchConversationById,
  sendMessageApi,
  createConversationApi,
} from "@/api/chat";
import { useAuthStore } from "@/stores/authStore";

export const useChatStore = defineStore("chat", () => {
  const auth = useAuthStore();
  const conversations = ref<Conversation[]>([]);
  const loading = ref(false);

  const fetchConversations = async () => {
    loading.value = true;
    try {
      const res = await fetchConversationsApi();
      conversations.value = res.map((c) => ({
        ...c,
        messages: c.messages || [],
      }));
    } finally {
      loading.value = false;
    }
  };

  const fetchConversation = async (conversationId: string) => {
    loading.value = true;
    try {
      const conv = await fetchConversationById(conversationId);
      const index = conversations.value.findIndex((c) => c._id === conv._id);
      if (index !== -1)
        conversations.value[index] = { ...conv, messages: conv.messages || [] };
      else conversations.value.push({ ...conv, messages: conv.messages || [] });
    } finally {
      loading.value = false;
    }
  };

  const sendMessage = async (conversationId: string, content: string) => {
    const msg: Message = await sendMessageApi(conversationId, content);
    const conv = conversations.value.find((c) => c._id === conversationId);
    if (conv) {
      if (!conv.messages) conv.messages = [];
      conv.messages.push(msg);
    }
    return msg;
  };

  const startConversation = async (userId: string): Promise<string | null> => {
    const existing = conversations.value.find(
      (c) =>
        c.participants.includes(userId) &&
        c.participants.includes(auth.user?._id!)
    );
    if (existing) return existing._id;

    const conv = await createConversationApi(userId);
    conv.messages = conv.messages || [];
    conversations.value.push(conv);
    return conv._id;
  };

  return {
    conversations,
    loading,
    fetchConversations,
    fetchConversation,
    sendMessage,
    startConversation,
  };
});
