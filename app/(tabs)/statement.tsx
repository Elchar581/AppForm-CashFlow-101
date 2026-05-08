import { router } from "expo-router";
import React, { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  businessCashflow,
  realEstateCashflow,
  stocksDividends,
  summarizePlayer,
} from "@/lib/calculations";
import { useActiveProfile } from "@/store/profiles";

const fmt = (n: number) =>
  (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("ru-RU");

function Row({
  label,
  value,
  bold,
  muted,
}: {
  label: string;
  value: number | string;
  bold?: boolean;
  muted?: boolean;
}) {
  const display = typeof value === "number" ? fmt(value) : value;
  const textType = bold ? "defaultSemiBold" : "default";
  const textStyle = muted ? styles.muted : undefined;
  return (
    <View style={styles.row}>
      <ThemedText type={textType} style={textStyle}>
        {label}
      </ThemedText>
      <ThemedText type={textType} style={textStyle}>
        {display}
      </ThemedText>
    </View>
  );
}

export default function StatementScreen() {
  const slot = useActiveProfile();

  useEffect(() => {
    if (!slot) router.replace("/");
  }, [slot]);

  if (!slot) return null;

  const player = slot.player;
  const s = summarizePlayer(player);
  const e = s.profession.expenses;
  const dividends = stocksDividends(player);
  const reCf = realEstateCashflow(player);
  const bizCf = businessCashflow(player);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedView style={styles.headline}>
        <ThemedText type="title">{player.playerName}</ThemedText>
        <ThemedText style={styles.muted}>{s.profession.name}</ThemedText>
        <View style={styles.cashflowBig}>
          <ThemedText style={styles.muted}>Месячный денежный поток</ThemedText>
          <ThemedText
            type="title"
            style={{ color: s.monthlyCashflow >= 0 ? "#2e7d32" : "#c62828" }}
          >
            {s.monthlyCashflow >= 0 ? "+" : ""}
            {fmt(s.monthlyCashflow)}
          </ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Доходы</ThemedText>
        <Row label="Зарплата" value={s.salary} />
        <Row label="Проценты / дивиденды" value={dividends} />
        <Row label="Аренда недвижимости" value={reCf} />
        <Row label="Бизнес и предприятия" value={bizCf} />
        <View style={styles.divider} />
        <Row label="Общий доход" value={s.totalIncome} bold />
        <Row label="в т.ч. пассивный" value={s.passiveIncome} muted />
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Расходы</ThemedText>
        <Row label="Налоги" value={e.taxes} />
        <Row label="Ипотека / аренда" value={e.mortgage} />
        <Row label="Кредит на образование" value={e.schoolLoan} />
        <Row label="Кредит на машину" value={e.carLoan} />
        <Row label="Кредитные карточки" value={e.creditCards} />
        <Row label="Мелкие кредиты" value={e.otherLoans} />
        <Row label="Прочие расходы" value={e.other} />
        <Row
          label={`Расходы на детей (${player.childrenCount})`}
          value={s.childrenExpense}
        />
        <Row label="Оплата кредита банка" value={s.bankLoanPayment} />
        <View style={styles.divider} />
        <Row label="Общий расход" value={s.totalExpenses} bold />
      </ThemedView>

      <ThemedView
        style={[styles.card, s.canExitRatRace && styles.cardWin]}
      >
        <ThemedText type="subtitle">
          {s.canExitRatRace ? "Выход доступен!" : "Условие выхода"}
        </ThemedText>
        <Row label="Пассивный доход" value={s.passiveIncome} />
        <Row label="Общий расход" value={s.totalExpenses} />
        <View style={styles.divider} />
        <ThemedText style={styles.muted}>
          {s.canExitRatRace
            ? "Пассивный доход покрывает все расходы — можно выйти из крысиных гонок."
            : `До выхода не хватает $${(s.totalExpenses - s.passiveIncome).toLocaleString("ru-RU")} пассивного дохода в месяц.`}
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  headline: { padding: 16, gap: 4 },
  cashflowBig: { marginTop: 8, gap: 4 },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(127,127,127,0.4)",
    gap: 8,
  },
  cardWin: { borderColor: "#2e7d32", borderWidth: 1.5 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(127,127,127,0.3)",
    marginVertical: 4,
  },
  muted: { opacity: 0.6 },
});
