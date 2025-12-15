import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import VueDevTools from "vite-plugin-vue-devtools";

export default defineConfig(({ mode }) => ({
  base: "/SkillShare/",
  plugins: [
    vue(),
    tailwindcss(),
    mode === "development" ? VueDevTools() : null,
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {},
}));
