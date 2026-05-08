import { StyleSheet, TextInput, type TextInputProps } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";

export function ThemedInput(props: TextInputProps) {
  const scheme = useColorScheme();
  const color = scheme === "dark" ? "#fff" : "#111";
  const placeholder = scheme === "dark" ? "#666" : "#999";
  return (
    <TextInput
      {...props}
      placeholderTextColor={props.placeholderTextColor ?? placeholder}
      style={[styles.input, { color }, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "rgba(127,127,127,0.4)",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
});
