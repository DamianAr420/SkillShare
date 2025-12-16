<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "@/stores/authStore";
import { checkNameAvailability } from "@/api/auth";
import { useToast } from "@/composables/useToast";
import { useChatStore } from "@/stores/chatStore";

type ErrorField = "name" | "password" | "repeatPassword" | "general";

const { t } = useI18n();
const auth = useAuthStore();
const { showToast } = useToast();
const chatStore = useChatStore();

const login = ref(true);
const name = ref("");
const password = ref("");
const repeatPassword = ref("");
const nameAvailable = ref<boolean | null>(null);

const localErrors = ref<{
  name?: string;
  password?: string;
  repeatPassword?: string;
  general?: string;
}>({});

const emit = defineEmits(["close"]);

function onBackdropClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (target.classList.contains("backdrop")) emit("close");
}

function toggleForm() {
  login.value = !login.value;
  name.value = "";
  password.value = "";
  repeatPassword.value = "";
  localErrors.value = {};
  nameAvailable.value = null;
}

// 🕓 debounce dla sprawdzania dostępności nazwy
let debounceTimer: number | undefined;
watch(name, (val) => {
  if (!val || login.value) return;
  clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(async () => {
    try {
      const available = await checkNameAvailability(val);
      nameAvailable.value = available;
      localErrors.value.name = available
        ? undefined
        : t("LoginDialog.errors.nameTaken");
    } catch {
      localErrors.value.name = t("LoginDialog.errors.nameCheckFailed");
    }
  }, 500);
});

// 🔍 sprawdzanie zgodności haseł w czasie rzeczywistym
watch([password, repeatPassword], ([pass, repeat]) => {
  if (!login.value) {
    localErrors.value.repeatPassword =
      repeat && pass !== repeat
        ? t("LoginDialog.errors.passwordsMismatch")
        : undefined;
  }
});

async function handleLogin() {
  localErrors.value = {};
  try {
    await auth.login(name.value, password.value);

    if (auth.token) {
      await chatStore.initializeChat(auth.token);
    }

    showToast(t("LoginDialog.success.login"), "success");
    emit("close");
  } catch {
    const err = auth.error;
    showToast(t("LoginDialog.errors.loginFailed"), "error");

    if (
      err?.field &&
      ["name", "password", "repeatPassword", "general"].includes(err.field)
    ) {
      localErrors.value[err.field as ErrorField] = err.message;
    } else {
      localErrors.value.general =
        err?.message || t("LoginDialog.errors.loginFailed");
    }
  }
}

async function handleRegister() {
  localErrors.value = {};

  if (nameAvailable.value === false) {
    localErrors.value.name = t("LoginDialog.errors.nameTaken");
    return;
  }

  if (localErrors.value.repeatPassword) return;

  try {
    await auth.register(name.value, password.value);
    showToast(t("LoginDialog.success.register"), "success");
    toggleForm();
  } catch {
    const err = auth.error;

    if (
      err?.field &&
      ["name", "password", "repeatPassword", "general"].includes(err.field)
    ) {
      localErrors.value[err.field as ErrorField] = err.message;
    } else {
      localErrors.value.general =
        err?.message || t("LoginDialog.errors.registerFailed");
    }
  }
}
</script>

<template>
  <div
    @click="onBackdropClick"
    class="backdrop fixed inset-0 z-50 bg-black/30 flex justify-center items-center"
  >
    <Transition mode="out-in">
      <!-- LOGIN -->
      <div
        v-if="login"
        key="login"
        v-motion
        :initial="{ opacity: 0, x: -50, scale: 0.95 }"
        :enter="{ opacity: 1, x: 0, scale: 1 }"
        :leave="{ opacity: 0, x: 50, scale: 0.95 }"
        :transition="{ duration: 0.4, ease: 'easeInOut' }"
        class="w-[380px] p-8 border border-[#F77821] rounded-2xl backdrop-blur-[9px] shadow-[0_8px_32px_rgba(0,0,0,0.25)] flex flex-col justify-center items-center gap-6 text-white bg-black/40"
      >
        <h1 class="text-3xl font-semibold tracking-wide">
          {{ t("LoginDialog.login.title") }}
        </h1>

        <form
          @submit.prevent="handleLogin"
          class="flex flex-col justify-center items-center gap-5 w-full"
        >
          <div class="relative w-full">
            <input
              v-model="name"
              id="login-name"
              type="text"
              placeholder=" "
              class="peer w-full bg-transparent border border-white rounded-lg px-3 pt-4 pb-2 text-white placeholder-transparent focus:outline-none focus:border-[#F77821] transition-all duration-300"
            />
            <label
              for="login-name"
              class="absolute left-3 top-1 text-[#F77821] text-sm transition-all duration-300 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-white peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#F77821]"
            >
              {{ t("LoginDialog.login.iName") }}
            </label>
          </div>

          <div class="relative w-full">
            <input
              v-model="password"
              id="login-password"
              type="password"
              placeholder=" "
              class="peer w-full bg-transparent border border-white rounded-lg px-3 pt-4 pb-2 text-white placeholder-transparent focus:outline-none focus:border-[#F77821] transition-all duration-300"
            />
            <label
              for="login-password"
              class="absolute left-3 top-1 text-[#F77821] text-sm transition-all duration-300 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-white peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#F77821]"
            >
              {{ t("LoginDialog.login.iPassword") }}
            </label>
          </div>

          <p v-if="localErrors.general" class="text-red-400 text-sm mt-[-4px]">
            {{ localErrors.general }}
          </p>

          <button
            type="submit"
            :disabled="auth.loading"
            class="bg-[#F77821] text-white font-medium rounded-full py-2 px-6 mt-2 hover:bg-[#ff8b3c] active:scale-95 transition-transform duration-150 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {{ t("LoginDialog.login.button") }}
          </button>
        </form>

        <span class="text-center">
          {{ t("LoginDialog.login.signIn.text") }}
          <button
            @click="toggleForm"
            class="ml-1 text-[#F77821] hover:text-[#a84300] cursor-pointer font-medium transition-colors duration-200"
          >
            {{ t("LoginDialog.login.signIn.signIn") }}
          </button>
        </span>
      </div>

      <!-- SIGNUP -->
      <div
        v-else
        key="signup"
        v-motion
        :initial="{ opacity: 0, x: 50, scale: 0.95 }"
        :enter="{ opacity: 1, x: 0, scale: 1 }"
        :leave="{ opacity: 0, x: -50, scale: 0.95 }"
        :transition="{ duration: 0.4, ease: 'easeInOut' }"
        class="w-[380px] p-8 border border-[#F77821] rounded-2xl backdrop-blur-[9px] shadow-[0_8px_32px_rgba(0,0,0,0.25)] flex flex-col justify-center items-center gap-6 text-white bg-black/40"
      >
        <h1 class="text-3xl font-semibold tracking-wide">
          {{ t("LoginDialog.signIn.title") }}
        </h1>

        <form
          @submit.prevent="handleRegister"
          class="flex flex-col justify-center items-center gap-5 w-full"
        >
          <div class="relative w-full">
            <input
              v-model="name"
              id="signup-name"
              type="text"
              placeholder=" "
              class="peer w-full bg-transparent border border-white rounded-lg px-3 pt-4 pb-2 text-white placeholder-transparent focus:outline-none focus:border-[#F77821] transition-all duration-300"
            />
            <label
              for="signup-name"
              class="absolute left-3 top-1 text-[#F77821] text-sm transition-all duration-300 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-white peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#F77821]"
            >
              {{ t("LoginDialog.signIn.iName") }}
            </label>
            <p v-if="localErrors.name" class="text-red-400 text-sm mt-1">
              {{ localErrors.name }}
            </p>
          </div>

          <div class="relative w-full">
            <input
              v-model="password"
              id="signup-password"
              type="password"
              placeholder=" "
              class="peer w-full bg-transparent border border-white rounded-lg px-3 pt-4 pb-2 text-white placeholder-transparent focus:outline-none focus:border-[#F77821] transition-all duration-300"
            />
            <label
              for="signup-password"
              class="absolute left-3 top-1 text-[#F77821] text-sm transition-all duration-300 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-white peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#F77821]"
            >
              {{ t("LoginDialog.signIn.iPassword") }}
            </label>
          </div>

          <div class="relative w-full">
            <input
              v-model="repeatPassword"
              id="signup-repeatPassword"
              type="password"
              placeholder=" "
              class="peer w-full bg-transparent border border-white rounded-lg px-3 pt-4 pb-2 text-white placeholder-transparent focus:outline-none focus:border-[#F77821] transition-all duration-300"
            />
            <label
              for="signup-repeatPassword"
              class="absolute left-3 top-1 text-[#F77821] text-sm transition-all duration-300 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-white peer-focus:top-1 peer-focus:text-xs peer-focus:text-[#F77821]"
            >
              {{ t("LoginDialog.signIn.iRepeatPassword") }}
            </label>
            <p
              v-if="localErrors.repeatPassword"
              class="text-red-400 text-sm mt-1"
            >
              {{ localErrors.repeatPassword }}
            </p>
          </div>

          <p v-if="localErrors.general" class="text-red-400 text-sm">
            {{ localErrors.general }}
          </p>

          <button
            type="submit"
            :disabled="
              auth.loading ||
              nameAvailable === false ||
              !!localErrors.repeatPassword
            "
            class="bg-[#F77821] text-white font-medium rounded-full py-2 px-6 mt-2 hover:bg-[#ff8b3c] active:scale-95 transition-transform duration-150 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {{ t("LoginDialog.signIn.button") }}
          </button>
        </form>

        <span class="text-center">
          {{ t("LoginDialog.signIn.logIn.text") }}
          <button
            @click="toggleForm"
            class="ml-1 text-[#F77821] hover:text-[#a84300] cursor-pointer font-medium transition-colors duration-200"
          >
            {{ t("LoginDialog.signIn.logIn.logIn") }}
          </button>
        </span>
      </div>
    </Transition>
  </div>
</template>
