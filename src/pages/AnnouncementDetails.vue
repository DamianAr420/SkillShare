<script setup lang="ts">
import { watch, onMounted, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAnnouncementStore } from "@/stores/announcementStore";
import { useAuthStore } from "@/stores/authStore";
import Loader from "@/components/ui/Loader.vue";
import { useI18n } from "vue-i18n";
import { useToast } from "@/composables/useToast";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog.vue";
import ImageDialog from "@/components/dialogs/ImageDialog.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const announcementStore = useAnnouncementStore();
const auth = useAuthStore();
const { showToast } = useToast();

const isOwner = ref(false);
const showConfirm = ref(false);
const showImageModal = ref(false);
const modalImageSrc = ref("");

onMounted(async () => {
  const id = route.params.id as string;
  await announcementStore.fetchAnnouncementById(id);

  if (auth.isAuthenticated) {
    await auth.fetchWatchlist();
  }
});

watch(
  () => announcementStore.selectedAnnouncement,
  (announcement) => {
    if (!announcement) {
      isOwner.value = false;
      return;
    }

    const announcementUserId = announcement.user?._id;
    const currentUserId = auth.user?._id;
    isOwner.value =
      Boolean(announcementUserId && currentUserId) &&
      announcementUserId === currentUserId;
  },
  { immediate: true }
);

const isWatched = computed(() => {
  const selectedId = announcementStore.selectedAnnouncement?._id?.toString();
  if (!auth.user?.watchlist || !selectedId) return false;

  return auth.user.watchlist.some((item: any) => {
    const id = typeof item === "string" ? item : item._id?.toString();
    return id === selectedId;
  });
});

const handleEdit = () => {
  if (!announcementStore.selectedAnnouncement) return;
  router.push(
    `/announcement/edit/${announcementStore.selectedAnnouncement._id}`
  );
};

const handleDelete = () => {
  showConfirm.value = true;
};

const confirmDelete = async () => {
  try {
    if (!announcementStore.selectedAnnouncement) return;
    await announcementStore.deleteAnnouncement(
      announcementStore.selectedAnnouncement._id
    );
    router.push("/Profile");
    showToast(t("announcementDetails.annDelete.success"), "success");
  } catch (error) {
    showToast(t("announcementDetails.annDelete.error"), "error");
    console.error(error);
  } finally {
    showConfirm.value = false;
  }
};

const toggleWatch = async () => {
  if (!auth.isAuthenticated) {
    showToast(t("announcementDetails.loginToWatch"), "error");
    return;
  }
  try {
    await auth.toggleWatchlist(announcementStore.selectedAnnouncement!._id);

    await auth.fetchWatchlist();

    showToast(
      isWatched.value
        ? t("announcementDetails.watchSuccess")
        : t("announcementDetails.unwatchSuccess"),
      "success"
    );
  } catch (err) {
    showToast(t("announcementDetails.watchError"), "error");
  }
};

const goToProfile = (userId: string) => {
  if (!isOwner.value) {
    router.push(`/profile/${userId}`);
  } else {
    router.push(`/profile`);
  }
};
</script>

<template>
  <div class="max-w-6xl mx-auto p-6">
    <div class="flex justify-between mb-6">
      <button
        @click="router.back()"
        class="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F77821]/10 text-[#F77821] font-medium hover:bg-[#F77821]/20 transition-all duration-200 shadow-sm"
      >
        ⬅ {{ t("announcementDetails.back") }}
      </button>

      <div v-if="isOwner" class="flex gap-3">
        <button
          @click="handleEdit"
          class="px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-all duration-200 shadow-sm"
        >
          ✏️ {{ t("announcementDetails.edit") }}
        </button>
        <button
          @click="handleDelete"
          class="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-all duration-200 shadow-sm"
        >
          🗑 {{ t("announcementDetails.delete") }}
        </button>
      </div>
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
          class="w-full max-h-[400px] object-cover cursor-pointer"
          alt="Announcement image"
          @click="
            () => {
              modalImageSrc = announcementStore.selectedAnnouncement.imageUrl;
              showImageModal = true;
            }
          "
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

          <div v-if="!isOwner" class="flex justify-end mt-2">
            <button
              @click="toggleWatch"
              class="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm"
              :class="
                isWatched
                  ? 'bg-yellow-400/20 text-yellow-600 hover:bg-yellow-400/30'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              "
            >
              {{
                isWatched
                  ? "★ " + t("announcementDetails.watching")
                  : "☆ " + t("announcementDetails.watch")
              }}
            </button>
          </div>

          <div class="flex flex-wrap gap-3 text-sm text-gray-500 mt-4">
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

          <div
            v-if="announcementStore.selectedAnnouncement.price"
            class="mt-6 flex justify-between items-center"
          >
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
                <p
                  class="text-gray-800 font-medium cursor-pointer hover:underline"
                  @click="
                    goToProfile(announcementStore.selectedAnnouncement.user._id)
                  "
                >
                  {{ announcementStore.selectedAnnouncement.user.name }}
                </p>
              </div>

              <div v-if="announcementStore.selectedAnnouncement.showPhone">
                <p class="text-gray-500 text-sm">
                  {{ t("announcementDetails.seller.phone") }}
                </p>
                <p class="text-gray-800 font-medium">
                  {{
                    announcementStore.selectedAnnouncement.user.phone ||
                    t("announcementDetails.seller.no")
                  }}
                </p>
              </div>

              <div v-if="announcementStore.selectedAnnouncement.showEmail">
                <p class="text-gray-500 text-sm">
                  {{ t("announcementDetails.seller.email") }}
                </p>
                <p class="text-gray-800 font-medium break-words">
                  {{
                    announcementStore.selectedAnnouncement.user.email ||
                    t("announcementDetails.seller.no")
                  }}
                </p>
              </div>
              <button
                v-if="
                  auth.isAuthenticated &&
                  !isOwner &&
                  announcementStore.selectedAnnouncement?.user?._id
                "
                @click="
                  $router.push(
                    `/chat/${announcementStore.selectedAnnouncement.user._id}`
                  )
                "
                class="bg-[#F77821] text-white px-4 py-2 rounded"
              >
                Napisz do sprzedawcy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <ConfirmDialog
    :visible="showConfirm"
    :title="t('announcementDetails.confirmDelete.title')"
    :message="t('announcementDetails.confirmDelete.message')"
    :confirmText="t('announcementDetails.confirmDelete.yes')"
    :cancelText="t('announcementDetails.confirmDelete.no')"
    @confirm="confirmDelete"
    @cancel="showConfirm = false"
  />

  <ImageDialog
    :src="modalImageSrc"
    :visible="showImageModal"
    @close="showImageModal = false"
  />
</template>

<style scoped>
button:active {
  transform: scale(0.97);
}
</style>
