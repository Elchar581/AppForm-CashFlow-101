import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getProfession, monthlyCashflow } from "@/lib/calculations";
import { RULES } from "@/lib/configs";
import { addChild, payday } from "@/lib/events";
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
    updatePlayer(slot.id, (s) =>
      payday(s, monthlyCashflow(s, getProfession(s.professionId))),
    );
  };

  const onAddChild = () => {
    if (p.childrenCount >= RULES.maxChildren) {
      Alert.alert("Максимум детей", `Лимит по правилам — ${RULES.maxChildren}.`);
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
        <View style={styles.summaryRow}>
          <ThemedText style={styles.summaryLabel}>Сбережения</ThemedText>
          <ThemedText type="defaultSemiBold">{fmt(p.cash)}</ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <ThemedText style={styles.summaryLabel}>Денежный поток</ThemedText>
          <ThemedText
            type="defaultSemiBold"
            style={{ color: cf >= 0 ? "#2e7d32" : "#c62828" }}
          >
            {cf >= 0 ? "+" : ""}
            {fmt(cf)}
          </ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">День получки</ThemedText>
        <ActionRow
          title="Получить денежный поток"
          subtitle={`+${fmt(cf)} в сбережения`}
          onPress={onPayday}
        />
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Сделки</ThemedText>
        <ActionRow
          title="Купить акции"
          subtitle="Из каталога: MYT4U, OK4U, ON2U, GRO4US, CD, 2BIG"
          onPress={() => router.push("/actions/buy-stock")}
        />
        <Divider />
        <ActionRow
          title="Продать акции"
          subtitle={
            p.stocks.length === 0
              ? "Нет позиций"
              : `${p.stocks.length} позиций`
          }
          onPress={() => router.push("/actions/sell-stock")}
          disabled={p.stocks.length === 0}
        />
        <Divider />
        <ActionRow
          title="Купить недвижимость"
          subtitle="Малая или крупная сделка"
          onPress={() => router.push("/actions/buy-real-estate")}
        />
        <Divider />
        <ActionRow
          title="Продать недвижимость"
          subtitle={
            p.realEstate.length === 0
              ? "Нет объектов"
              : `${p.realEstate.length} объектов`
          }
          onPress={() => router.push("/actions/sell-real-estate")}
          disabled={p.realEstate.length === 0}
        />
        <Divider />
        <ActionRow
          title="Купить бизнес"
          onPress={() => router.push("/actions/buy-business")}
        />
        <Divider />
        <ActionRow
          title="Продать бизнес"
          subtitle={
            p.businesses.length === 0
              ? "Нет бизнесов"
              : `${p.businesses.length} бизнесов`
          }
          onPress={() => router.push("/actions/sell-business")}
          disabled={p.businesses.length === 0}
        />
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Семья</ThemedText>
        <ActionRow
          title="Добавить ребёнка"
          subtitle={`Сейчас детей: ${p.childrenCount} / ${RULES.maxChildren}`}
          onPress={onAddChild}
          disabled={p.childrenCount >= RULES.maxChildren}
        />
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Финансы</ThemedText>
        <ActionRow
          title="Кредит банка"
          subtitle={
            p.bankLoanAmount > 0
              ? `Текущий долг: ${fmt(p.bankLoanAmount)}`
              : `Кратно ${fmt(RULES.bankLoan.step)}`
          }
          onPress={() => router.push("/actions/bank-loan")}
        />
        <Divider />
        <ActionRow
          title="Мелкая трата (Doodad)"
          subtitle="Списать из сбережений по карточке"
          onPress={() => router.push("/actions/doodad")}
        />
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Партия</ThemedText>
        <ActionRow
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
