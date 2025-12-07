<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useAnnouncementStore } from "@/stores/announcementStore";
import AnnouncementCard from "@/components/AnnouncementCard.vue";
import Loader from "@/components/ui/Loader.vue";
import { useBreakpoints } from "@/composables/useBreakpoints";

const route = useRoute();
const auth = useAuthStore();
const announcementStore = useAnnouncementStore();
const { isMobile } = useBreakpoints();

const userId = route.params.id as string;
const userLoading = ref(true);

onMounted(async () => {
  userLoading.value = true;
  try {
    await auth.fetchUserById(userId);

    if (auth.selectedUser?._id) {
      await announcementStore.fetchUserAnnouncements(auth.selectedUser._id);
    }
  } catch (err) {
    console.error("❌ Failed to load user profile:", err);
  } finally {
    userLoading.value = false;
  }
});
</script>

<template>
  <div class="max-w-5xl mx-auto p-6">
    <!-- PROFILE HEADER -->
    <div
      class="bg-white rounded-2xl shadow-md p-6 flex flex-col sm:flex-row gap-6 items-center min-h-[200px]"
    >
      <Loader v-if="userLoading" text="Ładowanie profilu..." />

      <template v-else>
        <div class="relative">
          <img
            class="w-40 h-40 object-cover border-4 border-[#F77821] rounded-2xl"
            :src="
              auth.selectedUser?.avatarUrl ||
              'https://via.placeholder.com/200x200?text=Profile'
            "
            alt="Profile image"
          />
        </div>

        <div class="flex flex-col flex-1 gap-3">
          <h2 class="text-3xl font-bold text-gray-900">
            {{ auth.selectedUser?.name || "Użytkownik" }}
          </h2>
          <p class="text-gray-600 text-lg">
            {{ auth.selectedUser?.desc || "Brak opisu użytkownika." }}
          </p>
        </div>
      </template>
    </div>

    <!-- USER ANNOUNCEMENTS -->
    <div class="mt-8">
      <h3 class="text-xl font-semibold mb-4">Ogłoszenia użytkownika</h3>

      <div v-if="announcementStore.loading">
        <Loader text="Ładuję ogłoszenia użytkownika..." />
      </div>

      <div
        v-else-if="announcementStore.announcements.length === 0"
        class="text-center text-gray-500 py-10"
      >
        Brak ogłoszeń.
      </div>

      <div v-else>
        <!-- MOBILE VIEW -->
        <div v-if="isMobile" class="flex flex-col gap-4">
          <AnnouncementCard
            v-for="a in announcementStore.announcements"
            :key="a._id"
            :announcement="a"
            :isMobile="true"
            :isOwner="announcementStore.isOwner"
            :isWatched="announcementStore.isWatched"
            :toggleWatch="announcementStore.toggleWatch"
          />
        </div>

        <!-- DESKTOP VIEW -->
        <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnnouncementCard
            v-for="a in announcementStore.announcements"
            :key="a._id"
            :announcement="a"
            :isMobile="false"
            :isOwner="announcementStore.isOwner"
            :isWatched="announcementStore.isWatched"
            :toggleWatch="announcementStore.toggleWatch"
          />
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
