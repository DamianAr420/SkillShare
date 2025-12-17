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
    class="backdrop fixed inset-0 z-[100] flex justify-center items-center p-4 bg-black/60 backdrop-blur-sm"
  >
    <Transition name="form-switch" mode="out-in">
      <div
        v-if="login"
        key="login"
        class="relative w-full max-w-[400px] bg-[#0f0f0f]/70 backdrop-blur-xl border border-[#f77821]/30 rounded-[24px] p-10 shadow-2xl flex flex-col items-center gap-8 text-white overflow-hidden"
      >
        <div
          class="absolute -top-12 -left-12 w-36 h-36 bg-[#f77821]/10 blur-[50px] rounded-full pointer-events-none"
        ></div>

        <div class="text-center z-10">
          <h1 class="text-3xl font-bold tracking-tight mb-1">
            {{ t("LoginDialog.login.title") }}
          </h1>
        </div>

        <form
          @submit.prevent="handleLogin"
          class="w-full flex flex-col gap-6 z-10"
        >
          <div class="relative w-full">
            <input
              v-model="name"
              id="login-name"
              type="text"
              placeholder=" "
              required
              class="auth-input w-full bg-transparent border-b border-white/20 py-2 pt-6 outline-none focus:border-[#f77821] transition-colors"
            />
            <label
              for="login-name"
              class="auth-label absolute left-0 top-6 text-gray-400 pointer-events-none transition-all duration-300"
            >
              {{ t("LoginDialog.login.iName") }}
            </label>
            <div
              class="auth-bar absolute bottom-0 left-0 h-[2px] w-0 bg-[#f77821] transition-all duration-300"
            ></div>
          </div>

          <div class="relative w-full">
            <input
              v-model="password"
              id="login-password"
              type="password"
              placeholder=" "
              required
              class="auth-input w-full bg-transparent border-b border-white/20 py-2 pt-6 outline-none focus:border-[#f77821] transition-colors"
            />
            <label
              for="login-password"
              class="auth-label absolute left-0 top-6 text-gray-400 pointer-events-none transition-all duration-300"
            >
              {{ t("LoginDialog.login.iPassword") }}
            </label>
            <div
              class="auth-bar absolute bottom-0 left-0 h-[2px] w-0 bg-[#f77821] transition-all duration-300"
            ></div>
          </div>

          <p
            v-if="localErrors.general"
            class="text-red-400 text-xs animate-pulse text-center"
          >
            {{ localErrors.general }}
          </p>

          <button
            type="submit"
            :disabled="auth.loading"
            class="w-full bg-gradient-to-r from-[#f77821] to-[#ff9d5c] text-white font-semibold py-3.5 rounded-xl mt-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
          >
            <span v-if="!auth.loading">{{
              t("LoginDialog.login.button")
            }}</span>
            <div
              v-else
              class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
            ></div>
          </button>
        </form>

        <div class="flex flex-col justify-center items-center gap-1">
          <p class="text-gray-400 text-sm">
            {{ t("LoginDialog.login.signIn.text") }}
          </p>

          <button
            @click="toggleForm"
            class="text-[#f77821] font-semibold underline underline-offset-4 hover:text-white transition-colors z-10"
          >
            {{ t("LoginDialog.login.signIn.signIn") }}
          </button>
        </div>
      </div>

      <div
        v-else
        key="signup"
        class="relative w-full max-w-[400px] bg-[#0f0f0f]/70 backdrop-blur-xl border border-[#f77821]/30 rounded-[24px] p-10 shadow-2xl flex flex-col items-center gap-8 text-white overflow-hidden"
      >
        <div
          class="absolute -top-12 -right-12 w-36 h-36 bg-[#f77821]/10 blur-[50px] rounded-full pointer-events-none"
        ></div>

        <div class="text-center z-10">
          <h1 class="text-3xl font-bold tracking-tight mb-1">
            {{ t("LoginDialog.signIn.title") }}
          </h1>
        </div>

        <form
          @submit.prevent="handleRegister"
          class="w-full flex flex-col gap-6 z-10"
        >
          <div class="relative w-full">
            <input
              v-model="name"
              id="signup-name"
              type="text"
              placeholder=" "
              required
              class="auth-input w-full bg-transparent border-b border-white/20 py-2 pt-6 outline-none focus:border-[#f77821] transition-colors"
            />
            <label
              for="signup-name"
              class="auth-label absolute left-0 top-6 text-gray-400 pointer-events-none transition-all duration-300"
            >
              {{ t("LoginDialog.signIn.iName") }}
            </label>
            <div
              class="auth-bar absolute bottom-0 left-0 h-[2px] transition-all duration-300"
              :class="[
                localErrors.name
                  ? 'w-full bg-red-500'
                  : nameAvailable
                  ? 'w-full bg-green-500'
                  : 'w-0 bg-[#f77821]',
              ]"
            ></div>
            <p
              v-if="localErrors.name"
              class="text-red-400 text-[10px] mt-1 absolute"
            >
              {{ localErrors.name }}
            </p>
          </div>

          <div class="relative w-full mt-2">
            <input
              v-model="password"
              id="signup-password"
              type="password"
              placeholder=" "
              required
              class="auth-input w-full bg-transparent border-b border-white/20 py-2 pt-6 outline-none focus:border-[#f77821] transition-colors"
            />
            <label
              for="signup-password"
              class="auth-label absolute left-0 top-6 text-gray-400 pointer-events-none transition-all duration-300"
            >
              {{ t("LoginDialog.signIn.iPassword") }}
            </label>
            <div
              class="auth-bar absolute bottom-0 left-0 h-[2px] w-0 bg-[#f77821] transition-all duration-300"
            ></div>
          </div>

          <div class="relative w-full mt-2">
            <input
              v-model="repeatPassword"
              id="signup-repeatPassword"
              type="password"
              placeholder=" "
              required
              class="auth-input w-full bg-transparent border-b border-white/20 py-2 pt-6 outline-none focus:border-[#f77821] transition-colors"
            />
            <label
              for="signup-repeatPassword"
              class="auth-label absolute left-0 top-6 text-gray-400 pointer-events-none transition-all duration-300"
            >
              {{ t("LoginDialog.signIn.iRepeatPassword") }}
            </label>
            <div
              class="auth-bar absolute bottom-0 left-0 h-[2px] transition-all duration-300"
              :class="
                localErrors.repeatPassword
                  ? 'w-full bg-red-500'
                  : 'w-0 bg-[#f77821]'
              "
            ></div>
            <p
              v-if="localErrors.repeatPassword"
              class="text-red-400 text-[10px] mt-1 absolute"
            >
              {{ localErrors.repeatPassword }}
            </p>
          </div>

          <p
            v-if="localErrors.general"
            class="text-red-400 text-xs animate-pulse text-center"
          >
            {{ localErrors.general }}
          </p>

          <button
            type="submit"
            :disabled="
              auth.loading ||
              nameAvailable === false ||
              !!localErrors.repeatPassword
            "
            class="w-full bg-gradient-to-r from-[#f77821] to-[#ff9d5c] text-white font-semibold py-3.5 rounded-xl mt-4 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
          >
            <span v-if="!auth.loading">{{
              t("LoginDialog.signIn.button")
            }}</span>
            <div
              v-else
              class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
            ></div>
          </button>
        </form>

        <div class="flex flex-col justify-center items-center gap-1">
          <p class="text-gray-400 text-sm">
            {{ t("LoginDialog.signIn.logIn.text") }}
          </p>

          <button
            @click="toggleForm"
            class="text-[#f77821] font-semibold underline underline-offset-4 hover:text-white transition-colors z-10"
          >
            {{ t("LoginDialog.signIn.logIn.logIn") }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.auth-input:focus ~ .auth-label,
.auth-input:not(:placeholder-shown) ~ .auth-label {
  top: 0;
  font-size: 0.75rem;
  color: #f77821;
  font-weight: 600;
}

.auth-input:focus ~ .auth-bar:not(.bg-red-500):not(.bg-green-500) {
  width: 100%;
}

.form-switch-enter-active,
.form-switch-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-switch-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.form-switch-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px transparent inset !important;
  -webkit-text-fill-color: white !important;
  transition: background-color 5000s ease-in-out 0s;
}
</style>
