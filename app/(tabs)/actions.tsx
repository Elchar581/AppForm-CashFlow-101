import { router } from "expo-router";
import React, { useEffect } from "react";
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { monthlyCashflow, getProfession } from "@/lib/calculations";
import { RULES } from "@/lib/configs";
import { addChild, payday } from "@/lib/events";
import { useActiveProfile, useProfilesActions } from "@/store/profiles";

const fmt = (n: number) =>
  (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("ru-RU");

function ActionButton({
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
      style={[styles.btn, disabled && styles.btnDisabled]}
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
        <ThemedText style={styles.muted}>{subtitle}</ThemedText>
      ) : null}
    </TouchableOpacity>
  );
}

export default function ActionsScreen() {
  const slot = useActiveProfile();
  const { updatePlayer, resetPlayer } = useProfilesActions();

  useEffect(() => {
    if (!slot) router.replace("/");
  }, [slot]);

  if (!slot) return null;
  const p = slot.player;
  const prof = getProfession(p.professionId);
  const cf = monthlyCashflow(p, prof);

  const onPayday = () => {
    updatePlayer(slot.id, (s) => payday(s, monthlyCashflow(s, getProfession(s.professionId))));
  };

  const onAddChild = () => {
    if (p.childrenCount >= RULES.maxChildren) {
      Alert.alert(
        "Максимум детей",
        `Лимит по правилам — ${RULES.maxChildren}.`,
      );
      return;
    }
    Alert.alert("Ребёнок", "Добавить ребёнка к семье?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Добавить",
        onPress: () => updatePlayer(slot.id, (s) => addChild(s)),
      },
    ]);
  };

  const onReset = () => {
    Alert.alert(
      "Начать заново?",
      "Партия сбросится в начальное состояние профессии. Имя сохранится.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Сбросить",
          style: "destructive",
          onPress: () => resetPlayer(slot.id),
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedView style={styles.summary}>
        <View style={styles.row}>
          <ThemedText style={styles.muted}>Сбережения</ThemedText>
          <ThemedText type="defaultSemiBold">{fmt(p.cash)}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.muted}>Денежный поток</ThemedText>
          <ThemedText
            type="defaultSemiBold"
            style={{ color: cf >= 0 ? "#2e7d32" : "#c62828" }}
          >
            {cf >= 0 ? "+" : ""}
            {fmt(cf)}
          </ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.group}>
        <ThemedText type="subtitle">День получки</ThemedText>
        <ActionButton
          title="Получить денежный поток"
          subtitle={`+${fmt(cf)} в сбережения`}
          onPress={onPayday}
        />
      </ThemedView>

      <ThemedView style={styles.group}>
        <ThemedText type="subtitle">Сделки</ThemedText>
        <ActionButton
          title="Купить акции"
          subtitle="Из каталога: MYT4U, OK4U, ON2U, GRO4US, CD, 2BIG"
          onPress={() => router.push("/actions/buy-stock")}
        />
        <ActionButton
          title="Продать акции"
          subtitle={p.stocks.length === 0 ? "Нет позиций" : `${p.stocks.length} позиций`}
          onPress={() => router.push("/actions/sell-stock")}
          disabled={p.stocks.length === 0}
        />
        <ActionButton
          title="Купить недвижимость"
          subtitle="Малая или крупная сделка"
          onPress={() => router.push("/actions/buy-real-estate")}
        />
        <ActionButton
          title="Продать недвижимость"
          subtitle={p.realEstate.length === 0 ? "Нет объектов" : `${p.realEstate.length} объектов`}
          onPress={() => router.push("/actions/sell-real-estate")}
          disabled={p.realEstate.length === 0}
        />
        <ActionButton
          title="Купить бизнес"
          onPress={() => router.push("/actions/buy-business")}
        />
        <ActionButton
          title="Продать бизнес"
          subtitle={p.businesses.length === 0 ? "Нет бизнесов" : `${p.businesses.length} бизнесов`}
          onPress={() => router.push("/actions/sell-business")}
          disabled={p.businesses.length === 0}
        />
      </ThemedView>

      <ThemedView style={styles.group}>
        <ThemedText type="subtitle">Семья</ThemedText>
        <ActionButton
          title="Добавить ребёнка"
          subtitle={`Сейчас детей: ${p.childrenCount} / ${RULES.maxChildren}`}
          onPress={onAddChild}
          disabled={p.childrenCount >= RULES.maxChildren}
        />
      </ThemedView>

      <ThemedView style={styles.group}>
        <ThemedText type="subtitle">Финансы</ThemedText>
        <ActionButton
          title="Кредит банка"
          subtitle={
            p.bankLoanAmount > 0
              ? `Текущий долг: ${fmt(p.bankLoanAmount)}`
              : `Кратно ${fmt(RULES.bankLoan.step)}, +${fmt(RULES.bankLoan.monthlyPaymentPer1000)}/мес на каждые ${fmt(RULES.bankLoan.step)}`
          }
          onPress={() => router.push("/actions/bank-loan")}
        />
        <ActionButton
          title="Мелкая трата (Doodad)"
          subtitle="Списать из сбережений по карточке"
          onPress={() => router.push("/actions/doodad")}
        />
      </ThemedView>

      <ThemedView style={styles.group}>
        <ThemedText type="subtitle">Партия</ThemedText>
        <ActionButton
          title="Начать заново"
          subtitle="Сбросить состояние, сохранить имя и профессию"
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
    gap: 4,
  },
  group: { gap: 8 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  btn: {
    padding: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(127,127,127,0.4)",
    gap: 2,
  },
  btnDisabled: { opacity: 0.4 },
  destructive: { color: "#c62828" },
  muted: { opacity: 0.6, fontSize: 13 },
});
