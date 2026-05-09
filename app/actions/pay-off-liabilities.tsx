import { Stack, router } from "expo-router";
import React, { useEffect } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";

import { FormScroll } from "@/components/form-scroll";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getProfession, isLiabilityPaidOff } from "@/lib/calculations";
import { payOffLiability } from "@/lib/events";
import type { ProfessionLiabilityKey } from "@/lib/types";
import { useT } from "@/store/locale";
import { alertModal } from "@/store/alert";
import { useActiveProfile, useProfilesActions } from "@/store/profiles";

const fmt = (n: number) =>
  (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("ru-RU");

const ROWS: { key: ProfessionLiabilityKey; titleKey: string; expenseLabel: string }[] = [
  { key: "mortgage",    titleKey: "statement.liabMortgage",     expenseLabel: "Ипотека / аренда" },
  { key: "schoolLoan",  titleKey: "statement.liabSchoolLoan",   expenseLabel: "Кредит на образование" },
  { key: "carLoan",     titleKey: "statement.liabCarLoan",      expenseLabel: "Кредит на машину" },
  { key: "creditCards", titleKey: "statement.liabCreditCards",  expenseLabel: "Кредитные карточки" },
  { key: "otherLoans",  titleKey: "statement.liabOtherLoans",   expenseLabel: "Мелкие кредиты" },
];

export default function PayOffLiabilitiesScreen() {
  const t = useT();
  const slot = useActiveProfile();
  const { updatePlayer } = useProfilesActions();

  useEffect(() => {
    if (!slot) router.replace("/profiles");
    else if (slot.player.phase !== "ratRace") router.back();
  }, [slot]);

  if (!slot || slot.player.phase !== "ratRace") return null;

  const p = slot.player;
  const prof = getProfession(p.professionId);

  const onPay = (key: ProfessionLiabilityKey, title: string, amount: number) => {
    if (amount > p.cash) {
      alertModal(
        t("payOff.notEnoughTitle"),
        t("payOff.notEnoughText", { name: title, amount: fmt(amount), cash: fmt(p.cash) }),
      );
      return;
    }
    alertModal(
      t("payOff.confirmTitle"),
      t("payOff.confirmText", { name: title, amount: fmt(amount) }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("payOff.confirmBtn"),
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
    <>
      <Stack.Screen options={{ title: t("actions.payOffLiab") }} />
      <FormScroll>
      <ThemedView style={styles.summary}>
        <View style={styles.row}>
          <ThemedText style={styles.muted}>{t("payOff.cashLabel")}</ThemedText>
          <ThemedText type="defaultSemiBold">{fmt(p.cash)}</ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">{t("payOff.canCloseHeader")}</ThemedText>
        <ThemedText style={styles.muted}>
          {t("payOff.canCloseHelper")}
        </ThemedText>
        {remaining.length === 0 ? (
          <ThemedText style={styles.muted}>
            {t("payOff.allClosed")}
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
                    {t(r.titleKey)}
                  </ThemedText>
                  <ThemedText type="defaultSemiBold">{fmt(amt)}</ThemedText>
                </View>
                <ThemedText style={styles.muted}>
                  {t("payOff.currentMonthly", { amount: fmt(exp) })}
                </ThemedText>
                <TouchableOpacity
                  style={[
                    styles.payBtn,
                    !affordable && styles.payBtnDisabled,
                  ]}
                  disabled={!affordable}
                  onPress={() => onPay(r.key, t(r.titleKey), amt)}
                >
                  <ThemedText type="defaultSemiBold" style={styles.payText}>
                    {affordable
                      ? t("payOff.payBtn", { amount: fmt(amt) })
                      : t("payOff.notEnoughBy", { amount: fmt(amt - p.cash) })}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ThemedView>

      {paid.length > 0 && (
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">{t("payOff.closedHeader")}</ThemedText>
          {paid.map((r) => (
            <View key={r.key} style={styles.row}>
              <ThemedText style={styles.muted}>{t(r.titleKey)}</ThemedText>
              <ThemedText style={styles.paidBadge}>{t("payOff.closedBadge")}</ThemedText>
            </View>
          ))}
        </ThemedView>
      )}
    </FormScroll>
    </>
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
