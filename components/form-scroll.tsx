import React from "react";
import { ScrollView, StyleSheet, type ScrollViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Скролл-контейнер для экранов-форм.
 * Учитывает нижний safe-area-инсет (системные кнопки навигации Android/Home Indicator iOS),
 * чтобы submit-кнопка не пряталась под системную панель.
 */
export function FormScroll({
  children,
  contentContainerStyle,
  ...rest
}: ScrollViewProps & { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      {...rest}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 24 },
        contentContainerStyle,
      ]}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
});
