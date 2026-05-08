import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { PROFESSIONS } from "@/lib/configs";
import { useProfilesActions } from "@/store/profiles";

const fmt = (n: number) =>
  (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("ru-RU");

export default function SetupScreen() {
  const [name, setName] = useState("");
  const { createProfile, setActive } = useProfilesActions();
  const colorScheme = useColorScheme();
  const inputColor = colorScheme === "dark" ? "#fff" : "#111";
  const placeholderColor = colorScheme === "dark" ? "#666" : "#999";

  const onPick = (professionId: string, professionName: string) => {
    const finalName = name.trim() || professionName;
    const slot = createProfile(finalName, professionId);
    if (!slot) {
      Alert.alert(
        "Слоты заняты",
        "Удалите одну из существующих партий, чтобы создать новую.",
      );
      return;
    }
    setActive(slot.id);
    router.replace("/statement");
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="defaultSemiBold">Имя игрока</ThemedText>
        <TextInput
          style={[styles.input, { color: inputColor }]}
          placeholder="Например, Маша (по умолчанию — название профессии)"
          placeholderTextColor={placeholderColor}
          value={name}
          onChangeText={setName}
        />

        <ThemedText
          type="defaultSemiBold"
          style={{ marginTop: 16, marginBottom: 4 }}
        >
          Профессия
        </ThemedText>

        {PROFESSIONS.map((p) => {
          const e = p.expenses;
          const totalExp =
            e.taxes +
            e.mortgage +
            e.schoolLoan +
            e.carLoan +
            e.creditCards +
            e.otherLoans +
            e.other;
          const startCashflow = p.income.salary - totalExp;
          return (
            <TouchableOpacity
              key={p.id}
              style={styles.card}
              onPress={() => onPick(p.id, p.name)}
            >
              <ThemedText type="defaultSemiBold">{p.name}</ThemedText>
              <ThemedView style={styles.row}>
                <ThemedText style={styles.muted}>Зарплата</ThemedText>
                <ThemedText>{fmt(p.income.salary)}</ThemedText>
              </ThemedView>
              <ThemedView style={styles.row}>
                <ThemedText style={styles.muted}>Стартовый поток</ThemedText>
                <ThemedText
                  style={{ color: startCashflow >= 0 ? "#2e7d32" : "#c62828" }}
                >
                  {startCashflow >= 0 ? "+" : ""}
                  {fmt(startCashflow)}
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.row}>
                <ThemedText style={styles.muted}>Сбережения</ThemedText>
                <ThemedText>{fmt(p.assets.savings)}</ThemedText>
              </ThemedView>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: "rgba(127,127,127,0.4)",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(127,127,127,0.4)",
    gap: 4,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  muted: { opacity: 0.6 },
});
