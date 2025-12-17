import { createI18n } from "vue-i18n";
import en from "./locales/en.json";
import pl from "./locales/pl.json";

const i18n = createI18n({
  legacy: false,
  locale:
    localStorage.getItem("user-locale") ||
    navigator.language.split("-")[0] ||
    "pl",
  fallbackLocale: "pl",
  messages: {
    pl,
    en,
  },
});

export default i18n;
