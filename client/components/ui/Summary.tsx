import React from 'react';
import { View } from 'react-native';
import { useAppTheme } from '@/contexts/ThemeContext';
import { Text } from './Text';
import { Surface } from './Surface';
import { Divider } from './Divider';

export function KeyValueRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  const theme = useAppTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing[2],
      }}
    >
      <Text variant="caption" color="muted" style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {label}
      </Text>
      <Text
        variant={emphasize ? 'title' : 'body'}
        style={{ fontFamily: emphasize ? theme.fontFamily.display.semiBold : theme.fontFamily.body.medium }}
      >
        {value}
      </Text>
    </View>
  );
}

type SummaryRow = { label: string; value: string };

export function SummaryCard({
  title,
  rows,
  total,
}: {
  title?: string;
  rows: SummaryRow[];
  total?: SummaryRow;
}) {
  const theme = useAppTheme();
  return (
    <Surface variant="elevated" padding={5} radius="lg">
      {title && (
        <Text variant="title" style={{ marginBottom: theme.spacing[3] }}>
          {title}
        </Text>
      )}
      {rows.map((r) => (
        <KeyValueRow key={r.label} label={r.label} value={r.value} />
      ))}
      {total && (
        <>
          <Divider style={{ marginVertical: theme.spacing[3] }} />
          <KeyValueRow label={total.label} value={total.value} emphasize />
        </>
      )}
    </Surface>
  );
}
