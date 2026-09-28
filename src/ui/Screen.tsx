/**
 * Der Rahmen um jeden Screen: Scrollbereich, Abstände, Übergang.
 *
 * Der Übergang ist bewusst zurückhaltend — ein kurzes Aufblenden mit einer
 * kleinen Bewegung nach oben. Kein Schieben von rechts: Dafür müsste die App
 * wissen, ob es vorwärts oder rückwärts ging, und das kostet mehr, als es
 * bringt. Hier geht es darum, dass ein Screenwechsel nicht mehr schlagartig
 * passiert.
 *
 * Auf nativen Geräten macht der Router den Übergang selbst. Dort wäre der
 * hier zusätzlich, also läuft er nur im Browser.
 *
 * Wer am Gerät „Bewegung reduzieren" eingestellt hat, bekommt gar keinen —
 * für manche Menschen ist Bewegung auf dem Bildschirm ein echtes Problem.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Platform, ScrollView, type ViewStyle } from 'react-native';

import { screenPadding, spacing } from '@/design';

type Props = {
  children: ReactNode;
  /** Inhalt senkrecht mittig, z. B. auf dem Startscreen. */
  centered?: boolean;
  style?: ViewStyle;
};

const DAUER = 220;

export function Screen({ children, centered = false, style }: Props) {
  const [reduziert, setReduziert] = useState(false);
  const fortschritt = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let aktiv = true;
    AccessibilityInfo.isReduceMotionEnabled().then((an) => {
      if (aktiv) setReduziert(an);
    });
    return () => {
      aktiv = false;
    };
  }, []);

  const animiert = Platform.OS === 'web' && !reduziert;

  useEffect(() => {
    if (!animiert) {
      fortschritt.setValue(1);
      return;
    }
    fortschritt.setValue(0);
    Animated.timing(fortschritt, {
      toValue: 1,
      duration: DAUER,
      useNativeDriver: true,
    }).start();
  }, [animiert, fortschritt]);

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: animiert ? fortschritt : 1,
        transform: [
          {
            translateY: animiert
              ? fortschritt.interpolate({ inputRange: [0, 1], outputRange: [12, 0] })
              : 0,
          },
        ],
      }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: screenPadding,
          paddingBottom: spacing.xxl,
          ...(centered ? { flexGrow: 1, justifyContent: 'center' } : {}),
          ...style,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </Animated.View>
  );
}