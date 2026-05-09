import { Stack, router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";

import { FormScroll } from "@/components/form-scroll";
import { ThemedInput } from "@/components/themed-input";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { RULES } from "@/lib/configs";
import { repayBankLoan, takeBankLoan } from "@/lib/events";
import { useT } from "@/store/locale";
import { alertModal } from "@/store/alert";
import { useActiveProfile, useProfilesActions } from "@/store/profiles";

const fmt = (n: number) =>
  (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("ru-RU");

export default function BankLoanScreen() {
  const t = useT();
  const slot = useActiveProfile();
  const { updatePlayer } = useProfilesActions();
  const [mode, setMode] = useState<"take" | "repay">("take");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!slot) router.replace("/profiles");
  }, [slot]);

  if (!slot) return null;
  const p = slot.player;
  const takeStep = RULES.bankLoan.step;
  const repayStep = RULES.bankLoan.repayStep;
  const ratePer = RULES.bankLoan.monthlyPaymentPer1000;
  const amountN = parseInt(amount, 10);
  const activeStep = mode === "take" ? takeStep : repayStep;
  const valid =
    Number.isFinite(amountN) &&
    amountN >= activeStep &&
    amountN % activeStep === 0;

  const onSubmit = () => {
    if (!valid) {
      alertModal(
        t("common.error"),
        t("bankLoan.errStep", { amount: fmt(activeStep) }),
      );
      return;
    }
    if (mode === "take") {
      updatePlayer(slot.id, (s) => takeBankLoan(s, amountN));
    } else {
      if (amountN > p.bankLoanAmount) {
        alertModal(
          t("common.error"),
          t("bankLoan.errMaxRepay", { amount: fmt(p.bankLoanAmount) }),
        );
        return;
      }
      if (amountN > p.cash) {
        alertModal(
          t("bankLoan.notEnough"),
          t("bankLoan.notEnoughText", { amount: fmt(p.cash) }),
        );
        return;
      }
      updatePlayer(slot.id, (s) => repayBankLoan(s, amountN));
    }
    router.back();
  };

  const monthlyAfterRepay = ((p.bankLoanAmount - (valid ? amountN : 0)) / 1000) * ratePer;
  const monthlyAfterTake = ((p.bankLoanAmount + (valid ? amountN : 0)) / 1000) * ratePer;
  const monthlyNow = (p.bankLoanAmount / 1000) * ratePer;

  return (
    <>
      <Stack.Screen options={{ title: t("actions.bankLoan") }} />
      <FormScroll>
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">{t("bankLoan.currentState")}</ThemedText>
          <View style={styles.row}>
            <ThemedText style={styles.muted}>{t("bankLoan.debt")}</ThemedText>
            <ThemedText type="defaultSemiBold">
              {fmt(p.bankLoanAmount)}
            </ThemedText>
          </View>
          <View style={styles.row}>
            <ThemedText style={styles.muted}>
              {t("bankLoan.monthlyPayment")}
            </ThemedText>
            <ThemedText type="defaultSemiBold">{fmt(monthlyNow)}</ThemedText>
          </View>
          <View style={styles.row}>
            <ThemedText style={styles.muted}>
              {t("actions.cashShort")}
            </ThemedText>
            <ThemedText type="defaultSemiBold">{fmt(p.cash)}</ThemedText>
          </View>
        </ThemedView>

        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">{t("bankLoan.action")}</ThemedText>
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, mode === "take" && styles.tabActive]}
              onPress={() => {
                setMode("take");
                setAmount("");
              }}
            >
              <ThemedText
                type={mode === "take" ? "defaultSemiBold" : "default"}
              >
                {t("bankLoan.take")}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === "repay" && styles.tabActive]}
              onPress={() => {
                setMode("repay");
                setAmount("");
              }}
              disabled={p.bankLoanAmount === 0}
            >
              <ThemedText
                type={mode === "repay" ? "defaultSemiBold" : "default"}
                style={p.bankLoanAmount === 0 ? styles.muted : undefined}
              >
                {t("bankLoan.repay")}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <ThemedText type="defaultSemiBold" style={{ marginTop: 8 }}>
            {mode === "take"
              ? t("bankLoan.amountTake", { step: fmt(takeStep) })
              : t("bankLoan.amountRepay", { step: fmt(repayStep) })}
          </ThemedText>
          <ThemedInput
            keyboardType="number-pad"
            placeholder={
              mode === "take"
                ? `${t("bankLoan.example")} ${fmt(takeStep * 5)}`
                : `${t("bankLoan.example")} ${fmt(repayStep * 10)}`
            }
            value={amount}
            onChangeText={setAmount}
          />

          {valid && (
            <View style={{ gap: 4 }}>
              <View style={styles.row}>
                <ThemedText style={styles.muted}>
                  {mode === "take"
                    ? t("bankLoan.monthlyAfterTake")
                    : t("bankLoan.monthlyAfterRepay")}
                </ThemedText>
                <ThemedText type="defaultSemiBold">
                  {fmt(mode === "take" ? monthlyAfterTake : monthlyAfterRepay)}
                </ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText style={styles.muted}>
                  {t("bankLoan.cashAfter")}
                </ThemedText>
                <ThemedText
                  type="defaultSemiBold"
                  style={{
                    color:
                      mode === "repay" && p.cash - amountN < 0
                        ? "#c62828"
                        : undefined,
                  }}
                >
                  {fmt(p.cash + (mode === "take" ? amountN : -amountN))}
                </ThemedText>
              </View>
            </View>
          )}
        </ThemedView>

        <TouchableOpacity style={styles.submitBtn} onPress={onSubmit}>
          <ThemedText type="defaultSemiBold" style={styles.submitText}>
            {mode === "take" ? t("bankLoan.btnTake") : t("bankLoan.btnRepay")}
          </ThemedText>
        </TouchableOpacity>
      </FormScroll>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(127,127,127,0.4)",
    gap: 8,
  },
  tabs: { flexDirection: "row", gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(127,127,127,0.5)",
  },
  tabActive: {
    borderColor: "#2e7d32",
    backgroundColor: "rgba(46,125,50,0.1)",
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  submitBtn: {
    backgroundColor: "#2e7d32",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: { color: "#fff" },
  muted: { opacity: 0.6 },
});
