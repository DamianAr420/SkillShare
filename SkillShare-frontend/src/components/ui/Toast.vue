<template>
  <div class="fixed bottom-6 right-6 transform flex flex-col z-[9999]">
    <TransitionGroup name="fade" tag="div">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="mb-2 px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 border min-w-[240px] justify-center text-center backdrop-blur-md"
        :class="toastClass(toast.type)"
      >
        <span class="text-sm font-medium">{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToast, type ToastType } from "@/composables/useToast";

const { toasts } = useToast();

function toastClass(type: ToastType) {
  switch (type) {
    case "success":
      return "bg-green-600/80 border-green-400 text-white";
    case "error":
      return "bg-red-600/80 border-red-400 text-white";
    case "warning":
      return "bg-yellow-500/80 border-yellow-400 text-black";
    case "info":
      return "bg-blue-600/80 border-blue-400 text-white";
    default:
      return "bg-black/80 border-[#F77821] text-white";
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s, transform 0.4s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
