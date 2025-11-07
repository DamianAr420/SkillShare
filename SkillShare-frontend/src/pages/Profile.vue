<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";
import { useAnnouncementStore } from "@/stores/announcementStore";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import Settings from "@/assets/icons/Settings.vue";
import Loader from "@/components/ui/Loader.vue";

const auth = useAuthStore();
const announcementStore = useAnnouncementStore();
const { t } = useI18n();

const username = ref("");
const desc = ref("");
const selected = ref("ann");
const userLoading = ref(true);

onMounted(async () => {
  userLoading.value = true;
  await auth.fetchUser();
  username.value = auth.user?.name || "Użytkownik";
  desc.value = auth.user?.desc || "Brak opisu użytkownika.";
  userLoading.value = false;

  if (auth.user?._id) {
    await announcementStore.fetchUserAnnouncements(auth.user._id);
  }
});
</script>

<template>
  <div class="max-w-5xl mx-auto p-6">
    <!-- Header -->
    <div
      class="bg-white rounded-2xl shadow-md p-6 flex flex-col sm:flex-row gap-6 items-center min-h-[200px]"
    >
      <!-- Loader podczas ładowania użytkownika -->
      <Loader v-if="userLoading" text="Ładowanie profilu..." />

      <!-- Główne dane użytkownika -->
      <template v-else>
        <div class="relative">
          <img
            class="w-40 h-40 object-cover border-4 border-[#F77821] rounded-2xl"
            :src="
              auth.user?.imageUrl ||
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

      <div class="h-[2px] bg-[#F77821]/20 my-6"></div>

      <!-- Content -->
      <div class="min-h-[300px] bg-white rounded-2xl shadow p-6 text-gray-600">
        <!-- Ogłoszenia -->
        <div v-if="selected === 'ann'">
          <div v-if="announcementStore.loading">
            <Loader text="Ładuję Twoje ogłoszenia..." />
          </div>

          <div
            v-else-if="
              announcementStore.announcements.length === 0 &&
              !announcementStore.loading
            "
            class="text-center text-gray-500 py-10"
          >
            {{ t("Profile.noAnnouncements") || "Brak ogłoszeń." }}
          </div>

          <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="a in announcementStore.announcements"
              :key="a._id"
              @click="$router.push(`/announcement/${a._id}`)"
              class="bg-white rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col"
            >
              <img
                :src="
                  a.imageUrl ||
                  'https://via.placeholder.com/300x200?text=' +
                    t('announcements.noImage')
                "
                class="h-40 w-full object-cover rounded mb-3"
                alt="img"
              />
              <h3 class="text-lg font-semibold mb-1">{{ a.title }}</h3>
              <p class="text-sm text-gray-600 flex-grow">{{ a.desc }}</p>
              <div class="flex items-center justify-between mt-3">
                <span class="text-[#F77821] font-semibold text-xl">
                  {{ a.price }} zł
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Obserwowani -->
        <div
          v-else-if="selected === 'follow'"
          class="flex flex-col items-center justify-center h-full"
        >
          <h3 class="text-xl font-semibold text-[#F77821] mb-2">
            {{ t("Profile.following") }}
          </h3>
          <p class="text-gray-500">
            Lista obserwowanych ogłoszeń pojawi się tutaj.
          </p>
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
