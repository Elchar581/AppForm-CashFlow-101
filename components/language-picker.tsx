import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/lib/i18n";
import { useLocaleStore, useT } from "@/store/locale";

export function LanguagePicker({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const currentLocale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const onPick = (loc: Locale) => {
    setLocale(loc);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <ThemedView style={styles.card}>
            <ThemedText type="subtitle" style={styles.title}>
              {t("menu.language")}
            </ThemedText>
            {SUPPORTED_LOCALES.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[
                  styles.option,
                  loc === currentLocale && styles.optionActive,
                ]}
                onPress={() => onPick(loc)}
              >
                <ThemedText
                  type={loc === currentLocale ? "defaultSemiBold" : "default"}
                  style={{ flex: 1 }}
                >
                  {LOCALE_LABELS[loc]}
                </ThemedText>
                {loc === currentLocale && (
                  <ThemedText style={{ color: "#2e7d32", fontSize: 18 }}>
                    ✓
                  </ThemedText>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancel} onPress={onClose}>
              <ThemedText style={{ opacity: 0.7 }}>
                {t("common.cancel")}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: 300,
    borderRadius: 16,
    padding: 8,
    gap: 4,
  },
  title: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 8,
  },
  optionActive: { backgroundColor: "rgba(46,125,50,0.10)" },
  cancel: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(127,127,127,0.3)",
    marginTop: 4,
  },
});
