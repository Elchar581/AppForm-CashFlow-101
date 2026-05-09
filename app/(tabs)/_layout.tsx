import { Tabs, router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useT } from "@/store/locale";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? "light"].tint;
  const t = useT();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tint,
        headerShown: true,
        tabBarButton: HapticTab,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.replace("/profiles")}
            style={styles.menuBtn}
            hitSlop={8}
          >
            <View style={styles.menuPill}>
              <IconSymbol name="line.3.horizontal" size={18} color={tint} />
              <ThemedText
                type="defaultSemiBold"
                style={[styles.menuText, { color: tint }]}
              >
                {t("tabs.backToMenu")}
              </ThemedText>
            </View>
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="statement"
        options={{
          title: t("tabs.statement"),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="balance"
        options={{
          title: t("tabs.balance"),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="list.bullet" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="actions"
        options={{
          title: t("tabs.actions"),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="plus.circle.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  menuBtn: { paddingLeft: 12, paddingRight: 4 },
  menuPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(127,127,127,0.12)",
  },
  menuText: { fontSize: 14 },
});
