<script lang="ts" setup>
import { useRoute } from "vue-router";
import NavBar from "@/components/NavBar.vue";
import FooterComp from "@/components/Footer.vue";
import ChatBubble from "@/components/ChatBubble.vue";
import { useAuthStore } from "@/stores/authStore";

const route = useRoute();
const auth = useAuthStore();
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F9FAFB]">
    <div class="max-w-7xl w-full flex mx-auto"><NavBar /></div>
    <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <router-view />
    </main>

    <FooterComp v-if="!route.path.startsWith('/chat')" />

    <ChatBubble
      v-if="!route.path.startsWith('/chat') && auth.isAuthenticated"
    />
  </div>
</template>
