<script setup lang="ts">
import { ref, watch } from "vue";
import { useAuthStore } from "@/stores/authStore";
import Loader from "@/components/ui/Loader.vue";
import { useI18n } from "vue-i18n";
import { useToast } from "@/composables/useToast";

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits(["close", "updated"]);

const auth = useAuthStore();
const { t } = useI18n();
const { showToast } = useToast();

const editName = ref("");
const editDesc = ref("");
const editEmail = ref("");
const editPhone = ref("");
const editPassword = ref("");
const avatarFile = ref<File | null>(null);
const previewUrl = ref("");
const loading = ref(false);

watch(
  () => props.show,
  (newVal) => {
    if (newVal && auth.user) {
      editName.value = auth.user.name || "";
      editDesc.value = auth.user.desc || "";
      editEmail.value = auth.user.email || "";
      editPhone.value = auth.user.phone || "";
      previewUrl.value = auth.user.avatarUrl || "";
    }
  }
);

const handleFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    avatarFile.value = file;
    previewUrl.value = URL.createObjectURL(file);
  }
};

const saveSettings = async () => {
  loading.value = true;
  const formData = new FormData();

  if (avatarFile.value) formData.append("avatar", avatarFile.value);
  formData.append("name", editName.value);
  formData.append("desc", editDesc.value);
  formData.append("email", editEmail.value);
  formData.append("phone", editPhone.value);
  if (editPassword.value) formData.append("password", editPassword.value);

  try {
    await auth.updateUserData(formData);
    emit("updated");
    emit("close");
    showToast(t("Profile.edit.success"), "success");
  } catch (err) {
    console.error(err);
    showToast(t("Profile.edit.error"), "error");
  } finally {
    loading.value = false;
  }
};

function onBackdropClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (target.classList.contains("backdrop")) emit("close");
}
</script>

<template>
  <div
    v-if="show"
    @click="onBackdropClick"
    class="backdrop fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
  >
    <div
      class="bg-white rounded-3xl shadow-2xl w-full max-w-md sm:max-w-lg p-5 sm:p-6 relative animate-fadeIn overflow-y-auto max-h-[90vh]"
    >
      <!-- Zamknij -->
      <button
        @click="$emit('close')"
        class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl transition"
      >
        ×
      </button>

      <!-- Tytuł -->
      <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-5 text-center">
        {{ t("Profile.edit.title") }}
      </h2>

      <form @submit.prevent="saveSettings" class="flex flex-col gap-4 sm:gap-5">
        <!-- Avatar -->
        <div class="flex flex-col items-center">
          <label class="text-sm text-gray-500 mb-2 font-medium">
            {{ t("Profile.edit.avatar") }}
          </label>

          <div class="relative w-24 h-24 sm:w-28 sm:h-28 mb-2">
            <img
              v-if="previewUrl"
              :src="previewUrl"
              class="w-full h-full object-cover rounded-full border-2 border-gray-200 shadow-sm"
            />
            <div
              v-else
              class="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-xl border-2 border-gray-200"
            >
              +
            </div>

            <input
              type="file"
              accept="image/*"
              @change="handleFileChange"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
            />
          </div>

          <p class="text-xs text-gray-400 text-center">
            {{ t("Profile.edit.avatarHint") }}
          </p>
        </div>

        <!-- Imię -->
        <div>
          <label class="text-sm text-gray-500 mb-1">{{
            t("Profile.edit.name")
          }}</label>
          <input
            v-model="editName"
            required
            class="w-full border border-gray-300 rounded-xl px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F77821] transition"
          />
        </div>

        <!-- Email -->
        <div>
          <label class="text-sm text-gray-500 mb-1">{{
            t("Profile.edit.email")
          }}</label>
          <input
            v-model="editEmail"
            type="email"
            class="w-full border border-gray-300 rounded-xl px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F77821] transition"
          />
        </div>

        <!-- Telefon -->
        <div>
          <label class="text-sm text-gray-500 mb-1">{{
            t("Profile.edit.phone")
          }}</label>
          <input
            v-model="editPhone"
            type="tel"
            class="w-full border border-gray-300 rounded-xl px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F77821] transition"
          />
        </div>

        <!-- Opis -->
        <div>
          <label class="text-sm text-gray-500 mb-1">{{
            t("Profile.edit.description")
          }}</label>
          <textarea
            v-model="editDesc"
            rows="3"
            class="w-full border border-gray-300 rounded-xl px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F77821] transition resize-none"
          />
        </div>

        <!-- Hasło -->
        <div>
          <label class="text-sm text-gray-500 mb-1">{{
            t("Profile.edit.password")
          }}</label>
          <input
            v-model="editPassword"
            type="password"
            :placeholder="t('Profile.edit.passwordPlaceholder')"
            class="w-full border border-gray-300 rounded-xl px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F77821] transition"
          />
        </div>

        <!-- Zapisz -->
        <button
          type="submit"
          :disabled="loading"
          class="bg-[#F77821] hover:bg-[#EA580C] text-white py-3 rounded-2xl font-semibold transition-all duration-200 shadow flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Loader v-if="loading" :text="t('Profile.edit.saving')" />
          <span v-else>{{ t("Profile.edit.saveButton") }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fadeIn {
  animation: fadeIn 0.25s ease-out;
}
</style>
