import { defineStore } from "pinia";
import { computed, ref } from "vue";
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
import type { Socket } from "socket.io-client";
import { connectSocket } from "@/utils/socket";

export const useChatStore = defineStore("chat", () => {
  const auth = useAuthStore();
  const conversations = ref<Conversation[]>([]);
  const loading = ref(false);
  const activeConversationId = ref<string | null>(null);
  const previousActiveConversationId = ref<string | null>(null);

  const socket = ref<Socket | null>(null);
  let initialized = false;

  const scrollFunction = ref<(() => Promise<void>) | null>(null);

  const setSocket = (s: Socket) => {
    socket.value = s;
  };

  const setScrollFunction = (fn: (() => Promise<void>) | null) => {
    scrollFunction.value = fn;
  };

  const normalizeConversation = (
    conv: Partial<Conversation>
  ): Conversation => ({
    _id: conv._id ?? crypto.randomUUID(),
    participants: conv.participants ?? [],
    messages: conv.messages ?? [],
    unreadCount: conv.unreadCount ?? 0,
    lastActivity: conv.lastActivity ?? new Date().toISOString(),
    lastMessage: conv.lastMessage ?? null,
  });

  const initializeSocketListeners = () => {
    if (!socket.value || initialized) return;
    initialized = true;

    socket.value.off("newMessage");
    socket.value.off("messagesRead");
    socket.value.off("userStatus");

    socket.value.on("newMessage", handleIncomingMessage);
    socket.value.on("messagesRead", handleMessagesRead);
    socket.value.on("userStatus", handleUserStatus);

    socket.value?.on(
      "messageRead",
      (data: { conversationId: string; userId: string }) => {
        const { conversationId, userId } = data;
        if (!auth.user) {
          console.error(
            "Autoryzacja użytkownika jest wymagana do przetworzenia messageRead."
          );
          return;
        }

        const conv = conversations.value.find((c) => c._id === conversationId);
        if (!conv) return;

        conv.messages.forEach((msg) => {
          if (auth.user) {
            if (
              msg.senderId === auth.user._id &&
              !msg.readBy.includes(userId)
            ) {
              msg.readBy.push(userId);
            }
          }
        });
      }
    );
  };

  const fetchConversations = async () => {
    loading.value = true;
    try {
      const res = await fetchConversationsApi();
      conversations.value = res.map(normalizeConversation);
    } finally {
      loading.value = false;
    }
  };

  const fetchConversation = async (conversationId: string) => {
    const conv = await fetchConversationById(conversationId);
    const normalized = normalizeConversation(conv);

    if (
      auth.user &&
      !normalized.participants.some((p) => p._id === auth.user?._id)
    ) {
      console.warn(
        `Zablokowano dołączenie do konwersacji ${conversationId}. Użytkownik nie jest uczestnikiem.`
      );
      return;
    }

    const idx = conversations.value.findIndex((c) => c._id === conversationId);
    if (idx !== -1) {
      conversations.value[idx] = normalized;
    } else {
      conversations.value.push(normalized);
    }

    socket.value?.emit("joinRoom", conversationId);
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
    const normalized = normalizeConversation(conv);
    conversations.value.unshift(normalized);
    setActiveConversation(normalized._id);
    return normalized;
  };

  const setActiveConversation = (conversationId: string | null) => {
    previousActiveConversationId.value = activeConversationId.value;
    activeConversationId.value = conversationId;

    if (
      previousActiveConversationId.value &&
      previousActiveConversationId.value !== conversationId
    ) {
      socket.value?.emit("leaveRoom", previousActiveConversationId.value);
    }

    if (conversationId && auth.user?._id) {
      const conv = conversations.value.find((c) => c._id === conversationId);
      if (!conv) {
        console.error(
          `Konwersacja ${conversationId} nie istnieje w lokalnej liście. Nie dołączam do pokoju.`
        );
        return;
      }

      socket.value?.emit("joinRoom", conversationId);
      markConversationAsRead(conversationId);
    }
  };

  const handleIncomingMessage = async (message: Message) => {
    if (!auth.user?._id) {
      return;
    }

    if (message.senderId === auth.user._id) {
      return;
    }

    const conversationIndex = conversations.value.findIndex(
      (c) => c._id === message.conversationId
    );

    let updatedConversations: Conversation[] = [...conversations.value];

    if (
      conversationIndex !== -1 &&
      updatedConversations[conversationIndex]?.messages.some(
        (m) => m._id === message._id
      )
    ) {
      return;
    }

    if (conversationIndex === -1) {
      const fetched = await fetchConversationById(message.conversationId);
      const newConv = normalizeConversation(fetched);

      if (!newConv.messages.some((m) => m._id === message._id)) {
        newConv.messages.push(message);
      }
      newConv.lastMessage = message;

      if (message.conversationId !== activeConversationId.value) {
        newConv.unreadCount = 1;
      }

      updatedConversations.unshift(newConv);
    } else {
      const conv = updatedConversations[conversationIndex];

      if (!conv) return;

      let updatedConv: Conversation = {
        ...conv,
        messages: [...conv.messages],
      };

      if (!updatedConv.messages.some((m) => m._id === message._id)) {
        updatedConv.messages.push(message);
      }

      updatedConv.lastMessage = message;
      updatedConv.lastActivity = new Date().toISOString();

      if (message.conversationId !== activeConversationId.value) {
        updatedConv = {
          ...updatedConv,
          unreadCount: updatedConv.unreadCount + 1,
        };
      } else {
        markConversationAsRead(message.conversationId);
        scrollFunction.value?.();
      }

      updatedConversations.unshift(updatedConv);
    }

    conversations.value = updatedConversations;
  };

  const sendMessage = async (conversationId: string, content: string) => {
    if (!auth.user?._id) return;

    const tempId = crypto.randomUUID();
    const senderId = auth.user._id;
    const createdAt = new Date().toISOString();

    const tempMsg: Message = {
      _id: tempId,
      senderId,
      receiverId: "",
      content,
      createdAt,
      readBy: [senderId],
      conversationId,
      isTemp: true,
    };

    addMessageLocally(tempMsg);

    try {
      const finalMsg = await sendMessageApi(conversationId, content);
      replaceMessage(conversationId, tempId, finalMsg);
    } catch (error) {
      console.error("Failed to send message", error);
      removeMessage(conversationId, tempId);
    }
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
      if (!msg.readBy.includes(userId)) msg.readBy.push(userId);
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
    const idx = conversations.value.findIndex(
      (c) => c._id === msg.conversationId
    );
    if (idx !== -1) {
      const conv = conversations.value[idx];
      if (!conv) return;

      let updatedConv = { ...conv };

      updatedConv.messages.push(msg);
      updatedConv.lastActivity = new Date().toISOString();
      updatedConv.lastMessage = msg;

      conversations.value.splice(idx, 1);
      conversations.value.unshift(updatedConv);

      if (msg.conversationId === activeConversationId.value) {
        scrollFunction.value?.();
      }
    }
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
    if (!conv || !auth.user?._id) return;

    if (conv.unreadCount > 0) {
      await markConversationAsReadApi(conversationId);
      conv.unreadCount = 0;
    }
    socket.value?.emit("markRead", { conversationId, userId: auth.user._id });
  };

  const deleteConversation = async (conversationId: string) => {
    await deleteConversationApi(conversationId);
    conversations.value = conversations.value.filter(
      (c) => c._id !== conversationId
    );
  };

  const rejoinRooms = () => {
    if (!socket.value || !auth.user) return;

    conversations.value.forEach((c) => {
      if (c.participants.some((p) => p._id === auth.user!._id)) {
        socket.value!.emit("joinRoom", c._id);
      }
    });

    if (activeConversationId.value) {
      const activeConv = conversations.value.find(
        (c) => c._id === activeConversationId.value
      );

      if (activeConv) {
        socket.value.emit("joinRoom", activeConversationId.value);
      }
    }
  };

  async function initializeChat(token: string) {
    const socket = connectSocket(token);
    setSocket(socket);

    initializeSocketListeners();

    await fetchConversations();

    rejoinRooms();

    socket.on("connect", () => {
      console.log("Socket reconnected, rejoining rooms...");
      rejoinRooms();
    });

    if (activeConversationId.value) {
      setActiveConversation(activeConversationId.value);
    }
  }

  const totalUnreadCount = computed(() => {
    return conversations.value.reduce(
      (total, conv) => total + conv.unreadCount,
      0
    );
  });

  return {
    conversations,
    loading,
    activeConversationId,
    setSocket,
    fetchConversations,
    fetchConversation,
    sendMessage,
    setActiveConversation,
    initializeSocketListeners,
    deleteConversation,
    startConversation,
    setScrollFunction,
    rejoinRooms,
    initializeChat,
    totalUnreadCount,
  };
});
