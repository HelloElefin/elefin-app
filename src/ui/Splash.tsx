/**
 * Der Willkommensgruß beim Start.
 *
 * Liegt als Ebene über der App und blendet sich nach kurzer Zeit weg. Kein
 * eigener Screen im Fluss: Sonst wäre bei jedem Neuladen ein Klick mehr
 * nötig, und gerade in der Testfassung lädt man oft neu.
 *
 * Antippen überspringt. Wer schnell ist, sieht ihn also kaum.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

import { colors, fontSize, screenPadding, spacing } from '@/design';

import { Art } from './art';
import { Wordmark } from './art';
import { useLineHeight } from './typography';

const SICHTBAR = 1600;
const AUSBLENDEN = 320;

export function Splash({ title, claim }: { title: string; claim: string }) {
  const [fertig, setFertig] = useState(false);
  const deckkraft = useRef(new Animated.Value(1)).current;
  const lineHeight = useLineHeight();

  function schliessen() {
    Animated.timing(deckkraft, {
      toValue: 0,
      duration: AUSBLENDEN,
      useNativeDriver: true,
    }).start(() => setFertig(true));
  }

  useEffect(() => {
    const zeit = setTimeout(schliessen, SICHTBAR);
    return () => clearTimeout(zeit);
    // Absichtlich nur einmal: Der Gruß erscheint beim Start, nicht erneut.
  }, []);

  if (fertig) return null;

  return (
    <Animated.View
      style={{
        ...StyleSheet.absoluteFill,
        opacity: deckkraft,
        backgroundColor: colors.background,
        zIndex: 10,
      }}
    >
      <Pressable
        onPress={schliessen}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.lg,
          padding: screenPadding,
        }}
      >
        <Art id="schublade" size="medium" />
        <Wordmark centered />
        <Text
          style={{
            fontSize: fontSize.lg,
            lineHeight: lineHeight(fontSize.lg, 1.25),
            color: colors.textPrimary,
            textAlign: 'center',
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: fontSize.md,
            lineHeight: lineHeight(fontSize.md),
            color: colors.textSecondary,
            textAlign: 'center',
          }}
        >
          {claim}
        </Text>
      </Pressable>
    </Animated.View>
  );
}