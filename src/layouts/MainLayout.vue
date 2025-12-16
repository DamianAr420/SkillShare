<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import NavBar from "@/components/NavBar.vue";
import FooterComp from "@/components/Footer.vue";
import ChatBubble from "@/components/ChatBubble.vue";
import { useAuthStore } from "@/stores/authStore";

const route = useRoute();
const auth = useAuthStore();

const isChatRoute = computed(() => route.path.startsWith("/chat"));
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F9FAFB] overflow-x-hidden">
    <div class="w-full max-w-7xl z-40">
      <NavBar />
    </div>

    <main
      class="flex-1 w-full max-w-7xl mx-auto"
      :class="[
        isChatRoute ? 'p-0 md:px-6 md:py-6' : 'px-4 sm:px-6 lg:px-8 py-6',
      ]"
    >
      <router-view />
    </main>

    <FooterComp v-if="!isChatRoute" />

    <ChatBubble v-if="!isChatRoute && auth.isAuthenticated" />
  </div>
</template>
