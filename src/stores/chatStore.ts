import { defineStore } from "pinia";
import { ref } from "vue";
import type { Conversation, Message } from "@/types/chat";
import {
  fetchConversationsApi,
  fetchConversationById,
  sendMessageApi,
  createConversationApi,
  deleteConversationApi,
  markConversationAsReadApi,
} from "@/api/chat";
import { useAuthStore } from "@/stores/authStore";
import { socket } from "@/utils/socket";

export const useChatStore = defineStore("chat", () => {
  const auth = useAuthStore();
  const conversations = ref<Conversation[]>([]);
  const loading = ref(false);
  const activeConversationId = ref<string | null>(null);

  const fetchConversations = async () => {
    loading.value = true;
    try {
      const res = await fetchConversationsApi();
      conversations.value = res.map((c) => ({
        ...c,
        messages: c.messages || [],
        unreadCount: c.unreadCount ?? 0,
      }));

      conversations.value.sort((a, b) => {
        const aLastMessage = a.messages[a.messages.length - 1];
        const bLastMessage = b.messages[b.messages.length - 1];

        const aTime = aLastMessage
          ? new Date(aLastMessage.createdAt).getTime()
          : 0;
        const bTime = bLastMessage
          ? new Date(bLastMessage.createdAt).getTime()
          : 0;
        // ---------------------------------------------
        return bTime - aTime;
      });
    } finally {
      loading.value = false;
    }
  };

  const fetchConversation = async (conversationId: string) => {
    loading.value = true;
    try {
      const conv = await fetchConversationById(conversationId);
      const newConv: Conversation = {
        ...conv,
        messages: conv.messages || [],
        unreadCount: conv.unreadCount ?? 0,
      };

      const index = conversations.value.findIndex((c) => c._id === conv._id);

      if (index !== -1) conversations.value[index] = newConv;
      else conversations.value.push(newConv);

      if (
        conversationId === activeConversationId.value &&
        newConv.unreadCount > 0
      ) {
        await markConversationAsRead(conversationId);
      }
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

      conv.unreadCount = 0;

      conversations.value = [
        conv,
        ...conversations.value.filter((c) => c._id !== conversationId),
      ];
    }

    socket.emit("sendMessage", { conversationId, message: msg });

    return msg;
  };

  const startConversation = async (userId: string): Promise<string | null> => {
    const existing = conversations.value.find(
      (c) =>
        c.participants.map((p) => p._id).includes(userId) &&
        c.participants.map((p) => p._id).includes(auth.user?._id!)
    );
    if (existing) {
      return existing._id;
    } else {
      const conv = await createConversationApi(userId);
      conv.messages = conv.messages || [];
      conv.unreadCount = 0;
      conversations.value.push(conv);
      return conv._id;
    }
  };

  const updateUserStatus = (
    userId: string,
    isOnline: boolean,
    lastSeen?: Date
  ) => {
    conversations.value.forEach((conv) => {
      conv.participants.forEach((p) => {
        if (p._id === userId) {
          p.isOnline = isOnline;
          if (lastSeen) p.lastSeen = lastSeen.toISOString();
        }
      });
    });
  };

  const deleteConversation = async (id: string) => {
    await deleteConversationApi(id);
    conversations.value = conversations.value.filter((c) => c._id !== id);
  };

  const markConversationAsRead = async (conversationId: string) => {
    const conv = conversations.value.find((c) => c._id === conversationId);
    if (!conv || !auth.user || conv.unreadCount === 0) return;

    try {
      await markConversationAsReadApi(conversationId);

      socket.emit("markRead", {
        conversationId,
        userId: auth.user._id,
      });

      conv.unreadCount = 0;
    } catch (error) {
      console.error(
        "Błąd podczas oznaczania wiadomości jako przeczytane:",
        error
      );
    }
  };

  const setActiveConversation = (conversationId: string | null) => {
    activeConversationId.value = conversationId;
    if (conversationId) {
      markConversationAsRead(conversationId);
      socket.emit("joinRoom", conversationId);
    }
  };

  const handleIncomingMessage = (payload: any) => {
    const { conversationId, ...message } = payload;
    const conv = conversations.value.find((c) => c._id === conversationId);

    const isSentByMe = message.senderId === auth.user?._id;

    if (conv) {
      if (!conv.messages) conv.messages = [];
      conv.messages.push(message as unknown as Message);

      if (conversationId !== activeConversationId.value) {
        if (!isSentByMe) {
          conv.unreadCount = (conv.unreadCount || 0) + 1;
        }
      } else {
        if (!isSentByMe) {
          markConversationAsRead(conversationId);
        }
      }

      conversations.value = [
        conv,
        ...conversations.value.filter((c) => c._id !== conversationId),
      ];
    }
  };

  const handleMessagesRead = (payload: {
    conversationId: string;
    userId: string;
  }) => {
    const { conversationId, userId } = payload;
    const conv = conversations.value.find((c) => c._id === conversationId);

    if (conv) {
      conv.messages.forEach((msg) => {
        if (!msg.readBy) msg.readBy = [];
        if (!msg.readBy.includes(userId)) {
          msg.readBy.push(userId);
        }
      });
    }
  };

  const initializeSocketListeners = () => {
    socket.on("newMessage", handleIncomingMessage);
    socket.on("messagesRead", handleMessagesRead);

    socket.on(
      "userStatusChanged",
      (user: { userId: string; isOnline?: boolean; lastSeen?: string }) => {
        const lastSeenDate = user.lastSeen
          ? new Date(user.lastSeen)
          : undefined;
        const isOnlineStatus = user.isOnline ?? false;

        updateUserStatus(user.userId, isOnlineStatus, lastSeenDate);
      }
    );
  };

  const removeSocketListeners = () => {
    socket.off("newMessage", handleIncomingMessage);
    socket.off("messagesRead", handleMessagesRead);
  };

  return {
    conversations,
    loading,
    activeConversationId,
    fetchConversations,
    fetchConversation,
    sendMessage,
    startConversation,
    updateUserStatus,
    deleteConversation,
    initializeSocketListeners,
    markConversationAsRead,
    setActiveConversation,
    removeSocketListeners,
  };
});
