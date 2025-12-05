<script setup lang="ts">
import SkillShareLogo from "../assets/SkillShareLogo.png";
import { useI18n } from "vue-i18n";
import { useToast } from "@/composables/useToast";

const { t } = useI18n();
const { showToast } = useToast();

const copyEmail = () => {
  navigator.clipboard.writeText(t("Footer.contact.email"));
  showToast(
    t("Footer.contact.copyEmail", { email: t("Footer.contact.email2") }),
    "success"
  );
};
</script>

<template>
  <footer class="bg-[#1F2937] text-white py-12 px-6 md:px-20">
    <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
      <div class="flex flex-col gap-4">
        <img :src="SkillShareLogo" alt="Logo" class="h-16 object-contain" />
        <p class="text-gray-300 text-sm leading-relaxed">
          {{ t("Footer.description") }}
        </p>
      </div>

      <div class="flex flex-col gap-3">
        <h3 class="text-lg font-semibold mb-2 text-[#F77821]">
          {{ t("Footer.navigation.title") }}
        </h3>

        <button
          @click="$router.push({ name: 'Home' })"
          class="hover:text-[#F77821] transition-colors duration-150 text-left text-gray-300 w-fit cursor-pointer"
        >
          {{ t("Footer.navigation.home") }}
        </button>

        <button
          @click="$router.push({ name: 'Categories' })"
          class="hover:text-[#F77821] transition-colors duration-150 text-left text-gray-300 w-fit cursor-pointer"
        >
          {{ t("Footer.navigation.categories") }}
        </button>
      </div>

      <div class="flex flex-col gap-3">
        <h3 class="text-lg font-semibold mb-2 text-[#F77821]">
          {{ t("Footer.contact.title") }}
        </h3>

        <p
          class="text-gray-300 text-sm cursor-pointer hover:text-[#F77821] transition-colors"
        >
          <span>{{ t("Footer.contact.email1") }}</span>
          <span @click="copyEmail">{{ t("Footer.contact.email2") }}</span>
        </p>
        <p class="text-gray-300 text-sm">
          {{ t("Footer.contact.phone") }}
        </p>
      </div>

      <div class="flex flex-col gap-3">
        <h3 class="text-lg font-semibold mb-2 text-[#F77821]">
          {{ t("Footer.about.title") }}
        </h3>

        <p class="text-gray-300 text-sm leading-relaxed">
          {{ t("Footer.about.description") }}
        </p>
      </div>
    </div>

    <div
      class="mt-12 text-center text-gray-400 text-xs border-t border-gray-700 pt-5"
    >
      {{ t("Footer.copyright", { year: new Date().getFullYear() }) }}
    </div>
  </footer>
</template>
