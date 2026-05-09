import { Stack, router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { FormScroll } from "@/components/form-scroll";

import { ThemedInput } from "@/components/themed-input";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { sellBusiness } from "@/lib/events";
import { useT } from "@/store/locale";
import { useActiveProfile, useProfilesActions } from "@/store/profiles";

const fmt = (n: number) =>
  (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("ru-RU");

export default function SellBusinessScreen() {
  const t = useT();
  const slot = useActiveProfile();
  const { updatePlayer } = useProfilesActions();
  const [assetId, setAssetId] = useState<string | null>(
    slot?.player.businesses[0]?.id ?? null,
  );
  const [salePrice, setSalePrice] = useState("");

  useEffect(() => {
    if (!slot) router.replace("/");
  }, [slot]);

  if (!slot || !assetId) {
    if (slot && slot.player.businesses.length === 0) router.back();
    return null;
  }

  const asset = slot.player.businesses.find((b) => b.id === assetId);
  if (!asset) {
    setAssetId(slot.player.businesses[0]?.id ?? null);
    return null;
  }
  const priceN = parseFloat(salePrice.replace(",", "."));
  const proceeds = Number.isFinite(priceN) ? priceN - asset.liability : 0;

  const onSubmit = () => {
    if (!Number.isFinite(priceN) || priceN < 0) {
      Alert.alert("Ошибка", "Введите цену продажи (≥ 0).");
      return;
    }
    updatePlayer(slot.id, (s) => sellBusiness(s, assetId, priceN));
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: t("actions.sellBusiness") }} />
      <FormScroll>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Какой бизнес продать</ThemedText>
        {slot.player.businesses.map((b) => (
          <TouchableOpacity
            key={b.id}
            style={[styles.row, assetId === b.id && styles.rowActive]}
            onPress={() => setAssetId(b.id)}
          >
            <ThemedText type="defaultSemiBold">{b.name}</ThemedText>
            <ThemedText style={styles.muted}>
              Цена {fmt(b.price)} · пассив {fmt(b.liability)} · поток{" "}
              {fmt(b.monthlyCashflow)}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">Цена продажи</ThemedText>
        <ThemedInput
          keyboardType="numeric"
          value={salePrice}
          onChangeText={setSalePrice}
        />
        <View style={styles.summaryRow}>
          <ThemedText style={styles.muted}>
            Получите (за вычетом пассива)
          </ThemedText>
          <ThemedText
            type="defaultSemiBold"
            style={{ color: proceeds >= 0 ? "#2e7d32" : "#c62828" }}
          >
            {fmt(proceeds)}
          </ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <ThemedText style={styles.muted}>Сбережения после</ThemedText>
          <ThemedText type="defaultSemiBold">
            {fmt(slot.player.cash + proceeds)}
          </ThemedText>
        </View>
      </ThemedView>

      <TouchableOpacity style={styles.submitBtn} onPress={onSubmit}>
        <ThemedText type="defaultSemiBold" style={styles.submitText}>
          {t("forms.btnSell")}
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
  row: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(127,127,127,0.5)",
    gap: 2,
  },
  rowActive: {
    borderColor: "#2e7d32",
    backgroundColor: "rgba(46,125,50,0.1)",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  submitBtn: {
    backgroundColor: "#2e7d32",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: { color: "#fff" },
  muted: { opacity: 0.6 },
});
