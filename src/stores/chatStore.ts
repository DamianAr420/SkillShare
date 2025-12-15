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

  let initialized = false;
  let currentRoom: string | null = null;

  const fetchConversations = async () => {
    loading.value = true;
    try {
      const res = await fetchConversationsApi();
      conversations.value = res.map((c) => ({
        ...c,
        messages: c.messages || [],
        unreadCount: c.unreadCount ?? 0,
      }));
    } finally {
      loading.value = false;
    }
  };

  const fetchConversation = async (conversationId: string) => {
    const conv = await fetchConversationById(conversationId);

    const normalized: Conversation = {
      ...conv,
      messages: conv.messages || [],
      unreadCount: conv.unreadCount ?? 0,
    };

    const idx = conversations.value.findIndex((c) => c._id === conversationId);

    if (idx !== -1) conversations.value[idx] = normalized;
    else conversations.value.push(normalized);
  };

  const startConversation = async (participantId: string) => {
    const existing = conversations.value.find((c) =>
      c.participants.some((p) => p._id === participantId)
    );

    if (existing) {
      setActiveConversation(existing._id);
      return existing;
    }

    const conv = await createConversationApi(participantId);

    const normalized: Conversation = {
      ...conv,
      messages: conv.messages || [],
      unreadCount: 0,
    };

    conversations.value.unshift(normalized);

    setActiveConversation(normalized._id);

    return normalized;
  };

  const initializeSocketListeners = () => {
    if (initialized) return;
    initialized = true;

    socket.emit("userOnline", auth.user!._id);

    setInterval(() => {
      socket.emit("heartbeat", { userId: auth.user!._id });
    }, 30000);

    socket.on("newMessage", handleIncomingMessage);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("userStatus", handleUserStatus);
  };

  const setActiveConversation = (conversationId: string | null) => {
    if (currentRoom) socket.emit("leaveRoom", currentRoom);

    activeConversationId.value = conversationId;

    if (conversationId) {
      socket.emit("joinRoom", conversationId);
      currentRoom = conversationId;
      markConversationAsRead(conversationId);
    }
  };

  const sendMessage = async (conversationId: string, content: string) => {
    const tempId = crypto.randomUUID();
    const senderId = auth.user!._id;

    addMessageLocally({
      _id: tempId,
      senderId,
      content,
      createdAt: new Date().toISOString(),
      readBy: [senderId],
      conversationId,
    } as Message);

    try {
      const finalMsg = await sendMessageApi(conversationId, content);
      replaceMessage(conversationId, tempId, finalMsg);
    } catch {
      removeMessage(conversationId, tempId);
    }
  };

  const handleIncomingMessage = (message: Message) => {
    const conv = conversations.value.find(
      (c) => c._id === message.conversationId
    );
    if (!conv) return;

    conv.messages.push(message);

    if (message.conversationId !== activeConversationId.value) {
      conv.unreadCount++;
    } else {
      markConversationAsRead(message.conversationId);
    }

    conversations.value = [
      conv,
      ...conversations.value.filter((c) => c._id !== conv._id),
    ];
  };

  const handleMessagesRead = ({
    conversationId,
    userId,
  }: {
    conversationId: string;
    userId: string;
  }) => {
    const conv = conversations.value.find((c) => c._id === conversationId);
    if (!conv) return;

    conv.messages.forEach((msg) => {
      if (!msg.readBy.includes(userId)) {
        msg.readBy.push(userId);
      }
    });
  };

  const handleUserStatus = ({
    userId,
    isOnline,
    lastSeen,
  }: {
    userId: string;
    isOnline: boolean;
    lastSeen?: string;
  }) => {
    conversations.value.forEach((conv) => {
      conv.participants.forEach((p) => {
        if (p._id === userId) {
          p.isOnline = isOnline;
          if (lastSeen) p.lastSeen = lastSeen;
        }
      });
    });
  };

  const addMessageLocally = (msg: Message) => {
    const conv = conversations.value.find((c) => c._id === msg.conversationId);
    if (!conv) return;

    conv.messages.push(msg);
    conv.unreadCount = 0;
  };

  const replaceMessage = (
    conversationId: string,
    tempId: string,
    finalMsg: Message
  ) => {
    const conv = conversations.value.find((c) => c._id === conversationId);
    if (!conv) return;

    const idx = conv.messages.findIndex((m) => m._id === tempId);
    if (idx !== -1) conv.messages[idx] = finalMsg;
  };

  const removeMessage = (conversationId: string, tempId: string) => {
    const conv = conversations.value.find((c) => c._id === conversationId);
    if (!conv) return;

    conv.messages = conv.messages.filter((m) => m._id !== tempId);
  };

  const markConversationAsRead = async (conversationId: string) => {
    const conv = conversations.value.find((c) => c._id === conversationId);
    if (!conv || conv.unreadCount === 0) return;

    await markConversationAsReadApi(conversationId);
    conv.unreadCount = 0;

    socket.emit("markRead", {
      conversationId,
      userId: auth.user!._id,
    });
  };

  const deleteConversation = async (conversationId: string) => {
    await deleteConversationApi(conversationId);
    conversations.value = conversations.value.filter(
      (c) => c._id !== conversationId
    );
  };

  return {
    conversations,
    loading,
    activeConversationId,
    fetchConversations,
    fetchConversation,
    sendMessage,
    setActiveConversation,
    initializeSocketListeners,
    deleteConversation,
    startConversation,
  };
});
