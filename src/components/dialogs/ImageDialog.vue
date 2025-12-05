<script setup lang="ts">
import { defineProps, defineEmits, watch } from "vue";

const props = defineProps<{
  src: string;
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const close = () => {
  emit("close");
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }
);
</script>

<template>
  <transition name="fade">
    <div
      v-if="visible"
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      @click="close"
    >
      <img
        :src="src"
        class="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-lg"
        @click.stop
        alt="Modal image"
      />
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
