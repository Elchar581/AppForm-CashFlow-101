import { Stack, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";

import { FormScroll } from "@/components/form-scroll";
import { ThemedInput } from "@/components/themed-input";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { STOCKS } from "@/lib/configs";
import { buyStock } from "@/lib/events";
import { useT } from "@/store/locale";
import { useActiveProfile, useProfilesActions } from "@/store/profiles";

const fmt = (n: number) =>
  (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("ru-RU");

export default function BuyStockScreen() {
  const t = useT();
  const slot = useActiveProfile();
  const { updatePlayer } = useProfilesActions();
  const [templateId, setTemplateId] = useState(STOCKS[0].id);
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (!slot) router.replace("/");
  }, [slot]);

  if (!slot) return null;

  const sharesN = parseInt(shares, 10);
  const priceN = parseFloat(price.replace(",", "."));
  const cost =
    Number.isFinite(sharesN) && Number.isFinite(priceN) ? sharesN * priceN : 0;
  const tpl = STOCKS.find((s) => s.id === templateId);

  const onSubmit = () => {
    if (!Number.isFinite(sharesN) || sharesN <= 0) {
      Alert.alert(t("common.error"), "Количество акций должно быть > 0.");
      return;
    }
    if (!Number.isFinite(priceN) || priceN < 0) {
      Alert.alert(t("common.error"), "Цена должна быть ≥ 0.");
      return;
    }
    if (cost > slot.player.cash) {
      Alert.alert(
        t("forms.notEnough"),
        t("forms.notEnoughText", {
          amount: fmt(cost),
          cash: fmt(slot.player.cash),
        }),
      );
      return;
    }
    updatePlayer(slot.id, (s) => buyStock(s, templateId, sharesN, priceN));
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: t("actions.buyStock") }} />
      <FormScroll>
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">{t("buyStock.ticker")}</ThemedText>
          <View style={styles.tickerRow}>
            {STOCKS.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.tickerBtn,
                  templateId === s.id && styles.tickerBtnActive,
                ]}
                onPress={() => setTemplateId(s.id)}
              >
                <ThemedText
                  type={templateId === s.id ? "defaultSemiBold" : "default"}
                >
                  {s.ticker}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
          {tpl?.hasDeposit ? (
            <ThemedText style={styles.muted}>
              {t("buyStock.hasDividend", {
                amount: fmt(tpl.dividendPerShare),
              })}
            </ThemedText>
          ) : (
            <ThemedText style={styles.muted}>
              {t("buyStock.noDividend")}
            </ThemedText>
          )}
        </ThemedView>

        <ThemedView style={styles.card}>
          <ThemedText type="defaultSemiBold">
            {t("buyStock.sharesCount")}
          </ThemedText>
          <ThemedInput
            keyboardType="number-pad"
            placeholder={t("buyStock.sharesPlaceholder")}
            value={shares}
            onChangeText={setShares}
          />

          <ThemedText type="defaultSemiBold" style={{ marginTop: 8 }}>
            {t("buyStock.pricePerShare")}
          </ThemedText>
          <ThemedInput
            keyboardType="numeric"
            placeholder={t("forms.priceFromCard")}
            value={price}
            onChangeText={setPrice}
          />

          <View style={styles.row}>
            <ThemedText style={styles.muted}>{t("buyStock.costSum")}</ThemedText>
            <ThemedText type="defaultSemiBold">{fmt(cost)}</ThemedText>
          </View>
          <View style={styles.row}>
            <ThemedText style={styles.muted}>
              {t("forms.savingsAfter")}
            </ThemedText>
            <ThemedText
              type="defaultSemiBold"
              style={{
                color: slot.player.cash - cost < 0 ? "#c62828" : undefined,
              }}
            >
              {fmt(slot.player.cash - cost)}
            </ThemedText>
          </View>
        </ThemedView>

        <TouchableOpacity style={styles.submitBtn} onPress={onSubmit}>
          <ThemedText type="defaultSemiBold" style={styles.submitText}>
            {t("forms.btnBuy")}
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
  tickerRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tickerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(127,127,127,0.5)",
  },
  tickerBtnActive: {
    borderColor: "#2e7d32",
    backgroundColor: "rgba(46,125,50,0.1)",
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  submitBtn: {
    backgroundColor: "#2e7d32",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: { color: "#fff" },
  muted: { opacity: 0.6 },
});
