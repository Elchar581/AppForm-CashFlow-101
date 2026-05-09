import { create } from "zustand";

export type AlertButtonStyle = "default" | "destructive" | "cancel";

export type AlertButton = {
  text: string;
  style?: AlertButtonStyle;
  onPress?: () => void;
};

export type AlertConfig = {
  title?: string;
  message?: string;
  buttons: AlertButton[];
};

type AlertState = {
  visible: boolean;
  config: AlertConfig | null;
  show: (config: AlertConfig) => void;
  hide: () => void;
};

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  config: null,
  show: (config) => set({ visible: true, config }),
  hide: () => set({ visible: false, config: null }),
}));

/**
 * Императивный API в стиле React Native Alert.alert,
 * но с кастомным красивым модалом.
 */
export function alertModal(
  title: string,
  message?: string,
  buttons?: AlertButton[],
): void {
  useAlertStore.getState().show({
    title,
    message,
    buttons: buttons ?? [{ text: "OK" }],
  });
}
