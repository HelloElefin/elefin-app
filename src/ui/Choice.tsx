/**
 * Einfachauswahl: eine Liste, aus der genau eine Zeile gilt.
 *
 * Jede Zeile ist eine eigene große Fläche statt eines kleinen Kreises
 * daneben — wer zittrige Hände hat, trifft die Zeile, nicht den Punkt.
 */
import { Pressable, Text, View } from 'react-native';

import { colors, fontSize, minTouchTarget, radius, spacing } from '@/design';

import { useLineHeight } from './typography';

export type ChoiceOption = {
  value: string;
  label: string;
  /** Kurze Erklärung unter der Beschriftung, z. B. „Urne, Einäscherung". */
  hint?: string;
};

type Props = {
  options: ChoiceOption[];
  value: string | null;
  onSelect: (value: string) => void;
};

export function Choice({ options, value, onSelect }: Props) {
  const lineHeight = useLineHeight();

  return (
    <View>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.hint ? `${option.label}, ${option.hint}` : option.label}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: spacing.sm,
              minHeight: minTouchTarget,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              marginBottom: spacing.sm,
              backgroundColor: selected
                ? colors.accentSubtle
                : pressed
                  ? colors.surfaceMuted
                  : colors.surface,
              borderWidth: 1,
              borderColor: selected ? colors.accent : colors.border,
              borderRadius: radius.md,
            })}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: radius.full,
                borderWidth: 2,
                borderColor: selected ? colors.accent : colors.border,
                backgroundColor: selected ? colors.accent : 'transparent',
                marginTop: spacing.xs,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: fontSize.md,
                  lineHeight: lineHeight(fontSize.md),
                  color: colors.textPrimary,
                }}
              >
                {option.label}
              </Text>
              {option.hint !== undefined && (
                <Text
                  style={{
                    fontSize: fontSize.sm,
                    lineHeight: lineHeight(fontSize.sm),
                    color: colors.textSecondary,
                  }}
                >
                  {option.hint}
                </Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}