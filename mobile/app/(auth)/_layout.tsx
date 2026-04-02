import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';

export default function AuthLayout() {
  const user = useAuthStore((s) => s.user);
  if (user) return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
