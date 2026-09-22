/**
 * Mehrfachauswahl. Gleicher Aufbau wie Choice, nur mit Kästchen statt
 * Kreisen und mehreren gleichzeitig gültigen Zeilen.
 */
import { Pressable, Text, View } from 'react-native';

import { colors, fontSize, minTouchTarget, radius, spacing } from '@/design';

import type { ChoiceOption } from './Choice';
import { useLineHeight } from './typography';

type Props = {
  options: ChoiceOption[];
  values: string[];
  onToggle: (value: string) => void;
};

export function MultiChoice({ options, values, onToggle }: Props) {
  const lineHeight = useLineHeight();

  return (
    <View>
      {options.map((option) => {
        const checked = values.includes(option.value);
        return (
          <Pressable
            key={option.value}
            onPress={() => onToggle(option.value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            accessibilityLabel={option.hint ? `${option.label}, ${option.hint}` : option.label}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: spacing.sm,
              minHeight: minTouchTarget,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              marginBottom: spacing.sm,
              backgroundColor: checked
                ? colors.accentSubtle
                : pressed
                  ? colors.surfaceMuted
                  : colors.surface,
              borderWidth: 1,
              borderColor: checked ? colors.accent : colors.border,
              borderRadius: radius.md,
            })}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: radius.sm,
                borderWidth: 2,
                borderColor: checked ? colors.accent : colors.border,
                backgroundColor: checked ? colors.accent : 'transparent',
                marginTop: spacing.xs,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {checked && (
                <Text style={{ color: colors.textOnAccent, fontSize: fontSize.xs }}>✓</Text>
              )}
            </View>
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