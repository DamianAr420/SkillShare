import api from "./axios";
import type { User } from "@/types/user";

export interface AuthResponse {
  message: string;
  token?: string;
}

export const registerUser = async (
  name: string,
  password: string
): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>("/register", { name, password });
  return res.data;
};

export const loginUser = async (
  name: string,
  password: string
): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>("/login", { name, password });
  return res.data;
};

export const getCurrentUser = async (): Promise<User> => {
  const res = await api.get<User>("/me");
  return res.data;
};

export const checkNameAvailability = async (name: string): Promise<boolean> => {
  const res = await api.get<{ available: boolean }>("/check-name", {
    params: { name },
  });
  return res.data.available;
};

export const getUserById = async (id: string) => {
  const res = await api.get(`/${id}`);
  return res.data;
};
