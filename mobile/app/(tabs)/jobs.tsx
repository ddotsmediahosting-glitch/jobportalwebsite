import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { jobsApi } from '../../src/api';
import { JobCard } from '../../src/components/JobCard';
import { FilterSheet } from '../../src/components/FilterSheet';
import { JobCardSkeleton } from '../../src/components/ui/Skeleton';
import { COLORS, QUERY_KEYS } from '../../src/constants';
import { Job, JobFilters } from '../../src/types';

export default function JobsScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const qc = useQueryClient();

  const [search, setSearch] = useState(params.q ?? '');
  const [submittedSearch, setSubmittedSearch] = useState(params.q ?? '');
  const [filters, setFilters] = useState<JobFilters>({});
  const [filterVisible, setFilterVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [savingId, setSavingId] = useState<string | null>(null);

  const activeFilters: JobFilters = { ...filters, q: submittedSearch || undefined, page, limit: 20 };
  const activeCount = Object.values(filters).filter(Boolean).length;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [QUERY_KEYS.jobs, activeFilters],
    queryFn: () => jobsApi.list(activeFilters),
    placeholderData: (prev) => prev,
  });

  const jobs: Job[] = data?.data?.data ?? [];
  const meta = data?.data?.meta;

  const saveMut = useMutation({
    mutationFn: (job: Job) =>
      job.isSaved ? jobsApi.unsaveJob(job.id) : jobsApi.saveJob(job.id),
    onMutate: async (job) => {
      setSavingId(job.id);
      await qc.cancelQueries({ queryKey: [QUERY_KEYS.jobs] });
      // Optimistic update
      qc.setQueryData<typeof data>([QUERY_KEYS.jobs, activeFilters], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: old.data.data.map((j: Job) =>
              j.id === job.id ? { ...j, isSaved: !j.isSaved } : j,
            ),
          },
        };
      });
    },
    onSettled: () => {
      setSavingId(null);
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.savedJobs] });
    },
  });

  const handleApplyFilters = useCallback((f: JobFilters) => {
    setFilters(f);
    setPage(1);
  }, []);

  const renderItem = useCallback(({ item }: { item: Job }) => (
    <JobCard job={item} onSaveToggle={(j) => saveMut.mutate(j)} savingId={savingId} />
  ), [savingId]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Search header */}
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color={COLORS.gray[400]} style={{ marginRight: 8 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => { setSubmittedSearch(search); setPage(1); }}
            placeholder="Search jobs..."
            placeholderTextColor={COLORS.gray[400]}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setSubmittedSearch(''); setPage(1); }}>
              <Ionicons name="close-circle" size={16} color={COLORS.gray[400]} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, activeCount > 0 && styles.filterBtnActive]}
          onPress={() => setFilterVisible(true)}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={activeCount > 0 ? COLORS.brand[600] : COLORS.gray[600]}
          />
          {activeCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Result count */}
      {meta && (
        <Text style={styles.resultCount}>
          {meta.total.toLocaleString()} job{meta.total !== 1 ? 's' : ''} found
        </Text>
      )}

      {/* List */}
      {isLoading ? (
        <View style={{ paddingHorizontal: 20 }}>
          {[0, 1, 2, 3].map((i) => <JobCardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(j) => j.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No jobs found</Text>
              <Text style={styles.emptySub}>Try adjusting your search or filters.</Text>
            </View>
          }
          ListFooterComponent={
            meta && meta.totalPages > 1 ? (
              <View style={styles.pager}>
                <TouchableOpacity
                  style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <Text style={styles.pageBtnText}>← Prev</Text>
                </TouchableOpacity>
                <Text style={styles.pageInfo}>{page} / {meta.totalPages}</Text>
                <TouchableOpacity
                  style={[styles.pageBtn, page >= meta.totalPages && styles.pageBtnDisabled]}
                  onPress={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page >= meta.totalPages}
                >
                  <Text style={styles.pageBtnText}>Next →</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        filters={filters}
        onApply={handleApplyFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.gray[50] },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingBottom: 8 },
  searchRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 2,
    borderWidth: 1, borderColor: COLORS.gray[200],
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.gray[900], paddingVertical: 10 },
  filterBtn: {
    backgroundColor: '#fff', borderRadius: 12,
    padding: 10, borderWidth: 1, borderColor: COLORS.gray[200],
    position: 'relative',
  },
  filterBtnActive: { borderColor: COLORS.brand[600], backgroundColor: COLORS.brand[50] },
  filterBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: COLORS.brand[600], borderRadius: 10,
    width: 18, height: 18, alignItems: 'center', justifyContent: 'center',
  },
  filterBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  resultCount: { fontSize: 12, color: COLORS.gray[500], paddingHorizontal: 20, marginBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.gray[700] },
  emptySub: { fontSize: 14, color: COLORS.gray[400], marginTop: 4 },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, paddingVertical: 20 },
  pageBtn: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.gray[200] },
  pageBtnDisabled: { opacity: 0.35 },
  pageBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.brand[600] },
  pageInfo: { fontSize: 13, color: COLORS.gray[500] },
});
