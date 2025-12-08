<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useCategoryStore } from "@/stores/categoryStore";
import { useAnnouncementStore } from "@/stores/announcementStore";
import { useToast } from "@/composables/useToast";
import { useI18n } from "vue-i18n";

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

const onFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    imageFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
  }
};

onMounted(async () => {
  const id = route.params.id as string;

  await categoryStore.fetchCategories();
  await announcementStore.fetchAnnouncementById(id);

  const ann = announcementStore.selectedAnnouncement;

  if (!ann) {
    showToast(t("announcementDetails.notFound"), "error");
    return;
  }

  title.value = ann.title;
  description.value = ann.desc;
  price.value = ann.price ?? null;
  location.value = ann.location ?? "";
  showEmail.value = ann.showEmail;
  showPhone.value = ann.showPhone;

  // 🔥 Category może być stringiem lub { name }
  let catName = "";
  if (typeof ann.category === "string") {
    catName = ann.category;
  } else {
    catName = ann.category.name;
  }

  // 🔥 Znajdujemy kategorię w bazie po nazwie i ustawiamy ID
  const found = categoryStore.categories.find((c) => c.name === catName);
  category.value = found?._id ?? "";
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
    formData.append("showPhone", showPhone.value ? "true" : "false");
    formData.append("showEmail", showEmail.value ? "true" : "false");

    if (imageFile.value) {
      formData.append("image", imageFile.value);
    }

    await announcementStore.updateAnnouncement(id, formData);

    showToast(t("editAnnouncement.success"), "success");
    router.push(`/announcement/${id}`);
  } catch (err) {
    console.error(err);
    showToast(t("editAnnouncement.error"), "error");
  }
};
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-10">
    <h1 class="text-4xl font-extrabold mb-10 text-center text-gray-800">
      {{ t("editAnnouncement.title") }}
    </h1>

    <form
      @submit.prevent="handleUpdate"
      class="flex flex-col gap-6 bg-white shadow-lg rounded-3xl p-8"
    >
      <input
        v-model="title"
        type="text"
        required
        :placeholder="t('addAnnouncement.titlePlaceholder')"
        class="border border-gray-300 p-4 rounded-xl"
      />

      <textarea
        v-model="description"
        rows="5"
        required
        :placeholder="t('addAnnouncement.descriptionPlaceholder')"
        class="border border-gray-300 p-4 rounded-xl"
      ></textarea>

      <div class="flex flex-col sm:flex-row gap-4">
        <input
          v-if="announcementStore.selectedAnnouncement?.type !== 'search'"
          v-model.number="price"
          type="number"
          :placeholder="t('addAnnouncement.pricePlaceholder')"
          class="border border-gray-300 p-4 rounded-xl flex-1"
        />

        <input
          v-model="location"
          type="text"
          :placeholder="t('addAnnouncement.locationPlaceholder')"
          class="border border-gray-300 p-4 rounded-xl flex-1"
        />
      </div>

      <select
        v-model="category"
        required
        class="border border-gray-300 p-4 rounded-xl"
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

      <div class="flex flex-col items-center">
        <label class="text-xl text-gray-500 mb-2 font-medium">
          {{ t("editAnnouncement.image") }}
        </label>

        <div class="relative w-full h-full mb-3">
          <img
            v-if="previewUrl"
            :src="previewUrl"
            class="w-32 h-32 object-cover rounded-2xl border-2 border-gray-200 shadow-sm"
          />

          <img
            v-else-if="announcementStore.selectedAnnouncement?.imageUrl"
            :src="announcementStore.selectedAnnouncement.imageUrl"
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
          {{ t("editAnnouncement.imageHint") }}
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
        class="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl shadow-lg cursor-pointer"
      >
        {{ t("editAnnouncement.updateButton") }}
      </button>
    </form>
  </div>
</template>
