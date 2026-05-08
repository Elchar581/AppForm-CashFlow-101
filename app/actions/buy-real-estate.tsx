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
import { BIG_DEALS, SMALL_DEALS } from "@/lib/configs";
import { buyRealEstate } from "@/lib/events";
import { useActiveProfile, useProfilesActions } from "@/store/profiles";

const fmt = (n: number) =>
  (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("ru-RU");

export default function BuyRealEstateScreen() {
  const slot = useActiveProfile();
  const { updatePlayer } = useProfilesActions();
  const [deck, setDeck] = useState<"small" | "big">("small");
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);
  const [price, setPrice] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [cashflow, setCashflow] = useState("");

  useEffect(() => {
    if (!slot) router.replace("/");
  }, [slot]);

  if (!slot) return null;

  const catalog = deck === "small" ? SMALL_DEALS : BIG_DEALS;
  const priceN = parseFloat(price.replace(",", "."));
  const dpN = parseFloat(downPayment.replace(",", "."));
  const cfN = parseFloat(cashflow.replace(",", "."));
  const mortgage =
    Number.isFinite(priceN) && Number.isFinite(dpN) ? priceN - dpN : 0;

  const pickFromCatalog = (id: string, label: string) => {
    setTemplateId(id);
    setName(label);
  };

  const onSubmit = () => {
    if (!Number.isFinite(priceN) || priceN <= 0) {
      Alert.alert("Ошибка", "Введите цену > 0.");
      return;
    }
    if (!Number.isFinite(dpN) || dpN < 0 || dpN > priceN) {
      Alert.alert("Ошибка", "Первый взнос должен быть от 0 до цены.");
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
      Alert.alert("Ошибка", "Введите месячный денежный поток (можно 0).");
      return;
    }
    updatePlayer(slot.id, (s) =>
      buyRealEstate(s, {
        name,
        deck,
        templateId,
        price: priceN,
        downPayment: dpN,
        monthlyCashflow: cfN,
      }),
    );
    router.back();
  };

  return (
    <FormScroll>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Тип сделки</ThemedText>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, deck === "small" && styles.tabActive]}
            onPress={() => {
              setDeck("small");
              setTemplateId(undefined);
              setName("");
            }}
          >
            <ThemedText
              type={deck === "small" ? "defaultSemiBold" : "default"}
            >
              Малая
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, deck === "big" && styles.tabActive]}
            onPress={() => {
              setDeck("big");
              setTemplateId(undefined);
              setName("");
            }}
          >
            <ThemedText type={deck === "big" ? "defaultSemiBold" : "default"}>
              Крупная
            </ThemedText>
          </TouchableOpacity>
        </View>
        <ThemedText style={styles.muted}>
          Выберите шаблон или введите название вручную
        </ThemedText>
        <View style={styles.chips}>
          {catalog.map((d) => (
            <TouchableOpacity
              key={d.id}
              style={[
                styles.chip,
                templateId === d.id && styles.chipActive,
              ]}
              onPress={() => pickFromCatalog(d.id, d.name)}
            >
              <ThemedText
                type={templateId === d.id ? "defaultSemiBold" : "default"}
              >
                {d.name}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="defaultSemiBold">Название</ThemedText>
        <ThemedInput
          placeholder="Например, 3/2 дом"
          value={name}
          onChangeText={(v) => {
            setName(v);
            setTemplateId(undefined);
          }}
        />

        <ThemedText type="defaultSemiBold" style={{ marginTop: 8 }}>
          Цена
        </ThemedText>
        <ThemedInput
          keyboardType="numeric"
          placeholder="Из карточки сделки"
          value={price}
          onChangeText={setPrice}
        />

        <ThemedText type="defaultSemiBold" style={{ marginTop: 8 }}>
          Первый взнос
        </ThemedText>
        <ThemedInput
          keyboardType="numeric"
          placeholder="Сколько платим из сбережений"
          value={downPayment}
          onChangeText={setDownPayment}
        />

        <ThemedText type="defaultSemiBold" style={{ marginTop: 8 }}>
          Месячный поток
        </ThemedText>
        <ThemedInput
          keyboardType="numeric"
          placeholder="Из карточки сделки"
          value={cashflow}
          onChangeText={setCashflow}
        />

        <View style={styles.row}>
          <ThemedText style={styles.muted}>Ипотека (price − dp)</ThemedText>
          <ThemedText type="defaultSemiBold">
            {fmt(Math.max(0, mortgage))}
          </ThemedText>
        </View>
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
          Купить
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
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(127,127,127,0.4)",
  },
  chipActive: {
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
