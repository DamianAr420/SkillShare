<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { useCategoryStore } from "@/stores/categoryStore";
import { useAnnouncementStore } from "@/stores/announcementStore";
import { useRouter } from "vue-router";
import { useToast } from "@/composables/useToast";

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
const router = useRouter();
const { showToast } = useToast();

const isLoggedIn = computed(() => auth.isAuthenticated);
const username = computed(() => auth.user?.name || "");

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

const iconMap: Record<string, any> = {
  Education: EducationIcon,
  Graphics: GraphicsIcon,
  Home: HomeIcon,
  IT: ITIcon,
  Other: OtherIcon,
  Technical: TechnicalIcon,
};

function goToCategory(name: string) {
  categoryStore.setSelectedCategory(name);
  router.push({ path: "/categories", query: { category: name } });
}

onMounted(() => {
  categoryStore.fetchCategories();
  announcementStore.fetchLatestAnnouncements();
});

const isOwner = (announcementUserId: string) => {
  return auth.user?._id === announcementUserId;
};

const isWatched = (announcement: any) => {
  if (!auth.user) return false;
  const id = announcement._id?.toString();
  return auth.user.watchlist?.some(
    (item: any) =>
      (typeof item === "string" ? item : item._id?.toString()) === id
  );
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

const normalizedAnnouncements = computed(() =>
  announcementStore.announcements.map((a) => ({
    ...a,
    userId: typeof a.user === "string" ? a.user : a.user._id,
    userName: typeof a.user === "string" ? a.user : a.user.name,
    categoryName: typeof a.category === "string" ? a.category : a.category.name,
  }))
);
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8 pb-12">
    <!-- ================= HEADER ================= -->
    <div class="text-center sm:text-left mb-10">
      <h1
        class="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#F77821] to-[#ff9d4c] bg-clip-text text-transparent py-2"
      >
        {{ t("Home.header.title") }}
      </h1>

      <p class="text-lg sm:text-xl mt-2 text-gray-700 font-medium">
        {{ t("Home.header.desc") }}
      </p>

      <span
        v-if="isLoggedIn"
        class="mt-4 inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-[#F77821] to-[#ff973b] text-white text-xl font-semibold rounded-2xl shadow-lg"
      >
        {{ t("Home.header.welcome") }}
        <span class="ml-2 font-bold">{{ username }}</span
        >!
      </span>
    </div>

    <!-- ================= MOBILE VIEW ================= -->
    <div v-if="isMobile" class="flex flex-col gap-6">
      <!-- ===== MOBILE CATEGORIES (SCROLLABLE) ===== -->
      <div>
        <h2 class="text-xl font-bold mb-3">
          {{ t("Home.categories.title") }}
        </h2>

        <div class="flex flex-col gap-3">
          <button
            v-for="category in categoryStore.categories"
            :key="category._id"
            class="flex flex-row items-center gap-3 bg-white p-3 rounded-xl shadow active:scale-95 transition-all hover:-translate-y-1"
            @click="goToCategory(category.name)"
          >
            <!-- Ikona -->
            <div
              class="bg-[#F77821] rounded-full flex items-center justify-center h-12 w-12"
            >
              <component
                :is="iconMap[category.name] || OtherIcon"
                class="h-6 w-6 text-white"
              />
            </div>

            <!-- Nazwa kategorii -->
            <span class="text-sm font-medium">
              {{ t("categories." + category.name) }}
            </span>
          </button>
        </div>
      </div>

      <!-- ===== MOBILE ANNOUNCEMENTS ===== -->
      <div class="flex flex-col gap-4">
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
                'bg-blue-200 border-blue-400 text-blue-800':
                  a.type === 'search',
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
    </div>

    <!-- ================= DESKTOP VIEW ================= -->
    <div class="hidden md:block">
      <div class="mb-10">
        <h2 class="text-3xl font-bold mb-6 text-gray-800">
          {{ t("Home.categories.title") }}
        </h2>

        <div class="flex flex-wrap gap-5">
          <button
            v-for="category in categoryStore.categories"
            :key="category._id"
            @click="goToCategory(category.name)"
            class="flex flex-col items-center p-5 rounded-2xl bg-white shadow-md hover:shadow-lg hover:scale-[1.03] transition-all duration-200 w-36 cursor-pointer"
          >
            <div
              class="bg-gradient-to-b from-[#F77821] to-[#ff973b] rounded-full flex items-center justify-center h-16 w-16 shadow-md"
            >
              <component
                :is="iconMap[category.name] || OtherIcon"
                class="h-8 w-8 text-white"
              />
            </div>
            <span class="mt-3 font-medium text-gray-700 text-center">
              {{ t("categories." + category.name) }}
            </span>
          </button>
        </div>
      </div>

      <div>
        <h1 class="text-3xl font-bold mb-6 text-gray-800">
          {{ t("Home.announcements.title") }}
        </h1>

        <div class="flex flex-col gap-5">
          <div
            v-for="ann in normalizedAnnouncements"
            :key="ann._id"
            @click="$router.push(`/announcement/${ann._id}`)"
            class="bg-white rounded-2xl shadow-md hover:shadow-xl hover:shadow-[#F77821]/40 transition-all duration-200 flex overflow-hidden cursor-pointer"
          >
            <img :src="ann.imageUrl" class="w-44 h-44 object-cover" />

            <div class="p-6 flex flex-col justify-between flex-1">
              <div class="flex justify-between items-start">
                <h3 class="text-xl font-bold text-gray-800">
                  {{ ann.title }}
                </h3>

                <button
                  v-if="!isOwner(ann.userId)"
                  @click.stop="toggleWatch(ann)"
                  class="text-yellow-500 text-2xl"
                  :class="{ 'scale-110': isWatched(ann) }"
                >
                  {{ isWatched(ann) ? "★" : "☆" }}
                </button>
              </div>

              <p class="text-gray-600 text-sm line-clamp-3">
                {{ ann.desc }}
              </p>

              <div class="flex flex-wrap items-center gap-3 mt-auto">
                <span
                  v-if="ann.price !== null"
                  class="text-[#F77821] text-2xl font-bold"
                >
                  {{ ann.price }} zł
                </span>

                <span
                  class="px-2 py-1 rounded-full text-xs font-semibold border"
                  :class="{
                    'bg-green-100 border-green-400 text-green-800':
                      ann.type === 'offer',
                    'bg-blue-100 border-blue-400 text-blue-800':
                      ann.type === 'search',
                  }"
                >
                  {{ t(`announcements.type.${ann.type}`) }}
                </span>

                <span
                  class="px-3 py-1 rounded-full bg-[#F77821] text-white text-xs font-semibold shadow"
                >
                  {{ t("categories." + ann.categoryName) }}
                </span>

                <span
                  class="ml-auto flex items-center gap-1 bg-orange-50 text-orange-700 text-xs px-3 py-1 rounded-lg border border-orange-200 shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 text-orange-500"
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

                  {{ ann.location || t("announcements.noLocation") }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
