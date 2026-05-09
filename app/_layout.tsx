import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AlertModal } from "@/components/alert-modal";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useT } from "@/store/locale";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const t = useT();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="profiles" options={{ title: t("app.name") }} />
        <Stack.Screen name="setup" options={{ title: t("setup.title") }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="actions/buy-stock" options={{ title: t("actions.buyStock") }} />
        <Stack.Screen name="actions/sell-stock" options={{ title: t("actions.sellStock") }} />
        <Stack.Screen name="actions/buy-real-estate" options={{ title: t("actions.buyRealEstate") }} />
        <Stack.Screen name="actions/sell-real-estate" options={{ title: t("actions.sellRealEstate") }} />
        <Stack.Screen name="actions/buy-business" options={{ title: t("actions.buyBusiness") }} />
        <Stack.Screen name="actions/sell-business" options={{ title: t("actions.sellBusiness") }} />
        <Stack.Screen name="actions/bank-loan" options={{ title: t("actions.bankLoan") }} />
        <Stack.Screen name="actions/doodad" options={{ title: t("actions.doodad") }} />
        <Stack.Screen name="actions/fast-track-buy" options={{ title: t("actions.ftBuyBtn") }} />
        <Stack.Screen name="actions/pay-off-liabilities" options={{ title: t("actions.payOffLiab") }} />
        <Stack.Screen name="rat-race-snapshot" options={{ title: t("phase.snapshot") }} />
      </Stack>
      <StatusBar style="auto" />
      <AlertModal />
    </ThemeProvider>
  );
}
