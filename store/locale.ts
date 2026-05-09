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
 *
 * Defensive: синхронизирует i18n.locale со значением из стора на каждом
 * рендере. Это страхует от случаев, когда компонент перерендерился, а
 * i18n.locale ещё не успел обновиться (например, после регидрации
 * persist-стора при холодном старте приложения).
 */
export function useT() {
  const locale = useLocaleStore((s) => s.locale);
  if (i18n.locale !== locale) {
    i18n.locale = locale;
  }
  return (key: string, params?: Record<string, unknown>): string =>
    i18n.t(key, params);
}
