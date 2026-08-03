import React from "react";

type StripeHooks = {
  initPaymentSheet: (params: Record<string, unknown>) => Promise<{
    error?: { message?: string } | null;
  }>;
  presentPaymentSheet: () => Promise<{
    error?: { message?: string } | null;
  }>;
};

const missingModuleError = {
  message:
    "Stripe native module is missing. Rebuild the app with `npx expo run:android` (or run:ios).",
};

const fallbackUseStripe = (): StripeHooks => ({
  initPaymentSheet: async () => ({ error: missingModuleError }),
  presentPaymentSheet: async () => ({ error: missingModuleError }),
});

const FallbackStripeProvider = ({
  children,
}: {
  readonly children: React.ReactNode;
}) => <>{children}</>;

type StripeModule = {
  StripeProvider: React.ComponentType<{
    publishableKey: string;
    merchantIdentifier?: string;
    urlScheme?: string;
    children: React.ReactNode;
  }>;
  useStripe: () => StripeHooks;
};

function loadStripeModule(): StripeModule | null {
  try {
    // Native import throws if StripeSdk is not in the binary (Expo Go / stale build).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("@stripe/stripe-react-native") as StripeModule;
  } catch (error) {
    console.warn(
      "[Stripe] Native module unavailable. Card payments disabled until you rebuild the native app.",
      error,
    );
    return null;
  }
}

const stripeModule = loadStripeModule();

export const isStripeNativeAvailable = stripeModule != null;

export const StripeProvider =
  stripeModule?.StripeProvider ?? FallbackStripeProvider;

export const useStripe = stripeModule?.useStripe ?? fallbackUseStripe;
