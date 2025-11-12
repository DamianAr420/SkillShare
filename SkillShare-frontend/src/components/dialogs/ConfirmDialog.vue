<template>
  <div
    v-if="visible"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
  >
    <div
      class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4 animate-fadeIn"
    >
      <h2 class="text-xl font-semibold text-gray-900">
        {{ title }}
      </h2>
      <p class="text-gray-600">{{ message }}</p>

      <div class="flex justify-end gap-3 mt-4">
        <button
          @click="$emit('cancel')"
          class="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition"
        >
          {{ cancelText }}
        </button>
        <button
          @click="$emit('confirm')"
          class="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}>();
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}
</style>
