import { Stack, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { FormScroll } from "@/components/form-scroll";
import { ThemedInput } from "@/components/themed-input";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { receiveAid } from "@/lib/events";
import { alertModal } from "@/store/alert";
import { useT } from "@/store/locale";
import { useActiveProfile, useProfilesActions } from "@/store/profiles";

const fmt = (n: number) =>
  (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("ru-RU");

export default function FinancialAidScreen() {
  const t = useT();
  const slot = useActiveProfile();
  const { updatePlayer } = useProfilesActions();
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!slot) router.replace("/profiles");
  }, [slot]);

  if (!slot) return null;

  const amountN = parseFloat(amount.replace(",", "."));
  const valid = Number.isFinite(amountN) && amountN > 0;

  const onSubmit = () => {
    if (!valid) {
      alertModal(t("common.error"), "");
      return;
    }
    updatePlayer(slot.id, (s) => receiveAid(s, amountN));
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: t("aid.title") }} />
      <FormScroll>
        <ThemedView style={styles.card}>
          <ThemedText style={styles.muted}>{t("aid.helper")}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.card}>
          <ThemedText type="defaultSemiBold">{t("aid.amountLabel")}</ThemedText>
          <ThemedInput
            keyboardType="numeric"
            placeholder={t("aid.amountPlaceholder")}
            value={amount}
            onChangeText={setAmount}
          />
          <View style={styles.row}>
            <ThemedText style={styles.muted}>{t("aid.cashAfter")}</ThemedText>
            <ThemedText
              type="defaultSemiBold"
              style={{ color: valid ? "#2e7d32" : undefined }}
            >
              {fmt(slot.player.cash + (valid ? amountN : 0))}
            </ThemedText>
          </View>
        </ThemedView>

        <TouchableOpacity style={styles.submitBtn} onPress={onSubmit}>
          <ThemedText type="defaultSemiBold" style={styles.submitText}>
            {t("aid.btnReceive")}
          </ThemedText>
        </TouchableOpacity>
      </FormScroll>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(127,127,127,0.4)",
    gap: 8,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  submitBtn: {
    backgroundColor: "#2e7d32",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: { color: "#fff" },
  muted: { opacity: 0.6 },
});
