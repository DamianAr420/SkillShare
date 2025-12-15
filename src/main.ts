import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import i18n from "./i18n";
import { MotionPlugin } from "@vueuse/motion";
import { createPinia } from "pinia";

import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";

const app = createApp(App);
const pinia = createPinia();

app.use(router).use(i18n).use(MotionPlugin).use(pinia).mount("#app");

(async () => {
  const authStore = useAuthStore();
  const chatStore = useChatStore();

  await authStore.fetchUser();

  if (authStore.user) {
    chatStore.initializeSocketListeners();
    await chatStore.fetchConversations();
  }
})();
