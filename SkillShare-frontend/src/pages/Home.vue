<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { computed, onMounted } from "vue";
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
            class="flex flex-row items-center gap-3 p-4 bg-white rounded-lg shadow hover:shadow-md transition-all duration-200 active:scale-95 hover:-translate-y-1"
            @click="goToCategory(category.name)"
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
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="ann in normalizedAnnouncements"
            :key="ann._id"
            @click="$router.push(`/announcement/${ann._id}`)"
            class="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col overflow-hidden"
          >
            <img
              :src="
                ann.imageUrl ||
                'https://via.placeholder.com/300x200?text=' +
                  t('announcements.noImage')
              "
              alt="img"
              class="w-full h-40 object-cover"
            />

            <div class="p-4 flex flex-col gap-2 flex-1">
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-semibold truncate">{{ ann.title }}</h3>
                <button
                  v-if="!isOwner(ann.userId)"
                  @click.stop="toggleWatch(ann)"
                  class="ml-2 text-yellow-500 text-2xl transition-transform duration-200"
                  :class="{ 'scale-110': isWatched(ann) }"
                >
                  {{ isWatched(ann) ? "★" : "☆" }}
                </button>
              </div>

              <p class="text-gray-600 text-sm line-clamp-3">{{ ann.desc }}</p>

              <div class="flex justify-between items-center mt-3">
                <span class="text-[#F77821] font-semibold text-xl"
                  >{{ ann.price }} zł</span
                >
                <span
                  class="px-3 py-1 rounded-full bg-[#F77821] text-white text-xs font-medium"
                >
                  {{ ann.categoryName }}
                </span>
              </div>
            </div>
          </div>
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
            class="flex flex-col items-center p-4 rounded-xl bg-white hover:shadow-lg transition-all duration-200 hover:-translate-y-2 active:scale-95 w-32"
            @click="goToCategory(category.name)"
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

        <div class="hidden md:flex flex-col gap-4">
          <div
            v-for="ann in normalizedAnnouncements"
            :key="ann._id"
            @click="$router.push(`/announcement/${ann._id}`)"
            class="bg-white rounded-2xl shadow-[0_0_5px_1px_rgba(0,0,0,0.25)] hover:shadow-[0_0_10px_2px_rgba(0,0,0,0.25)] hover:shadow-[#F77821] transition-all duration-200 flex flex-row overflow-hidden cursor-pointer"
          >
            <img :src="ann.imageUrl" alt="img" class="w-40 h-40 object-cover" />
            <div class="p-4 flex flex-col justify-between flex-1">
              <div class="flex justify-between items-start">
                <h3 class="text-xl font-semibold">{{ ann.title }}</h3>
                <button
                  v-if="!isOwner(ann.userId)"
                  @click.stop="toggleWatch(ann)"
                  class="ml-2 text-yellow-500 text-2xl transition-transform duration-200"
                  :class="{ 'scale-110': isWatched(ann) }"
                >
                  {{ isWatched(ann) ? "★" : "☆" }}
                </button>
              </div>
              <p class="text-gray-600 text-sm line-clamp-4">{{ ann.desc }}</p>
              <div class="flex justify-between items-center mt-2">
                <span class="text-[#F77821] font-semibold text-lg"
                  >{{ ann.price }} zł</span
                >
                <span
                  class="px-3 py-1 rounded-full bg-[#F77821] text-white text-xs font-medium"
                >
                  {{ ann.categoryName }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
