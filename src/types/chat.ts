import type { User } from "./user";

export interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  readBy: string[];
}

export interface Conversation {
  _id: string;
  participants: User[];
  messages: Message[];
  unreadCount: number;
  lastActivity?: string;
}
