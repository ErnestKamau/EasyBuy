import React from 'react';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';

type PriceTextProps = {
  amount: number | string;
  currency?: string;
  compareAt?: number | string;
  size?: 'sm' | 'md' | 'lg';
};

function format(amount: number | string, currency = 'KES') {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(n)) return String(amount);
  return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function PriceText({
  amount,
  currency = 'KES',
  compareAt,
  size = 'md',
}: PriceTextProps) {
  const theme = useAppTheme();
  const role = size === 'lg' ? 'h3' : size === 'sm' ? 'bodySmall' : 'title';

  return (
    <>
      <Text
        variant={role as any}
        color="brand"
        style={{ fontFamily: theme.fontFamily.display.semiBold }}
      >
        {format(amount, currency)}
      </Text>
      {compareAt != null && (
        <Text
          variant="caption"
          color="muted"
          style={{ textDecorationLine: 'line-through', marginLeft: 6 }}
        >
          {format(compareAt, currency)}
        </Text>
      )}
    </>
  );
}
