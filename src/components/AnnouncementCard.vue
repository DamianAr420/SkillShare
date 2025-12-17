<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useToast } from "@/composables/useToast";

const { t } = useI18n();
const { showToast } = useToast();

const props = defineProps({
  announcement: { type: Object, required: false },
  loading: { type: Boolean, default: false },
  isOwner: { type: Function, default: () => false },
  isWatched: { type: Function, default: () => false },
  toggleWatch: { type: Function, default: () => {} },
  isMobile: { type: Boolean, default: false },
});

const toggleWatchLocal = async (announcementId: string) => {
  const result = await props.toggleWatch(announcementId);
  if (result === "added")
    showToast(t("announcementDetails.watchSuccess"), "success");
  else if (result === "removed")
    showToast(t("announcementDetails.unwatchSuccess"), "info");
};
</script>

<template>
  <div
    v-if="loading || !announcement"
    class="animate-pulse bg-white rounded-2xl border border-gray-100 p-4 flex flex-col h-[420px] shadow-sm"
  >
    <div class="bg-orange-50/50 h-44 w-full rounded-xl mb-4"></div>
    <div class="h-5 bg-gray-200 rounded-full w-3/4 mb-4"></div>
    <div class="space-y-2 mb-6 flex-grow">
      <div class="h-3 bg-gray-100 rounded-full w-full"></div>
      <div class="h-3 bg-gray-100 rounded-full w-5/6"></div>
    </div>
    <div
      class="mt-auto pt-3 border-t border-gray-50 flex justify-between items-end"
    >
      <div class="h-8 bg-orange-100/50 rounded-lg w-24"></div>
      <div class="h-5 bg-gray-100 rounded-md w-16"></div>
    </div>
  </div>

  <div
    v-else
    class="group bg-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1.5 transition-all duration-300 p-4 flex flex-col cursor-pointer relative"
    @click="$router.push(`/announcement/${announcement._id}`)"
  >
    <div class="relative overflow-hidden rounded-xl mb-4 h-44 flex-shrink-0">
      <img
        :src="
          announcement.imageUrl ||
          'https://via.placeholder.com/300x200?text=' +
            t('announcements.noImage')
        "
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      <button
        v-if="announcement.user && !isOwner(announcement)"
        @click.stop="toggleWatchLocal(announcement._id)"
        class="absolute top-3 right-3 w-10 h-10 flex items-center justify-center bg-white/95 rounded-full shadow-lg transition-all hover:scale-110"
      >
        <span
          class="text-2xl"
          :class="isWatched(announcement) ? 'text-yellow-500' : 'text-gray-300'"
        >
          {{ isWatched(announcement) ? "★" : "☆" }}
        </span>
      </button>

      <div
        v-if="isMobile && announcement.type !== 'search'"
        class="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm"
      >
        <span class="text-[#F77821] font-bold"
          >{{ announcement.price }} zł</span
        >
      </div>
    </div>

    <div class="flex flex-col flex-grow">
      <h3
        class="text-lg font-bold text-gray-900 leading-tight mb-2 group-hover:text-[#F77821] transition-colors line-clamp-2"
      >
        {{ announcement.title }}
      </h3>

      <p class="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
        {{ announcement.desc }}
      </p>

      <div class="mt-auto">
        <div class="flex items-center justify-between mb-3">
          <span
            v-if="announcement.type !== 'search'"
            class="text-[#F77821] font-extrabold text-2xl"
          >
            {{ announcement.price }}
            <span class="text-xs font-bold uppercase">zł</span>
          </span>
          <span
            v-else
            class="text-blue-600 font-bold text-xs uppercase tracking-wider"
          >
            {{ t("announcements.type.search") }}
          </span>
        </div>

        <div class="flex items-center gap-2 border-t border-gray-50 pt-3">
          <span
            class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-orange-50 text-[#F77821]"
          >
            {{ t("categories." + announcement.category.name) }}
          </span>
          <span
            class="flex items-center gap-1 text-gray-400 text-[10px] ml-auto italic"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
            </svg>
            {{ announcement.location }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
