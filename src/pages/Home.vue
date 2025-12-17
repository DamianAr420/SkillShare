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
import AnnouncementSkeleton from "@/components/ui/AnnouncementSkeleton.vue";

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
  <div class="max-w-7xl mx-auto min-h-screen bg-[#fafafa]">
    <header class="text-center md:text-left mb-16">
      <h1 class="text-4xl md:text-6xl font-black tracking-tight mb-4">
        <span
          class="bg-gradient-to-r from-[#F77821] to-[#ff9d4c] bg-clip-text text-transparent"
        >
          {{ t("Home.header.title") }}
        </span>
      </h1>
      <p class="text-gray-500 text-lg md:text-xl max-w-2xl font-medium">
        {{ t("Home.header.desc") }}
      </p>

      <div v-if="isLoggedIn" class="mt-8 flex justify-center md:justify-start">
        <div
          class="group flex items-center gap-3 px-5 py-3 bg-white rounded-2xl shadow-sm border border-gray-100"
        >
          <div
            class="w-10 h-10 bg-orange-100 text-[#F77821] rounded-full flex items-center justify-center font-bold"
          >
            {{ username.charAt(0).toUpperCase() }}
          </div>
          <span class="text-gray-700">
            {{ t("Home.header.welcome") }}
            <span class="font-bold text-gray-900">{{ username }}</span>
          </span>
        </div>
      </div>
    </header>

    <section class="mb-16">
      <div class="flex items-center justify-between px-2 mb-6">
        <h2
          class="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-3"
        >
          <span class="w-1.5 h-6 bg-[#F77821] rounded-full"></span>
          {{ t("Home.categories.title") }}
        </h2>
      </div>

      <div
        class="flex md:grid md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 overflow-x-auto pb-4 px-2 md:px-0 scrollbar-hide snap-x"
      >
        <button
          v-for="category in categoryStore.categories"
          :key="category._id"
          @click="goToCategory(category.name)"
          class="flex flex-col items-center min-w-[90px] md:min-w-full snap-start group"
        >
          <div
            class="w-16 h-16 md:w-20 md:h-20 mb-3 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 group-hover:border-orange-200 group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300"
          >
            <div
              class="p-3 bg-orange-50 rounded-full group-hover:bg-[#F77821] transition-colors duration-300"
            >
              <component
                :is="iconMap[category.name] || OtherIcon"
                class="h-6 w-6 md:h-8 md:w-8 text-[#F77821] group-hover:text-white transition-colors"
              />
            </div>
          </div>

          <span
            class="text-[11px] md:text-sm font-bold text-gray-500 group-hover:text-gray-900 text-center leading-tight"
          >
            {{ t("categories." + category.name) }}
          </span>
        </button>
      </div>
    </section>

    <section>
      <div class="flex items-center justify-between mb-8 px-2 md:px-0 gap-6">
        <h2
          class="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight border-l-4 rounded border-[#F77821] pl-4"
        >
          {{ t("Home.announcements.title") }}
        </h2>

        <RouterLink
          to="/categories"
          class="flex items-center gap-1 text-[#F77821] font-bold text-xs md:text-sm hover:gap-2 transition-all group"
        >
          {{ t("Home.announcements.showAll") }}
        </RouterLink>
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
      >
        <template v-if="announcementStore.loading">
          <AnnouncementSkeleton v-for="i in 4" :key="'home-skel-' + i" />
        </template>

        <template v-else>
          <div
            v-for="ann in normalizedAnnouncements"
            :key="ann._id"
            @click="$router.push(`/announcement/${ann._id}`)"
            class="group bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-orange-200/50 transition-all duration-500 cursor-pointer flex flex-col h-full"
          >
            <div class="relative h-56 overflow-hidden">
              <img
                :src="ann.imageUrl || 'https://via.placeholder.com/400x300'"
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div class="absolute top-4 left-4">
                <span
                  class="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm"
                >
                  {{ t("categories." + ann.categoryName) }}
                </span>
              </div>
              <button
                v-if="!isOwner(ann.userId)"
                @click.stop="toggleWatch(ann)"
                class="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90"
              >
                <span
                  class="text-2xl"
                  :class="isWatched(ann) ? 'text-orange-500' : 'text-gray-300'"
                >
                  {{ isWatched(ann) ? "★" : "☆" }}
                </span>
              </button>
            </div>

            <div class="p-6 flex flex-col flex-grow">
              <div class="flex justify-between items-start mb-3">
                <span
                  class="text-[10px] font-bold uppercase tracking-tighter text-gray-400"
                >
                  {{ ann.location || t("Home.announcements.noLocalization") }}
                </span>
                <span
                  class="text-[10px] font-bold uppercase px-2 py-0.5 rounded border"
                  :class="
                    ann.type === 'offer'
                      ? 'text-green-600 border-green-100 bg-green-50'
                      : 'text-blue-600 border-blue-100 bg-blue-50'
                  "
                >
                  {{ t(`announcements.type.${ann.type}`) }}
                </span>
              </div>

              <h3
                class="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#F77821] transition-colors line-clamp-2 leading-snug"
              >
                {{ ann.title }}
              </h3>

              <p class="text-gray-500 text-sm line-clamp-2 mb-6">
                {{ ann.desc }}
              </p>

              <div
                class="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between"
              >
                <span
                  v-if="ann.price !== null"
                  class="text-2xl font-black text-gray-900"
                >
                  {{ ann.price }}
                  <span class="text-sm font-normal text-gray-400">zł</span>
                </span>
                <div
                  class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-[#F77821] transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 text-gray-300 group-hover:text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </section>
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

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
