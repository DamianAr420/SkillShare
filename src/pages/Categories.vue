<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from "vue";
import { useCategoryStore } from "@/stores/categoryStore";
import { useAnnouncementStore } from "@/stores/announcementStore";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import AnnouncementCard from "@/components/AnnouncementCard.vue";
import AnnouncementSkeleton from "@/components/ui/AnnouncementSkeleton.vue";

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
  <div class="max-w-7xl mx-auto bg-gray-50/30 min-h-screen">
    <header
      class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10"
    >
      <div>
        <h1 class="text-4xl font-extrabold text-gray-900 tracking-tight">
          {{ t("announcements.title") }}
        </h1>
        <p class="text-gray-500 mt-1 text-lg">
          {{ t("announcements.subtitle") || "Znajdź to, czego potrzebujesz" }}
        </p>
      </div>

      <RouterLink
        to="/add-announcement"
        class="group relative inline-flex items-center justify-center px-6 py-3 bg-[#F77821] text-white font-bold rounded-2xl shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
      >
        <span class="relative z-10 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="3"
              d="M12 4v16m8-8H4"
            />
          </svg>
          {{ t("announcements.addButton") }}
        </span>
        <div
          class="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"
        ></div>
      </RouterLink>
    </header>

    <div
      class="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-10"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="relative">
          <span
            class="absolute inset-y-0 left-3 flex items-center text-gray-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            v-model="searchTerm"
            type="text"
            :placeholder="t('announcements.searchPlaceholder')"
            class="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
          />
        </div>

        <div class="relative">
          <span
            class="absolute inset-y-0 left-3 flex items-center text-gray-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
            </svg>
          </span>
          <input
            v-model="locationFilter"
            type="text"
            :placeholder="t('announcements.locationPlaceholder')"
            class="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500/20 transition-all text-sm"
          />
        </div>

        <div class="flex gap-2">
          <input
            v-model="minPrice"
            type="number"
            :placeholder="t('announcements.minPrice')"
            class="w-1/2 px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500/20 text-sm"
          />
          <input
            v-model="maxPrice"
            type="number"
            :placeholder="t('announcements.maxPrice')"
            class="w-1/2 px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500/20 text-sm"
          />
        </div>

        <div class="flex gap-2">
          <select
            v-model="sortOption"
            class="w-1/2 px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500/20 text-sm appearance-none cursor-pointer text-gray-600 font-medium"
          >
            <option value="newest">
              🕒 {{ t("announcements.sort.newest") }}
            </option>
            <option value="oldest">{{ t("announcements.sort.oldest") }}</option>
            <option value="priceAsc">
              📈 {{ t("announcements.sort.priceAsc") }}
            </option>
            <option value="priceDesc">
              📉 {{ t("announcements.sort.priceDesc") }}
            </option>
          </select>
          <select
            v-model="offerType"
            class="w-1/2 px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500/20 text-sm appearance-none cursor-pointer text-gray-600 font-medium"
          >
            <option value="">{{ t("announcements.type.all") }}</option>
            <option value="offer">
              💎 {{ t("announcements.type.offer") }}
            </option>
            <option value="search">
              🔍 {{ t("announcements.type.search") }}
            </option>
          </select>
        </div>
      </div>

      <div class="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <button
          @click="selectCategory(null)"
          class="shrink-0 px-5 py-2 rounded-xl text-sm font-bold transition-all"
          :class="
            !selectedCategory
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          "
        >
          {{ t("announcements.all") }}
        </button>
        <button
          v-for="cat in categoryStore.categories"
          :key="cat._id"
          @click="selectCategory(cat.name)"
          class="shrink-0 px-5 py-2 rounded-xl text-sm font-bold transition-all border-2 border-transparent"
          :class="
            selectedCategory === cat.name
              ? 'bg-orange-50 text-[#F77821] border-orange-100'
              : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200 shadow-sm'
          "
        >
          {{ t("categories." + cat.name) }}
        </button>
      </div>
    </div>

    <main>
      <div
        v-if="announcementStore.loading"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <AnnouncementSkeleton v-for="i in 8" :key="'skel-' + i" />
      </div>

      <div
        v-else-if="announcementStore.announcements.length === 0"
        class="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm"
      >
        <div
          class="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-10 w-10 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-900">
          {{ t("announcements.noAnnouncements") }}
        </h3>
        <p class="text-gray-500 mt-2">
          Spróbuj zmienić parametry wyszukiwania.
        </p>
      </div>

      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <AnnouncementCard
          v-for="a in announcementStore.announcements"
          :key="a._id"
          :announcement="a"
          :isMobile="isMobile"
          :isOwner="announcementStore.isOwner"
          :isWatched="announcementStore.isWatched"
          :toggleWatch="announcementStore.toggleWatch"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
