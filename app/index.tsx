import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LanguagePicker } from "@/components/language-picker";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { LOCALE_LABELS } from "@/lib/i18n";
import { useLocaleStore, useT } from "@/store/locale";

export default function WelcomeScreen() {
  const t = useT();
  const currentLocale = useLocaleStore((s) => s.locale);
  const [langModalVisible, setLangModalVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ThemedView style={styles.body}>
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <ThemedText type="title" style={styles.title}>
            {t("app.name")}
          </ThemedText>
          <ThemedText style={styles.tagline}>
            {t("welcome.tagline")}
          </ThemedText>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => setLangModalVisible(true)}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.langBtnText}>
              🌐 {LOCALE_LABELS[currentLocale]}
            </ThemedText>
            <ThemedText style={styles.langChevron}>›</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playBtn}
            onPress={() => router.push("/profiles")}
            activeOpacity={0.85}
          >
            <ThemedText type="defaultSemiBold" style={styles.playText}>
              ▶  {t("welcome.play")}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      <LanguagePicker
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "space-between",
    paddingVertical: 48,
  },
  hero: {
    alignItems: "center",
    gap: 14,
    marginTop: 32,
  },
  logoWrap: {
    width: 200,
    height: 200,
    borderRadius: 44,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
    marginBottom: 8,
  },
  logo: { width: "100%", height: "100%" },
  title: {
    textAlign: "center",
    fontSize: 36,
    lineHeight: 42,
  },
  tagline: {
    textAlign: "center",
    opacity: 0.65,
    fontSize: 15,
  },
  controls: {
    gap: 14,
    marginBottom: 16,
  },
  langBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(127,127,127,0.4)",
  },
  langBtnText: { fontSize: 16 },
  langChevron: { fontSize: 22, opacity: 0.6 },
  playBtn: {
    backgroundColor: "#2e7d32",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#2e7d32",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  playText: {
    color: "#fff",
    fontSize: 18,
    letterSpacing: 0.5,
  },
});
