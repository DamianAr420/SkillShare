import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import i18n from "./i18n";
import { MotionPlugin } from "@vueuse/motion";
import { createPinia } from "pinia";

import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { connectSocket } from "@/utils/socket";

const app = createApp(App);
const pinia = createPinia();

app.use(router).use(i18n).use(MotionPlugin).use(pinia).mount("#app");

(async () => {
  const authStore = useAuthStore();
  const chatStore = useChatStore();

  try {
    await authStore.fetchUser();

    if (authStore.user && authStore.token) {
      const socket = connectSocket(authStore.token);
      chatStore.setSocket(socket);

      // 1. Ustaw nasłuchiwanie na eventy Socket.io
      chatStore.initializeSocketListeners();

      // 2. Pobierz listę konwersacji (ASYNCHRONICZNIE)
      await chatStore.fetchConversations();

      // 3. DOŁĄCZ DO POKOJÓW PO ZAOADOWANIU DANYCH!
      // Wywołaj, aby dołączyć od razu, jeśli socket jest już połączony
      chatStore.rejoinRooms();

      // 4. Ustaw listener na ponowne dołączenie przy każdym zerwaniu/nawiązaniu połączenia
      socket.on("connect", () => {
        console.log("Socket reconnected, rejoining rooms...");
        chatStore.rejoinRooms();
      });

      if (chatStore.activeConversationId) {
        chatStore.setActiveConversation(chatStore.activeConversationId);
      }
    }
  } catch (err) {
    console.error("Auth fetch failed:", err);
  }
})();
