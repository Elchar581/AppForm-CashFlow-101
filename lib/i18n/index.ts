import { I18n } from "i18n-js";

import en from "./locales/en";
import es from "./locales/es";
import ru from "./locales/ru";
import zh from "./locales/zh";

export const SUPPORTED_LOCALES = ["ru", "en", "es", "zh"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  ru: "Русский",
  en: "English",
  es: "Español",
  zh: "中文",
};

const i18n = new I18n({ ru, en, es, zh });
i18n.defaultLocale = "ru";
i18n.enableFallback = true;
i18n.locale = "ru";

export function setLocale(locale: Locale): void {
  i18n.locale = locale;
}

export function getLocale(): Locale {
  return i18n.locale as Locale;
}

/**
 * Перевести ключ. Поддерживает интерполяцию через {{var}} (на самом деле i18n-js
 * использует %{var}, но мы оборачиваем для удобства).
 */
export function t(key: string, params?: Record<string, unknown>): string {
  return i18n.t(key, params);
}

export { i18n };
