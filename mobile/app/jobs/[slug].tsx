import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Alert, Share, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { jobsApi } from '../../src/api';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { useAuthStore } from '../../src/store/auth.store';
import { COLORS, QUERY_KEYS, APP_URL } from '../../src/constants';
import {
  formatSalary, formatEmirate, formatWorkMode,
  formatEmploymentType, formatTimeAgo, stripHtml,
} from '../../src/utils/format';

export default function JobDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [applying, setApplying] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.jobDetail, slug],
    queryFn: () => jobsApi.detail(slug!),
    enabled: !!slug,
  });
  const job = data?.data?.data;

  const saveMut = useMutation({
    mutationFn: () => job?.isSaved ? jobsApi.unsaveJob(job.id) : jobsApi.saveJob(job!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.jobDetail, slug] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.savedJobs] });
    },
  });

  const applyMut = useMutation({
    mutationFn: (resumeId?: string) => jobsApi.apply(job!.id, { resumeId }),
    onSuccess: () => {
      Alert.alert('Application submitted! ✅', 'The employer will review your profile and get back to you.');
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.jobDetail, slug] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.applications] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Application failed. Please try again.';
      Alert.alert('Error', msg);
    },
  });

  const handleApply = () => {
    if (!user) { router.push('/(auth)/login'); return; }
    if (job?.hasApplied) { Alert.alert('Already applied', 'You have already applied for this job.'); return; }
    setApplying(true);
    applyMut.mutate(undefined);
  };

  const handleShare = async () => {
    if (!job) return;
    await Share.share({
      title: job.title,
      message: `${job.title} at ${job.employer.companyName}\n${APP_URL}/jobs/${job.slug}`,
      url: `${APP_URL}/jobs/${job.slug}`,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ padding: 20 }}>
          <Skeleton height={44} width={44} borderRadius={10} style={{ marginBottom: 16 }} />
          <Skeleton height={24} style={{ marginBottom: 10 }} />
          <Skeleton height={16} width="60%" style={{ marginBottom: 24 }} />
          <Skeleton height={120} borderRadius={12} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !job) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorCenter}>
          <Text style={styles.errorText}>Job not found or no longer available.</Text>
          <Button onPress={() => router.back()} variant="outline" style={{ marginTop: 16 }}>Go Back</Button>
        </View>
      </SafeAreaView>
    );
  }

  const cleanDesc = stripHtml(job.description);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Company header */}
        <View style={styles.companyBanner}>
          <TouchableOpacity
            onPress={() => router.push(`/companies/${job.employer.slug}`)}
            style={styles.companyRow}
          >
            {job.employer.logoUrl ? (
              <Image source={{ uri: job.employer.logoUrl }} style={styles.logo} resizeMode="contain" />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoInitial}>{job.employer.companyName[0]?.toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.companyName}>{job.employer.companyName}</Text>
              <Text style={styles.companyMeta}>
                {formatEmirate(job.emirate)} · {job.employer.industry ?? 'Company'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray[400]} />
          </TouchableOpacity>
        </View>

        {/* Job title + badges */}
        <View style={styles.titleSection}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <View style={styles.badgeRow}>
            {job.isFeatured && <Badge color="blue">Featured</Badge>}
            {job.isUrgent && <Badge color="red">Urgent</Badge>}
            {job.isEmiratization && <Badge color="green">Emiratization</Badge>}
          </View>
          <Text style={styles.postedTime}>
            Posted {formatTimeAgo(job.publishedAt ?? job.expiresAt ?? '')}
          </Text>
        </View>

        {/* Details grid */}
        <View style={styles.detailGrid}>
          <DetailItem icon="briefcase-outline" label="Type" value={formatEmploymentType(job.employmentType)} />
          <DetailItem icon="laptop-outline" label="Work mode" value={formatWorkMode(job.workMode)} />
          <DetailItem icon="location-outline" label="Location" value={formatEmirate(job.emirate)} />
          {(job.salaryMin || job.salaryMax) && (
            <DetailItem icon="cash-outline" label="Salary" value={formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)} />
          )}
          {job.experienceMin != null && (
            <DetailItem icon="time-outline" label="Experience" value={`${job.experienceMin}+ years`} />
          )}
        </View>

        {/* Skills */}
        {job.skills?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills Required</Text>
            <View style={styles.skillsRow}>
              {job.skills.map((skill) => (
                <View key={skill} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <Text style={styles.descText}>{cleanDesc}</Text>
        </View>

        {/* Requirements */}
        {job.requirements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Requirements</Text>
            <Text style={styles.descText}>{stripHtml(job.requirements)}</Text>
          </View>
        )}

        {/* Benefits */}
        {job.benefits && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Benefits</Text>
            <Text style={styles.descText}>{stripHtml(job.benefits)}</Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky action bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => saveMut.mutate()}>
          <Ionicons
            name={job.isSaved ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={job.isSaved ? COLORS.brand[600] : COLORS.gray[600]}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color={COLORS.gray[600]} />
        </TouchableOpacity>
        <Button
          onPress={handleApply}
          loading={applyMut.isPending}
          disabled={job.hasApplied}
          style={styles.applyBtn}
          size="lg"
        >
          {job.hasApplied ? '✓ Applied' : 'Apply Now'}
        </Button>
      </View>
    </SafeAreaView>
  );
}

function DetailItem({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={detailStyles.item}>
      <Ionicons name={icon} size={16} color={COLORS.brand[600]} />
      <View style={{ flex: 1 }}>
        <Text style={detailStyles.label}>{label}</Text>
        <Text style={detailStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderColor: COLORS.gray[100] },
  label: { fontSize: 11, color: COLORS.gray[400], textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 14, color: COLORS.gray[900], fontWeight: '600', marginTop: 1 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  companyBanner: { backgroundColor: COLORS.gray[50], borderBottomWidth: 1, borderColor: COLORS.gray[100], padding: 16 },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 52, height: 52, borderRadius: 12, borderWidth: 1, borderColor: COLORS.gray[100] },
  logoPlaceholder: { width: 52, height: 52, borderRadius: 12, backgroundColor: COLORS.brand[50], alignItems: 'center', justifyContent: 'center' },
  logoInitial: { fontSize: 22, fontWeight: '700', color: COLORS.brand[600] },
  companyName: { fontSize: 15, fontWeight: '700', color: COLORS.gray[900] },
  companyMeta: { fontSize: 12, color: COLORS.gray[500], marginTop: 2 },
  titleSection: { padding: 20, paddingBottom: 0 },
  jobTitle: { fontSize: 22, fontWeight: '800', color: COLORS.gray[900], lineHeight: 28, marginBottom: 10 },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  postedTime: { fontSize: 12, color: COLORS.gray[400] },
  detailGrid: { paddingHorizontal: 20, marginTop: 16, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: COLORS.gray[100], marginHorizontal: 16 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.gray[900], marginBottom: 12 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: { backgroundColor: COLORS.brand[50], borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  skillText: { fontSize: 13, color: COLORS.brand[700], fontWeight: '600' },
  descText: { fontSize: 14, color: COLORS.gray[700], lineHeight: 22 },
  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', padding: 16,
    borderTopWidth: 1, borderColor: COLORS.gray[100],
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 8,
  },
  iconBtn: { backgroundColor: COLORS.gray[50], borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.gray[200] },
  applyBtn: { flex: 1 },
  errorCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { fontSize: 16, color: COLORS.gray[500], textAlign: 'center' },
});
