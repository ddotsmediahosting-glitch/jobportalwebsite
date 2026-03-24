import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { authApi } from '../../src/api';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { COLORS } from '../../src/constants';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) { Alert.alert('Enter your email address'); return; }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      // Always show success (backend hides user enumeration)
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>📬</Text>
        <Text style={styles.successTitle}>Check your inbox</Text>
        <Text style={styles.successSub}>
          If an account exists for {email}, you'll receive a password reset link shortly.
        </Text>
        <Button onPress={() => router.replace('/(auth)/login')} style={{ marginTop: 24 }}>
          Back to Login
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Reset password</Text>
        <Text style={styles.sub}>Enter your email and we'll send you a reset link.</Text>
        <Input
          label="Email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon="mail-outline"
          returnKeyType="send"
          onSubmitEditing={handleSubmit}
        />
        <Button onPress={handleSubmit} loading={loading} fullWidth size="lg">Send Reset Link</Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: '#f8faff', paddingTop: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  back: { marginBottom: 28 },
  backText: { fontSize: 15, color: COLORS.brand[600], fontWeight: '600' },
  heading: { fontSize: 26, fontWeight: '800', color: COLORS.gray[900], marginBottom: 8 },
  sub: { fontSize: 14, color: COLORS.gray[500], marginBottom: 28, lineHeight: 20 },
  emoji: { fontSize: 52, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: '700', color: COLORS.gray[900], marginBottom: 10 },
  successSub: { fontSize: 14, color: COLORS.gray[500], textAlign: 'center', lineHeight: 20 },
});
