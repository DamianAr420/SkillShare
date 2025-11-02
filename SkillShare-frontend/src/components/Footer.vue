<script setup lang="ts">
import SkillShareLogo from "../assets/SkillShareLogo.png";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <footer class="bg-[#1F2937] text-white py-10 px-6 md:px-20">
    <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
      <!-- Logo + opis -->
      <div class="flex flex-col gap-4">
        <img :src="SkillShareLogo" alt="Logo" class="h-16 object-contain" />
        <p class="text-gray-300 text-sm">
          {{ t("Footer.description") }}
        </p>
      </div>

      <!-- Nawigacja -->
      <div class="flex flex-col gap-2">
        <h3 class="text-lg font-bold mb-2">
          {{ t("Footer.navigation.title") }}
        </h3>
        <button
          @click="$router.push({ name: 'Home' })"
          class="hover:text-[#F77821] transition-colors duration-150 text-left"
        >
          {{ t("Footer.navigation.home") }}
        </button>
        <button
          @click="$router.push({ name: 'Categories' })"
          class="hover:text-[#F77821] transition-colors duration-150 text-left"
        >
          {{ t("Footer.navigation.categories") }}
        </button>
      </div>

      <!-- Kontakt -->
      <div class="flex flex-col gap-2">
        <h3 class="text-lg font-bold mb-2">{{ t("Footer.contact.title") }}</h3>
        <p class="text-gray-300 text-sm">{{ t("Footer.contact.email") }}</p>
        <p class="text-gray-300 text-sm">{{ t("Footer.contact.phone") }}</p>
      </div>

      <!-- Social Media -->
      <div class="flex flex-col gap-2">
        <h3 class="text-lg font-bold mb-2">{{ t("Footer.social.title") }}</h3>
        <div class="flex gap-4 text-2xl">
          <a
            href="#"
            class="hover:text-[#F77821] transition-colors duration-150"
            >🌐</a
          >
          <a
            href="#"
            class="hover:text-[#F77821] transition-colors duration-150"
            >🐦</a
          >
          <a
            href="#"
            class="hover:text-[#F77821] transition-colors duration-150"
            >📘</a
          >
        </div>
      </div>
    </div>

    <!-- Copyright -->
    <div
      class="mt-10 text-center text-gray-400 text-sm border-t border-gray-700 pt-4"
    >
      {{ t("Footer.copyright", { year: new Date().getFullYear() }) }}
    </div>
  </footer>
</template>
