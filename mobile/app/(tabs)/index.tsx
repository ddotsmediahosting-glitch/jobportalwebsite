import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { jobsApi } from '../../src/api';
import { JobCard } from '../../src/components/JobCard';
import { JobCardSkeleton } from '../../src/components/ui/Skeleton';
import { useAuthStore } from '../../src/store/auth.store';
import { COLORS, QUERY_KEYS } from '../../src/constants';
import { Job } from '../../src/types';

const MEDIA_CATEGORIES = [
  { label: 'Media & TV', icon: 'tv-outline', q: 'media' },
  { label: 'Marketing', icon: 'megaphone-outline', q: 'marketing' },
  { label: 'Design', icon: 'color-palette-outline', q: 'design' },
  { label: 'Content', icon: 'create-outline', q: 'content' },
  { label: 'Video', icon: 'videocam-outline', q: 'video production' },
  { label: 'Social Media', icon: 'share-social-outline', q: 'social media' },
  { label: 'PR & Comms', icon: 'people-outline', q: 'public relations' },
  { label: 'Photography', icon: 'camera-outline', q: 'photography' },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = React.useState('');

  const { data: featuredRes, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.jobs, 'featured'],
    queryFn: () => jobsApi.featured(),
  });

  const jobs: Job[] = featuredRes?.data?.data ?? [];

  const handleSearch = () => {
    if (search.trim()) {
      router.push(`/(tabs)/jobs?q=${encodeURIComponent(search.trim())}`);
    } else {
      router.push('/(tabs)/jobs');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Hi, {user?.firstName ?? user?.email?.split('@')[0] ?? 'there'} 👋
            </Text>
            <Text style={styles.sub}>Find your next media role</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/notifications')}
            style={styles.bellBtn}
          >
            <Ionicons name="notifications-outline" size={22} color={COLORS.gray[700]} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={COLORS.gray[400]} style={styles.searchIcon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            placeholder="Job title, skill, or company..."
            placeholderTextColor={COLORS.gray[400]}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.gray[400]} />
            </TouchableOpacity>
          )}
        </View>

        {/* Media quick-links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by specialty</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {MEDIA_CATEGORIES.map(({ label, icon, q }) => (
              <TouchableOpacity
                key={q}
                style={styles.catChip}
                onPress={() => router.push(`/(tabs)/jobs?q=${encodeURIComponent(q)}`)}
              >
                <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={COLORS.brand[600]} />
                <Text style={styles.catLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⭐ Featured Jobs</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/jobs')}>
              <Text style={styles.seeAll}>See all →</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            [0, 1, 2].map((i) => <JobCardSkeleton key={i} />)
          ) : jobs.length === 0 ? (
            <Text style={styles.empty}>No featured jobs at the moment.</Text>
          ) : (
            jobs.map((job) => <JobCard key={job.id} job={job} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.gray[50] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  greeting: { fontSize: 22, fontWeight: '800', color: COLORS.gray[900] },
  sub: { fontSize: 13, color: COLORS.gray[500], marginTop: 2 },
  bellBtn: { padding: 8, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: COLORS.gray[100] },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    marginHorizontal: 20, marginBottom: 8,
    paddingHorizontal: 14, paddingVertical: 2,
    borderWidth: 1, borderColor: COLORS.gray[200],
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.gray[900], paddingVertical: 12 },
  section: { paddingHorizontal: 20, paddingTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray[900], marginBottom: 12 },
  seeAll: { fontSize: 13, color: COLORS.brand[600], fontWeight: '600' },
  catScroll: { marginBottom: 4 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    marginRight: 10, borderWidth: 1, borderColor: COLORS.gray[200],
  },
  catLabel: { fontSize: 13, fontWeight: '600', color: COLORS.gray[700] },
  empty: { fontSize: 14, color: COLORS.gray[400], textAlign: 'center', paddingVertical: 32 },
});
