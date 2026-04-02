import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/auth.store';
import { authEventEmitter } from '../src/api';
import { usePushNotifications } from '../src/hooks/usePushNotifications';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function RootLayoutInner() {
  const { hydrate, signOut, isHydrated, user } = useAuthStore();
  usePushNotifications();

  useEffect(() => {
    hydrate();
  }, []);

  // Listen for forced sign-out from the API interceptor (expired tokens)
  useEffect(() => {
    const handler = () => signOut();
    authEventEmitter.on('signout', handler);
    return () => authEventEmitter.off('signout', handler);
  }, [signOut]);

  if (!isHydrated) return null; // Splash screen covers this

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="jobs/[slug]"
        options={{ headerShown: true, title: 'Job Details', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="companies/[slug]"
        options={{ headerShown: true, title: 'Company', headerBackTitle: 'Back' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <RootLayoutInner />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
