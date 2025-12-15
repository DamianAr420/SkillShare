<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";

const router = useRouter();
const auth = useAuthStore();
const chatStore = useChatStore();

const posX = ref(0);
const posY = ref(0);

const heartbeatInterval = ref<number | null>(null);

let startX = 0;
let startY = 0;
let dragging = false;
let dragMoved = false;

const transitionEnabled = ref(true);
const shadowActive = ref(false);
const snappedSide = ref<"left" | "right">("right");

const unreadTotal = computed(() =>
  chatStore.conversations.reduce(
    (sum, conv) => sum + (conv.unreadCount || 0),
    0
  )
);

const goToChat = () => {
  if (!dragMoved) router.push("/chat");
};

const loadSavedPosition = () => {
  const savedX = localStorage.getItem("chatBubbleX");
  const savedY = localStorage.getItem("chatBubbleY");

  posX.value = savedX ? Number(savedX) : window.innerWidth - 90;
  posY.value = savedY ? Number(savedY) : window.innerHeight - 120;
};

const savePosition = () => {
  localStorage.setItem("chatBubbleX", posX.value.toString());
  localStorage.setItem("chatBubbleY", posY.value.toString());
};

const handleResize = () => {
  const bubbleWidth = 90;
  const bubbleHeight = 90;

  posY.value = Math.min(posY.value, window.innerHeight - bubbleHeight);

  transitionEnabled.value = true;

  if (snappedSide.value === "left") {
    posX.value = 10;
  } else {
    posX.value = window.innerWidth - bubbleWidth;
  }

  savePosition();
};

onMounted(async () => {
  loadSavedPosition();
  snappedSide.value = posX.value < window.innerWidth / 2 ? "left" : "right";
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);

  if (heartbeatInterval.value) {
    clearInterval(heartbeatInterval.value);
    heartbeatInterval.value = null;
  }
});

const startDrag = (e: MouseEvent | TouchEvent) => {
  dragging = true;
  dragMoved = false;

  transitionEnabled.value = false;
  shadowActive.value = true;

  let clientX: number;
  let clientY: number;

  if ("touches" in e) {
    const t = e.touches[0];
    if (!t) return;
    clientX = t.clientX;
    clientY = t.clientY;
  } else {
    clientX = (e as MouseEvent).clientX;
    clientY = (e as MouseEvent).clientY;
  }

  startX = clientX - posX.value;
  startY = clientY - posY.value;

  document.addEventListener("mousemove", onDrag);
  document.addEventListener("touchmove", onDrag, { passive: false });
  document.addEventListener("mouseup", stopDrag);
  document.addEventListener("touchend", stopDrag);
};

const onDrag = (e: MouseEvent | TouchEvent) => {
  if (!dragging) return;

  if ("touches" in e) e.preventDefault?.();

  let clientX: number;
  let clientY: number;

  if ("touches" in e) {
    const t = e.touches[0];
    if (!t) return;
    clientX = t.clientX;
    clientY = t.clientY;
  } else {
    clientX = (e as MouseEvent).clientX;
    clientY = (e as MouseEvent).clientY;
  }

  dragMoved = true;

  posX.value = clientX - startX;
  posY.value = clientY - startY;

  posX.value = Math.max(10, Math.min(posX.value, window.innerWidth - 90));
  posY.value = Math.max(10, Math.min(posY.value, window.innerHeight - 90));
};

const stopDrag = () => {
  if (!dragging) return;
  dragging = false;

  transitionEnabled.value = true;
  shadowActive.value = false;

  const attachRight = posX.value > window.innerWidth / 2;
  const targetX = attachRight ? window.innerWidth - 90 : 10;

  posX.value = attachRight ? targetX + 20 : targetX - 20;

  setTimeout(() => {
    posX.value = targetX;
    if (posX.value < window.innerWidth / 2) {
      posX.value = 10;
      snappedSide.value = "left";
    } else {
      posX.value = window.innerWidth - 90;
      snappedSide.value = "right";
    }
    savePosition();
  }, 130);

  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("touchmove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
  document.removeEventListener("touchend", stopDrag);
};
</script>

<template>
  <div
    v-if="auth.isAuthenticated"
    class="fixed z-50 select-none"
    :style="{
      left: posX + 'px',
      top: posY + 'px',
      transition: transitionEnabled
        ? 'all 0.25s cubic-bezier(.17,.89,.32,1.27)'
        : 'none',
    }"
  >
    <button
      @mousedown="startDrag"
      @touchstart="startDrag"
      @click="goToChat"
      class="w-16 h-16 rounded-full bg-orange-500 text-white flex items-center justify-center relative transition-transform"
      :class="{ 'active:scale-95': !dragging }"
      :style="{
        boxShadow: shadowActive
          ? '0 14px 30px rgba(0,0,0,0.35)'
          : '0 6px 14px rgba(0,0,0,0.25)',
      }"
    >
      💬
      <span
        v-if="unreadTotal > 0"
        class="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold pointer-events-none transform translate-x-1/4 -translate-y-1/4"
      >
        {{ unreadTotal > 99 ? "99+" : unreadTotal }}
      </span>
    </button>
  </div>
</template>

<style scoped>
button {
  touch-action: none;
}
</style>
