<script setup lang="ts">
import { ref, computed } from "vue";
import SkillShareLogo from "../assets/SkillShareLogo.png";
import { useI18n } from "vue-i18n";
import LoginDialog from "./dialogs/LoginDialog.vue";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "vue-router";

const { t } = useI18n();
const auth = useAuthStore();
const router = useRouter();

const mobileMenuOpen = ref(false);
const showLogin = ref(false);

const isLoggedIn = computed(() => auth.isAuthenticated);
const username = computed(() => auth.user?.name || "");

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
</script>

<template>
  <LoginDialog v-if="showLogin" @close="closeLogin" />

  <header
    class="w-full flex justify-between items-center px-6 py-4 shadow-md relative"
  >
    <button @click="$router.push({ name: 'Home' })">
      <img class="max-h-24 object-contain" :src="SkillShareLogo" alt="Logo" />
    </button>

    <!-- Desktop Menu -->
    <nav class="hidden md:flex gap-6 text-2xl font-bold">
      <button
        @click="$router.push({ name: 'Home' })"
        class="border border-transparent rounded px-4 py-2 hover:text-[#F77821] hover:border-[#F77821] transition-colors duration-150 ease-in cursor-pointer"
      >
        {{ t("NavBar.buttons.home") }}
      </button>
      <button
        @click="$router.push({ name: 'Categories' })"
        class="border border-transparent rounded px-4 py-2 hover:text-[#F77821] hover:border-[#F77821] transition-colors duration-150 ease-in cursor-pointer"
      >
        {{ t("NavBar.buttons.categories") }}
      </button>
    </nav>

    <!-- Log In / Username -->
    <button
      v-if="!isLoggedIn"
      @click="openLogin()"
      class="hidden md:block bg-[#F77821] text-white text-2xl px-5 py-2 rounded hover:bg-[#EA580C] transition-all duration-150 ease-in-out cursor-pointer"
    >
      {{ t("NavBar.buttons.logIn") }}
    </button>

    <button
      v-else
      @click="goToProfile()"
      class="hidden md:block bg-[#F77821] text-white text-2xl px-5 py-2 rounded hover:bg-[#EA580C] transition-all duration-150 ease-in-out cursor-pointer"
    >
      {{ username }}
    </button>

    <!-- Mobile Hamburger -->
    <button
      @click="toggleMobileMenu"
      class="md:hidden text-3xl cursor-pointer z-50"
    >
      ☰
    </button>
  </header>

  <!-- Mobile Menu -->
  <transition
    enter-active-class="transition-all duration-300 ease-out"
    leave-active-class="transition-all duration-200 ease-in"
    enter-from-class="opacity-0 -translate-y-10"
    enter-to-class="opacity-100 translate-y-0"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-10"
  >
    <div
      v-if="mobileMenuOpen"
      class="md:hidden bg-[#F9FAFB] shadow-md w-full absolute top-32 left-0 flex flex-col items-center gap-4 py-4 z-40"
    >
      <button
        @click="
          $router.push({ name: 'Home' });
          toggleMobileMenu();
        "
        class="text-xl font-bold hover:text-[#F77821] transition-colors duration-150"
      >
        {{ t("NavBar.buttons.home") }}
      </button>
      <button
        @click="
          $router.push({ name: 'Categories' });
          toggleMobileMenu();
        "
        class="text-xl font-bold hover:text-[#F77821] transition-colors duration-150"
      >
        {{ t("NavBar.buttons.categories") }}
      </button>
      <button
        v-if="!isLoggedIn"
        @click="openLogin()"
        class="bg-[#F77821] text-white text-xl px-4 py-2 rounded hover:bg-[#EA580C] transition-all duration-150 ease-in-out"
      >
        {{ t("NavBar.buttons.logIn") }}
      </button>
      <button
        v-else
        @click="goToProfile()"
        class="bg-[#F77821] text-white text-xl px-4 py-2 rounded hover:bg-[#EA580C] transition-all duration-150 ease-in-out"
      >
        {{ username }}
      </button>
    </div>
  </transition>
</template>
