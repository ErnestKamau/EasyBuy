import React from "react";
import { View, Text } from "react-native";
import { BaseToast, ErrorToast } from "react-native-toast-message";
import { MaterialIcons } from "@expo/vector-icons";

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: "#28a745",
        backgroundColor: "#d4edda",
        borderRadius: 8,
        height: 70,
        paddingHorizontal: 15,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: "600",
        color: "#155724",
      }}
      text2Style={{
        fontSize: 14,
        color: "#155724",
        fontWeight: "400",
      }}
      renderLeadingIcon={() => (
        <View
          style={{
            justifyContent: "center", // Center the icon vertically
            alignItems: "center", // Center the icon horizontally
            marginLeft: 10,
          }}
        >
          <MaterialIcons name="check-circle" size={24} color="#28a745" />
        </View>
      )}
    />
  ),

  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: "#dc3545",
        backgroundColor: "#f8d7da",
        borderRadius: 8,
        height: 80,
        paddingHorizontal: 15,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: "600",
        color: "#721c24",
      }}
      text2Style={{
        fontSize: 14,
        color: "#721c24",
        fontWeight: "400",
        lineHeight: 18,
      }}
      renderLeadingIcon={() => (
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            marginLeft: 10,
          }}
        >
          <MaterialIcons
            name="error"
            size={24}
            color="#dc3545"
          />
        </View>
      )}
    />
  ),

  
};
