<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, type ComputedRef } from "vue";
import SkillShareLogo from "../assets/SkillShareLogo.png";
import { useI18n } from "vue-i18n";
import LoginDialog from "./dialogs/LoginDialog.vue";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "vue-router";
import { useToast } from "@/composables/useToast";
import LogoutIcon from "@/assets/icons/LogoutIcon.vue";

const { t, locale } = useI18n();
const auth = useAuthStore();
const router = useRouter();
const { showToast } = useToast();

const mobileMenuOpen = ref(false);
const showLogin = ref(false);
const languageMenuOpen = ref(false);
const languageContainer = ref<HTMLElement | null>(null);

const languages = [
  { code: "pl", label: "Polski", iconClass: "fi-pl" },
  { code: "en", label: "English", iconClass: "fi-gb" },
];

const isLoggedIn = computed(() => auth.isAuthenticated);
const username = computed(() => auth.user?.name || "");
const currentLanguage = computed(() => {
  const found = languages.find((l) => l.code === locale.value);
  return found || languages[0];
}) as ComputedRef<(typeof languages)[0]>;

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value;
}

function openLogin() {
  showLogin.value = true;
  document.body.style.overflow = "hidden";
}

function closeLogin() {
  showLogin.value = false;
  document.body.style.overflow = "";
}

function goToProfile() {
  router.push({ name: "Profile" });
  mobileMenuOpen.value = false;
}

function logout() {
  auth.logout();
  showToast(t("NavBar.logout"), "success");
  router.push({ name: "Home" });
}

function setLanguage(code: string) {
  locale.value = code;
  localStorage.setItem("user-locale", code);
  languageMenuOpen.value = false;
}

function handleClickOutside(event: MouseEvent) {
  if (
    languageContainer.value &&
    !languageContainer.value.contains(event.target as Node)
  ) {
    languageMenuOpen.value = false;
  }
}

onMounted(() => document.addEventListener("click", handleClickOutside));
onUnmounted(() => document.removeEventListener("click", handleClickOutside));
</script>

<template>
  <LoginDialog v-if="showLogin" @close="closeLogin" />

  <div
    class="fixed top-0 left-0 w-full flex justify-center z-50 pointer-events-none"
  >
    <header
      class="pointer-events-auto w-full max-w-7xl h-20 md:h-28 flex justify-between items-center px-6 md:px-12 bg-[#F9FAFB]/95 backdrop-blur-md border-b md:border-x border-gray-200/50 md:rounded-b-3xl shadow-sm transition-all duration-300"
    >
      <div class="flex items-center">
        <button
          @click="$router.push({ name: 'Home' })"
          class="group flex items-center gap-2 focus:outline-none"
        >
          <img
            class="h-10 md:h-12 lg:h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105 cursor-pointer"
            :src="SkillShareLogo"
            alt="Logo"
          />
        </button>
      </div>

      <nav
        class="hidden md:flex items-center gap-10 text-lg font-bold text-gray-700"
      >
        <button
          @click="$router.push({ name: 'Home' })"
          class="relative py-2 hover:text-[#F77821] transition-colors duration-200 group cursor-pointer"
        >
          {{ t("NavBar.buttons.home") }}
          <span
            class="absolute bottom-0 left-0 w-0 h-0.5 bg-[#F77821] transition-all duration-300 group-hover:w-full"
          ></span>
        </button>

        <button
          @click="$router.push({ name: 'Search' })"
          class="relative py-2 hover:text-[#F77821] transition-colors duration-200 group cursor-pointer"
        >
          {{ t("NavBar.buttons.categories") }}
          <span
            class="absolute bottom-0 left-0 w-0 h-0.5 bg-[#F77821] transition-all duration-300 group-hover:w-full"
          ></span>
        </button>
      </nav>

      <div class="hidden md:flex items-center gap-3 xl:gap-6">
        <div class="relative" ref="languageContainer">
          <button
            @click="languageMenuOpen = !languageMenuOpen"
            class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:border-[#F77821] transition-all cursor-pointer group"
          >
            <span
              :class="['fi', currentLanguage.iconClass]"
              class="rounded-sm shadow-sm"
            ></span>
            <span class="font-bold text-gray-700 uppercase">{{
              currentLanguage.code
            }}</span>

            <svg
              class="w-4 h-4 text-gray-400 transition-transform duration-200"
              :class="{ 'rotate-180': languageMenuOpen }"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <transition
            enter-active-class="transition duration-100 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-75 ease-in"
            leave-from-class="transform scale-100 opacity-100"
            leave-to-class="transform scale-95 opacity-0"
          >
            <div
              v-if="languageMenuOpen"
              class="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 py-2"
            >
              <button
                v-for="lang in languages"
                :key="lang.code"
                @click="setLanguage(lang.code)"
                class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition-colors"
                :class="{
                  'text-[#F77821] bg-orange-50/50': locale === lang.code,
                }"
              >
                <span
                  :class="['fi', lang.iconClass]"
                  class="rounded-sm shadow-sm"
                ></span>
                <span class="font-medium text-sm">{{ lang.label }}</span>
              </button>
            </div>
          </transition>
        </div>
        <div
          v-if="isLoggedIn"
          class="flex items-center gap-3 pr-6 border-r border-gray-300"
        >
          <span class="text-base text-gray-500"
            >{{ t("NavBar.welcome") }},</span
          >
          <button
            @click="goToProfile()"
            class="text-lg font-bold text-gray-900 hover:text-[#F77821] transition-colors cursor-pointer"
          >
            {{ username }}
          </button>
        </div>

        <button
          v-if="!isLoggedIn"
          @click="openLogin()"
          class="bg-[#F77821] text-white text-lg font-bold px-8 py-3.5 rounded-full hover:bg-[#EA580C] hover:shadow-lg hover:shadow-orange-200 transition-all duration-300 active:scale-95 cursor-pointer"
        >
          {{ t("NavBar.buttons.logIn") }}
        </button>

        <button
          v-if="isLoggedIn"
          @click="logout()"
          class="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 cursor-pointer"
          :title="t('NavBar.buttons.logout')"
        >
          <LogoutIcon class="w-7 h-7" />
        </button>
      </div>

      <button
        @click="toggleMobileMenu"
        class="md:hidden w-12 h-12 flex flex-col justify-center items-center gap-2 focus:outline-none"
      >
        <span
          class="w-8 h-0.5 bg-gray-700 transition-all duration-300"
          :class="{ 'rotate-45 translate-y-2.5': mobileMenuOpen }"
        ></span>
        <span
          class="w-8 h-0.5 bg-gray-700 transition-all duration-300"
          :class="{ 'opacity-0': mobileMenuOpen }"
        ></span>
        <span
          class="w-8 h-0.5 bg-gray-700 transition-all duration-300"
          :class="{ '-rotate-45 -translate-y-2.5': mobileMenuOpen }"
        ></span>
      </button>
    </header>
  </div>

  <transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-10"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-10"
  >
    <div
      v-if="mobileMenuOpen"
      class="md:hidden fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-7xl bg-[#F9FAFB] shadow-2xl z-40 px-8 py-10 flex flex-col gap-8 rounded-b-3xl border-t border-gray-100"
    >
      <div class="flex flex-col gap-6">
        <button
          @click="
            router.push({ name: 'Home' });
            toggleMobileMenu();
          "
          class="text-left text-xl font-bold text-gray-800 py-2"
        >
          {{ t("NavBar.buttons.home") }}
        </button>
        <button
          @click="
            router.push({ name: 'Search' });
            toggleMobileMenu();
          "
          class="text-left text-xl font-bold text-gray-800 py-2"
        >
          {{ t("NavBar.buttons.categories") }}
        </button>
      </div>
      <div class="h-px bg-gray-200 w-full"></div>
      <div class="flex flex-col gap-3">
        <p
          class="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-2"
        >
          {{ t("NavBar.selectLanguage") }}
        </p>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="lang in languages"
            :key="lang.code"
            @click="
              setLanguage(lang.code);
              toggleMobileMenu();
            "
            class="flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all active:scale-95"
            :class="
              locale === lang.code
                ? 'border-[#F77821] bg-orange-50 text-[#F77821] font-bold'
                : 'border-gray-100 bg-white text-gray-600'
            "
          >
            <span
              :class="['fi', lang.iconClass]"
              class="text-xl rounded-md shadow-sm"
            ></span>
            <span class="text-sm font-semibold">{{ lang.label }}</span>
          </button>
        </div>
      </div>
      <div class="flex flex-col gap-6">
        <button
          v-if="!isLoggedIn"
          @click="openLogin()"
          class="w-full bg-[#F77821] text-white text-xl py-4 rounded-2xl font-bold shadow-md"
        >
          {{ t("NavBar.buttons.logIn") }}
        </button>
        <template v-else>
          <button
            @click="goToProfile()"
            class="w-full bg-gray-100 text-gray-900 text-lg py-4 rounded-2xl font-bold flex justify-between items-center px-6"
          >
            {{ username }}
            <span
              class="text-sm text-[#F77821] uppercase tracking-wider font-bold"
              >Mój Profil</span
            >
          </button>
          <button
            @click="
              logout();
              toggleMobileMenu();
            "
            class="flex items-center justify-center gap-3 text-red-600 text-lg font-bold py-3"
          >
            <LogoutIcon class="w-6 h-6" /> {{ t("NavBar.buttons.logout") }}
          </button>
        </template>
      </div>
    </div>
  </transition>

  <div class="h-20 md:h-28"></div>
</template>
