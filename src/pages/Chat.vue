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
const socket = io("https://skillshare-tgfy.onrender.com", {
  transports: ["websocket"],
});

const selectedConversationId = ref<string | null>(null);
const newMessage = ref("");
const messagesContainer = ref<HTMLElement | null>(null);

onMounted(async () => {
  await chatStore.fetchConversations();

  const userIdFromRoute = route.params.id as string;
  if (userIdFromRoute) {
    selectedConversationId.value = await chatStore.startConversation(
      userIdFromRoute
    );
  }

  await nextTick();
  scrollToEnd();
});

const scrollToEnd = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

watch(
  () => [
    selectedConversationId.value,
    chatStore.conversations.map((c) => c.messages.length),
  ],
  scrollToEnd
);

watch(selectedConversationId, (id) => {
  if (id) socket.emit("joinRoom", id);
});

socket.on("newMessage", (msg) => {
  const conv = chatStore.conversations.find(
    (c) => c._id === msg.conversationId
  );
  if (conv) {
    if (!conv.messages) conv.messages = [];
    conv.messages.push(msg);
    nextTick(() => scrollToEnd());
  }
});

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

const getLastMessage = (conversation: any) => {
  return conversation.messages.length
    ? conversation.messages[conversation.messages.length - 1]
    : null;
};
</script>

<template>
  <div class="flex flex-col md:flex-row h-[80vh] max-w-6xl mx-auto gap-4">
    <div
      class="w-full md:w-1/3 bg-white shadow rounded p-4 overflow-y-auto flex-shrink-0"
    >
      <h3 class="font-bold mb-3 text-lg">Konwersacje</h3>
      <Loader v-if="chatStore.loading" text="Ładowanie konwersacji..." />

      <div v-else>
        <div
          v-for="c in chatStore.conversations"
          :key="c._id"
          @click="selectedConversationId = c._id"
          class="flex items-center gap-3 my-2 p-2 rounded cursor-pointer hover:bg-gray-100 transition"
          :class="{ 'bg-gray-100': selectedConversationId === c._id }"
        >
          <img
            v-if="getOtherParticipant(c)?.avatarUrl"
            :src="getOtherParticipant(c)?.avatarUrl"
            alt="avatar"
            class="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
          <div class="flex-1 min-w-0">
            <div class="font-semibold truncate">
              {{ getOtherParticipant(c)?.name || "Nieznany" }}
            </div>
            <div class="text-gray-500 text-sm truncate">
              <span v-if="getLastMessage(c)">
                <strong>
                  {{
                    getLastMessage(c)?.senderId === auth.user?._id
                      ? "Ty"
                      : getOtherParticipant(c)?.name || "Nieznany"
                  }}
                </strong>
                {{ getLastMessage(c)?.content }}
              </span>
              <span v-else class="italic">Brak wiadomości</span>
            </div>
          </div>
        </div>

        <div
          v-if="chatStore.conversations.length === 0"
          class="text-gray-500 mt-4 text-center"
        >
          Brak konwersacji.
        </div>
      </div>
    </div>

    <div class="flex-1 bg-white shadow rounded p-4 flex flex-col">
      <div
        ref="messagesContainer"
        class="flex-1 overflow-y-auto mb-2 space-y-2 px-1 md:px-0 max-h-[90vh]"
      >
        <div
          v-for="msg in selectedConversation?.messages || []"
          :key="msg._id"
          class="flex"
          :class="{
            'justify-end': msg.senderId === auth.user?._id,
            'justify-start': msg.senderId !== auth.user?._id,
          }"
        >
          <div
            :class="{
              'bg-[#F77821] text-white': msg.senderId === auth.user?._id,
              'bg-gray-200 text-gray-800': msg.senderId !== auth.user?._id,
            }"
            class="px-4 py-2 rounded-lg max-w-[80%] break-words"
          >
            {{ msg.content }}
          </div>
        </div>
      </div>

      <div class="flex gap-2 mt-2">
        <input
          v-model="newMessage"
          @keyup.enter="sendMessage"
          placeholder="Napisz wiadomość..."
          class="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#F77821]"
        />
        <button
          @click="sendMessage"
          class="bg-[#F77821] text-white px-4 py-2 rounded-lg hover:bg-[#EA580C] transition"
        >
          Wyślij
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}
::-webkit-scrollbar-track {
  background-color: transparent;
}

button:active {
  transform: scale(0.97);
}
</style>
