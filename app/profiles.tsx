import { Stack, router } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LanguagePicker } from "@/components/language-picker";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { getProfession, monthlyCashflow } from "@/lib/calculations";
import { RULES } from "@/lib/configs";
import { LOCALE_LABELS } from "@/lib/i18n";
import { alertModal } from "@/store/alert";
import { useLocaleStore, useT } from "@/store/locale";
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
  const t = useT();
  const slots = useProfileSlots();
  const { setActive, deleteProfile } = useProfilesActions();
  const currentLocale = useLocaleStore((s) => s.locale);
  const [langModalVisible, setLangModalVisible] = useState(false);

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
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <Stack.Screen options={{ title: t("app.name") }} />
      <ThemedView style={styles.header}>
        <View style={styles.headerRow}>
          <ThemedText type="title">{t("app.name")}</ThemedText>
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => setLangModalVisible(true)}
          >
            <ThemedText style={styles.langBtnText}>
              🌐 {LOCALE_LABELS[currentLocale]}
            </ThemedText>
          </TouchableOpacity>
        </View>
        <ThemedText style={styles.muted}>{t("menu.subtitle")}</ThemedText>
      </ThemedView>

      <ScrollView contentContainerStyle={styles.list}>
        {slots.map((slot) => {
          const prof = getProfession(slot.player.professionId);
          const cf = monthlyCashflow(slot.player, prof);
          const profName = t(`professions.${prof.id}`, {
            defaultValue: prof.name,
          });
          const name = slot.player.playerName || profName;
          return (
            <View key={slot.id} style={styles.slot}>
              <TouchableOpacity
                style={styles.slotMain}
                onPress={() => openProfile(slot.id)}
              >
                <ThemedText type="defaultSemiBold">
                  {name} · {profName}
                </ThemedText>
                <ThemedText
                  style={{ color: cf >= 0 ? "#2e7d32" : "#c62828" }}
                >
                  {cf >= 0 ? "+" : ""}
                  {fmt(cf)} {t("menu.perMonth")}
                </ThemedText>
                <ThemedText style={styles.meta}>
                  {slot.player.phase === "fastTrack"
                    ? t("menu.onFastTrack")
                    : ""}
                  {formatDate(slot.updatedAt)}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => confirmDelete(slot.id, name)}
              >
                <ThemedText style={styles.deleteText}>
                  {t("common.delete")}
                </ThemedText>
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
            <ThemedText style={styles.muted}>{t("menu.create")}</ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <LanguagePicker
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, gap: 4 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(127,127,127,0.4)",
  },
  langBtnText: { fontSize: 13 },
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
