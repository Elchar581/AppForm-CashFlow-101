import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  businessCashflow,
  effectiveExpense,
  effectiveLiability,
  isLiabilityPaidOff,
  realEstateCashflow,
  stocksDividends,
  summarizePlayer,
} from "@/lib/calculations";
import type { PlayerState, ProfessionLiabilityKey } from "@/lib/types";

const fmt = (n: number) =>
  (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("ru-RU");

function Row({
  label,
  value,
  bold,
  muted,
  strikethrough,
}: {
  label: string;
  value: number | string;
  bold?: boolean;
  muted?: boolean;
  strikethrough?: boolean;
}) {
  const display = typeof value === "number" ? fmt(value) : value;
  const t = bold ? "defaultSemiBold" : "default";
  const styleLine = [
    muted ? styles.muted : undefined,
    strikethrough ? styles.struck : undefined,
  ];
  return (
    <View style={styles.row}>
      <ThemedText type={t} style={[...styleLine, { flex: 1 }]} numberOfLines={2}>
        {label}
      </ThemedText>
      <ThemedText type={t} style={styleLine}>
        {display}
      </ThemedText>
    </View>
  );
}

export function RatRaceView({
  player,
  snapshot = false,
}: {
  player: PlayerState;
  snapshot?: boolean;
}) {
  const s = summarizePlayer(player);
  const e = s.profession.expenses;
  const dividends = stocksDividends(player);
  const reCf = realEstateCashflow(player);
  const bizCf = businessCashflow(player);

  const expenseRow = (
    label: string,
    key: ProfessionLiabilityKey | null,
    fallback: number,
  ) => {
    if (key === null) return <Row key={label} label={label} value={fallback} />;
    const closed = isLiabilityPaidOff(player, key);
    return (
      <Row
        key={label}
        label={closed ? `${label} · погашен` : label}
        value={effectiveExpense(player, s.profession, key)}
        muted={closed}
        strikethrough={closed}
      />
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedView style={styles.headline}>
        <ThemedText type="title">{player.playerName}</ThemedText>
        <ThemedText style={styles.muted}>
          {s.profession.name} · {snapshot ? "Снимок крысиных гонок" : "Крысиные гонки"}
        </ThemedText>
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
        {expenseRow("Ипотека / аренда", "mortgage", e.mortgage)}
        {expenseRow("Кредит на образование", "schoolLoan", e.schoolLoan)}
        {expenseRow("Кредит на машину", "carLoan", e.carLoan)}
        {expenseRow("Кредитные карточки", "creditCards", e.creditCards)}
        {expenseRow("Мелкие кредиты", "otherLoans", e.otherLoans)}
        <Row label="Прочие расходы" value={e.other} />
        <Row
          label={`Расходы на детей (${player.childrenCount})`}
          value={s.childrenExpense}
        />
        <Row label="Оплата кредита банка" value={s.bankLoanPayment} />
        <View style={styles.divider} />
        <Row label="Общий расход" value={s.totalExpenses} bold />
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Пассивы стартовой профессии</ThemedText>
        <Row
          label="Ипотека"
          value={effectiveLiability(player, s.profession, "mortgage")}
          strikethrough={isLiabilityPaidOff(player, "mortgage")}
        />
        <Row
          label="Кредит на образование"
          value={effectiveLiability(player, s.profession, "schoolLoan")}
          strikethrough={isLiabilityPaidOff(player, "schoolLoan")}
        />
        <Row
          label="Кредит на машину"
          value={effectiveLiability(player, s.profession, "carLoan")}
          strikethrough={isLiabilityPaidOff(player, "carLoan")}
        />
        <Row
          label="Долг по кредитной карточке"
          value={effectiveLiability(player, s.profession, "creditCards")}
          strikethrough={isLiabilityPaidOff(player, "creditCards")}
        />
        <Row
          label="Мелкие кредиты"
          value={effectiveLiability(player, s.profession, "otherLoans")}
          strikethrough={isLiabilityPaidOff(player, "otherLoans")}
        />
      </ThemedView>

      <ThemedView style={[styles.card, s.canExitRatRace && styles.cardWin]}>
        <ThemedText type="subtitle">
          {s.canExitRatRace ? "Выход доступен!" : "Условие выхода"}
        </ThemedText>
        <Row label="Пассивный доход" value={s.passiveIncome} />
        <Row label="Общий расход" value={s.totalExpenses} />
        <View style={styles.divider} />
        <ThemedText style={styles.muted}>
          {s.canExitRatRace
            ? "Пассивный доход покрывает все расходы — кнопка «Выйти из крысиных гонок» доступна на вкладке Действия."
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
  cardWin: { borderColor: "#bf8f00", borderWidth: 1.5 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(127,127,127,0.3)",
    marginVertical: 4,
  },
  muted: { opacity: 0.6 },
  struck: { textDecorationLine: "line-through" },
});
