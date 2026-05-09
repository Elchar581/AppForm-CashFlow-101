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
  const t = bold ? "defaultSemiBold" : "default";
  const s = muted ? styles.muted : undefined;
  return (
    <View style={styles.row}>
      <ThemedText type={t} style={[s, { flex: 1 }]} numberOfLines={2}>
        {label}
      </ThemedText>
      <ThemedText type={t} style={s}>
        {display}
      </ThemedText>
    </View>
  );
}

export function FastTrackView({ player }: { player: PlayerState }) {
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
        <ThemedText style={styles.muted}>Большой круг</ThemedText>
        <View style={styles.cashflowBig}>
          <ThemedText style={styles.muted}>Месячный поток</ThemedText>
          <ThemedText type="title" style={{ color: "#2e7d32" }}>
            +{fmt(total)}
          </ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Доходы Большого круга</ThemedText>
        <Row
          label="Начальный пассивный доход (×100)"
          value={ft.initialPassiveIncome}
        />
        <Row label="Прибыль ВТ-бизнесов" value={recurring} />
        <View style={styles.divider} />
        <Row label="Итого" value={total} bold />
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Купленные ВТ-бизнесы</ThemedText>
        {ft.holdings.length === 0 ? (
          <ThemedText style={styles.muted}>
            Пока не куплено. Покупайте на вкладке Действия.
          </ThemedText>
        ) : (
          ft.holdings.map((h) => {
            const tpl = FAST_TRACK_BY_ID[h.businessId];
            const name = tpl?.name ?? h.businessId;
            return (
              <Row
                key={h.id}
                label={name}
                value={
                  h.monthlyCashflow > 0
                    ? `+${fmt(h.monthlyCashflow)}/мес`
                    : "разово"
                }
              />
            );
          })
        )}
      </ThemedView>

      <ThemedView style={[styles.card, won && styles.cardWin]}>
        <ThemedText type="subtitle">
          {won ? "🏆 Победа!" : "Условие победы"}
        </ThemedText>
        <Row
          label="Прибавка к потоку с момента выхода"
          value={ft.cashflowDeltaSinceStart}
        />
        <Row label="Цель" value={RULES.fastTrack.winCashflowDelta} />
        <View style={styles.divider} />
        <ThemedText style={styles.muted}>
          {won
            ? "Поток вырос на нужную величину. Можно либо праздновать, либо продолжать наращивать."
            : `Осталось +${fmt(remaining)}/мес — покупайте ВТ-бизнесы. Альтернативно — купить «мечту».`}
        </ThemedText>
      </ThemedView>

      <TouchableOpacity
        style={styles.snapshotBtn}
        onPress={() => router.push("/rat-race-snapshot")}
      >
        <ThemedText type="defaultSemiBold" style={styles.snapshotText}>
          📋 Посмотреть бланк крысиных гонок
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
