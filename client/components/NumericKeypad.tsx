import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Delete } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/contexts/ThemeContext";

interface NumericKeypadProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
}

const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onKeyPress,
  onBackspace,
}) => {
  const { currentTheme } = useTheme();

  const handlePress = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onKeyPress(key);
  };

  const handleBackspace = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onBackspace();
  };

  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "backspace"],
  ];

  return (
    <View style={styles.container}>
      {keys.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((key, keyIndex) => {
            if (key === "") {
              return <View key={`empty-${keyIndex}`} style={styles.key} />;
            }

            if (key === "backspace") {
              return (
                <TouchableOpacity
                  key="backspace"
                  style={[
                    styles.key,
                    { backgroundColor: currentTheme.surface },
                  ]}
                  onPress={handleBackspace}
                  activeOpacity={0.7}
                >
                  <Delete size={28} color={currentTheme.text} />
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={key}
                style={[styles.key, { backgroundColor: currentTheme.surface }]}
                onPress={() => handlePress(key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.keyText, { color: currentTheme.text }]}>
                  {key}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  key: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  keyText: {
    fontSize: 28,
    fontWeight: "600",
  },
});

export default NumericKeypad;
