<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useCategoryStore } from "@/stores/categoryStore";
import { useAnnouncementStore } from "@/stores/announcementStore";
import { useRouter } from "vue-router";
import { useToast } from "@/composables/useToast";
import { useAuthStore } from "@/stores/authStore";

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
const imageUrl = ref("");

onMounted(() => {
  categoryStore.fetchCategories();
  authStore.fetchUser();
});

const handleSubmit = async () => {
  try {
    await announcementStore.addAnnouncement({
      title: title.value,
      desc: description.value,
      price: Number(price.value),
      location: location.value,
      category: category.value,
      imageUrl: imageUrl.value || "",
      user: authStore.user?._id || "",
    });

    showToast("✅ Ogłoszenie zostało dodane!", "success");
    router.push("/categories");
  } catch (err) {
    console.error(err);
    showToast("❌ Wystąpił błąd przy dodawaniu ogłoszenia.", "error");
  }
};
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <h1 class="text-3xl font-bold mb-8 text-center">Dodaj nowe ogłoszenie</h1>

    <form
      @submit.prevent="handleSubmit"
      class="flex flex-col gap-4 bg-white shadow-md rounded-2xl p-6"
    >
      <input
        v-model="title"
        type="text"
        placeholder="Tytuł"
        class="border p-3 rounded-md"
        required
      />

      <textarea
        v-model="description"
        rows="4"
        placeholder="Opis ogłoszenia"
        class="border p-3 rounded-md"
        required
      />

      <div class="flex flex-col sm:flex-row gap-4">
        <input
          v-model="price"
          type="number"
          placeholder="Cena (zł)"
          class="border p-3 rounded-md flex-1"
          required
        />
        <input
          v-model="location"
          type="text"
          placeholder="Lokalizacja"
          class="border p-3 rounded-md flex-1"
        />
      </div>

      <select v-model="category" class="border p-3 rounded-md" required>
        <option value="">Wybierz kategorię</option>
        <option
          v-for="cat in categoryStore.categories"
          :key="cat._id"
          :value="cat._id"
        >
          {{ cat.name }}
        </option>
      </select>

      <input
        v-model="imageUrl"
        type="text"
        placeholder="URL obrazka (opcjonalnie)"
        class="border p-3 rounded-md"
      />

      <button
        type="submit"
        class="mt-4 bg-[#F77821] hover:bg-[#ff973b] text-white font-semibold py-3 rounded-xl shadow-md transition"
        :disabled="announcementStore.loading"
      >
        {{ announcementStore.loading ? "Dodawanie..." : "Dodaj ogłoszenie" }}
      </button>
    </form>

    <!-- 🔔 Toaster -->
    <Toast />
  </div>
</template>

<script lang="ts">
import Toast from "@/components/ui/Toast.vue";
export default { components: { Toast } };
</script>
