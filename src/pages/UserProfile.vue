<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { useAnnouncementStore } from "@/stores/announcementStore";
import AnnouncementCard from "@/components/AnnouncementCard.vue";
import Loader from "@/components/ui/Loader.vue";
import { useBreakpoints } from "@/composables/useBreakpoints";
import { useI18n } from "vue-i18n";
import { useToast } from "@/composables/useToast";
import { useChatStore } from "@/stores/chatStore";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const announcementStore = useAnnouncementStore();
const { isMobile } = useBreakpoints();
const { t } = useI18n();
const { showToast } = useToast();
const chatStore = useChatStore();

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

const goToChat = async (userId: string) => {
  if (!auth.isAuthenticated) {
    showToast(t("announcementDetails.loginToChat"), "error");
    return;
  }

  try {
    await chatStore.startConversation(userId);

    await chatStore.fetchConversations();

    router.push({
      name: "chat",
      query: { id: chatStore.activeConversationId },
    });
  } catch (error) {
    console.error("Błąd podczas przechodzenia do czatu:", error);
    showToast(t("announcementDetails.chatError"), "error");
  }
};
</script>

<template>
  <div class="max-w-6xl mx-auto min-h-screen bg-[#fafafa]">
    <div
      class="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden mb-12"
    >
      <div
        class="relative h-32 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-20"
      ></div>

      <div
        class="px-6 pb-8 sm:px-10 -mt-16 flex flex-col md:flex-row gap-6 items-center md:items-end"
      >
        <div class="relative shrink-0">
          <img
            class="w-32 h-32 sm:w-40 sm:h-40 object-cover border-8 border-white rounded-[2.5rem] shadow-xl bg-white"
            :src="
              auth.selectedUser?.avatarUrl ||
              'https://via.placeholder.com/200x200?text=User'
            "
            alt="Profile image"
          />
        </div>

        <div class="flex-1 text-center md:text-left space-y-2 min-w-0 pb-2">
          <Loader v-if="userLoading" :text="t('Profile.loadingProfile')" />
          <template v-else>
            <h2
              class="text-3xl md:text-4xl font-black text-gray-900 tracking-tight truncate"
            >
              {{ auth.selectedUser?.name || "Użytkownik" }}
            </h2>
            <p
              class="text-gray-500 font-medium max-w-2xl line-clamp-3 text-sm md:text-base"
            >
              {{ auth.selectedUser?.desc || t("Profile.noDescription") }}
            </p>
            <button
              v-if="auth.selectedUser?._id"
              @click="goToChat(auth.selectedUser._id)"
              class="w-full md:w-fit px-8 py-3 bg-[#F77821] text-white rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-[#ff8a3d] hover:-translate-y-1 transition-all cursor-pointer mt-2"
            >
              {{ t("Profile.startChat") }}
            </button>
          </template>
        </div>
      </div>
    </div>

    <div class="space-y-6">
      <div class="flex items-center justify-between px-2">
        <h3 class="text-xl font-black text-gray-900 uppercase tracking-wider">
          {{ t("Profile.announcements") }}
          <span class="text-orange-500 ml-1"
            >({{ announcementStore.announcements.length }})</span
          >
        </h3>
      </div>

      <div class="min-h-[300px]">
        <Loader v-if="announcementStore.loading" :text="t('Profile.loading')" />

        <template v-else>
          <div
            v-if="announcementStore.announcements.length === 0"
            class="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white rounded-[2.5rem] border border-dashed border-gray-200"
          >
            <div
              class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-8 w-8"
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
              Ten użytkownik nie ma obecnie aktywnych ogłoszeń.
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
              :isOwner="() => false"
              :isWatched="() => announcementStore.isWatched(a)"
              :toggleWatch="announcementStore.toggleWatch"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
