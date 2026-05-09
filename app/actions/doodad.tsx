import { Stack, router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";

import { FormScroll } from "@/components/form-scroll";

import { ThemedInput } from "@/components/themed-input";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { doodad } from "@/lib/events";
import { useT } from "@/store/locale";
import { alertModal } from "@/store/alert";
import { useActiveProfile, useProfilesActions } from "@/store/profiles";

const fmt = (n: number) =>
  (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("ru-RU");

export default function DoodadScreen() {
  const t = useT();
  const slot = useActiveProfile();
  const { updatePlayer } = useProfilesActions();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!slot) router.replace("/profiles");
  }, [slot]);

  if (!slot) return null;

  const amountN = parseFloat(amount.replace(",", "."));
  const valid = Number.isFinite(amountN) && amountN > 0;

  const onSubmit = () => {
    if (!description.trim()) {
      alertModal(t("common.error"), "Опишите трату (например, “Шопинг”).");
      return;
    }
    if (!valid) {
      alertModal(t("common.error"), "Сумма должна быть > 0.");
      return;
    }
    updatePlayer(slot.id, (s) => doodad(s, description.trim(), amountN));
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: t("actions.doodad") }} />
      <FormScroll>
      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">{t("forms.description")}</ThemedText>
        <ThemedInput
          placeholder={t("doodad.descPlaceholder")}
          value={description}
          onChangeText={setDescription}
        />
        <ThemedText type="defaultSemiBold" style={{ marginTop: 8 }}>
          Сумма
        </ThemedText>
        <ThemedInput
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        <View style={styles.row}>
          <ThemedText style={styles.muted}>{t("forms.savingsNow")}</ThemedText>
          <ThemedText type="defaultSemiBold">{fmt(slot.player.cash)}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.muted}>{t("forms.afterDeduction")}</ThemedText>
          <ThemedText
            type="defaultSemiBold"
            style={{
              color:
                valid && slot.player.cash - amountN < 0
                  ? "#c62828"
                  : undefined,
            }}
          >
            {fmt(slot.player.cash - (valid ? amountN : 0))}
          </ThemedText>
        </View>
      </ThemedView>

      <TouchableOpacity style={styles.submitBtn} onPress={onSubmit}>
        <ThemedText type="defaultSemiBold" style={styles.submitText}>
          {t("forms.btnDeduct")}
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
    backgroundColor: "#c62828",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: { color: "#fff" },
  muted: { opacity: 0.6 },
});
