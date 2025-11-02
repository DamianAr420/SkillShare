<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { useCategoryStore } from "@/stores/categoryStore";
import { useAnnouncementStore } from "@/stores/announcementStore";

import EducationIcon from "@/assets/icons/Education.vue";
import GraphicsIcon from "@/assets/icons/Graphics.vue";
import HomeIcon from "@/assets/icons/Home.vue";
import ITIcon from "@/assets/icons/IT.vue";
import OtherIcon from "@/assets/icons/Other.vue";
import TechnicalIcon from "@/assets/icons/Technical.vue";

const { t } = useI18n();
const auth = useAuthStore();
const categoryStore = useCategoryStore();
const announcementStore = useAnnouncementStore();

const isLoggedIn = computed(() => auth.isAuthenticated);
const username = computed(() => auth.user?.name || "");

const iconMap: Record<string, any> = {
  Education: EducationIcon,
  Graphics: GraphicsIcon,
  Home: HomeIcon,
  IT: ITIcon,
  Other: OtherIcon,
  Technical: TechnicalIcon,
};

onMounted(() => {
  categoryStore.fetchCategories();
  announcementStore.fetchLatestAnnouncements();
});
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8">
    <!-- HEADER -->
    <div class="text-center sm:text-left mb-8 flex flex-col">
      <h1 class="text-3xl sm:text-4xl font-bold">
        {{ t("Home.header.title") }}
      </h1>
      <span class="text-xl sm:text-2xl text-gray-700">
        {{ t("Home.header.desc") }}
      </span>
      <span
        v-if="isLoggedIn"
        class="mt-4 inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-[#F77821] to-[#ff973b] text-white text-xl font-medium rounded-2xl shadow-md"
      >
        {{ t("Home.header.welcome") }}
        <span class="ml-2 font-bold">{{ username }}</span
        >!
      </span>
    </div>

    <!-- ================= MOBILE VIEW ================= -->
    <div class="block md:hidden">
      <!-- Categories -->
      <div class="mb-6">
        <h2 class="text-2xl font-bold mb-4">
          {{ t("Home.categories.title") }}
        </h2>
        <div class="flex flex-col gap-4">
          <button
            v-for="category in categoryStore.categories"
            :key="category._id"
            class="flex flex-row items-center gap-3 p-4 bg-white rounded-lg shadow hover:shadow-md transition"
          >
            <div
              class="bg-[#F77821] rounded-full flex items-center justify-center h-12 w-12"
            >
              <component
                :is="iconMap[category.name] || OtherIcon"
                class="h-6 w-6 text-white"
              />
            </div>
            <span class="text-sm font-medium">{{ category.name }}</span>
          </button>
        </div>
      </div>

      <!-- Announcements -->
      <div>
        <h2 class="text-2xl font-bold mb-4">
          {{ t("Home.announcements.title") }}
        </h2>
        <div class="flex flex-col gap-4">
          <button
            v-for="ann in announcementStore.announcements"
            :key="ann.title"
            class="flex flex-col bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition"
          >
            <img
              class="w-full h-32 rounded bg-[#F77821] object-cover mb-2"
              src=""
              alt="img"
            />
            <h3 class="text-lg font-medium mb-1">{{ ann.title }}</h3>
            <span class="text-gray-600 text-sm mb-2">{{ ann.desc }}</span>
            <div class="text-xl font-semibold text-right">
              {{ ann.price }}
            </div>
          </button>
          <button
            @click="$router.push('/categories')"
            class="mt-4 text-[#F77821] hover:underline"
          >
            {{ t("Home.announcements.showAll") }}
          </button>
        </div>
      </div>
    </div>

    <!-- ================= DESKTOP VIEW ================= -->
    <div class="hidden md:block">
      <!-- Categories -->
      <div class="mb-6">
        <h2 class="text-3xl font-bold mb-4">
          {{ t("Home.categories.title") }}
        </h2>
        <div class="flex flex-row flex-wrap gap-4">
          <button
            v-for="category in categoryStore.categories"
            :key="category._id"
            class="flex flex-col items-center p-4 rounded-lg hover:shadow-md transition w-32"
          >
            <div
              class="bg-[#F77821] rounded-full flex items-center justify-center h-12 w-12"
            >
              <component
                :is="iconMap[category.name] || OtherIcon"
                class="h-6 w-6 text-white"
              />
            </div>
            <span class="mt-2 text-center">{{ category.name }}</span>
          </button>
        </div>
      </div>

      <!-- Announcements -->
      <div>
        <h1 class="text-3xl font-bold mb-6">
          {{ t("Home.announcements.title") }}
        </h1>

        <div
          class="bg-white p-6 flex flex-col mx-auto gap-4 rounded-lg shadow-md max-w-4xl"
        >
          <button
            v-for="ann in announcementStore.announcements"
            :key="ann.title"
            class="w-full text-left flex flex-col bg-gray-50 p-4 rounded-lg hover:shadow-lg transition"
          >
            <div class="flex flex-row items-center justify-between gap-4">
              <img
                class="h-20 w-32 rounded bg-[#F77821] object-cover"
                src=""
                alt="img"
              />

              <div
                class="flex-1 flex flex-col justify-center text-center md:text-left"
              >
                <h2 class="text-xl md:text-2xl font-medium mb-1">
                  {{ ann.title }}
                </h2>
                <span class="text-gray-600 text-sm md:text-base">{{
                  ann.desc
                }}</span>
              </div>

              <div class="text-2xl font-semibold text-right md:text-right">
                {{ ann.price }}
              </div>
            </div>

            <hr class="border-[#F77821] mt-4" />
          </button>
          <button
            @click="$router.push('/categories')"
            class="mt-4 text-[#F77821] hover:underline"
          >
            {{ t("Home.announcements.showAll") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
