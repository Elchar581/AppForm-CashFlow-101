import { router } from "expo-router";
import React, { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getProfession } from "@/lib/calculations";
import { STOCK_BY_ID } from "@/lib/configs";
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
  const t = bold ? "defaultSemiBold" : "default";
  const s = muted ? styles.muted : undefined;
  return (
    <View style={styles.row}>
      <ThemedText type={t} style={s}>
        {label}
      </ThemedText>
      <ThemedText type={t} style={s}>
        {display}
      </ThemedText>
    </View>
  );
}

export default function BalanceScreen() {
  const slot = useActiveProfile();

  useEffect(() => {
    if (!slot) router.replace("/");
  }, [slot]);

  if (!slot) return null;
  const p = slot.player;
  const prof = getProfession(p.professionId);

  const realEstateTotalCost = p.realEstate.reduce((s, r) => s + r.price, 0);
  const realEstateTotalDP = p.realEstate.reduce((s, r) => s + r.downPayment, 0);
  const realEstateMortgageSum = p.realEstate.reduce(
    (s, r) => s + r.mortgage,
    0,
  );
  const businessTotalCost = p.businesses.reduce((s, b) => s + b.price, 0);
  const businessTotalDP = p.businesses.reduce((s, b) => s + b.downPayment, 0);
  const businessLiabSum = p.businesses.reduce((s, b) => s + b.liability, 0);
  const stocksValueAtCost = p.stocks.reduce(
    (s, st) => s + st.shares * st.buyPrice,
    0,
  );

  const totalAssetsCost =
    p.cash + stocksValueAtCost + realEstateTotalCost + businessTotalCost;
  const totalLiabilities =
    prof.liabilities.mortgage +
    prof.liabilities.schoolLoan +
    prof.liabilities.carLoan +
    prof.liabilities.creditCards +
    prof.liabilities.otherLoans +
    realEstateMortgageSum +
    businessLiabSum +
    p.bankLoanAmount;
  const netWorth = totalAssetsCost - totalLiabilities;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedView style={styles.headline}>
        <ThemedText type="title">Балансовый отчёт</ThemedText>
        <ThemedText style={styles.muted}>
          {p.playerName} · {prof.name}
        </ThemedText>
        <View style={styles.netWorth}>
          <ThemedText style={styles.muted}>Чистый капитал</ThemedText>
          <ThemedText
            type="title"
            style={{ color: netWorth >= 0 ? "#2e7d32" : "#c62828" }}
          >
            {fmt(netWorth)}
          </ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Активы</ThemedText>
        <Row label="Сбережения" value={p.cash} />

        {p.stocks.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Акции / Депозиты
            </ThemedText>
            {p.stocks.map((s) => {
              const tpl = STOCK_BY_ID[s.templateId];
              const ticker = tpl?.ticker ?? s.templateId;
              return (
                <Row
                  key={s.id}
                  label={`${ticker} · ${s.shares} шт. @ ${fmt(s.buyPrice)}`}
                  value={s.shares * s.buyPrice}
                />
              );
            })}
          </View>
        )}

        {p.realEstate.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Недвижимость</ThemedText>
            {p.realEstate.map((r) => (
              <Row
                key={r.id}
                label={`${r.name} · взнос ${fmt(r.downPayment)}`}
                value={r.price}
              />
            ))}
          </View>
        )}

        {p.businesses.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Бизнес</ThemedText>
            {p.businesses.map((b) => (
              <Row
                key={b.id}
                label={`${b.name} · взнос ${fmt(b.downPayment)}`}
                value={b.price}
              />
            ))}
          </View>
        )}

        <View style={styles.divider} />
        <Row label="Итого активов (по цене)" value={totalAssetsCost} bold />
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Пассивы</ThemedText>
        {prof.liabilities.mortgage > 0 && (
          <Row label="Ипотека" value={prof.liabilities.mortgage} />
        )}
        {prof.liabilities.schoolLoan > 0 && (
          <Row
            label="Кредит на образование"
            value={prof.liabilities.schoolLoan}
          />
        )}
        {prof.liabilities.carLoan > 0 && (
          <Row label="Кредит на автомобиль" value={prof.liabilities.carLoan} />
        )}
        {prof.liabilities.creditCards > 0 && (
          <Row
            label="Долг по кредитной карточке"
            value={prof.liabilities.creditCards}
          />
        )}
        {prof.liabilities.otherLoans > 0 && (
          <Row label="Мелкие кредиты" value={prof.liabilities.otherLoans} />
        )}
        {realEstateMortgageSum > 0 && (
          <Row label="Ипотека недвижимости" value={realEstateMortgageSum} />
        )}
        {businessLiabSum > 0 && (
          <Row label="Пассивы бизнеса" value={businessLiabSum} />
        )}
        {p.bankLoanAmount > 0 && (
          <Row label="Кредит банка" value={p.bankLoanAmount} />
        )}
        <View style={styles.divider} />
        <Row label="Итого пассивов" value={totalLiabilities} bold />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  headline: { padding: 16, gap: 4 },
  netWorth: { marginTop: 8, gap: 4 },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(127,127,127,0.4)",
    gap: 8,
  },
  section: { gap: 4, marginTop: 4 },
  sectionTitle: { opacity: 0.7, fontWeight: "600", marginTop: 4 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(127,127,127,0.3)",
    marginVertical: 4,
  },
  muted: { opacity: 0.6 },
});
