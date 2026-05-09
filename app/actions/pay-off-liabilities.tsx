import { router } from "expo-router";
import React, { useEffect } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";

import { FormScroll } from "@/components/form-scroll";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getProfession, isLiabilityPaidOff } from "@/lib/calculations";
import { payOffLiability } from "@/lib/events";
import type { ProfessionLiabilityKey } from "@/lib/types";
import { useActiveProfile, useProfilesActions } from "@/store/profiles";

const fmt = (n: number) =>
  (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("ru-RU");

const ROWS: { key: ProfessionLiabilityKey; title: string; expenseLabel: string }[] = [
  { key: "mortgage",    title: "Ипотека",                 expenseLabel: "Ипотека / аренда" },
  { key: "schoolLoan",  title: "Кредит на образование",   expenseLabel: "Кредит на образование" },
  { key: "carLoan",     title: "Кредит на машину",        expenseLabel: "Кредит на машину" },
  { key: "creditCards", title: "Долг по кредитной карточке", expenseLabel: "Кредитные карточки" },
  { key: "otherLoans",  title: "Мелкие кредиты",          expenseLabel: "Мелкие кредиты" },
];

export default function PayOffLiabilitiesScreen() {
  const slot = useActiveProfile();
  const { updatePlayer } = useProfilesActions();

  useEffect(() => {
    if (!slot) router.replace("/");
    else if (slot.player.phase !== "ratRace") router.back();
  }, [slot]);

  if (!slot || slot.player.phase !== "ratRace") return null;

  const p = slot.player;
  const prof = getProfession(p.professionId);

  const onPay = (key: ProfessionLiabilityKey, title: string, amount: number) => {
    if (amount > p.cash) {
      Alert.alert(
        "Недостаточно средств",
        `На полное погашение «${title}» нужно ${fmt(amount)}, доступно ${fmt(p.cash)}.\n\nЧастичное погашение по правилам недоступно.`,
      );
      return;
    }
    Alert.alert(
      "Погасить полностью?",
      `${title}\n\nЗаплатить ${fmt(amount)} из сбережений и закрыть пассив. Соответствующий ежемесячный платёж обнулится.`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Погасить",
          onPress: () => updatePlayer(slot.id, (s) => payOffLiability(s, key)),
        },
      ],
    );
  };

  const remaining = ROWS.filter(
    (r) => prof.liabilities[r.key] > 0 && !isLiabilityPaidOff(p, r.key),
  );
  const paid = ROWS.filter((r) => isLiabilityPaidOff(p, r.key));

  return (
    <FormScroll>
      <ThemedView style={styles.summary}>
        <View style={styles.row}>
          <ThemedText style={styles.muted}>Сбережения</ThemedText>
          <ThemedText type="defaultSemiBold">{fmt(p.cash)}</ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Можно закрыть</ThemedText>
        <ThemedText style={styles.muted}>
          Закрытие — только полностью. Списывает всю сумму пассива из
          сбережений и обнуляет соответствующую строку расходов.
        </ThemedText>
        {remaining.length === 0 ? (
          <ThemedText style={styles.muted}>
            Все стартовые пассивы уже погашены 🎉
          </ThemedText>
        ) : (
          remaining.map((r) => {
            const amt = prof.liabilities[r.key];
            const exp = prof.expenses[r.key];
            const affordable = amt <= p.cash;
            return (
              <View key={r.key} style={styles.item}>
                <View style={styles.itemHeader}>
                  <ThemedText type="defaultSemiBold" style={{ flex: 1 }}>
                    {r.title}
                  </ThemedText>
                  <ThemedText type="defaultSemiBold">{fmt(amt)}</ThemedText>
                </View>
                <ThemedText style={styles.muted}>
                  Сейчас платим в месяц: {fmt(exp)}
                </ThemedText>
                <TouchableOpacity
                  style={[
                    styles.payBtn,
                    !affordable && styles.payBtnDisabled,
                  ]}
                  disabled={!affordable}
                  onPress={() => onPay(r.key, r.title, amt)}
                >
                  <ThemedText type="defaultSemiBold" style={styles.payText}>
                    {affordable
                      ? `Погасить · ${fmt(amt)}`
                      : `Не хватает ${fmt(amt - p.cash)}`}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ThemedView>

      {paid.length > 0 && (
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">Уже погашены</ThemedText>
          {paid.map((r) => (
            <View key={r.key} style={styles.row}>
              <ThemedText style={styles.muted}>{r.title}</ThemedText>
              <ThemedText style={styles.paidBadge}>✓ закрыт</ThemedText>
            </View>
          ))}
        </ThemedView>
      )}
    </FormScroll>
  );
}

const styles = StyleSheet.create({
  summary: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(127,127,127,0.4)",
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(127,127,127,0.4)",
    gap: 8,
  },
  item: {
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(127,127,127,0.3)",
    gap: 6,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  payBtn: {
    backgroundColor: "#2e7d32",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  payBtnDisabled: { backgroundColor: "#888" },
  payText: { color: "#fff" },
  paidBadge: { color: "#2e7d32", fontWeight: "600" },
  muted: { opacity: 0.6 },
});
