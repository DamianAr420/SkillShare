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

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    imageFile.value = target.files[0];
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
    if (imageFile.value) formData.append("image", imageFile.value);

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
    <h1 class="text-4xl font-extrabold mb-10 text-center text-gray-800">
      {{ t("addAnnouncement.title") }}
    </h1>

    <form
      @submit.prevent="handleSubmit"
      class="flex flex-col gap-6 bg-white shadow-lg rounded-3xl p-8"
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
          v-model="price"
          type="number"
          :placeholder="t('addAnnouncement.pricePlaceholder')"
          class="border border-gray-300 p-4 rounded-xl flex-1 focus:ring-2 focus:ring-[#F77821] focus:border-[#F77821] transition outline-none text-gray-700"
          required
        />
        <input
          v-model="location"
          type="text"
          :placeholder="t('addAnnouncement.locationPlaceholder')"
          class="border border-gray-300 p-4 rounded-xl flex-1 focus:ring-2 focus:ring-[#F77821] focus:border-[#F77821] transition outline-none text-gray-700"
        />
      </div>

      <select
        v-model="category"
        class="border border-gray-300 p-4 rounded-xl focus:ring-2 focus:ring-[#F77821] focus:border-[#F77821] transition outline-none text-gray-700"
        required
      >
        <option value="">{{ t("addAnnouncement.selectCategory") }}</option>
        <option
          v-for="cat in categoryStore.categories"
          :key="cat._id"
          :value="cat._id"
        >
          {{ cat.name }}
        </option>
      </select>

      <input
        type="file"
        accept="image/*"
        @change="onFileChange"
        class="border border-gray-300 p-4 rounded-xl file:bg-[#F77821] file:text-white file:px-4 file:py-2 file:rounded-xl file:cursor-pointer hover:file:bg-[#ff973b] transition outline-none"
      />

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
