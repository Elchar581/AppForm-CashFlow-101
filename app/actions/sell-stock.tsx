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
import { STOCK_BY_ID } from "@/lib/configs";
import { sellStock } from "@/lib/events";
import { useActiveProfile, useProfilesActions } from "@/store/profiles";

const fmt = (n: number) =>
  (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("ru-RU");

export default function SellStockScreen() {
  const slot = useActiveProfile();
  const { updatePlayer } = useProfilesActions();
  const [stockId, setStockId] = useState<string | null>(
    slot?.player.stocks[0]?.id ?? null,
  );
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (!slot) router.replace("/");
  }, [slot]);

  if (!slot || !stockId) {
    if (slot && slot.player.stocks.length === 0) router.back();
    return null;
  }

  const owned = slot.player.stocks.find((s) => s.id === stockId);
  if (!owned) {
    setStockId(slot.player.stocks[0]?.id ?? null);
    return null;
  }
  const tpl = STOCK_BY_ID[owned.templateId];
  const sharesN = parseInt(shares, 10);
  const priceN = parseFloat(price.replace(",", "."));
  const proceeds =
    Number.isFinite(sharesN) && Number.isFinite(priceN)
      ? sharesN * priceN
      : 0;

  const onSubmit = () => {
    if (!Number.isFinite(sharesN) || sharesN <= 0) {
      Alert.alert("Ошибка", "Количество должно быть положительным.");
      return;
    }
    if (sharesN > owned.shares) {
      Alert.alert("Ошибка", `У вас только ${owned.shares} акций.`);
      return;
    }
    if (!Number.isFinite(priceN) || priceN < 0) {
      Alert.alert("Ошибка", "Цена должна быть неотрицательной.");
      return;
    }
    updatePlayer(slot.id, (s) => sellStock(s, stockId, sharesN, priceN));
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Какую позицию продать</ThemedText>
        {slot.player.stocks.map((s) => {
          const t = STOCK_BY_ID[s.templateId];
          const ticker = t?.ticker ?? s.templateId;
          return (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.posRow,
                stockId === s.id && styles.posRowActive,
              ]}
              onPress={() => setStockId(s.id)}
            >
              <ThemedText type="defaultSemiBold">{ticker}</ThemedText>
              <ThemedText style={styles.muted}>
                {s.shares} шт. · купили по {fmt(s.buyPrice)}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">
          Продать акций (макс {owned.shares})
        </ThemedText>
        <ThemedInput
          keyboardType="number-pad"
          placeholder="Количество"
          value={shares}
          onChangeText={setShares}
        />
        <ThemedText type="defaultSemiBold" style={{ marginTop: 8 }}>
          Цена продажи за акцию
        </ThemedText>
        <ThemedInput
          keyboardType="numeric"
          placeholder="Из карточки рынка"
          value={price}
          onChangeText={setPrice}
        />
        <View style={styles.row}>
          <ThemedText style={styles.muted}>Получите</ThemedText>
          <ThemedText type="defaultSemiBold">{fmt(proceeds)}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.muted}>
            Прибыль/убыток к цене покупки
          </ThemedText>
          <ThemedText
            type="defaultSemiBold"
            style={{
              color:
                Number.isFinite(priceN) && priceN >= owned.buyPrice
                  ? "#2e7d32"
                  : "#c62828",
            }}
          >
            {fmt(
              Number.isFinite(priceN)
                ? sharesN * (priceN - owned.buyPrice)
                : 0,
            )}
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
  posRow: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(127,127,127,0.5)",
    gap: 2,
  },
  posRowActive: {
    borderColor: "#2e7d32",
    backgroundColor: "rgba(46,125,50,0.1)",
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
