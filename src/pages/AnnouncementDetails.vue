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
    <button
      class="group mb-8 flex items-center gap-2 text-gray-500 font-semibold hover:text-[#F77821] transition-colors cursor-pointer"
      @click="router.push({ name: 'Search' })"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5 transform group-hover:-translate-x-1 transition-transform"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 19l-7-7 7-7"
        />
      </svg>
      {{ t("announcementDetails.back") }}
    </button>

    <Loader v-if="announcementStore.loading" />

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-6">
        <div
          class="relative bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 group cursor-zoom-in"
          @click="openImage(ann.imageUrl || '')"
        >
          <img
            v-if="ann.imageUrl"
            :src="ann.imageUrl"
            :alt="ann.title"
            class="w-full h-[300px] md:h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div
            v-else
            class="w-full h-80 bg-gray-100 flex items-center justify-center text-gray-400"
          >
            {{ t("announcementDetails.noImage") }}
          </div>

          <div class="absolute top-6 left-6">
            <span
              class="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg backdrop-blur-md"
              :class="
                ann.type === 'offer'
                  ? 'bg-green-500/90 text-white'
                  : 'bg-blue-500/90 text-white'
              "
            >
              {{ t(`announcements.type.${ann.type}`) }}
            </span>
          </div>
        </div>

        <div
          class="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100"
        >
          <div
            class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
          >
            <h1
              class="text-3xl md:text-4xl font-black text-gray-900 leading-tight"
            >
              {{ ann.title }}
            </h1>
            <div
              v-if="ann.price !== null"
              class="text-3xl font-black text-[#F77821] whitespace-nowrap"
            >
              {{ ann.price }}
              <span class="text-lg font-normal text-gray-400">zł</span>
            </div>
          </div>

          <div
            class="prose prose-orange max-w-none text-gray-600 leading-relaxed text-lg italic mb-10"
          >
            {{ ann.desc }}
          </div>

          <div
            class="grid grid-cols-2 md:grid-cols-3 gap-6 pt-8 border-t border-gray-50"
          >
            <div>
              <p
                class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1"
              >
                {{ t("announcementDetails.location") }}
              </p>
              <p class="font-bold text-gray-800">
                {{ ann.location || "Polska" }}
              </p>
            </div>
            <div>
              <p
                class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1"
              >
                {{ t("announcementDetails.category") }}
              </p>
              <p class="font-bold text-gray-800">
                {{
                  typeof ann.category === "string"
                    ? ann.category
                    : ann.category.name
                }}
              </p>
            </div>
            <div>
              <p
                class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1"
              >
                {{ t("announcementDetails.views") }}
              </p>
              <p class="font-bold text-gray-800">{{ ann.views }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div
          class="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-orange-100/50 border border-orange-50 space-y-4 lg:sticky lg:top-8"
        >
          <button
            v-if="auth.isAuthenticated && !isOwner"
            @click="toggleWatch"
            class="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold transition-all duration-300 border-2 cursor-pointer"
            :class="
              isWatched
                ? 'border-orange-500 text-orange-500 bg-orange-50'
                : 'border-gray-100 text-gray-700 hover:border-orange-200'
            "
          >
            <component
              :is="isWatched ? StarSolid : StarOutline"
              class="w-6 h-6"
            />
            {{
              isWatched
                ? t("announcementDetails.watching")
                : t("announcementDetails.watch")
            }}
          </button>

          <div v-if="seller" class="pt-4 space-y-6">
            <div
              @click="goToProfile(seller._id)"
              class="flex items-center gap-4 pb-6 border-b border-gray-50 cursor-pointer group/seller"
            >
              <div class="relative">
                <div
                  class="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-[#F77821] text-2xl font-black group-hover/seller:bg-[#F77821] group-hover/seller:text-white transition-all duration-300"
                >
                  {{ seller.name.charAt(0).toUpperCase() }}
                </div>
                <div
                  class="absolute -bottom-1 -right-1 bg-white p-1 rounded-lg shadow-sm opacity-0 group-hover/seller:opacity-100 transition-opacity"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </div>
              </div>

              <div>
                <p
                  class="text-xs font-bold text-gray-400 uppercase tracking-widest"
                >
                  {{ t("announcementDetails.sellerData") }}
                </p>
                <h3
                  class="text-xl font-bold text-gray-900 group-hover/seller:text-[#F77821] transition-colors"
                >
                  {{ seller.name }}
                </h3>
                <p
                  class="text-[10px] text-orange-400 font-bold opacity-0 group-hover/seller:opacity-100 transition-opacity uppercase"
                >
                  {{ t("announcementDetails.viewProfile") }}
                </p>
              </div>
            </div>

            <div class="space-y-4">
              <button
                v-if="!isOwner"
                @click="goToChat(seller._id)"
                class="w-full py-4 bg-[#F77821] text-white rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-[#ff8a3d] hover:-translate-y-1 transition-all cursor-pointer"
              >
                {{ t("announcementDetails.chat.startChat") }}
              </button>

              <div
                v-if="ann.showPhone && seller.phone"
                class="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center"
              >
                <p class="text-[10px] text-gray-400 font-bold uppercase mb-1">
                  {{ t("announcementDetails.seller.phone") }}
                </p>
                <p class="text-xl font-bold text-gray-800">
                  {{ seller.phone }}
                </p>
              </div>

              <div
                v-if="ann.showEmail && seller.email"
                @click="copyToClipboard(seller.email)"
                class="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center cursor-pointer hover:border-orange-200 hover:bg-orange-50 transition-all group/email"
              >
                <p
                  class="text-[10px] text-gray-400 font-bold uppercase mb-1 group-hover/email:text-orange-500"
                >
                  {{ t("announcementDetails.seller.email") }}
                </p>
                <p class="text-sm font-bold text-gray-800 break-all">
                  {{ seller.email }}
                </p>
                <p
                  class="text-[9px] text-orange-400 opacity-0 group-hover/email:opacity-100 transition-opacity mt-1 uppercase font-bold"
                >
                  {{ t("announcementDetails.clickToCopy") }}
                </p>
              </div>
            </div>
          </div>

          <div
            v-if="isOwner"
            class="pt-6 grid grid-cols-2 gap-3 border-t border-gray-100"
          >
            <button
              @click="handleEdit"
              class="py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors cursor-pointer"
            >
              {{ t("announcementDetails.edit") }}
            </button>
            <button
              @click="handleDelete"
              class="py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors cursor-pointer"
            >
              {{ t("announcementDetails.delete") }}
            </button>
          </div>
        </div>
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

<style scoped>
.prose {
  white-space: pre-line;
}
</style>
