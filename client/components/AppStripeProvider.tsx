import React from "react";
import { StripeProvider, isStripeNativeAvailable } from "@/components/stripeNative";

const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

export function AppStripeProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  if (!publishableKey || !isStripeNativeAvailable) {
    return <>{children}</>;
  }

  return (
    <StripeProvider
      publishableKey={publishableKey}
      merchantIdentifier="merchant.com.easybuy.app"
      urlScheme="easybuy"
    >
      {children}
    </StripeProvider>
  );
}
