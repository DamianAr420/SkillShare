<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";
import { useAnnouncementStore } from "@/stores/announcementStore";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import Settings from "@/assets/icons/Settings.vue";
import Loader from "@/components/ui/Loader.vue";
import ProfileSettingsDialog from "@/components/dialogs/ProfileSettingsDialog.vue";
import AnnouncementCard from "@/components/AnnouncementCard.vue";
import { useBreakpoints } from "@/composables/useBreakpoints";

const auth = useAuthStore();
const announcementStore = useAnnouncementStore();
const { t } = useI18n();
const { isMobile } = useBreakpoints();

const username = ref("");
const desc = ref("");
const selected = ref<"ann" | "follow">("ann");
const userLoading = ref(true);
const showSettings = ref(false);

const updateUserInfo = () => {
  username.value = auth.user?.name || "Użytkownik";
  desc.value = auth.user?.desc || "Brak opisu użytkownika.";
};

const loadProfileData = async () => {
  userLoading.value = true;

  try {
    await auth.fetchUser();
    updateUserInfo();

    if (auth.user?._id) {
      await announcementStore.fetchUserAnnouncements(auth.user._id);
      if (auth.user.watchlist?.length) {
        await announcementStore.fetchFollowedAnnouncements(auth.user.watchlist);
      }
    }
  } catch (err) {
    console.error("❌ Failed to load profile data:", err);
  } finally {
    userLoading.value = false;
  }
};

onMounted(async () => {
  await loadProfileData();
});

const openSettings = () => {
  showSettings.value = true;
  document.body.style.overflow = "hidden";
};

const closeSettings = () => {
  showSettings.value = false;
  document.body.style.overflow = "";
};

const handleUpdated = async () => {
  await loadProfileData();
};
</script>

<template>
  <ProfileSettingsDialog
    :show="showSettings"
    @close="closeSettings"
    @updated="handleUpdated"
  />

  <div class="max-w-6xl mx-auto min-h-screen bg-[#fafafa]">
    <div
      class="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden mb-8"
    >
      <div
        class="relative h-32 bg-gradient-to-r from-[#F77821] to-[#ff9d5c] opacity-20"
      ></div>

      <div
        class="px-6 pb-8 sm:px-10 -mt-16 flex flex-col md:flex-row gap-6 items-center md:items-end"
      >
        <div class="relative group shrink-0">
          <img
            class="w-32 h-32 sm:w-36 md:w-40 sm:h-36 md:h-40 object-cover border-8 border-white rounded-[2.5rem] shadow-xl bg-white"
            :src="
              auth.user?.avatarUrl ||
              'https://via.placeholder.com/200x200?text=User'
            "
            alt="Profile image"
          />
          <div
            class="absolute bottom-3 right-3 w-5 h-5 bg-green-500 border-4 border-white rounded-full shadow-sm"
            :title="t('Profile.active')"
          ></div>
        </div>

        <div
          class="flex-1 flex flex-col lg:flex-row justify-between items-center lg:items-end gap-6 w-full"
        >
          <div class="text-center md:text-left space-y-2 flex-1 min-w-0">
            <h2
              class="text-3xl md:text-4xl font-black text-gray-900 tracking-tight truncate"
            >
              {{ username }}
            </h2>
            <p
              class="text-gray-500 font-medium max-w-xl line-clamp-2 text-sm md:text-base"
            >
              {{ desc || t("Profile.noDescription") }}
            </p>
          </div>

          <div
            class="flex flex-wrap items-center justify-center md:justify-start gap-3 shrink-0"
          >
            <button
              @click="openSettings()"
              class="flex items-center justify-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all cursor-pointer min-w-[140px] md:min-w-0"
            >
              <Settings class="w-5 h-5" />
              <span class="inline">{{
                t("Profile.settings") || "Ustawienia"
              }}</span>
            </button>

            <RouterLink
              to="/add-announcement"
              class="flex items-center justify-center gap-2 px-5 py-3 bg-[#F77821] text-white font-bold rounded-2xl shadow-lg shadow-orange-200 hover:bg-[#ff8a3d] hover:-translate-y-1 transition-all min-w-[140px] md:min-w-0"
            >
              <span class="text-xl leading-none">+</span>
              <span>{{ t("announcements.addButton") }}</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>

    <div class="space-y-8">
      <div
        class="flex items-center justify-center sm:justify-start gap-1 p-1.5 bg-gray-200/50 rounded-2xl w-fit mx-auto sm:mx-0"
      >
        <button
          @click="selected = 'ann'"
          class="px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer"
          :class="
            selected === 'ann'
              ? 'bg-white text-[#F77821] shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          "
        >
          {{ t("Profile.announcements") }}
          <span class="ml-1 opacity-50 text-xs"
            >({{ announcementStore.announcements.length }})</span
          >
        </button>
        <button
          @click="selected = 'follow'"
          class="px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 cursor-pointer"
          :class="
            selected === 'follow'
              ? 'bg-white text-[#F77821] shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          "
        >
          {{ t("Profile.following") }}
          <span class="ml-1 opacity-50 text-xs"
            >({{ auth.user?.watchlist?.length || 0 }})</span
          >
        </button>
      </div>

      <div class="min-h-[400px]">
        <Loader
          v-if="userLoading || announcementStore.loading"
          :text="t('Profile.loading')"
        />

        <template v-else>
          <div v-if="selected === 'ann'">
            <div
              v-if="announcementStore.announcements.length === 0"
              class="flex flex-col items-center justify-center py-20 text-center space-y-4"
            >
              <div
                class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-10 w-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <p class="text-gray-500 font-medium">
                {{ t("Profile.noAnnouncements") }}
              </p>
            </div>

            <div
              v-else
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnnouncementCard
                v-for="a in announcementStore.announcements"
                :key="a._id"
                :announcement="a"
                :isMobile="isMobile"
                :isOwner="() => true"
                :isWatched="() => false"
                :toggleWatch="announcementStore.toggleWatch"
              />
            </div>
          </div>

          <div v-else-if="selected === 'follow'">
            <div
              v-if="announcementStore.followedAnnouncements.length === 0"
              class="flex flex-col items-center justify-center py-20 text-center space-y-4"
            >
              <div
                class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-10 w-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <p class="text-gray-500 font-medium">
                {{ t("Profile.noFollowed") }}
              </p>
            </div>

            <div
              v-else
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnnouncementCard
                v-for="a in announcementStore.followedAnnouncements"
                :key="a._id"
                :announcement="a"
                :isMobile="isMobile"
                :isOwner="() => false"
                :isWatched="() => true"
                :toggleWatch="announcementStore.toggleWatch"
              />
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
