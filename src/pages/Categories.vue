<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from "vue";
import { useCategoryStore } from "@/stores/categoryStore";
import { useAnnouncementStore } from "@/stores/announcementStore";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import AnnouncementCard from "@/components/AnnouncementCard.vue";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const categoryStore = useCategoryStore();
const announcementStore = useAnnouncementStore();

const selectedCategory = ref<string | null>(null);
const sortOption = ref("newest");
const minPrice = ref("");
const maxPrice = ref("");
const searchTerm = ref("");
const locationFilter = ref("");
const offerType = ref<"offer" | "search" | "">("");
const isMobile = ref(window.innerWidth < 768);

const updateScreen = () => {
  isMobile.value = window.innerWidth < 768;
};

onMounted(() => {
  window.addEventListener("resize", updateScreen);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateScreen);
});

onMounted(async () => {
  await categoryStore.fetchCategories();
  await auth.fetchUser();

  const cat = route.query.category as string;
  if (cat) {
    selectedCategory.value = cat;
    categoryStore.setSelectedCategory(cat);
  }

  await fetchAnnouncements();
});

async function fetchAnnouncements() {
  await announcementStore.fetchFilteredAnnouncements({
    category: selectedCategory.value || "",
    minPrice: minPrice.value || "",
    maxPrice: maxPrice.value || "",
    sort: sortOption.value,
    search: searchTerm.value || "",
    location: locationFilter.value || "",
    type: offerType.value || undefined,
  });
}

function selectCategory(cat: string | null) {
  selectedCategory.value = cat;
  categoryStore.setSelectedCategory(cat || "");

  router.replace({
    query: {
      ...route.query,
      category: cat || undefined,
    },
  });
}

watch(
  [
    selectedCategory,
    sortOption,
    minPrice,
    maxPrice,
    searchTerm,
    locationFilter,
    offerType,
  ],
  fetchAnnouncements
);
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8 py-6">
    <!-- HEADER -->
    <div class="flex flex-col sm:flex-row justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">{{ t("announcements.title") }}</h1>

      <RouterLink
        to="/add-announcement"
        class="mt-4 sm:mt-0 inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-[#F77821] to-[#ff973b] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition"
      >
        {{ t("announcements.addButton") }}
      </RouterLink>
    </div>

    <!-- SEARCH & FILTERS -->
    <div class="flex flex-col sm:flex-row gap-4 mb-6 items-center">
      <input
        v-model="searchTerm"
        type="text"
        :placeholder="t('announcements.searchPlaceholder')"
        class="border p-2 rounded w-full sm:w-64"
      />
      <input
        v-model="locationFilter"
        type="text"
        :placeholder="t('announcements.locationPlaceholder')"
        class="border p-2 rounded w-full sm:w-64"
      />
    </div>

    <!-- CATEGORIES -->
    <div class="flex flex-wrap gap-3 mb-6 justify-center sm:justify-start">
      <button
        v-for="cat in categoryStore.categories"
        :key="cat._id"
        @click="selectCategory(cat.name)"
        class="px-4 py-2 rounded-full text-sm font-medium border transition"
        :class="{
          'bg-[#F77821] text-white border-[#F77821]':
            selectedCategory === cat.name,
          'bg-white text-gray-700 border-gray-300 hover:bg-gray-100':
            selectedCategory !== cat.name,
        }"
      >
        {{ t("categories." + cat.name) }}
      </button>
      <button
        @click="selectCategory(null)"
        class="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 hover:bg-gray-200"
      >
        {{ t("announcements.all") }}
      </button>
    </div>

    <!-- PRICE & SORT -->
    <div class="flex flex-col sm:flex-row gap-4 mb-8 items-center">
      <div class="flex gap-2">
        <input
          v-model="minPrice"
          type="number"
          :placeholder="t('announcements.minPrice')"
          class="border p-2 rounded w-28"
        />
        <input
          v-model="maxPrice"
          type="number"
          :placeholder="t('announcements.maxPrice')"
          class="border p-2 rounded w-28"
        />
      </div>

      <select v-model="sortOption" class="border p-2 rounded w-40">
        <option value="newest">{{ t("announcements.sort.newest") }}</option>
        <option value="oldest">{{ t("announcements.sort.oldest") }}</option>
        <option value="priceAsc">{{ t("announcements.sort.priceAsc") }}</option>
        <option value="priceDesc">
          {{ t("announcements.sort.priceDesc") }}
        </option>
      </select>
      <select v-model="offerType" class="border p-2 rounded w-40">
        <option value="">{{ t("announcements.type.all") }}</option>
        <option value="offer">{{ t("announcements.type.offer") }}</option>
        <option value="search">{{ t("announcements.type.search") }}</option>
      </select>
    </div>

    <!-- ANNOUNCEMENTS GRID -->
    <div
      v-if="announcementStore.loading"
      class="text-center text-gray-500 py-10"
    >
      {{ t("announcements.loading") }}
    </div>
    <div
      v-else-if="announcementStore.announcements.length === 0"
      class="text-center text-gray-500 py-10"
    >
      {{ t("announcements.noAnnouncements") }}
    </div>
    <!-- MOBILE VIEW -->
    <div v-if="isMobile" class="flex flex-col gap-4">
      <AnnouncementCard
        v-for="a in announcementStore.announcements"
        :key="a._id"
        :announcement="a"
        :isMobile="true"
        :isOwner="announcementStore.isOwner"
        :isWatched="announcementStore.isWatched"
        :toggleWatch="announcementStore.toggleWatch"
      />
    </div>

    <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnnouncementCard
        v-for="a in announcementStore.announcements"
        :key="a._id"
        :announcement="a"
        :isMobile="false"
        :isOwner="announcementStore.isOwner"
        :isWatched="announcementStore.isWatched"
        :toggleWatch="announcementStore.toggleWatch"
      />
    </div>
  </div>
</template>

<style scoped>
button:active {
  transform: scale(0.95);
}
</style>
