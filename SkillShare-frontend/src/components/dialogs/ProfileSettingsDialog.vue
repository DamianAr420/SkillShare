<script setup lang="ts">
import { ref, watch } from "vue";
import { useAuthStore } from "@/stores/authStore";
import Loader from "@/components/ui/Loader.vue";

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits(["close", "updated"]);

const auth = useAuthStore();

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
  } catch (err) {
    console.error(err);
    alert("Błąd podczas zapisu ustawień.");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
  >
    <div
      class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative animate-fadeIn"
    >
      <button
        @click="$emit('close')"
        class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl transition"
      >
        ×
      </button>

      <h2 class="text-2xl font-semibold text-gray-900 mb-5 text-center">
        Ustawienia profilu
      </h2>

      <form @submit.prevent="saveSettings" class="flex flex-col gap-4">
        <div>
          <label class="text-sm text-gray-500">Avatar</label>
          <input
            type="file"
            @change="handleFileChange"
            accept="image/*"
            class="mt-1 text-sm text-gray-600"
          />
          <img
            v-if="previewUrl"
            :src="previewUrl"
            class="w-24 h-24 object-cover rounded-lg mt-3 border border-gray-200 shadow-sm"
          />
        </div>

        <div>
          <label class="text-sm text-gray-500">Nazwa</label>
          <input
            v-model="editName"
            required
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F77821]/60 transition"
          />
        </div>

        <div>
          <label class="text-sm text-gray-500">E-mail</label>
          <input
            v-model="editEmail"
            type="email"
            required
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F77821]/60 transition"
          />
        </div>

        <div>
          <label class="text-sm text-gray-500">Telefon</label>
          <input
            v-model="editPhone"
            type="tel"
            required
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F77821]/60 transition"
          />
        </div>

        <div>
          <label class="text-sm text-gray-500">Opis</label>
          <textarea
            v-model="editDesc"
            rows="3"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F77821]/60 transition"
          />
        </div>

        <div>
          <label class="text-sm text-gray-500">Nowe hasło</label>
          <input
            v-model="editPassword"
            type="password"
            placeholder="Zostaw puste, aby nie zmieniać"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F77821]/60 transition"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="bg-[#F77821] hover:bg-[#EA580C] text-white py-2 rounded-lg font-medium transition-all duration-200 shadow disabled:opacity-60 flex items-center justify-center"
        >
          <Loader v-if="loading" text="Zapisuję..." />
          <span v-else>Zapisz zmiany</span>
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
