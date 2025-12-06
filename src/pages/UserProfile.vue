<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { useAnnouncementStore } from "@/stores/announcementStore";
import Loader from "@/components/ui/Loader.vue";

const route = useRoute();
const auth = useAuthStore();
const announcementStore = useAnnouncementStore();

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

      <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="a in announcementStore.announcements"
          :key="a._id"
          @click="$router.push(`/announcement/${a._id}`)"
          class="bg-white rounded-xl shadow-[0_0_5px_1px_rgba(0,0,0,0.25)] hover:shadow-[0_0_8px_1px_rgba(0,0,0,0.25)] hover:shadow-[#F77821] transition p-4 flex flex-col cursor-pointer"
        >
          <img
            :src="
              a.imageUrl ||
              'https://via.placeholder.com/300x200?text=Brak+zdjęcia'
            "
            class="h-40 w-full object-cover rounded mb-3"
            alt="img"
          />
          <h3 class="text-lg font-semibold mb-1">{{ a.title }}</h3>
          <p class="text-sm text-gray-600 flex-grow">{{ a.desc }}</p>
          <div class="flex items-center justify-between mt-3">
            <span v-if="a.price" class="text-[#F77821] font-semibold text-xl"
              >{{ a.price }} zł</span
            >
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
