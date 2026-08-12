import { Stack, useRouter } from 'expo-router';
import { Screen, EmptyState } from '@/components/ui';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Screen edges={['top', 'left', 'right', 'bottom']}>
        <EmptyState
          illustration="error"
          title="Aaaah! Something went wrong"
          message="Brace yourself till we get this sorted. You may go home or try again later."
          actionLabel="Go to home"
          onAction={() => router.replace('/')}
        />
      </Screen>
    </>
  );
}
