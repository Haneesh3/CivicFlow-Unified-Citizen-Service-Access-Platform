import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../lib/store';
import { api } from '../lib/api';

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { user, setUser, setToken } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        try {
          const response = await api.get('/users/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setToken(token);
          setUser(response.data);
        } catch (e) {
          await SecureStore.deleteItemAsync('token');
        }
      }
      setIsReady(true);
    }
    loadUser();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, segments, isReady]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}
