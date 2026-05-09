import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  canExitRatRace,
  fastTrackHasWon,
  fastTrackMonthlyCashflow,
  getProfession,
  monthlyCashflow,
  passiveIncome,
} from "@/lib/calculations";
import { RULES } from "@/lib/configs";
import { addChild, exitRatRace, payday } from "@/lib/events";
import { useT } from "@/store/locale";
import { alertModal } from "@/store/alert";
import { useActiveProfile, useProfilesActions } from "@/store/profiles";

const fmt = (n: number) =>
  (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("ru-RU");

function ActionRow({
  title,
  subtitle,
  onPress,
  disabled,
  destructive,
}: {
  title: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, disabled && styles.rowDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <ThemedText
        type="defaultSemiBold"
        style={destructive ? styles.destructive : undefined}
      >
        {title}
      </ThemedText>
      {subtitle ? (
        <ThemedText style={styles.muted} numberOfLines={2}>
          {subtitle}
        </ThemedText>
      ) : null}
    </TouchableOpacity>
  );
}

const Divider = () => <View style={styles.divider} />;

export default function ActionsScreen() {
  const t = useT();
  const slot = useActiveProfile();
  const { updatePlayer, resetPlayer } = useProfilesActions();

  useEffect(() => {
    if (!slot) router.replace("/profiles");
  }, [slot]);

  if (!slot) return null;
  const p = slot.player;
  const prof = getProfession(p.professionId);
  const isFT = p.phase === "fastTrack";
  const cf = isFT ? fastTrackMonthlyCashflow(p) : monthlyCashflow(p, prof);
  const canExit = !isFT && canExitRatRace(p, prof);
  const won = isFT && fastTrackHasWon(p);

  const onPayday = () => {
    updatePlayer(slot.id, (s) => {
      const cashflow =
        s.phase === "fastTrack"
          ? fastTrackMonthlyCashflow(s)
          : monthlyCashflow(s, getProfession(s.professionId));
      return payday(s, cashflow);
    });
  };

  const onAddChild = () => {
    if (p.childrenCount >= RULES.maxChildren) {
      alertModal(
        t("actions.childMaxTitle"),
        t("actions.childMaxText", { max: RULES.maxChildren }),
      );
      return;
    }
    alertModal(t("actions.childAddTitle"), t("actions.childAddText"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("actions.childAddBtn"),
        onPress: () => updatePlayer(slot.id, (s) => addChild(s)),
      },
    ]);
  };

  const onExit = () => {
    const passive = passiveIncome(p);
    const initial =
      Math.round(passive / 1000) * 1000 * RULES.fastTrack.passiveIncomeMultiplier;
    alertModal(
      t("actions.exitConfirmTitle"),
      t("actions.exitConfirmText", {
        passive: fmt(passive),
        initial: fmt(initial),
        step: fmt(1000),
        mult: RULES.fastTrack.passiveIncomeMultiplier,
      }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("actions.exitConfirmBtn"),
          onPress: () => updatePlayer(slot.id, (s) => exitRatRace(s)),
        },
      ],
    );
  };

  const onReset = () => {
    alertModal(t("actions.resetTitle"), t("actions.resetText"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("actions.resetBtn"),
        style: "destructive",
        onPress: () => resetPlayer(slot.id),
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedView style={styles.summary}>
        <View style={styles.summaryRow}>
          <ThemedText style={styles.summaryLabel}>
            {t("actions.cashShort")}
          </ThemedText>
          <ThemedText type="defaultSemiBold">{fmt(p.cash)}</ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <ThemedText style={styles.summaryLabel}>
            {isFT ? t("actions.flowFTShort") : t("actions.flowShort")}
          </ThemedText>
          <ThemedText
            type="defaultSemiBold"
            style={{ color: cf >= 0 ? "#2e7d32" : "#c62828" }}
          >
            {cf >= 0 ? "+" : ""}
            {fmt(cf)}
          </ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <ThemedText style={styles.summaryLabel}>
            {t("actions.phase")}
          </ThemedText>
          <ThemedText type="defaultSemiBold">
            {isFT ? t("phase.fastTrack") : t("phase.ratRace")}
          </ThemedText>
        </View>
      </ThemedView>

      {canExit && (
        <ThemedView style={[styles.card, styles.exitCard]}>
          <ThemedText type="subtitle">{t("actions.exitTitle")}</ThemedText>
          <ThemedText style={styles.muted}>
            {t("actions.exitHelper")}
          </ThemedText>
          <TouchableOpacity style={styles.exitBtn} onPress={onExit}>
            <ThemedText type="defaultSemiBold" style={styles.submitText}>
              {t("actions.exitBtn")}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}

      {won && (
        <ThemedView style={[styles.card, styles.winCard]}>
          <ThemedText type="subtitle">{t("actions.winTitle")}</ThemedText>
          <ThemedText style={styles.muted}>
            {t("actions.winText", {
              amount: fmt(RULES.fastTrack.winCashflowDelta),
              dream: p.fastTrack?.dreamBought ? t("actions.winDream") : "",
            })}
          </ThemedText>
        </ThemedView>
      )}

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">{t("actions.payday")}</ThemedText>
        <ActionRow
          title={t("actions.paydayBtn")}
          subtitle={t("actions.paydaySub", { amount: fmt(cf) })}
          onPress={onPayday}
        />
      </ThemedView>

      {isFT && (
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">{t("actions.bigCircle")}</ThemedText>
          <ActionRow
            title={t("actions.ftBuyBtn")}
            subtitle={t("actions.ftBuySub", {
              count: p.fastTrack?.holdings.length ?? 0,
              delta: fmt(p.fastTrack?.cashflowDeltaSinceStart ?? 0),
            })}
            onPress={() => router.push("/actions/fast-track-buy")}
          />
          <Divider />
          <ActionRow
            title={t("actions.snapshotBtn")}
            subtitle={t("actions.snapshotSub")}
            onPress={() => router.push("/rat-race-snapshot")}
          />
        </ThemedView>
      )}

      {!isFT && (
        <>
          <ThemedView style={styles.card}>
            <ThemedText type="subtitle">{t("actions.deals")}</ThemedText>
            <ActionRow
              title={t("actions.buyStock")}
              subtitle={t("actions.buyStockSub")}
              onPress={() => router.push("/actions/buy-stock")}
            />
            <Divider />
            <ActionRow
              title={t("actions.sellStock")}
              subtitle={
                p.stocks.length === 0
                  ? t("actions.sellStockNo")
                  : t("actions.sellStockSub", { count: p.stocks.length })
              }
              onPress={() => router.push("/actions/sell-stock")}
              disabled={p.stocks.length === 0}
            />
            <Divider />
            <ActionRow
              title={t("actions.buyRealEstate")}
              subtitle={t("actions.buyRealEstateSub")}
              onPress={() => router.push("/actions/buy-real-estate")}
            />
            <Divider />
            <ActionRow
              title={t("actions.sellRealEstate")}
              subtitle={
                p.realEstate.length === 0
                  ? t("actions.sellRealEstateNo")
                  : t("actions.sellRealEstateSub", { count: p.realEstate.length })
              }
              onPress={() => router.push("/actions/sell-real-estate")}
              disabled={p.realEstate.length === 0}
            />
            <Divider />
            <ActionRow
              title={t("actions.buyBusiness")}
              onPress={() => router.push("/actions/buy-business")}
            />
            <Divider />
            <ActionRow
              title={t("actions.sellBusiness")}
              subtitle={
                p.businesses.length === 0
                  ? t("actions.sellBusinessNo")
                  : t("actions.sellBusinessSub", { count: p.businesses.length })
              }
              onPress={() => router.push("/actions/sell-business")}
              disabled={p.businesses.length === 0}
            />
          </ThemedView>

          <ThemedView style={styles.card}>
            <ThemedText type="subtitle">{t("actions.family")}</ThemedText>
            <ActionRow
              title={t("actions.addChild")}
              subtitle={t("actions.addChildSub", {
                count: p.childrenCount,
                max: RULES.maxChildren,
              })}
              onPress={onAddChild}
              disabled={p.childrenCount >= RULES.maxChildren}
            />
          </ThemedView>
        </>
      )}

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">{t("actions.finance")}</ThemedText>
        {!isFT && (
          <>
            <ActionRow
              title={t("actions.bankLoan")}
              subtitle={
                p.bankLoanAmount > 0
                  ? t("actions.bankLoanSubDebt", {
                      amount: fmt(p.bankLoanAmount),
                    })
                  : t("actions.bankLoanSubMul", {
                      amount: fmt(RULES.bankLoan.step),
                    })
              }
              onPress={() => router.push("/actions/bank-loan")}
            />
            <Divider />
            <ActionRow
              title={t("actions.payOffLiab")}
              subtitle={t("actions.payOffLiabSub")}
              onPress={() => router.push("/actions/pay-off-liabilities")}
            />
            <Divider />
          </>
        )}
        <ActionRow
          title={t("actions.doodad")}
          subtitle={t("actions.doodadSub")}
          onPress={() => router.push("/actions/doodad")}
        />
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">{t("actions.party")}</ThemedText>
        <ActionRow
          title={t("actions.reset")}
          subtitle={t("actions.resetSub")}
          destructive
          onPress={onReset}
        />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  summary: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(127,127,127,0.4)",
    gap: 6,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  summaryLabel: { opacity: 0.7, flex: 1 },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(127,127,127,0.4)",
    gap: 8,
  },
  exitCard: {
    borderColor: "#2e7d32",
    borderWidth: 1.5,
    backgroundColor: "rgba(46,125,50,0.05)",
  },
  winCard: {
    borderColor: "#bf8f00",
    borderWidth: 1.5,
    backgroundColor: "rgba(191,143,0,0.08)",
  },
  exitBtn: {
    backgroundColor: "#2e7d32",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  submitText: { color: "#fff" },
  row: {
    paddingVertical: 10,
    paddingHorizontal: 2,
    gap: 2,
  },
  rowDisabled: { opacity: 0.4 },
  destructive: { color: "#c62828" },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(127,127,127,0.3)",
    marginHorizontal: -16,
  },
  muted: { opacity: 0.6, fontSize: 13 },
});
