import { Stack } from "expo-router";

export default function WalletLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="history"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
    </Stack>
  );
}
