import { Stack, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";

import { FormScroll } from "@/components/form-scroll";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { FAST_TRACK } from "@/lib/configs";
import { buyFastTrackBusiness } from "@/lib/events";
import { useT } from "@/store/locale";
import { useActiveProfile, useProfilesActions } from "@/store/profiles";

const fmt = (n: number) =>
  (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("ru-RU");

export default function FastTrackBuyScreen() {
  const t = useT();
  const slot = useActiveProfile();
  const { updatePlayer } = useProfilesActions();
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    if (!slot) router.replace("/");
    else if (slot.player.phase !== "fastTrack") router.back();
  }, [slot]);

  if (!slot || slot.player.phase !== "fastTrack") return null;
  const p = slot.player;
  const selected = businessId
    ? FAST_TRACK.find((b) => b.id === businessId)
    : null;

  const onSubmit = () => {
    if (!businessId) {
      Alert.alert("Не выбрано", "Сначала выберите бизнес из списка.");
      return;
    }
    const biz = FAST_TRACK.find((b) => b.id === businessId);
    if (!biz) return;
    if (biz.downPayment > p.cash) {
      Alert.alert(
        "Недостаточно средств",
        `Нужно ${fmt(biz.downPayment)}, доступно ${fmt(p.cash)}.`,
      );
      return;
    }
    updatePlayer(slot.id, (s) => buyFastTrackBusiness(s, businessId));
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: t("actions.ftBuyBtn") }} />
      <FormScroll>
      <ThemedView style={styles.summary}>
        <View style={styles.row}>
          <ThemedText style={styles.muted}>Сбережения</ThemedText>
          <ThemedText type="defaultSemiBold">{fmt(p.cash)}</ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Выберите бизнес</ThemedText>
        {FAST_TRACK.map((b) => {
          const affordable = b.downPayment <= p.cash;
          const alreadyBought =
            p.fastTrack?.holdings.some((h) => h.businessId === b.id) ?? false;
          const enabled = affordable && !alreadyBought;
          const isSelected = businessId === b.id;
          return (
            <TouchableOpacity
              key={b.id}
              style={[
                styles.option,
                isSelected && styles.optionActive,
                !enabled && styles.optionDisabled,
              ]}
              onPress={() => setBusinessId(b.id)}
              disabled={!enabled}
            >
              <View style={styles.optionHeader}>
                <ThemedText
                  type="defaultSemiBold"
                  style={{ flex: 1 }}
                  numberOfLines={2}
                >
                  {t(`fastTrackBusinesses.${b.id}`, { defaultValue: b.name })}
                </ThemedText>
                {alreadyBought ? (
                  <ThemedText style={styles.boughtBadge}>✓ куплен</ThemedText>
                ) : b.diceRequired ? (
                  <ThemedText style={styles.dice}>
                    🎲{" "}
                    {b.diceRequired === 6
                      ? "нужно 6"
                      : `нужно ${b.diceRequired}+`}
                  </ThemedText>
                ) : null}
              </View>
              <View style={styles.row}>
                <ThemedText style={styles.muted}>
                  {b.kind === "monthly"
                    ? "Прибыль / мес"
                    : "Разовая выплата"}
                </ThemedText>
                <ThemedText style={{ color: "#2e7d32" }}>
                  {fmt(b.amount)}
                </ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText style={styles.muted}>Первый взнос</ThemedText>
                <ThemedText>{fmt(b.downPayment)}</ThemedText>
              </View>
            </TouchableOpacity>
          );
        })}
      </ThemedView>

      {selected && (
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">Подтверждение</ThemedText>
          <View style={styles.row}>
            <ThemedText style={styles.muted}>Заплатить</ThemedText>
            <ThemedText type="defaultSemiBold">
              {fmt(selected.downPayment)}
            </ThemedText>
          </View>
          <View style={styles.row}>
            <ThemedText style={styles.muted}>
              {selected.kind === "monthly"
                ? "Прибавка к денежному потоку"
                : "Сразу зачислить в сбережения"}
            </ThemedText>
            <ThemedText
              type="defaultSemiBold"
              style={{ color: "#2e7d32" }}
            >
              +{fmt(selected.amount)}
            </ThemedText>
          </View>
          <View style={styles.row}>
            <ThemedText style={styles.muted}>Сбережения после</ThemedText>
            <ThemedText type="defaultSemiBold">
              {fmt(
                p.cash -
                  selected.downPayment +
                  (selected.kind === "oneTime" ? selected.amount : 0),
              )}
            </ThemedText>
          </View>
          {selected.diceRequired ? (
            <ThemedText style={styles.muted}>
              {selected.diceRequired === 6
                ? "Условие: выбросьте 6 очков на кубике."
                : `Условие: выбросьте ${selected.diceRequired} или более очков на кубике.`}
              {" "}Бросаете физический кубик сами — приложение этого не проверяет.
            </ThemedText>
          ) : null}
        </ThemedView>
      )}

      <TouchableOpacity
        style={[styles.submitBtn, !businessId && styles.submitDisabled]}
        onPress={onSubmit}
        disabled={!businessId}
      >
        <ThemedText type="defaultSemiBold" style={styles.submitText}>
          {t("forms.btnBuy")}
        </ThemedText>
      </TouchableOpacity>
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
    gap: 4,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(127,127,127,0.4)",
    gap: 8,
  },
  option: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(127,127,127,0.4)",
    gap: 4,
  },
  optionActive: {
    borderColor: "#2e7d32",
    backgroundColor: "rgba(46,125,50,0.1)",
    borderWidth: 1.5,
  },
  optionDisabled: { opacity: 0.4 },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  dice: { fontSize: 13, opacity: 0.8 },
  boughtBadge: { color: "#2e7d32", fontWeight: "600", fontSize: 13 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  submitBtn: {
    backgroundColor: "#2e7d32",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: "#fff" },
  muted: { opacity: 0.6 },
});
