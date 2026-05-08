import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="setup" options={{ title: "Новая партия" }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="actions/buy-stock"
          options={{ title: "Купить акции" }}
        />
        <Stack.Screen
          name="actions/sell-stock"
          options={{ title: "Продать акции" }}
        />
        <Stack.Screen
          name="actions/buy-real-estate"
          options={{ title: "Купить недвижимость" }}
        />
        <Stack.Screen
          name="actions/sell-real-estate"
          options={{ title: "Продать недвижимость" }}
        />
        <Stack.Screen
          name="actions/buy-business"
          options={{ title: "Купить бизнес" }}
        />
        <Stack.Screen
          name="actions/sell-business"
          options={{ title: "Продать бизнес" }}
        />
        <Stack.Screen
          name="actions/bank-loan"
          options={{ title: "Кредит банка" }}
        />
        <Stack.Screen
          name="actions/doodad"
          options={{ title: "Мелкая трата (Doodad)" }}
        />
        <Stack.Screen
          name="actions/fast-track-buy"
          options={{ title: "Купить бизнес · Большой круг" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
