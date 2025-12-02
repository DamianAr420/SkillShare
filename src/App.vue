<template>
  <RouterView />
  <Toast />
</template>

<script setup lang="ts">
import Toast from "@/components/ui/Toast.vue";
import { io } from "socket.io-client";
import { useChatStore } from "@/stores/chatStore";

const chatStore = useChatStore();
const socket = io("https://skillshare-tgfy.onrender.com", {
  transports: ["websocket"],
});

socket.on("userStatusChanged", ({ userId, isOnline }) => {
  chatStore.updateUserStatus(userId, isOnline);
});
</script>
