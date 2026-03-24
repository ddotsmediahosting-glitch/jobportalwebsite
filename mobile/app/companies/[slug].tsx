import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Linking, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../src/api';
import { JobCard } from '../../src/components/JobCard';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { COLORS, QUERY_KEYS } from '../../src/constants';
import { Employer, Job } from '../../src/types';
import { stripHtml } from '../../src/utils/format';

export default function CompanyScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const { data: companyData, isLoading: companyLoading } = useQuery({
    queryKey: [QUERY_KEYS.companyDetail, slug],
    queryFn: () => apiClient.get<{ success: boolean; data: Employer }>(`/employers/${slug}`),
    enabled: !!slug,
  });

  const company = companyData?.data?.data;

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: [QUERY_KEYS.jobs, 'company', slug],
    queryFn: () => apiClient.get<{ success: boolean; data: Job[]; meta: unknown }>(`/jobs?employerSlug=${slug}&limit=10`),
    enabled: !!slug,
  });

  const jobs: Job[] = (jobsData?.data as { data?: Job[] })?.data ?? [];

  if (companyLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ padding: 20 }}>
          <Skeleton height={100} borderRadius={16} style={{ marginBottom: 16 }} />
          <Skeleton height={24} style={{ marginBottom: 10 }} />
          <Skeleton height={16} width="60%" />
        </View>
      </SafeAreaView>
    );
  }

  if (!company) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorCenter}>
          <Text style={styles.errorText}>Company not found.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: COLORS.brand[600], marginTop: 12 }}>← Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header banner */}
        <View style={styles.banner}>
          {company.logoUrl ? (
            <Image source={{ uri: company.logoUrl }} style={styles.logo} resizeMode="contain" />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoInitial}>{company.companyName[0]?.toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.companyName}>{company.companyName}</Text>
          {company.industry && <Text style={styles.industry}>{company.industry}</Text>}
          {company.emirate && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.gray[400]} />
              <Text style={styles.locationText}>{company.emirate}</Text>
            </View>
          )}

          {company.website && (
            <TouchableOpacity
              onPress={() => Linking.openURL(company.website!)}
              style={styles.websiteBtn}
            >
              <Ionicons name="globe-outline" size={14} color={COLORS.brand[600]} />
              <Text style={styles.websiteText}>Visit Website</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* About */}
        {company.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{stripHtml(company.description)}</Text>
          </View>
        )}

        {/* Active jobs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Open Positions</Text>
          {jobsLoading ? (
            [0, 1, 2].map((i) => <Skeleton key={i} height={80} borderRadius={12} style={{ marginBottom: 10 }} />)
          ) : jobs.length === 0 ? (
            <Text style={styles.noJobs}>No open positions at this time.</Text>
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
  banner: { backgroundColor: '#fff', alignItems: 'center', padding: 28, borderBottomWidth: 1, borderColor: COLORS.gray[100] },
  logo: { width: 80, height: 80, borderRadius: 16, borderWidth: 1, borderColor: COLORS.gray[100], marginBottom: 12 },
  logoPlaceholder: { width: 80, height: 80, borderRadius: 16, backgroundColor: COLORS.brand[50], alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoInitial: { fontSize: 32, fontWeight: '700', color: COLORS.brand[600] },
  companyName: { fontSize: 22, fontWeight: '800', color: COLORS.gray[900] },
  industry: { fontSize: 13, color: COLORS.gray[500], marginTop: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  locationText: { fontSize: 13, color: COLORS.gray[500] },
  websiteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, borderWidth: 1.5, borderColor: COLORS.brand[200], paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.brand[50] },
  websiteText: { fontSize: 13, color: COLORS.brand[600], fontWeight: '600' },
  section: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.gray[900], marginBottom: 14 },
  description: { fontSize: 14, color: COLORS.gray[700], lineHeight: 22 },
  noJobs: { fontSize: 14, color: COLORS.gray[400], textAlign: 'center', paddingVertical: 24 },
  errorCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { fontSize: 16, color: COLORS.gray[500], textAlign: 'center' },
});
