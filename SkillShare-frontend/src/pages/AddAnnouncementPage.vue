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
    <h1 class="text-3xl font-bold mb-8 text-center">
      {{ t("addAnnouncement.title") }}
    </h1>

    <form
      @submit.prevent="handleSubmit"
      class="flex flex-col gap-4 bg-white shadow-md rounded-2xl p-6"
    >
      <input
        v-model="title"
        type="text"
        :placeholder="t('addAnnouncement.titlePlaceholder')"
        class="border p-3 rounded-md"
        required
      />

      <textarea
        v-model="description"
        rows="4"
        :placeholder="t('addAnnouncement.descriptionPlaceholder')"
        class="border p-3 rounded-md"
        required
      />

      <div class="flex flex-col sm:flex-row gap-4">
        <input
          v-model="price"
          type="number"
          :placeholder="t('addAnnouncement.pricePlaceholder')"
          class="border p-3 rounded-md flex-1"
          required
        />
        <input
          v-model="location"
          type="text"
          :placeholder="t('addAnnouncement.locationPlaceholder')"
          class="border p-3 rounded-md flex-1"
        />
      </div>

      <select v-model="category" class="border p-3 rounded-md" required>
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
        class="border p-3 rounded-md"
      />

      <button
        type="submit"
        class="mt-4 bg-[#F77821] hover:bg-[#ff973b] text-white font-semibold py-3 rounded-xl shadow-md transition"
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
