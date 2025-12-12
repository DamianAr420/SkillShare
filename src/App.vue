<template>
  <RouterView />
  <Toast />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import Toast from "@/components/ui/Toast.vue";
import { socket } from "@/utils/socket";
import { useChatStore } from "@/stores/chatStore";

const chatStore = useChatStore();

const handleUserStatusChanged = (user: {
  userId: string;
  isOnline?: boolean;
  lastSeen?: string;
}) => {
  const isOnlineStatus = user.isOnline ?? false;

  const lastSeenDate = user.lastSeen ? new Date(user.lastSeen) : undefined;

  chatStore.updateUserStatus(user.userId, isOnlineStatus, lastSeenDate);
};

onMounted(() => {
  socket.on("userStatusChanged", handleUserStatusChanged);
});

onUnmounted(() => {
  socket.off("userStatusChanged", handleUserStatusChanged);
});
</script>
