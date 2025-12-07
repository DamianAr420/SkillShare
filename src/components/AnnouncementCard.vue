<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useToast } from "@/composables/useToast";

const { t } = useI18n();
const { showToast } = useToast();

const props = defineProps({
  announcement: { type: Object, required: true },
  isOwner: { type: Function, required: true },
  isWatched: { type: Function, required: true },
  toggleWatch: { type: Function, required: true },
  isMobile: { type: Boolean, required: true },
});

const toggleWatchLocal = async (announcementId: string) => {
  const result = await props.toggleWatch(announcementId);

  if (result === "added") {
    showToast(t("announcementDetails.watchSuccess"), "success");
  } else if (result === "removed") {
    showToast(t("announcementDetails.unwatchSuccess"), "info");
  } else {
    showToast(t("announcementDetails.watchError"), "error");
  }
};
</script>

<template>
  <!-- MOBILE CARD -->
  <div
    v-if="isMobile"
    class="bg-white rounded-xl shadow-[0px_0px_8px_1px_rgba(0,0,0,0.25)] p-3 active:scale-[0.98] transition cursor-pointer"
    @click="$router.push(`/announcement/${announcement._id}`)"
  >
    <div class="relative">
      <img
        :src="
          announcement.imageUrl ||
          'https://via.placeholder.com/300x200?text=' +
            t('announcements.noImage')
        "
        class="h-48 w-full object-cover rounded-lg"
      />

      <button
        v-if="announcement.user && !isOwner(announcement)"
        @click.stop="toggleWatchLocal(announcement._id)"
        class="absolute top-2 right-2 text-yellow-400 text-3xl bg-white rounded-full shadow p-1 leading-none"
        :class="{ 'scale-110': isWatched(announcement) }"
      >
        {{ isWatched(announcement) ? "★" : "☆" }}
      </button>
    </div>

    <h3 class="text-lg font-bold mt-3 mb-1">
      {{ announcement.title }}
    </h3>

    <div class="flex flex-wrap items-center gap-2 mb-2">
      <span
        class="px-2 py-1 rounded-full text-[11px] font-semibold border"
        :class="{
          'bg-green-200 border-green-400 text-green-800':
            announcement.type === 'offer',
          'bg-blue-200 border-blue-400 text-blue-800':
            announcement.type === 'search',
        }"
      >
        {{ t(`announcements.type.${announcement.type}`) }}
      </span>

      <span
        class="px-2 py-1 rounded-full text-[11px] bg-[#F77821] text-white font-medium border border-[#F77821]"
      >
        {{ t("categories." + announcement.category.name) }}
      </span>

      <span
        class="flex items-center gap-1 bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded-lg border border-orange-200 shadow-sm"
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

        {{ announcement.location || t("announcements.noLocation") }}
      </span>
    </div>

    <p class="text-gray-700 text-sm mb-3 line-clamp-3">
      {{ announcement.desc }}
    </p>

    <span
      v-if="announcement.price !== null"
      class="text-[#F77821] font-bold text-2xl"
    >
      {{ announcement.price }} zł
    </span>
  </div>

  <!-- DESKTOP CARD -->
  <div
    v-else
    class="bg-white rounded-xl shadow-[0_0_5px_1px_rgba(0,0,0,0.25)] hover:shadow-[0_0_8px_1px_rgba(0,0,0,0.25)] hover:shadow-[#F77821] transition p-4 flex flex-col relative"
  >
    <img
      :src="
        announcement.imageUrl ||
        'https://via.placeholder.com/300x200?text=' + t('announcements.noImage')
      "
      class="h-40 w-full object-cover rounded mb-3 cursor-pointer"
      @click="$router.push(`/announcement/${announcement._id}`)"
    />

    <h3 class="text-lg font-semibold mb-1 flex items-center justify-between">
      {{ announcement.title }}
      <button
        v-if="announcement.user && !isOwner(announcement)"
        @click.stop="toggleWatchLocal(announcement._id)"
        class="ml-2 text-yellow-500 text-2xl transition-transform duration-200"
        :class="{ 'scale-110': isWatched(announcement) }"
      >
        {{ isWatched(announcement) ? "★" : "☆" }}
      </button>
    </h3>

    <p class="text-sm text-gray-600 flex-grow">
      {{ announcement.desc }}
    </p>

    <span
      v-if="announcement.price !== null"
      class="text-[#F77821] font-bold text-lg sm:text-xl mt-2 text-right"
    >
      {{ announcement.price }} zł
    </span>

    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between mt-3 gap-2 sm:gap-4"
    >
      <span
        class="px-2 py-1 rounded-full text-xs font-semibold border flex-shrink-0"
        :class="{
          'bg-green-200 border-green-400 text-green-800':
            announcement.type === 'offer',
          'bg-blue-200 border-blue-400 text-blue-800':
            announcement.type === 'search',
        }"
      >
        {{ t(`announcements.type.${announcement.type}`) }}
      </span>

      <span
        class="px-3 py-1 rounded-full text-sm font-medium border bg-[#F77821] text-white border-[#F77821] flex-shrink-0"
      >
        {{ t("categories." + announcement.category.name) }}
      </span>

      <span
        class="flex items-center gap-1 bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded-lg border border-orange-200 shadow-sm"
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

        {{ announcement.location || t("announcements.noLocation") }}
      </span>
    </div>
  </div>
</template>
