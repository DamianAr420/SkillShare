<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { useRoute } from "vue-router";
import Loader from "@/components/ui/Loader.vue";
import { io } from "socket.io-client";

const chatStore = useChatStore();
const auth = useAuthStore();
const route = useRoute();
const socket = io("http://localhost:5000");

const selectedConversationId = ref<string | null>(null);
const newMessage = ref("");
const messagesContainer = ref<HTMLElement | null>(null);

// Pobranie wszystkich konwersacji po wejściu
onMounted(async () => {
  await chatStore.fetchConversations();

  const userIdFromRoute = route.params.id as string;
  if (userIdFromRoute) {
    selectedConversationId.value = await chatStore.startConversation(
      userIdFromRoute
    );
  }

  // Od razu przewiń do ostatniej wiadomości po wejściu
  await nextTick();
  scrollToEnd();
});

// Scroll do ostatniej wiadomości w kontenerze czatu
const scrollToEnd = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

// Watcher dla nowych wiadomości i zmiany konwersacji
watch(
  () => [
    selectedConversationId.value,
    chatStore.conversations.map((c) => c.messages.length),
  ],
  scrollToEnd
);

// Dołączenie do pokoju Socket.IO
watch(selectedConversationId, (id) => {
  if (id) socket.emit("joinRoom", id);
});

// Obsługa przychodzących wiadomości
socket.on("newMessage", (msg) => {
  const conv = chatStore.conversations.find(
    (c) => c._id === msg.conversationId
  );
  if (conv) {
    if (!conv.messages) conv.messages = [];
    conv.messages.push(msg);
    nextTick(() => scrollToEnd()); // przewiń po dodaniu
  }
});

// Wysyłanie wiadomości
const sendMessage = async () => {
  if (!selectedConversationId.value || !newMessage.value.trim()) return;

  const msg = await chatStore.sendMessage(
    selectedConversationId.value,
    newMessage.value
  );

  socket.emit("sendMessage", {
    conversationId: selectedConversationId.value,
    message: msg,
  });

  newMessage.value = "";
};

const selectedConversation = computed(() => {
  return (
    chatStore.conversations.find(
      (c) => c._id === selectedConversationId.value
    ) || null
  );
});

const getOtherParticipant = (conversation: any) => {
  return conversation.participants.find((p: any) => p._id !== auth.user?._id);
};
</script>

<template>
  <div class="flex h-[80vh] gap-4 max-w-6xl mx-auto">
    <!-- Lista konwersacji -->
    <div class="w-1/3 bg-white shadow rounded p-4 overflow-y-auto">
      <h3 class="font-bold mb-2">Konwersacje</h3>
      <Loader v-if="chatStore.loading" text="Ładowanie konwersacji..." />

      <div v-else>
        <div
          v-for="c in chatStore.conversations"
          :key="c._id"
          @click="selectedConversationId = c._id"
          class="flex w-full items-center gap-3 my-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
          :class="{ 'bg-gray-100': selectedConversationId === c._id }"
        >
          <img
            v-if="getOtherParticipant(c)?.avatarUrl"
            :src="getOtherParticipant(c)?.avatarUrl"
            alt="avatar"
            class="w-10 h-10 rounded-full object-cover"
          />
          <div class="flex-1 min-w-0">
            <div class="font-semibold truncate">
              {{ getOtherParticipant(c)?.name || "Nieznany" }}
            </div>
            <div class="text-gray-500 text-sm truncate">
              <span v-if="c.messages.length">
                <strong>
                  {{
                    c.messages[c.messages.length - 1].senderId ===
                    auth.user?._id
                      ? "Ty"
                      : getOtherParticipant(c)?.name
                  }}:
                </strong>
                {{ c.messages[c.messages.length - 1].content }}
              </span>
              <span v-else class="italic">Brak wiadomości</span>
            </div>
          </div>
        </div>

        <div
          v-if="chatStore.conversations.length === 0"
          class="text-gray-500 mt-4"
        >
          Brak konwersacji.
        </div>
      </div>
    </div>

    <!-- Wiadomości -->
    <div class="flex-1 bg-white shadow rounded p-4 flex flex-col">
      <div ref="messagesContainer" class="flex-1 overflow-y-auto mb-2">
        <div
          v-for="msg in selectedConversation?.messages || []"
          :key="msg._id"
          :class="{
            'text-right': msg.senderId === auth.user?._id,
            'text-left': msg.senderId !== auth.user?._id,
          }"
          class="mb-2"
        >
          <div
            :class="{
              'inline-block bg-[#F77821] text-white px-3 py-1 rounded':
                msg.senderId === auth.user?._id,
              'inline-block bg-gray-200 px-3 py-1 rounded':
                msg.senderId !== auth.user?._id,
            }"
          >
            {{ msg.content }}
          </div>
        </div>
      </div>

      <div class="flex gap-2">
        <input
          v-model="newMessage"
          @keyup.enter="sendMessage"
          class="flex-1 border rounded px-3 py-2"
          placeholder="Napisz wiadomość..."
        />
        <button
          @click="sendMessage"
          class="bg-[#F77821] text-white px-4 py-2 rounded"
        >
          Wyślij
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
button:active {
  transform: scale(0.97);
}
</style>
