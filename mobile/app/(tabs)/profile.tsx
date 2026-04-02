import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Alert, TextInput,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { seekerApi } from '../../src/api';
import { useAuthStore } from '../../src/store/auth.store';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { COLORS, QUERY_KEYS, EMIRATE_LABELS } from '../../src/constants';
import { SeekerProfile } from '../../src/types';
import { formatDate } from '../../src/utils/format';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const qc = useQueryClient();
  const isSeeker = user?.role === 'SEEKER';

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.profile],
    queryFn: () => seekerApi.getProfile(),
    enabled: isSeeker,
  });
  const profile: SeekerProfile | undefined = data?.data?.data;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<SeekerProfile>>({});

  const startEdit = () => {
    setForm({
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      headline: profile?.headline ?? '',
      bio: profile?.bio ?? '',
      phone: profile?.phone ?? '',
      portfolioUrl: profile?.portfolioUrl ?? '',
      linkedInUrl: profile?.linkedInUrl ?? '',
    });
    setEditing(true);
  };

  const updateMut = useMutation({
    mutationFn: (data: Partial<SeekerProfile>) => seekerApi.updateProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.profile] });
      setEditing(false);
    },
    onError: () => Alert.alert('Error', 'Failed to update profile. Please try again.'),
  });

  const avatarMut = useMutation({
    mutationFn: (uri: string) => seekerApi.uploadAvatar(uri),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.profile] }),
  });

  const resumeMut = useMutation({
    mutationFn: ({ uri, name }: { uri: string; name: string }) =>
      seekerApi.uploadResume(uri, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.profile] }),
  });

  const deleteResumeMut = useMutation({
    mutationFn: (resumeId: string) => seekerApi.deleteResume(resumeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.profile] }),
  });

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      avatarMut.mutate(result.assets[0].uri);
    }
  };

  const pickResume = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword',
             'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      resumeMut.mutate({ uri: asset.uri, name: asset.name });
    }
  };

  const completeness = profile ? (() => {
    const fields = [profile.firstName, profile.lastName, profile.headline,
      profile.bio, profile.phone, profile.skills?.length,
      profile.avatarUrl, profile.resumes?.length];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  })() : 0;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ padding: 20 }}>
          <Skeleton height={80} borderRadius={40} width={80} style={{ alignSelf: 'center', marginBottom: 16 }} />
          <Skeleton height={20} width="50%" style={{ alignSelf: 'center', marginBottom: 8 }} />
          <Skeleton height={14} width="70%" style={{ alignSelf: 'center' }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar + name */}
        <View style={styles.hero}>
          <TouchableOpacity onPress={isSeeker ? pickAvatar : undefined} style={styles.avatarWrap}>
            {profile?.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {(profile?.firstName ?? user?.email ?? '?')[0].toUpperCase()}
                </Text>
              </View>
            )}
            {isSeeker && (
              <View style={styles.avatarEdit}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.name}>
            {profile?.firstName
              ? `${profile.firstName} ${profile.lastName ?? ''}`.trim()
              : user?.email}
          </Text>
          {profile?.headline && <Text style={styles.headline}>{profile.headline}</Text>}
          <Text style={styles.role}>{user?.role}</Text>
        </View>

        {/* Completeness bar */}
        {isSeeker && (
          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.sectionTitle}>Profile Completeness</Text>
              <Text style={[styles.sectionTitle, { color: COLORS.brand[600] }]}>{completeness}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${completeness}%` as `${number}%` }]} />
            </View>
          </View>
        )}

        {/* Edit form or display */}
        {isSeeker && (
          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.sectionTitle}>Personal Info</Text>
              {!editing && (
                <TouchableOpacity onPress={startEdit}>
                  <Ionicons name="pencil" size={18} color={COLORS.brand[600]} />
                </TouchableOpacity>
              )}
            </View>

            {editing ? (
              <>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Input label="First Name" value={form.firstName ?? ''} onChangeText={(v) => setForm((f) => ({ ...f, firstName: v }))} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input label="Last Name" value={form.lastName ?? ''} onChangeText={(v) => setForm((f) => ({ ...f, lastName: v }))} />
                  </View>
                </View>
                <Input label="Headline" value={form.headline ?? ''} onChangeText={(v) => setForm((f) => ({ ...f, headline: v }))} placeholder="e.g. Senior Video Editor" />
                <Input label="Phone" value={form.phone ?? ''} onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))} keyboardType="phone-pad" />
                <Input label="Bio" value={form.bio ?? ''} onChangeText={(v) => setForm((f) => ({ ...f, bio: v }))} multiline numberOfLines={3} />
                <Input label="Portfolio / Behance / Dribbble URL" value={form.portfolioUrl ?? ''} onChangeText={(v) => setForm((f) => ({ ...f, portfolioUrl: v }))} keyboardType="url" autoCapitalize="none" leftIcon="link-outline" />
                <Input label="LinkedIn URL" value={form.linkedInUrl ?? ''} onChangeText={(v) => setForm((f) => ({ ...f, linkedInUrl: v }))} keyboardType="url" autoCapitalize="none" leftIcon="logo-linkedin" />
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                  <Button variant="outline" onPress={() => setEditing(false)} style={{ flex: 1 }}>Cancel</Button>
                  <Button onPress={() => updateMut.mutate(form)} loading={updateMut.isPending} style={{ flex: 1 }}>Save</Button>
                </View>
              </>
            ) : (
              <>
                <InfoRow icon="mail-outline" label="Email" value={user?.email} />
                {profile?.phone && <InfoRow icon="call-outline" label="Phone" value={profile.phone} />}
                {profile?.portfolioUrl && <InfoRow icon="link-outline" label="Portfolio" value={profile.portfolioUrl} />}
                {profile?.linkedInUrl && <InfoRow icon="logo-linkedin" label="LinkedIn" value={profile.linkedInUrl} />}
              </>
            )}
          </View>
        )}

        {/* Resumes */}
        {isSeeker && (
          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.sectionTitle}>Resumes / CVs</Text>
              <Button size="sm" variant="outline" onPress={pickResume} loading={resumeMut.isPending}>
                + Upload
              </Button>
            </View>
            {(profile?.resumes ?? []).length === 0 ? (
              <Text style={styles.emptyLabel}>No resumes uploaded yet.</Text>
            ) : (
              profile?.resumes.map((r) => (
                <View key={r.id} style={styles.resumeRow}>
                  <Ionicons name="document-text-outline" size={20} color={COLORS.brand[600]} />
                  <Text style={styles.resumeName} numberOfLines={1}>{r.fileName}</Text>
                  {r.isPrimary && <Text style={styles.primaryBadge}>Primary</Text>}
                  <Text style={styles.resumeDate}>{formatDate(r.createdAt)}</Text>
                  <TouchableOpacity onPress={() => Alert.alert('Delete resume?', r.fileName, [
                    { text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteResumeMut.mutate(r.id) }
                  ])}>
                    <Ionicons name="trash-outline" size={16} color={COLORS.gray[400]} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* Sign out */}
        <View style={styles.section}>
          <Button variant="danger" onPress={() => Alert.alert('Sign out?', '', [
            { text: 'Cancel' }, { text: 'Sign out', style: 'destructive', onPress: signOut }
          ])} fullWidth>
            Sign Out
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={COLORS.gray[400]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.gray[50] },
  hero: { alignItems: 'center', backgroundColor: '#fff', paddingVertical: 28, borderBottomWidth: 1, borderColor: COLORS.gray[100] },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: COLORS.brand[100] },
  avatarPlaceholder: { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.brand[50], alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 36, fontWeight: '700', color: COLORS.brand[600] },
  avatarEdit: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.brand[600], width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  name: { fontSize: 20, fontWeight: '800', color: COLORS.gray[900] },
  headline: { fontSize: 13, color: COLORS.gray[500], marginTop: 4, textAlign: 'center', paddingHorizontal: 32 },
  role: { fontSize: 11, color: COLORS.brand[600], fontWeight: '700', backgroundColor: COLORS.brand[50], paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, marginTop: 8 },
  section: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: COLORS.gray[100] },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.gray[900] },
  progressTrack: { height: 8, backgroundColor: COLORS.gray[100], borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: 8, backgroundColor: COLORS.brand[600], borderRadius: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  infoLabel: { fontSize: 11, color: COLORS.gray[400] },
  infoValue: { fontSize: 14, color: COLORS.gray[800], fontWeight: '500', marginTop: 1 },
  emptyLabel: { fontSize: 13, color: COLORS.gray[400], textAlign: 'center', paddingVertical: 12 },
  resumeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: 1, borderColor: COLORS.gray[100] },
  resumeName: { flex: 1, fontSize: 13, color: COLORS.gray[700] },
  primaryBadge: { fontSize: 10, backgroundColor: COLORS.brand[50], color: COLORS.brand[600], paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, fontWeight: '700' },
  resumeDate: { fontSize: 11, color: COLORS.gray[400] },
});
