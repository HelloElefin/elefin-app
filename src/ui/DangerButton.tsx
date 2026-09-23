/**
 * Ein Knopf für etwas Unwiderrufliches, mit Rückfrage an Ort und Stelle.
 *
 * Kein Systemdialog: Den gibt es im Browser über React Native nicht, und
 * eine Rückfrage, die im Browser nichts tut, wäre schlimmer als keine.
 * Stattdessen verwandelt sich der Knopf in zwei Knöpfe.
 */
import { useState } from 'react';
import { Text, View } from 'react-native';

import { colors, fontSize, spacing } from '@/design';

import { Button } from './Button';
import { useLineHeight } from './typography';

type Props = {
  label: string;
  question: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
};

export function DangerButton({ label, question, confirmLabel, cancelLabel, onConfirm }: Props) {
  const [fragt, setFragt] = useState(false);
  const lineHeight = useLineHeight();

  if (!fragt) return <Button label={label} variant="quiet" onPress={() => setFragt(true)} />;

  return (
    <View style={{ gap: spacing.sm }}>
      <Text
        style={{
          fontSize: fontSize.sm,
          lineHeight: lineHeight(fontSize.sm),
          color: colors.danger,
          textAlign: 'center',
        }}
      >
        {question}
      </Text>
      <Button
        label={confirmLabel}
        onPress={() => {
          setFragt(false);
          onConfirm();
        }}
      />
      <Button label={cancelLabel} variant="quiet" onPress={() => setFragt(false)} />
    </View>
  );
}