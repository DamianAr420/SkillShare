import api from "./axios";
import type { User } from "@/types/user";

export interface AuthResponse {
  message: string;
  token?: string;
}

// 🔹 Rejestracja
export const registerUser = async (
  name: string,
  password: string
): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>("/register", { name, password });
  return res.data;
};

// 🔹 Logowanie
export const loginUser = async (
  name: string,
  password: string
): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>("/login", { name, password });
  return res.data;
};

// 🔹 Pobranie aktualnego użytkownika
export const getCurrentUser = async (): Promise<User> => {
  const res = await api.get<User>("/me");
  return res.data;
};

// 🔹 Sprawdzenie dostępności nazwy użytkownika
export const checkNameAvailability = async (name: string): Promise<boolean> => {
  const res = await api.get<{ available: boolean }>("/check-name", {
    params: { name },
  });
  return res.data.available;
};
