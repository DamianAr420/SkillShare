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
    formData.append("type", "search");
    formData.append("showPhone", showPhone.value ? "true" : "false");
    formData.append("showEmail", showEmail.value ? "true" : "false");

    if (imageFile.value) {
      formData.append("image", imageFile.value);
    }

    await announcementStore.addAnnouncement(formData);

    showToast(t("addAnnouncement.success"), "success");
    router.push("/categories");
  } catch (err) {
    console.error(err);
    showToast(t("addAnnouncement.error"), "error");
  }
};
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <form
      @submit.prevent="handleSubmit"
      class="flex flex-col gap-6 bg-white shadow-[0_0_10px_2px_rgba(0,0,0,0.25)] rounded-3xl p-8"
    >
      <input
        v-model="title"
        type="text"
        :placeholder="t('addAnnouncement.titlePlaceholder')"
        class="border border-gray-300 p-4 rounded-xl focus:ring-2 focus:ring-[#F77821] focus:border-[#F77821] transition outline-none text-gray-700"
        required
      />
      <textarea
        v-model="description"
        rows="5"
        :placeholder="t('addAnnouncement.descriptionPlaceholder')"
        class="border border-gray-300 p-4 rounded-xl focus:ring-2 focus:ring-[#F77821] focus:border-[#F77821] transition outline-none text-gray-700"
        required
      ></textarea>
      <div class="flex flex-col sm:flex-row gap-4">
        <input
          v-model="location"
          type="text"
          :placeholder="t('addAnnouncement.locationPlaceholder')"
          class="border border-gray-300 p-4 rounded-xl flex-1 focus:ring-2 focus:ring-[#F77821] focus:border-[#F77821] transition outline-none text-gray-700"
        />
        <select
          v-model="category"
          class="border border-gray-300 p-4 rounded-xl flex-1 focus:ring-2 focus:ring-[#F77821] focus:border-[#F77821] transition outline-none text-gray-700"
          required
        >
          <option value="">{{ t("addAnnouncement.selectCategory") }}</option>
          <option
            v-for="cat in categoryStore.categories"
            :key="cat._id"
            :value="cat._id"
          >
            {{ t("categories." + cat.name) }}
          </option>
        </select>
      </div>
      <div class="flex flex-col items-center">
        <label class="text-xl text-gray-500 mb-2 font-medium">
          {{ t("addAnnouncement.imageLabel") }}
        </label>
        <div
          class="relative w-full h-full mb-3 flex justify-center items-center"
        >
          <img
            v-if="previewUrl"
            :src="previewUrl"
            class="w-full h-full object-cover rounded-2xl border-2 border-gray-200 shadow-sm"
          />
          <div
            v-else
            class="w-32 h-32 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 text-3xl border-2 border-gray-200"
          >
            +
          </div>
          <input
            type="file"
            accept="image/*"
            @change="onFileChange"
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-2xl"
          />
        </div>
        <p class="text-lg text-gray-400">
          {{ t("addAnnouncement.imageHint") }}
        </p>
      </div>

      <div class="flex flex-col sm:flex-row gap-6">
        <!-- Telefon -->
        <div
          class="flex flex-col flex-1 justify-center items-center text-center"
        >
          <label class="font-medium text-gray-700 mb-2">
            {{ t("addAnnouncement.showPhone") }}
          </label>
          <button
            type="button"
            @click="showPhone = !showPhone"
            :class="showPhone ? 'bg-[#F77821]' : 'bg-gray-300'"
            class="relative w-20 h-10 rounded-full cursor-pointer flex items-center px-1 justify-between transition-colors duration-200"
          >
            <span
              class="font-medium ml-1"
              :class="showPhone ? 'text-white' : 'text-gray-400'"
            >
              {{ t("addAnnouncement.yes") }}
            </span>
            <span
              class="font-medium mr-1"
              :class="!showPhone ? 'text-white' : 'text-gray-400'"
            >
              {{ t("addAnnouncement.no") }}
            </span>

            <div
              class="absolute w-10 h-8 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out"
              :class="showPhone ? 'translate-x-8' : 'translate-x-0'"
            ></div>
          </button>
        </div>

        <!-- Email -->
        <div
          class="flex flex-col flex-1 justify-center items-center text-center"
        >
          <label class="font-medium text-gray-700 mb-2">
            {{ t("addAnnouncement.showEmail") }}
          </label>
          <button
            type="button"
            @click="showEmail = !showEmail"
            :class="showEmail ? 'bg-[#F77821]' : 'bg-gray-300'"
            class="relative w-20 h-10 rounded-full cursor-pointer flex items-center px-1 justify-between transition-colors duration-200"
          >
            <span
              class="font-medium ml-1"
              :class="showEmail ? 'text-white' : 'text-gray-400'"
            >
              {{ t("addAnnouncement.yes") }}
            </span>
            <span
              class="font-medium mr-1"
              :class="!showEmail ? 'text-white' : 'text-gray-400'"
            >
              {{ t("addAnnouncement.no") }}
            </span>

            <div
              class="absolute w-10 h-8 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out"
              :class="showEmail ? 'translate-x-8' : 'translate-x-0'"
            ></div>
          </button>
        </div>
      </div>

      <button
        type="submit"
        class="mt-6 bg-[#F77821] hover:bg-[#ff973b] text-white font-semibold py-4 rounded-2xl shadow-lg transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="announcementStore.loading"
      >
        {{
          announcementStore.loading
            ? t("addAnnouncement.adding")
            : t("addAnnouncement.addButton")
        }}
      </button>
    </form>
    <Toast />
  </div>
</template>
