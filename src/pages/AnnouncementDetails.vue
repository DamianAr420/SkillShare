<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAnnouncementStore } from "@/stores/announcementStore";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/composables/useToast";
import { useI18n } from "vue-i18n";
import { useChatStore } from "@/stores/chatStore";
import { StarIcon as StarSolid } from "@heroicons/vue/24/solid";
import { StarIcon as StarOutline } from "@heroicons/vue/24/outline";

const route = useRoute();
const router = useRouter();
const announcementStore = useAnnouncementStore();
const auth = useAuthStore();
const { showToast } = useToast();
const { t } = useI18n();
const chatStore = useChatStore();

import Loader from "@/components/ui/Loader.vue";
import ConfirmDialog from "@/components/dialogs/ConfirmDialog.vue";
import ImageDialog from "@/components/dialogs/ImageDialog.vue";

import type { Announcement } from "@/types/announcement";

interface Seller {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
}

const showConfirm = ref(false);
const seller = ref<Seller | null>(null);
const sellerLoading = ref(false);

const showImageModal = ref(false);
const modalImageSrc = ref("");

const isOwner = computed(() => seller.value?._id === auth.user?._id);

const ann = computed<Announcement>(() => {
  return (
    announcementStore.selectedAnnouncement ?? {
      _id: "",
      title: t("announcementDetails.notFound"),
      desc: "",
      price: 0,
      location: "",
      createdAt: "",
      imageUrl: "",
      user: { _id: "", name: "" },
      category: { name: t("announcementDetails.unknownCategory") },
      type: "",
      showPhone: false,
      showEmail: false,
      views: 0,
    }
  );
});

const loadSeller = async () => {
  if (!ann.value) return;
  const sellerId =
    typeof ann.value.user === "string" ? ann.value.user : ann.value.user._id;
  if (!sellerId) return;
  sellerLoading.value = true;
  seller.value = await auth.fetchUserById(sellerId);
  sellerLoading.value = false;
};

watch(() => announcementStore.selectedAnnouncement, loadSeller);

onMounted(async () => {
  const id = route.params.id as string;
  await announcementStore.fetchAnnouncementById(id);
  if (auth.isAuthenticated) await auth.fetchWatchlist();
  await loadSeller();
  await announcementStore.countView(id);
});

const isWatched = computed(() => {
  const id = ann.value._id;
  if (!id || !auth.user?.watchlist) return false;
  return auth.user.watchlist.some(
    (item: any) => (typeof item === "string" ? item : item._id) === id
  );
});

const toggleWatch = async () => {
  if (!auth.isAuthenticated) {
    showToast(t("announcementDetails.loginToWatch"), "error");
    return;
  }
  if (!ann.value._id) return;
  try {
    await auth.toggleWatchlist(ann.value._id);
    await auth.fetchWatchlist();
    showToast(
      isWatched.value
        ? t("announcementDetails.watchSuccess")
        : t("announcementDetails.unwatchSuccess"),
      isWatched.value ? "success" : "info"
    );
  } catch {
    showToast(t("announcementDetails.watchError"), "error");
  }
};

const handleEdit = () => router.push(`/announcement/edit/${ann.value._id}`);
const handleDelete = () => (showConfirm.value = true);

const confirmDelete = async () => {
  if (!ann.value._id) return;
  try {
    await announcementStore.deleteAnnouncement(ann.value._id);
    router.push("/Profile");
    showToast(t("announcementDetails.annDelete.success"), "success");
  } catch {
    showToast(t("announcementDetails.annDelete.error"), "error");
  } finally {
    showConfirm.value = false;
  }
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    showToast(t("announcementDetails.copied", { email: text }), "success");
  } catch {
    showToast(t("announcementDetails.copyError"), "error");
  }
};

const goToProfile = (id: string) =>
  isOwner.value ? router.push("/profile") : router.push(`/profile/${id}`);
const openImage = (src: string) => {
  modalImageSrc.value = src;
  showImageModal.value = true;
};

const goToChat = async (userId: string) => {
  if (!auth.isAuthenticated) {
    showToast(t("announcementDetails.loginToChat"), "error");
    return;
  }

  try {
    const conversationId = await chatStore.startConversation(userId);
    if (conversationId) {
      router.push(`/chat/${conversationId}`);
    }
  } catch {
    showToast("Nie udało się rozpocząć rozmowy", "error");
  }
};
</script>

<template>
  <div class="max-w-5xl mx-auto p-4 space-y-6">
    <!-- Back button -->
    <button
      class="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition duration-300 shadow cursor-pointer"
      @click="router.back()"
    >
      {{ t("announcementDetails.back") }}
    </button>

    <Loader v-if="announcementStore.loading" />

    <div v-else class="space-y-6">
      <!-- Image -->
      <div
        class="w-full rounded-2xl overflow-hidden shadow-xl cursor-pointer"
        @click="openImage(ann.imageUrl || t('announcementDetails.noImage'))"
      >
        <img
          :src="ann.imageUrl || ''"
          :alt="ann.title"
          class="w-full h-80 md:h-96 object-cover transition duration-500"
        />
      </div>

      <!-- Info panel -->
      <div class="bg-white rounded-2xl shadow-xl p-6 space-y-4">
        <h1
          class="text-4xl font-extrabold text-gray-900 transition duration-300"
        >
          {{ ann.title }}
        </h1>
        <p class="text-gray-700 leading-relaxed">{{ ann.desc }}</p>

        <!-- Watch button -->
        <div
          v-if="
            auth.isAuthenticated &&
            !announcementStore.isOwner(announcementStore.selectedAnnouncement)
          "
          class="flex justify-end mt-4"
        >
          <button
            class="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl cursor-pointer"
            @click="toggleWatch"
          >
            <component
              :is="isWatched ? StarSolid : StarOutline"
              class="w-6 h-6 text-yellow-300 transition-colors duration-300 hover:text-yellow-100"
            />
            <span
              class="select-none transition-colors duration-300 hover:text-white"
            >
              {{
                isWatched
                  ? t("announcementDetails.watching")
                  : t("announcementDetails.watch")
              }}
            </span>
          </button>
        </div>

        <!-- Stats cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div v-if="ann.type !== 'search'" class="p-4 rounded-xl shadow-inner">
            <p class="text-gray-500 uppercase tracking-wide text-sm">
              {{ t("announcementDetails.price") }}
            </p>
            <p class="text-2xl font-bold">{{ ann.price }} zł</p>
          </div>
          <div class="p-4 rounded-xl shadow-inner">
            <p class="text-gray-500 uppercase tracking-wide text-sm">
              {{ t("announcementDetails.location") }}
            </p>
            <p class="text-xl font-semibold">{{ ann.location }}</p>
          </div>
          <div class="p-4 rounded-xl shadow-inner">
            <p class="text-gray-500 uppercase tracking-wide text-sm">
              {{ t("announcementDetails.category") }}
            </p>
            <p class="text-xl font-semibold">
              {{
                typeof ann.category === "string"
                  ? ann.category
                  : ann.category.name
              }}
            </p>
          </div>
          <div class="p-4 rounded-xl shadow-inner">
            <p class="text-gray-500 uppercase tracking-wide text-sm">
              {{ t("announcementDetails.type") }}
            </p>
            <p class="text-xl font-semibold">{{ ann.type }}</p>
          </div>
        </div>
      </div>

      <!-- Seller panel -->
      <div v-if="seller" class="rounded-2xl shadow-xl p-6 space-y-4">
        <h2 class="text-2xl font-semibold text-gray-800">
          {{ t("announcementDetails.sellerData") }}
        </h2>
        <p>
          <strong>{{ t("announcementDetails.seller.name") }}</strong>
          {{ seller.name }}
        </p>
        <p v-if="ann.showEmail && seller.email">
          <strong>{{ t("announcementDetails.seller.email") }}</strong>
          <span
            class="cursor-pointer text-blue-600 hover:underline transition duration-300"
            @click="copyToClipboard(seller.email)"
          >
            {{ seller.email }}
          </span>
        </p>
        <p v-if="ann.showPhone && seller.phone">
          <strong>{{ t("announcementDetails.seller.phone") }}</strong>
          {{ seller.phone }}
        </p>
        <div class="flex flex-wrap gap-3 mt-2">
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300 cursor-pointer"
            @click="goToProfile(seller._id)"
          >
            {{ t("announcementDetails.goToProfile") }}
          </button>
          <button
            class="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition duration-300 cursor-pointer"
            @click="goToChat(seller._id)"
          >
            {{ t("announcementDetails.chat.startChat") }}
          </button>
        </div>
      </div>

      <div class="w-fit flex flex-row gap-2 mx-auto items-center">
        <p>{{ t("announcementDetails.views") }}</p>
        <p>{{ ann.views }}</p>
      </div>

      <!-- Owner actions -->
      <div v-if="isOwner" class="flex flex-wrap gap-3 mt-4">
        <button
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-300 cursor-pointer"
          @click="handleEdit"
        >
          {{ t("announcementDetails.edit") }}
        </button>
        <button
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-300 cursor-pointer"
          @click="handleDelete"
        >
          {{ t("announcementDetails.delete") }}
        </button>
      </div>
    </div>

    <ConfirmDialog
      :visible="showConfirm"
      :title="t('announcementDetails.confirmDelete.title')"
      :message="t('announcementDetails.confirmDelete.message')"
      @confirm="confirmDelete"
      @close="showConfirm = false"
    />

    <ImageDialog
      :visible="showImageModal"
      :src="modalImageSrc"
      @close="showImageModal = false"
    />
  </div>
</template>
