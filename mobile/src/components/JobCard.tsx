import React from 'react';
import {
  View, Text, TouchableOpacity, Image, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Job } from '../types';
import { Badge } from './ui/Badge';
import { COLORS } from '../constants';
import {
  formatSalary, formatEmirate, formatWorkMode,
  formatEmploymentType, formatTimeAgo, truncate,
} from '../utils/format';

interface JobCardProps {
  job: Job;
  onSaveToggle?: (job: Job) => void;
  savingId?: string | null;
}

export function JobCard({ job, onSaveToggle, savingId }: JobCardProps) {
  const router = useRouter();
  const isSaving = savingId === job.id;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/jobs/${job.slug}`)}
    >
      {/* Header row */}
      <View style={styles.headerRow}>
        {job.employer.logoUrl ? (
          <Image source={{ uri: job.employer.logoUrl }} style={styles.logo} resizeMode="contain" />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoInitial}>
              {job.employer.companyName?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.company} numberOfLines={1}>{job.employer.companyName}</Text>
          <Text style={styles.meta} numberOfLines={1}>{formatEmirate(job.emirate)}</Text>
        </View>
        {onSaveToggle && (
          <TouchableOpacity
            onPress={() => onSaveToggle(job)}
            disabled={isSaving}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={job.isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={job.isSaved ? COLORS.brand[600] : COLORS.gray[400]}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>{job.title}</Text>

      {/* Chips */}
      <View style={styles.chips}>
        <Chip icon="briefcase-outline" label={formatEmploymentType(job.employmentType)} />
        <Chip icon="location-outline" label={formatWorkMode(job.workMode)} />
        {(job.salaryMin || job.salaryMax) && (
          <Chip icon="cash-outline" label={formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)} />
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.badgeRow}>
          {job.isFeatured && <Badge color="blue">Featured</Badge>}
          {job.isUrgent && <Badge color="red">Urgent</Badge>}
        </View>
        <Text style={styles.time}>{formatTimeAgo(job.publishedAt ?? job.expiresAt ?? '')}</Text>
      </View>
    </TouchableOpacity>
  );
}

function Chip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={12} color={COLORS.gray[500]} />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  logo: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: COLORS.gray[100] },
  logoPlaceholder: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: COLORS.brand[50],
    alignItems: 'center', justifyContent: 'center',
  },
  logoInitial: { fontSize: 18, fontWeight: '700', color: COLORS.brand[600] },
  company: { fontSize: 13, fontWeight: '600', color: COLORS.gray[700] },
  meta: { fontSize: 12, color: COLORS.gray[400], marginTop: 1 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.gray[900], marginBottom: 10, lineHeight: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.gray[50],
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
  },
  chipText: { fontSize: 11, color: COLORS.gray[600], fontWeight: '500' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badgeRow: { flexDirection: 'row', gap: 6 },
  time: { fontSize: 11, color: COLORS.gray[400] },
});
