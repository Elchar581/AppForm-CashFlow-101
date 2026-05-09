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
import { useAlertStore, type AlertButton } from "@/store/alert";

/**
 * Глобальный модал, монтируется один раз в корневом layout.
 * Слушает useAlertStore и показывает текущий alert.
 */
export function AlertModal() {
  const visible = useAlertStore((s) => s.visible);
  const config = useAlertStore((s) => s.config);
  const hide = useAlertStore((s) => s.hide);

  if (!config) {
    return (
      <Modal visible={false} transparent animationType="fade">
        <View />
      </Modal>
    );
  }

  const handlePress = (b: AlertButton) => {
    hide();
    setTimeout(() => b.onPress?.(), 0);
  };

  const isCancel = (b: AlertButton) => b.style === "cancel";
  const cancelBtn = config.buttons.find(isCancel);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (cancelBtn) handlePress(cancelBtn);
        else hide();
      }}
    >
      <Pressable
        style={styles.overlay}
        onPress={() => {
          if (cancelBtn) handlePress(cancelBtn);
        }}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <ThemedView style={styles.card}>
            {config.title ? (
              <ThemedText type="subtitle" style={styles.title}>
                {config.title}
              </ThemedText>
            ) : null}
            {config.message ? (
              <ThemedText style={styles.message}>{config.message}</ThemedText>
            ) : null}
            <View style={styles.buttons}>
              {config.buttons.map((b, i) => {
                const isDestructive = b.style === "destructive";
                const isCancelStyle = b.style === "cancel";
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.btn}
                    onPress={() => handlePress(b)}
                  >
                    <ThemedText
                      type={isCancelStyle ? "default" : "defaultSemiBold"}
                      style={[
                        styles.btnText,
                        isDestructive && styles.btnTextDestructive,
                        isCancelStyle && styles.btnTextCancel,
                      ]}
                    >
                      {b.text}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
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
    width: 320,
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  title: { textAlign: "center" },
  message: {
    textAlign: "center",
    opacity: 0.8,
    marginTop: 4,
    marginBottom: 4,
  },
  buttons: {
    marginTop: 8,
    gap: 4,
  },
  btn: {
    paddingVertical: 12,
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(127,127,127,0.3)",
  },
  btnText: { fontSize: 16, color: "#0a7ea4" },
  btnTextDestructive: { color: "#c62828" },
  btnTextCancel: { color: "#888" },
});
