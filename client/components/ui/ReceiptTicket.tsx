import React from 'react';
import { View } from 'react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';
import { KeyValueRow } from './Summary';
import { Divider } from './Divider';

type ReceiptRow = { label: string; value: string };

type ReceiptTicketProps = {
  title?: string;
  subtitle?: string;
  rows: ReceiptRow[];
  total?: ReceiptRow;
  barcodeValue?: string;
};

/** Perforated-edge order confirmation card */
export function ReceiptTicket({
  title = 'Thank you!',
  subtitle = 'Your order has been confirmed',
  rows,
  total,
  barcodeValue,
}: ReceiptTicketProps) {
  const theme = useAppTheme();
  const notch = 10;

  return (
    <View style={{ marginVertical: theme.spacing[4] }}>
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          padding: theme.spacing[6],
          ...theme.getElevation('elv300'),
          overflow: 'visible',
        }}
      >
        <View style={{ alignItems: 'center', gap: theme.spacing[2], marginBottom: theme.spacing[5] }}>
          <Text variant="h3" style={{ textAlign: 'center' }}>
            {title}
          </Text>
          <Text variant="body" color="secondary" style={{ textAlign: 'center' }}>
            {subtitle}
          </Text>
        </View>

        <DashedDivider notch={notch} />

        <View style={{ paddingVertical: theme.spacing[4] }}>
          {rows.map((r) => (
            <KeyValueRow key={r.label} label={r.label} value={r.value} />
          ))}
          {total && (
            <>
              <Divider style={{ marginVertical: theme.spacing[3] }} />
              <KeyValueRow label={total.label} value={total.value} emphasize />
            </>
          )}
        </View>

        <DashedDivider notch={notch} />

        {barcodeValue && (
          <View style={{ alignItems: 'center', paddingTop: theme.spacing[5], gap: theme.spacing[2] }}>
            <View
              style={{
                flexDirection: 'row',
                height: 48,
                width: '80%',
                gap: 2,
                alignItems: 'stretch',
                justifyContent: 'center',
              }}
            >
              {barcodeValue
                .split('')
                .map((ch, i) => (
                  <View
                    key={i}
                    style={{
                      width: (ch.charCodeAt(0) % 3) + 1,
                      backgroundColor: theme.colors.text,
                      opacity: 0.85,
                    }}
                  />
                ))}
            </View>
            <Text variant="caption" color="muted">
              {barcodeValue}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function DashedDivider({ notch }: { notch: number }) {
  const theme = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: -theme.spacing[6] }}>
      <View
        style={{
          width: notch * 2,
          height: notch * 2,
          borderRadius: notch,
          backgroundColor: theme.colors.background,
          marginLeft: -notch,
        }}
      />
      <View
        style={{
          flex: 1,
          borderStyle: 'dashed',
          borderWidth: 1,
          borderColor: theme.colors.border,
          height: 0,
        }}
      />
      <View
        style={{
          width: notch * 2,
          height: notch * 2,
          borderRadius: notch,
          backgroundColor: theme.colors.background,
          marginRight: -notch,
        }}
      />
    </View>
  );
}
