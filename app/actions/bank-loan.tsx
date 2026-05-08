import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { FormScroll } from "@/components/form-scroll";

import { ThemedInput } from "@/components/themed-input";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { RULES } from "@/lib/configs";
import { repayBankLoan, takeBankLoan } from "@/lib/events";
import { useActiveProfile, useProfilesActions } from "@/store/profiles";

const fmt = (n: number) =>
  (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("ru-RU");

export default function BankLoanScreen() {
  const slot = useActiveProfile();
  const { updatePlayer } = useProfilesActions();
  const [mode, setMode] = useState<"take" | "repay">("take");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!slot) router.replace("/");
  }, [slot]);

  if (!slot) return null;
  const p = slot.player;
  const step = RULES.bankLoan.step;
  const ratePer = RULES.bankLoan.monthlyPaymentPer1000;
  const amountN = parseInt(amount, 10);
  const valid =
    Number.isFinite(amountN) && amountN > 0 && amountN % step === 0;
  const blocks = valid ? amountN / step : 0;
  const monthlyDelta = blocks * ratePer;

  const onSubmit = () => {
    if (!valid) {
      Alert.alert("Ошибка", `Сумма должна быть кратна ${fmt(step)}.`);
      return;
    }
    if (mode === "take") {
      updatePlayer(slot.id, (s) => takeBankLoan(s, amountN));
    } else {
      if (amountN > p.bankLoanAmount) {
        Alert.alert(
          "Ошибка",
          `К погашению доступно ${fmt(p.bankLoanAmount)}.`,
        );
        return;
      }
      if (amountN > p.cash) {
        Alert.alert(
          "Недостаточно средств",
          `На сбережениях ${fmt(p.cash)}.`,
        );
        return;
      }
      updatePlayer(slot.id, (s) => repayBankLoan(s, amountN));
    }
    router.back();
  };

  return (
    <FormScroll>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Текущее состояние</ThemedText>
        <View style={styles.row}>
          <ThemedText style={styles.muted}>Долг банку</ThemedText>
          <ThemedText type="defaultSemiBold">
            {fmt(p.bankLoanAmount)}
          </ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.muted}>
            Ежемесячный платёж по нему
          </ThemedText>
          <ThemedText type="defaultSemiBold">
            {fmt((p.bankLoanAmount / step) * ratePer)}
          </ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.muted}>Сбережения</ThemedText>
          <ThemedText type="defaultSemiBold">{fmt(p.cash)}</ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Действие</ThemedText>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === "take" && styles.tabActive]}
            onPress={() => setMode("take")}
          >
            <ThemedText type={mode === "take" ? "defaultSemiBold" : "default"}>
              Взять
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === "repay" && styles.tabActive]}
            onPress={() => setMode("repay")}
            disabled={p.bankLoanAmount === 0}
          >
            <ThemedText
              type={mode === "repay" ? "defaultSemiBold" : "default"}
              style={p.bankLoanAmount === 0 ? styles.muted : undefined}
            >
              Погасить
            </ThemedText>
          </TouchableOpacity>
        </View>

        <ThemedText type="defaultSemiBold" style={{ marginTop: 8 }}>
          Сумма (кратно {fmt(step)})
        </ThemedText>
        <ThemedInput
          keyboardType="number-pad"
          placeholder={`Например, ${fmt(step * 5)}`}
          value={amount}
          onChangeText={setAmount}
        />

        {valid && (
          <View style={{ gap: 4 }}>
            <View style={styles.row}>
              <ThemedText style={styles.muted}>
                {mode === "take" ? "Платёж в месяц станет" : "Платёж снизится на"}
              </ThemedText>
              <ThemedText type="defaultSemiBold">
                {mode === "take"
                  ? fmt(((p.bankLoanAmount + amountN) / step) * ratePer)
                  : "−" + fmt(monthlyDelta)}
              </ThemedText>
            </View>
            <View style={styles.row}>
              <ThemedText style={styles.muted}>Сбережения после</ThemedText>
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
          {mode === "take" ? "Взять кредит" : "Погасить"}
        </ThemedText>
      </TouchableOpacity>
    </FormScroll>
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
