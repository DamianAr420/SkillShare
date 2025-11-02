import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import i18n from "./i18n";
import { MotionPlugin } from "@vueuse/motion";
import { createPinia } from "pinia";

createApp(App)
  .use(router)
  .use(i18n)
  .use(MotionPlugin)
  .use(createPinia())
  .mount("#app");
