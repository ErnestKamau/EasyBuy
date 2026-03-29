import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

interface CodeInputProps {
  code: string[];
  length?: number;
}

const CodeInput: React.FC<CodeInputProps> = ({ code, length = 4 }) => {
  const { currentTheme } = useTheme();

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => {
        const digit = code[index] || "";
        const isFilled = digit !== "";

        return (
          <View
            key={`code-box-${index}`}
            style={[
              styles.box,
              {
                backgroundColor: currentTheme.surface,
                borderColor: isFilled
                  ? currentTheme.primary
                  : currentTheme.border,
                borderWidth: isFilled ? 2 : 1,
              },
            ]}
          >
            {isFilled && (
              <Text style={[styles.digitText, { color: currentTheme.text }]}>
                {digit}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 24,
  },
  box: {
    width: 50,
    height: 60,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  digitText: {
    fontSize: 24,
    fontWeight: "700",
  },
});

export default CodeInput;
