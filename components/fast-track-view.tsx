import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  fastTrackBusinessCashflow,
  fastTrackHasWon,
  fastTrackMonthlyCashflow,
} from "@/lib/calculations";
import { FAST_TRACK_BY_ID, RULES } from "@/lib/configs";
import { useT } from "@/store/locale";
import type { PlayerState } from "@/lib/types";

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
      <ThemedText type={ttype} style={[s, { flex: 1 }]} numberOfLines={2}>
        {label}
      </ThemedText>
      <ThemedText type={ttype} style={s}>
        {display}
      </ThemedText>
    </View>
  );
}

export function FastTrackView({ player }: { player: PlayerState }) {
  const t = useT();
  const ft = player.fastTrack;
  if (!ft) return null;

  const recurring = fastTrackBusinessCashflow(player);
  const total = fastTrackMonthlyCashflow(player);
  const won = fastTrackHasWon(player);
  const remaining = Math.max(
    0,
    RULES.fastTrack.winCashflowDelta - ft.cashflowDeltaSinceStart,
  );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedView style={styles.headline}>
        <ThemedText type="title">{player.playerName}</ThemedText>
        <ThemedText style={styles.muted}>{t("phase.fastTrack")}</ThemedText>
        <View style={styles.cashflowBig}>
          <ThemedText style={styles.muted}>
            {t("statement.monthlyFlowFT")}
          </ThemedText>
          <ThemedText type="title" style={{ color: "#2e7d32" }}>
            +{fmt(total)}
          </ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">{t("statement.ftIncome")}</ThemedText>
        <Row
          label={t("statement.ftInitialPassive")}
          value={ft.initialPassiveIncome}
        />
        <Row label={t("statement.ftBusinessRevenue")} value={recurring} />
        <View style={styles.divider} />
        <Row label={t("statement.ftTotal")} value={total} bold />
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">{t("statement.ftPurchased")}</ThemedText>
        {ft.holdings.length === 0 ? (
          <ThemedText style={styles.muted}>{t("statement.ftEmpty")}</ThemedText>
        ) : (
          ft.holdings.map((h) => {
            const tpl = FAST_TRACK_BY_ID[h.businessId];
            const name = t(`fastTrackBusinesses.${h.businessId}`, {
              defaultValue: tpl?.name ?? h.businessId,
            });
            return (
              <Row
                key={h.id}
                label={name}
                value={
                  h.monthlyCashflow > 0
                    ? t("statement.perMonthPlus", {
                        amount: fmt(h.monthlyCashflow),
                      })
                    : t("statement.oneTimePayout")
                }
              />
            );
          })
        )}
      </ThemedView>

      <ThemedView style={[styles.card, won && styles.cardWin]}>
        <ThemedText type="subtitle">
          {won ? t("statement.ftWonTitle") : t("statement.ftWinCondition")}
        </ThemedText>
        <Row label={t("statement.ftDelta")} value={ft.cashflowDeltaSinceStart} />
        <Row label={t("statement.ftGoal")} value={RULES.fastTrack.winCashflowDelta} />
        <View style={styles.divider} />
        <ThemedText style={styles.muted}>
          {won
            ? t("statement.ftWonText")
            : t("statement.ftRemaining", { amount: fmt(remaining) })}
        </ThemedText>
      </ThemedView>

      <TouchableOpacity
        style={styles.snapshotBtn}
        onPress={() => router.push("/rat-race-snapshot")}
      >
        <ThemedText type="defaultSemiBold" style={styles.snapshotText}>
          {t("statement.ftSnapshotBtn")}
        </ThemedText>
      </TouchableOpacity>
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
  snapshotBtn: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(127,127,127,0.5)",
    alignItems: "center",
  },
  snapshotText: { opacity: 0.85 },
});
