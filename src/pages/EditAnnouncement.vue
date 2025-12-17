<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useCategoryStore } from "@/stores/categoryStore";
import { useAnnouncementStore } from "@/stores/announcementStore";
import { useToast } from "@/composables/useToast";
import { useI18n } from "vue-i18n";
import Loader from "@/components/ui/Loader.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const categoryStore = useCategoryStore();
const announcementStore = useAnnouncementStore();
const { showToast } = useToast();

const title = ref<string>("");
const description = ref<string>("");
const price = ref<number | null>(null);
const location = ref<string>("");
const category = ref<string>("");
const imageFile = ref<File | null>(null);
const previewUrl = ref<string>("");
const showPhone = ref(true);
const showEmail = ref(true);
const loading = ref(true);

const onFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    imageFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
  }
};

onMounted(async () => {
  const id = route.params.id as string;
  loading.value = true;

  try {
    await categoryStore.fetchCategories();
    await announcementStore.fetchAnnouncementById(id);
    const ann = announcementStore.selectedAnnouncement;

    if (!ann) {
      showToast(t("announcementDetails.notFound"), "error");
      router.push("/categories");
      return;
    }

    title.value = ann.title;
    description.value = ann.desc;
    price.value = ann.price ?? null;
    location.value = ann.location ?? "";
    showEmail.value = ann.showEmail;
    showPhone.value = ann.showPhone;

    const catName =
      typeof ann.category === "string" ? ann.category : ann.category.name;
    const found = categoryStore.categories.find((c) => c.name === catName);
    category.value = found?._id ?? "";
  } finally {
    loading.value = false;
  }
});

const handleUpdate = async () => {
  try {
    const id = route.params.id as string;
    const formData = new FormData();
    formData.append("title", title.value);
    formData.append("desc", description.value);
    formData.append("price", price.value?.toString() || "");
    formData.append("location", location.value);
    formData.append("category", category.value);
    formData.append("showPhone", String(showPhone.value));
    formData.append("showEmail", String(showEmail.value));

    if (imageFile.value) {
      formData.append("image", imageFile.value);
    }

    await announcementStore.updateAnnouncement(id, formData);
    showToast(t("editAnnouncement.success"), "success");
    router.push(`/announcement/${id}`);
  } catch (err) {
    showToast(t("editAnnouncement.error"), "error");
  }
};
</script>

<template>
  <div class="min-h-screen bg-[#fafafa] py-12 px-4 sm:px-6">
    <div class="max-w-3xl mx-auto">
      <div class="text-center mb-10 space-y-2">
        <h1 class="text-4xl font-black text-gray-900 tracking-tight">
          {{ t("editAnnouncement.title") }}
        </h1>
        <p class="text-gray-500 font-medium">
          {{
            t("editAnnouncement.subtitle") ||
            "Zaktualizuj szczegóły swojego ogłoszenia"
          }}
        </p>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <Loader />
      </div>

      <form
        v-else
        @submit.prevent="handleUpdate"
        class="bg-white shadow-xl shadow-gray-200/50 rounded-[2.5rem] border border-gray-100 p-6 sm:p-10 flex flex-col gap-6"
      >
        <div class="space-y-2">
          <label class="text-sm font-bold text-gray-700 ml-1">{{
            t("addAnnouncement.titleLabel")
          }}</label>
          <input
            v-model="title"
            type="text"
            required
            class="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-100 focus:border-[#F77821] transition-all outline-none text-gray-700 font-medium"
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-bold text-gray-700 ml-1">{{
            t("addAnnouncement.descLabel")
          }}</label>
          <textarea
            v-model="description"
            rows="5"
            required
            class="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-100 focus:border-[#F77821] transition-all outline-none text-gray-700 font-medium resize-none"
          ></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-if="announcementStore.selectedAnnouncement?.type !== 'search'"
            class="space-y-2"
          >
            <label class="text-sm font-bold text-gray-700 ml-1">{{
              t("addAnnouncement.priceLabel")
            }}</label>
            <div class="relative">
              <input
                v-model.number="price"
                type="number"
                class="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-100 focus:border-[#F77821] transition-all outline-none text-gray-700 font-bold"
              />
              <span
                class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold"
                >PLN</span
              >
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-bold text-gray-700 ml-1">{{
              t("addAnnouncement.locationLabel")
            }}</label>
            <input
              v-model="location"
              type="text"
              class="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-100 focus:border-[#F77821] transition-all outline-none text-gray-700 font-medium"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-bold text-gray-700 ml-1">{{
            t("addAnnouncement.categoryLabel")
          }}</label>
          <select
            v-model="category"
            required
            class="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-100 focus:border-[#F77821] transition-all outline-none text-gray-700 font-medium appearance-none cursor-pointer"
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
            <img
              v-if="previewUrl"
              :src="previewUrl"
              class="w-full h-full object-cover"
            />
            <img
              v-else-if="announcementStore.selectedAnnouncement?.imageUrl"
              :src="announcementStore.selectedAnnouncement.imageUrl"
              class="w-full h-full object-cover"
            />
            <div v-else class="text-gray-400 font-bold">+</div>

            <div
              class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-sm"
            >
              {{ t("addAnnouncement.imageHint") }}
            </div>
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
              class="relative w-14 h-8 rounded-full transition-colors duration-300"
              :class="showPhone ? 'bg-[#F77821]' : 'bg-gray-300'"
            >
              <div
                class="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300"
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
              class="relative w-14 h-8 rounded-full transition-colors duration-300"
              :class="showEmail ? 'bg-[#F77821]' : 'bg-gray-300'"
            >
              <div
                class="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300"
                :class="showEmail ? 'translate-x-6' : 'translate-x-0'"
              ></div>
            </button>
          </div>
        </div>

        <button
          type="submit"
          class="mt-4 w-full bg-[#F77821] text-white font-black py-5 rounded-[2rem] shadow-xl shadow-orange-100 hover:bg-[#ff8a3d] hover:-translate-y-1 active:scale-95 transition-all cursor-pointer text-lg"
        >
          {{ t("editAnnouncement.updateButton") || "Zapisz zmiany" }}
        </button>
      </form>
    </div>
  </div>
</template>
