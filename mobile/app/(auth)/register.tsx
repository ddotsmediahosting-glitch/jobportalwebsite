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

type Role = 'SEEKER' | 'EMPLOYER';

export default function RegisterScreen() {
  const { signUp, isLoading } = useAuthStore();
  const [role, setRole] = useState<Role>('SEEKER');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (role === 'SEEKER') {
      if (!firstName.trim()) e.firstName = 'Required';
      if (!lastName.trim()) e.lastName = 'Required';
    } else {
      if (!companyName.trim()) e.companyName = 'Required';
    }
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Minimum 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      await signUp({
        email: email.trim().toLowerCase(),
        password,
        role,
        ...(role === 'SEEKER' ? { firstName, lastName } : { companyName }),
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', msg);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Text style={styles.logo}>Ddotsmedia<Text style={{ color: COLORS.brand[600] }}>Jobs</Text></Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>Create account</Text>

          {/* Role toggle */}
          <View style={styles.roleRow}>
            {(['SEEKER', 'EMPLOYER'] as Role[]).map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                onPress={() => setRole(r)}
              >
                <Text style={[styles.roleTxt, role === r && styles.roleTxtActive]}>
                  {r === 'SEEKER' ? 'Job Seeker' : 'Employer'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {role === 'SEEKER' ? (
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input label="First Name" value={firstName} onChangeText={setFirstName} error={errors.firstName} />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Last Name" value={lastName} onChangeText={setLastName} error={errors.lastName} />
              </View>
            </View>
          ) : (
            <Input label="Company Name" value={companyName} onChangeText={setCompanyName} error={errors.companyName} leftIcon="business-outline" />
          )}

          <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" leftIcon="mail-outline" error={errors.email} />
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry leftIcon="lock-closed-outline" error={errors.password} />

          <Button onPress={handleRegister} loading={isLoading} fullWidth size="lg">
            Create Account
          </Button>

          <Text style={styles.terms}>
            By creating an account you agree to our{' '}
            <Text style={{ color: COLORS.brand[600] }}>Terms of Service</Text> and{' '}
            <Text style={{ color: COLORS.brand[600] }}>Privacy Policy</Text>.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: '#f8faff' },
  brand: { alignItems: 'center', marginBottom: 28, marginTop: 20 },
  logo: { fontSize: 24, fontWeight: '800', color: COLORS.gray[900] },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  heading: { fontSize: 22, fontWeight: '700', color: COLORS.gray[900], marginBottom: 20 },
  roleRow: { flexDirection: 'row', backgroundColor: COLORS.gray[100], borderRadius: 10, padding: 3, marginBottom: 20 },
  roleBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  roleBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  roleTxt: { fontSize: 14, fontWeight: '600', color: COLORS.gray[500] },
  roleTxtActive: { color: COLORS.brand[600] },
  row: { flexDirection: 'row' },
  terms: { fontSize: 12, color: COLORS.gray[400], textAlign: 'center', marginTop: 16, lineHeight: 18 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 14, color: COLORS.gray[500] },
  footerLink: { fontSize: 14, color: COLORS.brand[600], fontWeight: '700' },
});
