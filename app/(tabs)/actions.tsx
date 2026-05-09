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

  const onExit = () => {
    const passive = passiveIncome(p);
    const initial =
      Math.round(passive / 1000) * 1000 * RULES.fastTrack.passiveIncomeMultiplier;
    Alert.alert(
      "Выход из крысиных гонок",
      `Поздравляем! Пассивный доход ${fmt(passive)} превысил расходы.\n\nНа Большом круге начальный пассивный доход = ${fmt(initial)} (округление до ${fmt(1000)} × ${RULES.fastTrack.passiveIncomeMultiplier}).\n\nПерейти?`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Перейти",
          onPress: () => updatePlayer(slot.id, (s) => exitRatRace(s)),
        },
      ],
    );
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
          <ThemedText style={styles.summaryLabel}>
            {isFT ? "Поток на ВТ" : "Денежный поток"}
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
          <ThemedText style={styles.summaryLabel}>Фаза</ThemedText>
          <ThemedText type="defaultSemiBold">
            {isFT ? "Большой круг" : "Крысиные гонки"}
          </ThemedText>
        </View>
      </ThemedView>

      {canExit && (
        <ThemedView style={[styles.card, styles.exitCard]}>
          <ThemedText type="subtitle">🎉 Выход доступен!</ThemedText>
          <ThemedText style={styles.muted}>
            Пассивный доход покрывает все расходы — можно выйти из крысиных гонок.
          </ThemedText>
          <TouchableOpacity style={styles.exitBtn} onPress={onExit}>
            <ThemedText type="defaultSemiBold" style={styles.submitText}>
              Выйти из крысиных гонок
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}

      {won && (
        <ThemedView style={[styles.card, styles.winCard]}>
          <ThemedText type="subtitle">🏆 Вы выиграли!</ThemedText>
          <ThemedText style={styles.muted}>
            Прибавка к потоку ≥ {fmt(RULES.fastTrack.winCashflowDelta)}
            {p.fastTrack?.dreamBought ? " · мечта куплена" : ""}.
          </ThemedText>
        </ThemedView>
      )}

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">День получки</ThemedText>
        <ActionRow
          title="Получить денежный поток"
          subtitle={`+${fmt(cf)} в сбережения`}
          onPress={onPayday}
        />
      </ThemedView>

      {isFT && (
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">Большой круг</ThemedText>
          <ActionRow
            title="Купить бизнес ВТ"
            subtitle={`Куплено: ${p.fastTrack?.holdings.length ?? 0} · Прибавка к потоку: ${fmt(p.fastTrack?.cashflowDeltaSinceStart ?? 0)}`}
            onPress={() => router.push("/actions/fast-track-buy")}
          />
          <Divider />
          <ActionRow
            title="📋 Бланк крысиных гонок"
            subtitle="Снимок предыдущего этапа: доходы, расходы, пассивы"
            onPress={() => router.push("/rat-race-snapshot")}
          />
        </ThemedView>
      )}

      {!isFT && (
        <>
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
        </>
      )}

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Финансы</ThemedText>
        {!isFT && (
          <>
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
              title="Закрытие пассивов"
              subtitle="Полностью погасить ипотеку / кредиты профессии"
              onPress={() => router.push("/actions/pay-off-liabilities")}
            />
            <Divider />
          </>
        )}
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
