import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { COLORS } from '../../src/constants';

export default function LoginScreen() {
  const { signIn, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Invalid email or password';
      Alert.alert('Login Failed', msg);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Brand */}
        <View style={styles.brand}>
          <Text style={styles.logo}>Ddotsmedia<Text style={{ color: COLORS.brand[600] }}>Jobs</Text></Text>
          <Text style={styles.tagline}>UAE's media & creative job platform</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.sub}>Sign in to your account</Text>

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
            leftIcon="mail-outline"
            error={errors.email}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            leftIcon="lock-closed-outline"
            error={errors.password}
          />

          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity style={styles.forgotWrap}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </Link>

          <Button onPress={handleLogin} loading={isLoading} fullWidth size="lg">
            Sign In
          </Button>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Create one</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: '#f8faff', justifyContent: 'center' },
  brand: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 28, fontWeight: '800', color: COLORS.gray[900] },
  tagline: { fontSize: 13, color: COLORS.gray[500], marginTop: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  heading: { fontSize: 22, fontWeight: '700', color: COLORS.gray[900], marginBottom: 4 },
  sub: { fontSize: 14, color: COLORS.gray[500], marginBottom: 24 },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -8 },
  forgotText: { fontSize: 13, color: COLORS.brand[600], fontWeight: '500' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 14, color: COLORS.gray[500] },
  footerLink: { fontSize: 14, color: COLORS.brand[600], fontWeight: '700' },
});
