import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { loginUser, registerUser, getCurrentUser } from "@/api/auth";
import { parseAuthError, type FormError } from "@/utils/errorHandler";
import type { User } from "@/types/user";

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(localStorage.getItem("token"));
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<FormError | null>(null);

  const isAuthenticated = computed(() => !!token.value);

  async function login(name: string, password: string) {
    loading.value = true;
    error.value = null;
    try {
      const res = await loginUser(name, password);
      if (res.token) {
        token.value = res.token;
        localStorage.setItem("token", res.token);
        await fetchUser();
      }
    } catch (err: any) {
      error.value = parseAuthError(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function register(name: string, password: string) {
    loading.value = true;
    error.value = null;
    try {
      const res = await registerUser(name, password);
      return res.message;
    } catch (err: any) {
      error.value = parseAuthError(err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchUser() {
    try {
      user.value = await getCurrentUser();
    } catch (err: any) {
      console.error("Failed to fetch user:", err);
      logout();
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem("token");
  }

  if (token.value) {
    fetchUser();
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    fetchUser,
    logout,
  };
});
