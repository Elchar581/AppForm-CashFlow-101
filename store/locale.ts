import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  i18n,
  SUPPORTED_LOCALES,
  setLocale as applyLocale,
  type Locale,
} from "@/lib/i18n";

type LocaleStore = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: "ru",
      setLocale: (locale) => {
        applyLocale(locale);
        set({ locale });
      },
    }),
    {
      name: "cashflow:locale",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state && SUPPORTED_LOCALES.includes(state.locale)) {
          applyLocale(state.locale);
        }
      },
    },
  ),
);

/**
 * Хук перевода: подписывается на изменение локали (re-render компонента
 * при смене языка) и возвращает t-функцию.
 */
export function useT() {
  useLocaleStore((s) => s.locale);
  return (key: string, params?: Record<string, unknown>): string =>
    i18n.t(key, params);
}
