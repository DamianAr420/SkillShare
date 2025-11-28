<script setup lang="ts">
import { ref } from "vue";
import OfferForm from "@/components/forms/OfferForm.vue";
import SearchForm from "@/components/forms/SearchForm.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const type = ref("offer");
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <h1 class="text-4xl font-extrabold mb-10 text-center text-gray-800">
      {{ t("addAnnouncement.title") }}
    </h1>

    <div class="flex justify-center mb-8 gap-4">
      <button
        :class="{
          'bg-[#F77821] text-white': type === 'offer',
          'bg-gray-200': type !== 'offer',
        }"
        class="py-2 px-6 rounded-xl"
        @click="type = 'offer'"
      >
        {{ t("addAnnouncement.offer") }}
      </button>
      <button
        :class="{
          'bg-[#F77821] text-white': type === 'search',
          'bg-gray-200': type !== 'search',
        }"
        class="py-2 px-6 rounded-xl"
        @click="type = 'search'"
      >
        {{ t("addAnnouncement.search") }}
      </button>
    </div>

    <div>
      <OfferForm v-if="type === 'offer'" />
      <SearchForm v-else />
    </div>
  </div>
</template>
