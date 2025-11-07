<script setup lang="ts">
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAnnouncementStore } from "@/stores/announcementStore";
import { useAuthStore } from "@/stores/authStore";
import Loader from "@/components/ui/Loader.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const announcementStore = useAnnouncementStore();
const auth = useAuthStore();

onMounted(async () => {
  const id = route.params.id as string;
  await announcementStore.fetchAnnouncementById(id);
});
</script>

<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="flex justify-start mb-6">
      <button
        @click="router.back()"
        class="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F77821]/10 text-[#F77821] font-medium hover:bg-[#F77821]/20 transition-all duration-200 shadow-sm"
      >
        ⬅ {{ t("announcementDetails.back") }}
      </button>
    </div>

    <div v-if="announcementStore.loading" class="flex justify-center py-10">
      <Loader :text="t('announcementDetails.loading')" />
    </div>

    <div
      v-else-if="!announcementStore.selectedAnnouncement"
      class="text-center text-gray-500 py-10"
    >
      {{ t("announcementDetails.notFound") }}
    </div>

    <div
      v-else
      class="bg-white shadow-lg rounded-2xl overflow-hidden flex flex-col gap-6"
    >
      <div class="w-full bg-gray-50 flex items-center justify-center">
        <img
          :src="
            announcementStore.selectedAnnouncement.imageUrl ||
            'https://via.placeholder.com/800x400?text=' +
              t('announcementDetails.noImage')
          "
          class="w-full max-h-[400px] object-cover"
          alt="Announcement image"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        <div class="md:col-span-2 flex flex-col gap-4">
          <h1 class="text-3xl font-bold text-gray-900">
            {{ announcementStore.selectedAnnouncement.title }}
          </h1>
          <p class="text-gray-700 text-lg leading-relaxed">
            {{ announcementStore.selectedAnnouncement.desc }}
          </p>

          <div class="flex flex-wrap gap-3 text-sm text-gray-500">
            <span
              class="bg-[#F77821]/10 text-[#F77821] px-3 py-1 rounded-full font-medium"
            >
              {{
                announcementStore.selectedAnnouncement.category?.name ||
                t("announcementDetails.unknownCategory")
              }}
            </span>
            <span
              >📍 {{ announcementStore.selectedAnnouncement.location }}</span
            >
            <span>
              🕒
              {{
                new Date(
                  announcementStore.selectedAnnouncement.createdAt || ""
                ).toLocaleDateString()
              }}
            </span>
          </div>

          <div class="mt-6 flex justify-between items-center">
            <span class="text-3xl font-semibold text-[#F77821]">
              {{ announcementStore.selectedAnnouncement.price }} zł
            </span>
          </div>
        </div>

        <div class="bg-gray-50 rounded-xl p-4">
          <h3 class="font-semibold text-lg mb-3">
            {{ t("announcementDetails.sellerData") }}
          </h3>

          <div v-if="auth.loading">
            <Loader text="Ładowanie danych użytkownika..." />
          </div>

          <div v-if="announcementStore.selectedAnnouncement.user">
            <div class="space-y-2">
              <div>
                <p class="text-gray-500 text-sm">
                  {{ t("announcementDetails.seller.name") }}
                </p>
                <p class="text-gray-800 font-medium">
                  {{ announcementStore.selectedAnnouncement.user.name }}
                </p>
              </div>

              <div>
                <p class="text-gray-500 text-sm">
                  {{ t("announcementDetails.seller.phone") }}
                </p>
                <p class="text-gray-800 font-medium">
                  {{
                    announcementStore.selectedAnnouncement.user.phone ||
                    t("announcementDetails.seller.noPhone")
                  }}
                </p>
              </div>

              <div>
                <p class="text-gray-500 text-sm">
                  {{ t("announcementDetails.seller.email") }}
                </p>
                <p class="text-gray-800 font-medium break-words">
                  {{ announcementStore.selectedAnnouncement.user.email }}
                </p>
              </div>
            </div>
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
