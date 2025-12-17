<script setup lang="ts">
import { ref } from "vue";
import OfferForm from "@/components/forms/OfferForm.vue";
import SearchForm from "@/components/forms/SearchForm.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const type = ref<"offer" | "search">("offer");
</script>

<template>
  <div class="min-h-screen bg-[#fafafa]">
    <div class="max-w-3xl mx-auto">
      <div class="text-center mb-12 space-y-4">
        <h1
          class="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight"
        >
          {{ t("addAnnouncement.title") }}
        </h1>
        <p class="text-gray-500 font-medium text-lg">
          {{
            t("addAnnouncement.subtitle") ||
            "Wybierz rodzaj ogłoszenia, aby kontynuować"
          }}
        </p>
      </div>

      <div class="flex justify-center mb-12">
        <div
          class="bg-gray-200/50 p-1.5 rounded-[2rem] flex items-center w-full max-w-md shadow-inner"
        >
          <button
            @click="type = 'offer'"
            class="flex-1 py-4 px-6 rounded-[1.8rem] font-bold text-sm sm:text-base transition-all duration-300 cursor-pointer"
            :class="
              type === 'offer'
                ? 'bg-white text-[#F77821] shadow-lg scale-[1.02]'
                : 'text-gray-500 hover:text-gray-700'
            "
          >
            <span class="flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                v-if="type === 'offer'"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              {{ t("addAnnouncement.offer") }}
            </span>
          </button>

          <button
            @click="type = 'search'"
            class="flex-1 py-4 px-6 rounded-[1.8rem] font-bold text-sm sm:text-base transition-all duration-300 cursor-pointer"
            :class="
              type === 'search'
                ? 'bg-white text-[#F77821] shadow-lg scale-[1.02]'
                : 'text-gray-500 hover:text-gray-700'
            "
          >
            <span class="flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                v-if="type === 'search'"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {{ t("addAnnouncement.search") }}
            </span>
          </button>
        </div>
      </div>

      <div
        class="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 p-6 sm:p-10 transition-all duration-500"
      >
        <transition name="fade" mode="out-in">
          <div :key="type">
            <OfferForm v-if="type === 'offer'" />
            <SearchForm v-else />
          </div>
        </transition>
      </div>

      <p class="text-center mt-8 text-gray-400 text-sm">
        {{
          t("addAnnouncement.helpNote") ||
          "Upewnij się, że wybierasz poprawną kategorię, aby ułatwić innym znalezienie Twojego ogłoszenia."
        }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
