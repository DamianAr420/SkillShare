import { ref, computed } from "vue";
import { defineStore } from "pinia";
import {
  loginUser,
  registerUser,
  getCurrentUser,
  getUserById,
  updateUser,
  toggleWatchAnnouncement,
  getUserWatchlist,
} from "@/api/auth";
import { parseAuthError, type FormError } from "@/utils/errorHandler";
import type { User } from "@/types/user";

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(localStorage.getItem("token"));
  const user = ref<User | null>(null);
  const selectedUser = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<FormError | null>(null);
  const watchlist = ref<any[]>([]);

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
      console.error("❌ Failed to fetch user:", err);
      logout();
    }
  }

  async function fetchUserById(id: string) {
    loading.value = true;
    try {
      const data = await getUserById(id);
      selectedUser.value = data;
      return data;
    } catch (err) {
      console.error("❌ Failed to fetch user by id:", err);
      selectedUser.value = null;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateUserData(formData: FormData) {
    loading.value = true;
    try {
      const res = await updateUser(formData);
      user.value = res.user;
      return res.message;
    } catch (err) {
      console.error("❌ Update user failed:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function toggleWatchlist(announcementId: string) {
    try {
      const res = await toggleWatchAnnouncement(announcementId);
      user.value!.watchlist = res.watchlist;
      await fetchWatchlist();
    } catch (err) {
      console.error("❌ Failed to toggle watchlist:", err);
      throw err;
    }
  }

  async function fetchWatchlist() {
    loading.value = true;
    try {
      watchlist.value = await getUserWatchlist();
    } catch (err) {
      console.error("❌ Failed to fetch watchlist:", err);
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem("token");
  }

  return {
    token,
    user,
    selectedUser,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    fetchUser,
    fetchUserById,
    logout,
    updateUserData,
    watchlist,
    fetchWatchlist,
    toggleWatchlist,
  };
});
