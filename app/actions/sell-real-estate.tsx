import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedInput } from "@/components/themed-input";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { sellRealEstate } from "@/lib/events";
import { useActiveProfile, useProfilesActions } from "@/store/profiles";

const fmt = (n: number) =>
  (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("ru-RU");

export default function SellRealEstateScreen() {
  const slot = useActiveProfile();
  const { updatePlayer } = useProfilesActions();
  const [assetId, setAssetId] = useState<string | null>(
    slot?.player.realEstate[0]?.id ?? null,
  );
  const [salePrice, setSalePrice] = useState("");

  useEffect(() => {
    if (!slot) router.replace("/");
  }, [slot]);

  if (!slot || !assetId) {
    if (slot && slot.player.realEstate.length === 0) router.back();
    return null;
  }

  const asset = slot.player.realEstate.find((r) => r.id === assetId);
  if (!asset) {
    setAssetId(slot.player.realEstate[0]?.id ?? null);
    return null;
  }
  const priceN = parseFloat(salePrice.replace(",", "."));
  const proceeds = Number.isFinite(priceN) ? priceN - asset.mortgage : 0;

  const onSubmit = () => {
    if (!Number.isFinite(priceN) || priceN < 0) {
      Alert.alert("Ошибка", "Введите цену продажи (≥ 0).");
      return;
    }
    updatePlayer(slot.id, (s) => sellRealEstate(s, assetId, priceN));
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Какой объект продать</ThemedText>
        {slot.player.realEstate.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={[styles.row, assetId === r.id && styles.rowActive]}
            onPress={() => setAssetId(r.id)}
          >
            <ThemedText type="defaultSemiBold">{r.name}</ThemedText>
            <ThemedText style={styles.muted}>
              Цена {fmt(r.price)} · ипотека {fmt(r.mortgage)} · поток{" "}
              {fmt(r.monthlyCashflow)}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">Цена продажи</ThemedText>
        <ThemedInput
          keyboardType="numeric"
          placeholder="Например, по карте Market"
          value={salePrice}
          onChangeText={setSalePrice}
        />
        <View style={styles.summaryRow}>
          <ThemedText style={styles.muted}>Получите (за вычетом ипотеки)</ThemedText>
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
          Продать
        </ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
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
