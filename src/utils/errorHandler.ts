// src/utils/errorHandler.ts
export interface FormError {
  field?: string;
  message: string;
}

export function parseAuthError(error: any): FormError {
  // Backend zwraca np. { message: "User already exists" }
  const msg =
    error?.response?.data?.message || error?.message || "Wystąpił błąd";

  const status = error?.response?.status;

  // Rejestracja
  if (msg.includes("User already exists") || status === 409) {
    return { field: "name", message: "Ta nazwa użytkownika jest już zajęta" };
  }

  // Logowanie
  if (msg.includes("Invalid credentials") || status === 401) {
    return { message: "Nieprawidłowa nazwa użytkownika lub hasło" };
  }

  // Błąd serwera
  if (status && status >= 500) {
    return { message: "Błąd serwera. Spróbuj ponownie później." };
  }

  return { message: msg };
}
