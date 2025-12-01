<script setup lang="ts">
import { ref, onMounted, watch, computed, onUnmounted } from "vue";
import { useCategoryStore } from "@/stores/categoryStore";
import { useAnnouncementStore } from "@/stores/announcementStore";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/composables/useToast";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const categoryStore = useCategoryStore();
const announcementStore = useAnnouncementStore();
const { showToast } = useToast();

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

const isOwner = (announcementUserId: string) => {
  return auth.user?._id === announcementUserId;
};

const isWatched = (announcement: any) => {
  if (!auth.user || isOwner(announcement.user._id)) return false;
  const announcementId = announcement._id.toString();

  return auth.user.watchlist?.some((item: any) => {
    const id = typeof item === "string" ? item : item._id?.toString();
    return id === announcementId;
  });
};

const toggleWatch = async (announcement: any) => {
  if (!auth.user) {
    showToast(t("announcementDetails.loginToWatch"), "error");
    return;
  }

  if (!auth.user.watchlist) {
    auth.user.watchlist = [];
  }

  try {
    const id = announcement._id.toString();
    const index = auth.user.watchlist.findIndex((item: any) => {
      const itemId = typeof item === "string" ? item : item._id?.toString();
      return itemId === id;
    });

    let message = "";
    if (index > -1) {
      auth.user.watchlist.splice(index, 1);
      message = t("announcementDetails.unwatchSuccess");
    } else {
      auth.user.watchlist.push(id);
      message = t("announcementDetails.watchSuccess");
    }

    showToast(message, "success");

    await auth.toggleWatchlist(id);
  } catch (err) {
    console.error("Error toggling watchlist", err);
    showToast(t("announcementDetails.watchError"), "error");
  }
};

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

const normalizedAnnouncements = computed(() => {
  return announcementStore.announcements.map((a) => ({
    ...a,
    userId: typeof a.user === "string" ? a.user : a.user._id,
    userName: typeof a.user === "string" ? a.user : a.user.name,
    categoryName: typeof a.category === "string" ? a.category : a.category.name,
    location: a.location || "",
  }));
});
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
      <div
        v-for="a in normalizedAnnouncements"
        :key="a._id"
        class="bg-white rounded-xl shadow-[0px_0px_8px_1px_rgba(0,0,0,0.25)] p-3 active:scale-[0.98] transition cursor-pointer"
        @click="$router.push(`/announcement/${a._id}`)"
      >
        <!-- IMAGE -->
        <div class="relative">
          <img
            :src="
              a.imageUrl ||
              'https://via.placeholder.com/300x200?text=' +
                t('announcements.noImage')
            "
            class="h-48 w-full object-cover rounded-lg"
          />

          <!-- WATCH ICON FLOATING -->
          <button
            v-if="!isOwner(a.userId)"
            @click.stop="toggleWatch(a)"
            class="absolute top-2 right-2 text-yellow-400 text-3xl bg-white rounded-full shadow p-1 leading-none"
            :class="{ 'scale-110': isWatched(a) }"
          >
            {{ isWatched(a) ? "★" : "☆" }}
          </button>
        </div>

        <!-- TITLE -->
        <h3 class="text-lg font-bold mt-3 mb-1">
          {{ a.title }}
        </h3>

        <!-- CATEGORY + TYPE + LOCATION -->
        <div class="flex flex-wrap items-center gap-2 mb-2">
          <span
            class="px-2 py-1 rounded-full text-[11px] font-semibold border"
            :class="{
              'bg-green-200 border-green-400 text-green-800':
                a.type === 'offer',
              'bg-blue-200 border-blue-400 text-blue-800': a.type === 'search',
            }"
          >
            {{ t(`announcements.type.${a.type}`) }}
          </span>

          <span
            class="px-2 py-1 rounded-full text-[11px] bg-[#F77821] text-white font-medium border border-[#F77821]"
          >
            {{ t("categories." + a.categoryName) }}
          </span>

          <span
            class="ml-auto flex items-center gap-1 bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded-lg border border-orange-200 shadow-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-3 w-3 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 22s8-4.438 8-11a8 8 0 10-16 0c0 6.562 8 11 8 11z"
              />
            </svg>

            {{ a.location || t("announcements.noLocation") }}
          </span>
        </div>

        <!-- DESCRIPTION -->
        <p class="text-gray-700 text-sm mb-3 line-clamp-3">
          {{ a.desc }}
        </p>

        <!-- PRICE -->
        <div class="flex justify-between items-center">
          <span
            v-if="a.price !== null"
            class="text-[#F77821] font-bold text-2xl"
          >
            {{ a.price }} zł
          </span>
        </div>
      </div>
    </div>

    <!-- DESKTOP VIEW -->
    <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="a in normalizedAnnouncements"
        :key="a._id"
        class="bg-white rounded-xl shadow-[0_0_5px_1px_rgba(0,0,0,0.25)] hover:shadow-[0_0_8px_1px_rgba(0,0,0,0.25)] hover:shadow-[#F77821] transition p-4 flex flex-col relative"
      >
        <img
          :src="
            a.imageUrl ||
            'https://via.placeholder.com/300x200?text=' +
              t('announcements.noImage')
          "
          class="h-40 w-full object-cover rounded mb-3 cursor-pointer"
          @click="$router.push(`/announcement/${a._id}`)"
        />

        <h3
          class="text-lg font-semibold mb-1 flex items-center justify-between"
        >
          {{ a.title }}
          <button
            v-if="!isOwner(a.userId)"
            @click.stop="toggleWatch(a)"
            class="ml-2 text-yellow-500 text-2xl transition-transform duration-200"
            :class="{ 'scale-110': isWatched(a) }"
          >
            {{ isWatched(a) ? "★" : "☆" }}
          </button>
        </h3>

        <p class="text-sm text-gray-600 flex-grow">{{ a.desc }}</p>

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between mt-3 gap-2 sm:gap-4"
        >
          <span
            v-if="a.price !== null"
            class="text-[#F77821] font-bold text-lg sm:text-xl"
          >
            {{ a.price }} zł
          </span>

          <span
            class="px-2 py-1 rounded-full text-xs font-semibold border flex-shrink-0"
            :class="{
              'bg-green-200 border-green-400 text-green-800':
                a.type === 'offer',
              'bg-blue-200 border-blue-400 text-blue-800': a.type === 'search',
            }"
          >
            {{ t(`announcements.type.${a.type}`) }}
          </span>

          <span
            class="px-3 py-1 rounded-full text-sm font-medium border bg-[#F77821] text-white border-[#F77821] flex-shrink-0"
          >
            {{ t("categories." + a.categoryName) }}
          </span>

          <span class="text-gray-500 text-sm italic flex-shrink-0">
            {{ a.location || t("announcements.noLocation") }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
button:active {
  transform: scale(0.95);
}
</style>
