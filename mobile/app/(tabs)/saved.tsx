import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { jobsApi } from '../../src/api';
import { JobCard } from '../../src/components/JobCard';
import { JobCardSkeleton } from '../../src/components/ui/Skeleton';
import { COLORS, QUERY_KEYS } from '../../src/constants';
import { Job } from '../../src/types';

export default function SavedScreen() {
  const qc = useQueryClient();
  const router = useRouter();
  const [savingId, setSavingId] = React.useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.savedJobs],
    queryFn: () => jobsApi.savedJobs(),
  });

  const items = (data?.data?.data ?? []) as Array<{ id: string; job: Job; createdAt: string }>;

  const unsaveMut = useMutation({
    mutationFn: (jobId: string) => jobsApi.unsaveJob(jobId),
    onMutate: (jobId) => setSavingId(jobId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.savedJobs] }),
    onSettled: () => setSavingId(null),
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Jobs</Text>
        {items.length > 0 && (
          <Text style={styles.count}>{items.length} saved</Text>
        )}
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: 16 }}>
          {[0, 1, 2].map((i) => <JobCardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔖</Text>
              <Text style={styles.emptyTitle}>No saved jobs yet</Text>
              <Text style={styles.emptySub}>Tap the bookmark icon on any job to save it here.</Text>
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={() => router.push('/(tabs)/jobs')}
              >
                <Text style={styles.browseBtnText}>Browse Jobs</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <JobCard
              job={{ ...item.job, isSaved: true }}
              onSaveToggle={(job) => unsaveMut.mutate(job.id)}
              savingId={savingId}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.gray[50] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.gray[900] },
  count: { fontSize: 13, color: COLORS.gray[500] },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.gray[700], marginBottom: 6 },
  emptySub: { fontSize: 14, color: COLORS.gray[400], textAlign: 'center', lineHeight: 20 },
  browseBtn: {
    marginTop: 24, backgroundColor: COLORS.brand[600],
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
