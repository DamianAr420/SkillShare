<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const router = useRouter();
const auth = useAuthStore();

const goToChat = () => {
  router.push("/chat");
};
</script>

<template>
  <div v-if="auth.isAuthenticated" class="fixed bottom-6 right-6 z-50">
    <button
      @click="goToChat"
      class="w-16 h-16 rounded-full bg-orange-500 text-white shadow-lg flex items-center justify-center"
    >
      💬
    </button>
  </div>
</template>
