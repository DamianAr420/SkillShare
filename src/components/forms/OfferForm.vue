<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useCategoryStore } from "@/stores/categoryStore";
import { useAnnouncementStore } from "@/stores/announcementStore";
import { useRouter } from "vue-router";
import { useToast } from "@/composables/useToast";
import { useAuthStore } from "@/stores/authStore";
import { useI18n } from "vue-i18n";
import Toast from "@/components/ui/Toast.vue";

const { t } = useI18n();
const router = useRouter();
const categoryStore = useCategoryStore();
const announcementStore = useAnnouncementStore();
const { showToast } = useToast();
const authStore = useAuthStore();

const title = ref("");
const description = ref("");
const price = ref("");
const location = ref("");
const category = ref("");
const imageFile = ref<File | null>(null);
const previewUrl = ref("");
const showPhone = ref(true);
const showEmail = ref(true);

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    imageFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
  }
};

onMounted(() => {
  categoryStore.fetchCategories();
  authStore.fetchUser();
});

const handleSubmit = async () => {
  try {
    const formData = new FormData();
    formData.append("title", title.value);
    formData.append("desc", description.value);
    formData.append("price", price.value);
    formData.append("location", location.value);
    formData.append("category", category.value);
    formData.append("user", authStore.user?._id || "");
    formData.append("type", "offer");
    formData.append("showPhone", String(showPhone.value));
    formData.append("showEmail", String(showEmail.value));

    if (imageFile.value) formData.append("image", imageFile.value);

    await announcementStore.addAnnouncement(formData);
    showToast(t("addAnnouncement.success"), "success");
    router.push("/categories");
  } catch (err) {
    showToast(t("addAnnouncement.error"), "error");
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="flex flex-col gap-6">
    <div class="space-y-2">
      <label class="text-sm font-bold text-gray-700 ml-1">{{
        t("addAnnouncement.titleLabel") || "Tytuł ogłoszenia"
      }}</label>
      <input
        v-model="title"
        type="text"
        :placeholder="t('addAnnouncement.titlePlaceholder')"
        class="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-100 focus:border-[#F77821] transition-all outline-none text-gray-700 font-medium"
        required
      />
    </div>

    <div class="space-y-2">
      <label class="text-sm font-bold text-gray-700 ml-1">{{
        t("addAnnouncement.descLabel") || "Opis"
      }}</label>
      <textarea
        v-model="description"
        rows="5"
        :placeholder="t('addAnnouncement.descriptionPlaceholder')"
        class="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-100 focus:border-[#F77821] transition-all outline-none text-gray-700 font-medium resize-none"
        required
      ></textarea>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="space-y-2">
        <label class="text-sm font-bold text-gray-700 ml-1">{{
          t("addAnnouncement.priceLabel") || "Cena"
        }}</label>
        <div class="relative">
          <input
            v-model="price"
            type="number"
            :placeholder="t('addAnnouncement.pricePlaceholder')"
            class="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-100 focus:border-[#F77821] transition-all outline-none text-gray-700 font-bold"
            required
          />
          <span
            class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold"
            >PLN</span
          >
        </div>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-bold text-gray-700 ml-1">{{
          t("addAnnouncement.locationLabel") || "Lokalizacja"
        }}</label>
        <input
          v-model="location"
          type="text"
          :placeholder="t('addAnnouncement.locationPlaceholder')"
          class="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-100 focus:border-[#F77821] transition-all outline-none text-gray-700 font-medium"
        />
      </div>
    </div>

    <div class="space-y-2">
      <label class="text-sm font-bold text-gray-700 ml-1">{{
        t("addAnnouncement.categoryLabel") || "Kategoria"
      }}</label>
      <select
        v-model="category"
        class="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-100 focus:border-[#F77821] transition-all outline-none text-gray-700 font-medium appearance-none cursor-pointer"
        required
      >
        <option value="" disabled>
          {{ t("addAnnouncement.selectCategory") }}
        </option>
        <option
          v-for="cat in categoryStore.categories"
          :key="cat._id"
          :value="cat._id"
        >
          {{ t("categories." + cat.name) }}
        </option>
      </select>
    </div>

    <div class="space-y-4 py-4">
      <label
        class="block text-center text-sm font-bold text-gray-700 uppercase tracking-widest"
      >
        {{ t("addAnnouncement.imageLabel") }}
      </label>
      <div
        class="relative group mx-auto w-full max-w-sm aspect-video bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden hover:border-orange-400 hover:bg-orange-50/30 transition-all cursor-pointer"
      >
        <template v-if="previewUrl">
          <img :src="previewUrl" class="w-full h-full object-cover" />
          <div
            class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-sm"
          >
            Zmień zdjęcie
          </div>
        </template>
        <template v-else>
          <div class="flex flex-col items-center gap-2 text-gray-400">
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span class="text-xs font-bold uppercase tracking-tighter">{{
              t("addAnnouncement.imageHint")
            }}</span>
          </div>
        </template>
        <input
          type="file"
          accept="image/*"
          @change="onFileChange"
          class="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>
    </div>

    <div
      class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-3xl border border-gray-100"
    >
      <div class="flex items-center justify-between px-4 py-2">
        <span class="text-sm font-bold text-gray-600">{{
          t("addAnnouncement.showPhone")
        }}</span>
        <button
          type="button"
          @click="showPhone = !showPhone"
          class="relative w-14 h-8 rounded-full transition-colors duration-300 flex items-center"
          :class="showPhone ? 'bg-[#F77821]' : 'bg-gray-300'"
        >
          <div
            class="absolute w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 mx-1"
            :class="showPhone ? 'translate-x-6' : 'translate-x-0'"
          ></div>
        </button>
      </div>

      <div class="flex items-center justify-between px-4 py-2">
        <span class="text-sm font-bold text-gray-600">{{
          t("addAnnouncement.showEmail")
        }}</span>
        <button
          type="button"
          @click="showEmail = !showEmail"
          class="relative w-14 h-8 rounded-full transition-colors duration-300 flex items-center"
          :class="showEmail ? 'bg-[#F77821]' : 'bg-gray-300'"
        >
          <div
            class="absolute w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 mx-1"
            :class="showEmail ? 'translate-x-6' : 'translate-x-0'"
          ></div>
        </button>
      </div>
    </div>

    <button
      type="submit"
      :disabled="announcementStore.loading"
      class="mt-4 w-full bg-[#F77821] text-white font-black py-5 rounded-[2rem] shadow-xl shadow-orange-200 hover:bg-[#ff8a3d] hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none text-lg tracking-wide"
    >
      {{
        announcementStore.loading
          ? t("addAnnouncement.adding")
          : t("addAnnouncement.addButton")
      }}
    </button>
  </form>
  <Toast />
</template>
