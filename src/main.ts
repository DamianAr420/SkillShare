import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import i18n from "./i18n";
import { MotionPlugin } from "@vueuse/motion";
import { createPinia } from "pinia";
import "/node_modules/flag-icons/css/flag-icons.min.css";

import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(i18n);
app.use(MotionPlugin);

app.mount("#app");

(async () => {
  const authStore = useAuthStore();
  const chatStore = useChatStore();

  try {
    await authStore.fetchUser();

    if (authStore.user && authStore.token) {
      await chatStore.initializeChat(authStore.token);
    }
  } catch (err) {
    console.error("Inicjalizacja aplikacji nie powiodła się:", err);
  }
})();
