import { Tabs, router } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: true,
        tabBarButton: HapticTab,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.replace("/")}
            style={{ paddingHorizontal: 16 }}
          >
            <ThemedText style={{ color: Colors[colorScheme ?? "light"].tint }}>
              Меню
            </ThemedText>
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="statement"
        options={{
          title: "Бланк",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
