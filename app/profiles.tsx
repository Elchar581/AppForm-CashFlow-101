import { Stack, router } from "expo-router";
import React from "react";
import {
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
import { alertModal } from "@/store/alert";
import { useT } from "@/store/locale";
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

export default function ProfilesScreen() {
  const t = useT();
  const slots = useProfileSlots();
  const { setActive, deleteProfile } = useProfilesActions();
  const emptyCount = Math.max(0, RULES.maxProfileSlots - slots.length);

  const openProfile = (id: string) => {
    setActive(id);
    router.push("/statement");
  };

  const confirmDelete = (id: string, name: string) => {
    alertModal(t("menu.deleteTitle"), t("menu.deleteText", { name }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => deleteProfile(id),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ title: t("menu.subtitle") }} />
      <ScrollView contentContainerStyle={styles.list}>
        {slots.map((slot) => {
          const prof = getProfession(slot.player.professionId);
          const cf = monthlyCashflow(slot.player, prof);
          const profName = t(`professions.${prof.id}`, {
            defaultValue: prof.name,
          });
          const name = slot.player.playerName || profName;
          const isFT = slot.player.phase === "fastTrack";
          const accentColor = isFT ? "#bf8f00" : "#2e7d32";
          const cfColor = cf >= 0 ? "#2e7d32" : "#c62828";
          return (
            <ThemedView key={slot.id} style={styles.slot}>
              <TouchableOpacity
                style={styles.slotMain}
                onPress={() => openProfile(slot.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.accent, { backgroundColor: accentColor }]} />
                <View style={styles.slotBody}>
                  <View style={styles.slotHeader}>
                    <ThemedText type="subtitle" style={styles.slotName}>
                      {name}
                    </ThemedText>
                    <View
                      style={[
                        styles.phaseBadge,
                        { borderColor: accentColor },
                      ]}
                    >
                      <ThemedText
                        style={[styles.phaseBadgeText, { color: accentColor }]}
                      >
                        {isFT ? t("phase.fastTrack") : t("phase.ratRace")}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={styles.profession}>{profName}</ThemedText>

                  <View style={styles.divider} />

                  <View style={styles.row}>
                    <ThemedText style={styles.muted}>
                      {t("actions.flowShort")}
                    </ThemedText>
                    <ThemedText
                      type="defaultSemiBold"
                      style={{ color: cfColor }}
                    >
                      {cf >= 0 ? "+" : ""}
                      {fmt(cf)} {t("menu.perMonth")}
                    </ThemedText>
                  </View>
                  <View style={styles.row}>
                    <ThemedText style={styles.muted}>
                      {t("actions.cashShort")}
                    </ThemedText>
                    <ThemedText type="defaultSemiBold">
                      {fmt(slot.player.cash)}
                    </ThemedText>
                  </View>

                  <ThemedText style={styles.meta}>
                    {formatDate(slot.updatedAt)}
                  </ThemedText>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => confirmDelete(slot.id, name)}
              >
                <ThemedText style={styles.deleteText}>
                  {t("common.delete")}
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          );
        })}

        {Array.from({ length: emptyCount }).map((_, i) => (
          <TouchableOpacity
            key={`empty-${i}`}
            style={styles.empty}
            onPress={() => router.push("/setup")}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.emptyPlus}>+</ThemedText>
            <ThemedText style={styles.emptyText}>
              {t("menu.create")}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, gap: 14 },
  slot: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(127,127,127,0.3)",
  },
  slotMain: { flexDirection: "row" },
  accent: { width: 5 },
  slotBody: { flex: 1, padding: 16, gap: 4 },
  slotHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  slotName: { fontSize: 18 },
  profession: { opacity: 0.65, marginTop: -2 },
  phaseBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  phaseBadgeText: { fontSize: 11, fontWeight: "600" },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(127,127,127,0.25)",
    marginVertical: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  meta: { fontSize: 11, opacity: 0.45, marginTop: 8 },
  muted: { opacity: 0.65, fontSize: 13 },
  deleteBtn: {
    paddingVertical: 10,
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(127,127,127,0.25)",
    backgroundColor: "rgba(198,40,40,0.04)",
  },
  deleteText: { color: "#c62828", fontSize: 14, fontWeight: "500" },
  empty: {
    minHeight: 96,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(127,127,127,0.4)",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  emptyPlus: { fontSize: 28, opacity: 0.5, lineHeight: 32 },
  emptyText: { opacity: 0.6 },
});
