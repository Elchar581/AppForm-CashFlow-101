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
import { STOCKS } from "@/lib/configs";
import { buyStock } from "@/lib/events";
import { useActiveProfile, useProfilesActions } from "@/store/profiles";

const fmt = (n: number) =>
  (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("ru-RU");

export default function BuyStockScreen() {
  const slot = useActiveProfile();
  const { updatePlayer } = useProfilesActions();
  const [templateId, setTemplateId] = useState(STOCKS[0].id);
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (!slot) router.replace("/");
  }, [slot]);

  if (!slot) return null;

  const sharesN = parseInt(shares, 10);
  const priceN = parseFloat(price.replace(",", "."));
  const cost =
    Number.isFinite(sharesN) && Number.isFinite(priceN)
      ? sharesN * priceN
      : 0;
  const tpl = STOCKS.find((s) => s.id === templateId);

  const onSubmit = () => {
    if (!Number.isFinite(sharesN) || sharesN <= 0) {
      Alert.alert("Ошибка", "Количество акций должно быть положительным числом.");
      return;
    }
    if (!Number.isFinite(priceN) || priceN < 0) {
      Alert.alert("Ошибка", "Цена должна быть неотрицательным числом.");
      return;
    }
    if (cost > slot.player.cash) {
      Alert.alert(
        "Недостаточно средств",
        `Нужно ${fmt(cost)}, доступно ${fmt(slot.player.cash)}.`,
      );
      return;
    }
    updatePlayer(slot.id, (s) => buyStock(s, templateId, sharesN, priceN));
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Тикер</ThemedText>
        <View style={styles.tickerRow}>
          {STOCKS.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.tickerBtn,
                templateId === s.id && styles.tickerBtnActive,
              ]}
              onPress={() => setTemplateId(s.id)}
            >
              <ThemedText
                type={templateId === s.id ? "defaultSemiBold" : "default"}
              >
                {s.ticker}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
        {tpl?.hasDeposit ? (
          <ThemedText style={styles.muted}>
            Дивиденд: {fmt(tpl.dividendPerShare)} в мес. за акцию
          </ThemedText>
        ) : (
          <ThemedText style={styles.muted}>
            Без дивидендов — прибыль только от роста цены при продаже
          </ThemedText>
        )}
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">Количество акций</ThemedText>
        <ThemedInput
          keyboardType="number-pad"
          placeholder="Например, 100"
          value={shares}
          onChangeText={setShares}
        />

        <ThemedText type="defaultSemiBold" style={{ marginTop: 8 }}>
          Цена за акцию
        </ThemedText>
        <ThemedInput
          keyboardType="numeric"
          placeholder="Из карточки сделки"
          value={price}
          onChangeText={setPrice}
        />

        <View style={styles.row}>
          <ThemedText style={styles.muted}>Сумма покупки</ThemedText>
          <ThemedText type="defaultSemiBold">{fmt(cost)}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.muted}>Сбережения после</ThemedText>
          <ThemedText
            type="defaultSemiBold"
            style={{
              color: slot.player.cash - cost < 0 ? "#c62828" : undefined,
            }}
          >
            {fmt(slot.player.cash - cost)}
          </ThemedText>
        </View>
      </ThemedView>

      <TouchableOpacity style={styles.submitBtn} onPress={onSubmit}>
        <ThemedText type="defaultSemiBold" style={styles.submitText}>
          Купить
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
  tickerRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tickerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(127,127,127,0.5)",
  },
  tickerBtnActive: {
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
