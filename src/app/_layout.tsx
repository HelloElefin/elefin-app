import 'react-native-get-random-values';
import '@/i18n';

import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/design';
import { SessionProvider } from '@/state/session';
import { TestBanner } from '@/ui';

export default function RootLayout() {
  const { t, i18n } = useTranslation();

  return (
    <SessionProvider language={i18n.language}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        {/* Nur Phase 1. Fällt weg, sobald nativ und verschlüsselt gespeichert wird. */}
        <TestBanner text={t('common.test_banner')} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
      </SafeAreaView>
    </SessionProvider>
  );
}