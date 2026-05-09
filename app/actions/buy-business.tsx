import { Stack, router } from "expo-router";
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
import { buyBusiness } from "@/lib/events";
import { useT } from "@/store/locale";
import { useActiveProfile, useProfilesActions } from "@/store/profiles";

const fmt = (n: number) =>
  (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("ru-RU");

export default function BuyBusinessScreen() {
  const t = useT();
  const slot = useActiveProfile();
  const { updatePlayer } = useProfilesActions();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [liability, setLiability] = useState("");
  const [cashflow, setCashflow] = useState("");

  useEffect(() => {
    if (!slot) router.replace("/");
  }, [slot]);

  if (!slot) return null;

  const priceN = parseFloat(price.replace(",", "."));
  const dpN = parseFloat(downPayment.replace(",", "."));
  const liabN = parseFloat(liability.replace(",", ".")) || 0;
  const cfN = parseFloat(cashflow.replace(",", "."));

  const onSubmit = () => {
    if (!name.trim()) {
      Alert.alert("Ошибка", "Введите название бизнеса.");
      return;
    }
    if (!Number.isFinite(priceN) || priceN <= 0) {
      Alert.alert("Ошибка", "Цена должна быть > 0.");
      return;
    }
    if (!Number.isFinite(dpN) || dpN < 0) {
      Alert.alert("Ошибка", "Первый взнос должен быть ≥ 0.");
      return;
    }
    if (dpN > slot.player.cash) {
      Alert.alert(
        "Недостаточно средств",
        `Нужно ${fmt(dpN)}, доступно ${fmt(slot.player.cash)}.`,
      );
      return;
    }
    if (!Number.isFinite(cfN)) {
      Alert.alert("Ошибка", "Введите месячный поток (можно 0).");
      return;
    }
    updatePlayer(slot.id, (s) =>
      buyBusiness(s, {
        name,
        price: priceN,
        downPayment: dpN,
        liability: liabN,
        monthlyCashflow: cfN,
      }),
    );
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: t("actions.buyBusiness") }} />
      <FormScroll>
      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">Название</ThemedText>
        <ThemedInput
          placeholder="Например, Кафе на углу"
          value={name}
          onChangeText={setName}
        />

        <ThemedText type="defaultSemiBold" style={{ marginTop: 8 }}>
          Цена бизнеса
        </ThemedText>
        <ThemedInput
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />

        <ThemedText type="defaultSemiBold" style={{ marginTop: 8 }}>
          Первый взнос
        </ThemedText>
        <ThemedInput
          keyboardType="numeric"
          value={downPayment}
          onChangeText={setDownPayment}
        />

        <ThemedText type="defaultSemiBold" style={{ marginTop: 8 }}>
          Пассив (если есть)
        </ThemedText>
        <ThemedInput
          keyboardType="numeric"
          placeholder="Долг по бизнесу, если карточка указывает"
          value={liability}
          onChangeText={setLiability}
        />

        <ThemedText type="defaultSemiBold" style={{ marginTop: 8 }}>
          Месячный поток
        </ThemedText>
        <ThemedInput
          keyboardType="numeric"
          value={cashflow}
          onChangeText={setCashflow}
        />

        <View style={styles.row}>
          <ThemedText style={styles.muted}>Сбережения после</ThemedText>
          <ThemedText
            type="defaultSemiBold"
            style={{
              color:
                Number.isFinite(dpN) && slot.player.cash - dpN < 0
                  ? "#c62828"
                  : undefined,
            }}
          >
            {fmt(slot.player.cash - (Number.isFinite(dpN) ? dpN : 0))}
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
