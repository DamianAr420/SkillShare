<template>
  <RouterView />
  <Toast />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import Toast from "@/components/ui/Toast.vue";
import { useChatStore } from "@/stores/chatStore";
import { socket } from "@/utils/socket";
import { useAuthStore } from "@/stores/authStore";

const chatStore = useChatStore();
const authStore = useAuthStore();

onMounted(() => {
  chatStore.initializeSocketListeners();
  chatStore.fetchConversations();

  if (authStore.user?._id) {
    socket.emit("userOnline", authStore.user._id);
  }
});

onUnmounted(() => {
  chatStore.removeSocketListeners();
});
</script>
