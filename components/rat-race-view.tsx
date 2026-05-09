import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
import { useT } from "@/store/locale";
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
  const ttype = bold ? "defaultSemiBold" : "default";
  const styleLine = [
    muted ? styles.muted : undefined,
    strikethrough ? styles.struck : undefined,
  ];
  return (
    <View style={styles.row}>
      <ThemedText
        type={ttype}
        style={[...styleLine, { flex: 1 }]}
        numberOfLines={2}
      >
        {label}
      </ThemedText>
      <ThemedText type={ttype} style={styleLine}>
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
  const t = useT();
  const insets = useSafeAreaInsets();
  const bottomPad = snapshot ? insets.bottom + 24 : 16;
  const s = summarizePlayer(player);
  const e = s.profession.expenses;
  const dividends = stocksDividends(player);
  const reCf = realEstateCashflow(player);
  const bizCf = businessCashflow(player);
  const profName = t(`professions.${s.profession.id}`, {
    defaultValue: s.profession.name,
  });

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
        label={closed ? `${label} · ${t("statement.paid")}` : label}
        value={effectiveExpense(player, s.profession, key)}
        muted={closed}
        strikethrough={closed}
      />
    );
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
    >
      <ThemedView style={styles.headline}>
        <ThemedText type="title">
          {player.playerName || profName}
        </ThemedText>
        <ThemedText style={styles.muted}>
          {player.playerName
            ? `${profName} · ${snapshot ? t("phase.snapshot") : t("phase.ratRace")}`
            : snapshot
              ? t("phase.snapshot")
              : t("phase.ratRace")}
        </ThemedText>
        <View style={styles.cashflowBig}>
          <ThemedText style={styles.muted}>
            {t("statement.monthlyCashflow")}
          </ThemedText>
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
        <ThemedText type="subtitle">{t("statement.income")}</ThemedText>
        <Row label={t("statement.salary")} value={s.salary} />
        <Row label={t("statement.interestDividends")} value={dividends} />
        <Row label={t("statement.rentRealEstate")} value={reCf} />
        <Row label={t("statement.businesses")} value={bizCf} />
        <View style={styles.divider} />
        <Row label={t("statement.totalIncome")} value={s.totalIncome} bold />
        <Row
          label={t("statement.passiveIncluded")}
          value={s.passiveIncome}
          muted
        />
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">{t("statement.expenses")}</ThemedText>
        <Row label={t("statement.taxes")} value={e.taxes} />
        {expenseRow(t("statement.mortgage"), "mortgage", e.mortgage)}
        {expenseRow(t("statement.schoolLoan"), "schoolLoan", e.schoolLoan)}
        {expenseRow(t("statement.carLoan"), "carLoan", e.carLoan)}
        {expenseRow(t("statement.creditCards"), "creditCards", e.creditCards)}
        {expenseRow(t("statement.otherLoans"), "otherLoans", e.otherLoans)}
        <Row label={t("statement.other")} value={e.other} />
        <Row
          label={t("statement.children", { count: player.childrenCount })}
          value={s.childrenExpense}
        />
        <Row label={t("statement.bankLoan")} value={s.bankLoanPayment} />
        <View style={styles.divider} />
        <Row label={t("statement.totalExpenses")} value={s.totalExpenses} bold />
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">{t("statement.profLiabilities")}</ThemedText>
        <Row
          label={t("statement.liabMortgage")}
          value={effectiveLiability(player, s.profession, "mortgage")}
          strikethrough={isLiabilityPaidOff(player, "mortgage")}
        />
        <Row
          label={t("statement.liabSchoolLoan")}
          value={effectiveLiability(player, s.profession, "schoolLoan")}
          strikethrough={isLiabilityPaidOff(player, "schoolLoan")}
        />
        <Row
          label={t("statement.liabCarLoan")}
          value={effectiveLiability(player, s.profession, "carLoan")}
          strikethrough={isLiabilityPaidOff(player, "carLoan")}
        />
        <Row
          label={t("statement.liabCreditCards")}
          value={effectiveLiability(player, s.profession, "creditCards")}
          strikethrough={isLiabilityPaidOff(player, "creditCards")}
        />
        <Row
          label={t("statement.liabOtherLoans")}
          value={effectiveLiability(player, s.profession, "otherLoans")}
          strikethrough={isLiabilityPaidOff(player, "otherLoans")}
        />
      </ThemedView>

      <ThemedView style={[styles.card, s.canExitRatRace && styles.cardWin]}>
        <ThemedText type="subtitle">
          {s.canExitRatRace
            ? t("statement.exitAvailable")
            : t("statement.exitCondition")}
        </ThemedText>
        <Row label={t("statement.passiveIncome")} value={s.passiveIncome} />
        <Row label={t("statement.totalExpenses")} value={s.totalExpenses} />
        <View style={styles.divider} />
        <ThemedText style={styles.muted}>
          {s.canExitRatRace
            ? t("statement.exitHelper")
            : t("statement.exitNeed", {
                amount: fmt(s.totalExpenses - s.passiveIncome),
              })}
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
