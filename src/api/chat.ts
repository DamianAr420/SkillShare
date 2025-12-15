import type { Conversation, Message } from "@/types/chat";
import api from "./axios";

export const fetchConversationsApi = async (): Promise<Conversation[]> => {
  const res = await api.get("/chat/conversations");
  return res.data;
};

export const fetchConversationById = async (
  id: string
): Promise<Conversation> => {
  const res = await api.get(`/chat/conversations/${id}`);
  return res.data;
};

export const sendMessageApi = async (
  conversationId: string,
  content: string
): Promise<Message> => {
  const res = await api.post(`/chat/conversations/${conversationId}/messages`, {
    content,
  });
  return res.data;
};

export const createConversationApi = async (
  participantId: string
): Promise<Conversation> => {
  const res = await api.post("/chat/conversations", {
    participantId,
  });
  return res.data;
};

export const deleteConversationApi = async (id: string) => {
  const res = await api.delete(`/chat/conversations/${id}`);
  return res.data;
};

export const markConversationAsReadApi = async (id: string) => {
  await api.post(`/chat/conversations/${id}/mark-read`);
};
