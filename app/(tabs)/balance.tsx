import { router } from "expo-router";
import React, { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { effectiveLiability, getProfession } from "@/lib/calculations";
import { FAST_TRACK_BY_ID, STOCK_BY_ID } from "@/lib/configs";
import { useT } from "@/store/locale";
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
  const ttype = bold ? "defaultSemiBold" : "default";
  const s = muted ? styles.muted : undefined;
  return (
    <View style={styles.row}>
      <ThemedText type={ttype} style={[s, styles.rowLabel]}>
        {label}
      </ThemedText>
      <ThemedText type={ttype} style={s}>
        {display}
      </ThemedText>
    </View>
  );
}

export default function BalanceScreen() {
  const t = useT();
  const slot = useActiveProfile();

  useEffect(() => {
    if (!slot) router.replace("/profiles");
  }, [slot]);

  if (!slot) return null;
  const p = slot.player;
  const prof = getProfession(p.professionId);
  const profName = t(`professions.${prof.id}`, { defaultValue: prof.name });

  const realEstateTotalCost = p.realEstate.reduce((s, r) => s + r.price, 0);
  const realEstateMortgageSum = p.realEstate.reduce(
    (s, r) => s + r.mortgage,
    0,
  );
  const businessTotalCost = p.businesses.reduce((s, b) => s + b.price, 0);
  const businessLiabSum = p.businesses.reduce((s, b) => s + b.liability, 0);
  const stocksValueAtCost = p.stocks.reduce(
    (s, st) => s + st.shares * st.buyPrice,
    0,
  );

  const liabMortgage = effectiveLiability(p, prof, "mortgage");
  const liabSchoolLoan = effectiveLiability(p, prof, "schoolLoan");
  const liabCarLoan = effectiveLiability(p, prof, "carLoan");
  const liabCreditCards = effectiveLiability(p, prof, "creditCards");
  const liabOtherLoans = effectiveLiability(p, prof, "otherLoans");

  const totalAssetsCost =
    p.cash + stocksValueAtCost + realEstateTotalCost + businessTotalCost;
  const totalLiabilities =
    liabMortgage +
    liabSchoolLoan +
    liabCarLoan +
    liabCreditCards +
    liabOtherLoans +
    realEstateMortgageSum +
    businessLiabSum +
    p.bankLoanAmount;
  const netWorth = totalAssetsCost - totalLiabilities;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedView style={styles.headline}>
        <ThemedText type="title">{t("balance.title")}</ThemedText>
        <ThemedText style={styles.muted}>
          {p.playerName} · {profName}
        </ThemedText>
        <View style={styles.netWorth}>
          <ThemedText style={styles.muted}>{t("balance.netWorth")}</ThemedText>
          <ThemedText
            type="title"
            style={{ color: netWorth >= 0 ? "#2e7d32" : "#c62828" }}
          >
            {fmt(netWorth)}
          </ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">{t("balance.assets")}</ThemedText>
        <Row label={t("balance.savings")} value={p.cash} />

        {p.stocks.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              {t("balance.stocks")}
            </ThemedText>
            {p.stocks.map((s) => {
              const tpl = STOCK_BY_ID[s.templateId];
              const ticker = tpl?.ticker ?? s.templateId;
              return (
                <Row
                  key={s.id}
                  label={t("balance.sharesAt", {
                    ticker,
                    shares: s.shares,
                    price: fmt(s.buyPrice),
                  })}
                  value={s.shares * s.buyPrice}
                />
              );
            })}
          </View>
        )}

        {p.realEstate.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              {t("balance.realEstate")}
            </ThemedText>
            {p.realEstate.map((r) => (
              <Row
                key={r.id}
                label={t("balance.propertyDownPayment", {
                  name: r.name,
                  amount: fmt(r.downPayment),
                })}
                value={r.price}
              />
            ))}
          </View>
        )}

        {p.businesses.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              {t("balance.business")}
            </ThemedText>
            {p.businesses.map((b) => (
              <Row
                key={b.id}
                label={t("balance.propertyDownPayment", {
                  name: b.name,
                  amount: fmt(b.downPayment),
                })}
                value={b.price}
              />
            ))}
          </View>
        )}

        {p.fastTrack && p.fastTrack.holdings.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              {t("balance.ftBusinesses")}
            </ThemedText>
            {p.fastTrack.holdings.map((h) => {
              const tpl = FAST_TRACK_BY_ID[h.businessId];
              const name = t(`fastTrackBusinesses.${h.businessId}`, {
                defaultValue: tpl?.name ?? h.businessId,
              });
              return (
                <Row
                  key={h.id}
                  label={`${name} · ${
                    h.monthlyCashflow > 0
                      ? t("statement.perMonthPlus", {
                          amount: fmt(h.monthlyCashflow),
                        })
                      : t("statement.oneTimePayout")
                  }`}
                  value={tpl?.downPayment ?? 0}
                />
              );
            })}
          </View>
        )}

        <View style={styles.divider} />
        <Row label={t("balance.totalAssets")} value={totalAssetsCost} bold />
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">{t("balance.liabilities")}</ThemedText>
        {liabMortgage > 0 && (
          <Row label={t("statement.liabMortgage")} value={liabMortgage} />
        )}
        {liabSchoolLoan > 0 && (
          <Row label={t("statement.liabSchoolLoan")} value={liabSchoolLoan} />
        )}
        {liabCarLoan > 0 && (
          <Row label={t("statement.liabCarLoan")} value={liabCarLoan} />
        )}
        {liabCreditCards > 0 && (
          <Row label={t("statement.liabCreditCards")} value={liabCreditCards} />
        )}
        {liabOtherLoans > 0 && (
          <Row label={t("statement.liabOtherLoans")} value={liabOtherLoans} />
        )}
        {realEstateMortgageSum > 0 && (
          <Row
            label={t("balance.liabRealEstateMortgage")}
            value={realEstateMortgageSum}
          />
        )}
        {businessLiabSum > 0 && (
          <Row label={t("balance.liabBusiness")} value={businessLiabSum} />
        )}
        {p.bankLoanAmount > 0 && (
          <Row label={t("balance.liabBank")} value={p.bankLoanAmount} />
        )}
        <View style={styles.divider} />
        <Row
          label={t("balance.totalLiabilities")}
          value={totalLiabilities}
          bold
        />
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  rowLabel: { flex: 1, flexShrink: 1 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(127,127,127,0.3)",
    marginVertical: 4,
  },
  muted: { opacity: 0.6 },
});
