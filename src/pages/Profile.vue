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

// Aktualizuj username i opis po zmianach użytkownika
const updateUserInfo = () => {
  username.value = auth.user?.name || "Użytkownik";
  desc.value = auth.user?.desc || "Brak opisu użytkownika.";
};

// Załaduj dane użytkownika i ogłoszenia
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

// Obsługa ustawień profilu
const openSettings = () => {
  showSettings.value = true;
  document.body.style.overflow = "hidden";
};

const closeSettings = () => {
  showSettings.value = false;
  document.body.style.overflow = "";
};

// Odśwież dane po aktualizacji profilu
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

  <div class="max-w-5xl mx-auto p-6">
    <!-- Header -->
    <div
      class="bg-white rounded-2xl shadow-md p-6 flex flex-col sm:flex-row gap-6 items-center min-h-[200px]"
    >
      <Loader v-if="userLoading" text="Ładowanie profilu..." />

      <template v-else>
        <div class="relative">
          <img
            class="w-40 h-40 object-cover border-4 border-[#F77821] rounded-2xl"
            :src="
              auth.user?.avatarUrl ||
              'https://via.placeholder.com/200x200?text=Profile'
            "
            alt="Profile image"
          />
          <div
            class="absolute bottom-2 right-2 bg-[#F77821] text-white text-xs px-2 py-1 rounded-full shadow"
          >
            {{ t("Profile.active") }}
          </div>
        </div>

        <div class="flex flex-col flex-1 gap-3">
          <div class="flex justify-between items-start">
            <h2 class="text-3xl font-bold text-gray-900">{{ username }}</h2>
            <button
              @click="openSettings()"
              class="bg-[#F77821] hover:bg-[#EA580C] transition-all duration-200 p-2 rounded-xl shadow-sm hover:shadow-md"
              title="Ustawienia"
            >
              <Settings class="text-white w-6 h-6" />
            </button>
          </div>
          <p class="text-gray-600 text-lg">{{ desc }}</p>
        </div>
      </template>
    </div>

    <!-- Tabs -->
    <div class="mt-8">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <!-- Zakładki -->
        <div class="flex flex-wrap gap-3 justify-center sm:justify-start">
          <button
            @click="selected = 'ann'"
            class="py-2 px-6 rounded-full border border-[#F77821] font-medium transition-all duration-200"
            :class="
              selected === 'ann'
                ? 'bg-[#F77821] text-white shadow-md'
                : 'bg-white text-[#F77821] hover:bg-[#F77821]/10'
            "
          >
            {{ t("Profile.announcements") }}
          </button>
          <button
            @click="selected = 'follow'"
            class="py-2 px-6 rounded-full border border-[#F77821] font-medium transition-all duration-200"
            :class="
              selected === 'follow'
                ? 'bg-[#F77821] text-white shadow-md'
                : 'bg-white text-[#F77821] hover:bg-[#F77821]/10'
            "
          >
            {{ t("Profile.following") }}
          </button>
        </div>

        <!-- Dodaj ogłoszenie -->
        <RouterLink
          to="/add-announcement"
          class="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-[#F77821] to-[#ff973b] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
        >
          {{ t("announcements.addButton") }}
        </RouterLink>
      </div>

      <div class="h-[2px] bg-[#F77821]/20 my-6"></div>

      <!-- Content -->
      <div class="min-h-[300px] bg-white rounded-2xl shadow p-6 text-gray-600">
        <!-- Własne ogłoszenia -->
        <div v-if="selected === 'ann'">
          <div v-if="announcementStore.loading">
            <Loader text="Ładuję Twoje ogłoszenia..." />
          </div>

          <div
            v-else-if="announcementStore.announcements.length === 0"
            class="text-center text-gray-500 py-10"
          >
            {{ t("Profile.noAnnouncements") || "Brak ogłoszeń." }}
          </div>

          <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnnouncementCard
              v-for="a in announcementStore.announcements"
              :key="
                a._id ||
                a.title + (typeof a.user === 'string' ? a.user : a.user._id)
              "
              :announcement="a"
              :isMobile="isMobile"
              :isOwner="announcementStore.isOwner"
              :isWatched="announcementStore.isWatched"
              :toggleWatch="announcementStore.toggleWatch"
            />
          </div>
        </div>

        <!-- Obserwowane ogłoszenia -->
        <div v-else-if="selected === 'follow'">
          <div v-if="announcementStore.loading">
            <Loader text="Ładuję obserwowane ogłoszenia..." />
          </div>

          <div
            v-else-if="announcementStore.followedAnnouncements.length === 0"
            class="text-center text-gray-500 py-10"
          >
            {{ t("Profile.noFollowed") || "Brak obserwowanych ogłoszeń." }}
          </div>

          <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnnouncementCard
              v-for="a in announcementStore.followedAnnouncements"
              :key="
                a._id ||
                a.title + (typeof a.user === 'string' ? a.user : a.user?._id)
              "
              :announcement="a"
              :isMobile="isMobile"
              :isOwner="announcementStore.isOwner"
              :isWatched="announcementStore.isWatched"
              :toggleWatch="announcementStore.toggleWatch"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
button:active {
  transform: scale(0.97);
}
</style>
