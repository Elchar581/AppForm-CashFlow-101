import { router } from "expo-router";
import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getProfession, monthlyCashflow } from "@/lib/calculations";
import { RULES } from "@/lib/configs";
import { useProfileSlots, useProfilesActions } from "@/store/profiles";

const fmt = (n: number) =>
  (n < 0 ? "-" : "") + "$" + Math.abs(n).toLocaleString("ru-RU");

const formatDate = (ts: number) => {
  const d = new Date(ts);
  return (
    d.toLocaleDateString("ru-RU") +
    " " +
    d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  );
};

export default function MenuScreen() {
  const slots = useProfileSlots();
  const { setActive, deleteProfile } = useProfilesActions();

  const emptyCount = Math.max(0, RULES.maxProfileSlots - slots.length);

  const openProfile = (id: string) => {
    setActive(id);
    router.push("/statement");
  };

  const confirmDelete = (id: string, name: string) => {
    Alert.alert(
      "Удалить партию?",
      `Партия "${name}" будет удалена безвозвратно.`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => deleteProfile(id),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">CashFlow 101</ThemedText>
        <ThemedText style={styles.muted}>Выберите партию</ThemedText>
      </ThemedView>

      <ScrollView contentContainerStyle={styles.list}>
        {slots.map((slot) => {
          const prof = getProfession(slot.player.professionId);
          const cf = monthlyCashflow(slot.player, prof);
          const name = slot.player.playerName || prof.name;
          return (
            <View key={slot.id} style={styles.slot}>
              <TouchableOpacity
                style={styles.slotMain}
                onPress={() => openProfile(slot.id)}
              >
                <ThemedText type="defaultSemiBold">
                  {name} · {prof.name}
                </ThemedText>
                <ThemedText
                  style={{ color: cf >= 0 ? "#2e7d32" : "#c62828" }}
                >
                  {cf >= 0 ? "+" : ""}
                  {fmt(cf)} / мес
                </ThemedText>
                <ThemedText style={styles.meta}>
                  {slot.player.phase === "fastTrack"
                    ? "На большом круге · "
                    : ""}
                  {formatDate(slot.updatedAt)}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => confirmDelete(slot.id, name)}
              >
                <ThemedText style={styles.deleteText}>Удалить</ThemedText>
              </TouchableOpacity>
            </View>
          );
        })}

        {Array.from({ length: emptyCount }).map((_, i) => (
          <TouchableOpacity
            key={`empty-${i}`}
            style={[styles.slot, styles.empty]}
            onPress={() => router.push("/setup")}
          >
            <ThemedText style={styles.muted}>+ Создать партию</ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, gap: 4 },
  list: { padding: 16, gap: 12 },
  slot: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(127,127,127,0.4)",
    overflow: "hidden",
  },
  slotMain: { padding: 16, gap: 4 },
  deleteBtn: {
    paddingVertical: 10,
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(127,127,127,0.3)",
  },
  deleteText: { color: "#c62828", fontSize: 14 },
  empty: {
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
  },
  meta: { fontSize: 12, opacity: 0.6 },
  muted: { opacity: 0.6 },
});
