<template>
  <div
    class="flex flex-col items-center justify-center w-full h-full py-10 text-center"
  >
    <div class="relative w-12 h-12">
      <div
        class="absolute inset-0 border-4 border-[#F77821]/30 border-t-[#F77821] rounded-full animate-spin"
      ></div>
    </div>
    <p v-if="text" class="mt-4 text-gray-600 font-medium text-sm">
      {{ text }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps({
  text: {
    type: String,
    default: "Ładowanie...",
  },
});
</script>
