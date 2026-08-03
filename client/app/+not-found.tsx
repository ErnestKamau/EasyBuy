import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text, Button, Screen } from '@/components/ui';

export default function NotFoundScreen() {
  const theme = useAppTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Screen>
        <View style={[styles.container, { padding: theme.spacing[6] }]}>
          <Text variant="h2" style={{ textAlign: 'center' }}>
            This screen doesn't exist.
          </Text>
          <Link href="/" asChild>
            <Button title="Go to home" style={{ marginTop: theme.spacing[5] }} />
          </Link>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
