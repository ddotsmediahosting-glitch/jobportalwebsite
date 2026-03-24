import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { notificationsApi } from '../../src/api';
import { COLORS, QUERY_KEYS } from '../../src/constants';
import { AppNotification } from '../../src/types';
import { formatTimeAgo } from '../../src/utils/format';
import { Skeleton } from '../../src/components/ui/Skeleton';

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  APPLICATION_UPDATE: 'briefcase',
  JOB_ALERT: 'megaphone',
  PROFILE_VIEW: 'eye',
  INTERVIEW_INVITE: 'calendar',
  SYSTEM: 'information-circle',
  PROMOTION: 'star',
};

const TYPE_COLORS: Record<string, string> = {
  APPLICATION_UPDATE: '#3b82f6',
  JOB_ALERT: '#f59e0b',
  PROFILE_VIEW: '#8b5cf6',
  INTERVIEW_INVITE: '#10b981',
  SYSTEM: '#6b7280',
  PROMOTION: '#f59e0b',
};

export default function NotificationsScreen() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.notifications],
    queryFn: () => notificationsApi.list(),
    refetchInterval: 60_000,
  });

  const notifications: AppNotification[] = data?.data?.data ?? [];
  const unread = notifications.filter((n) => !n.readAt).length;

  const markAllMut = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.notifications] }),
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.notifications] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEYS.notifications] }),
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          {unread > 0 && <Text style={styles.unread}>{unread} unread</Text>}
        </View>
        {unread > 0 && (
          <TouchableOpacity onPress={() => markAllMut.mutate()} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={{ padding: 16 }}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ marginBottom: 16 }}>
              <Skeleton height={60} borderRadius={12} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySub}>No notifications yet.</Text>
            </View>
          }
          renderItem={({ item: n }) => (
            <TouchableOpacity
              style={[styles.card, !n.readAt && styles.cardUnread]}
              onPress={() => { if (!n.readAt) markReadMut.mutate(n.id); }}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrap, { backgroundColor: (TYPE_COLORS[n.type] ?? '#6b7280') + '20' }]}>
                <Ionicons
                  name={TYPE_ICONS[n.type] ?? 'notifications'}
                  size={20}
                  color={TYPE_COLORS[n.type] ?? '#6b7280'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifTitle} numberOfLines={1}>{n.title}</Text>
                <Text style={styles.notifBody} numberOfLines={2}>{n.body}</Text>
                <Text style={styles.notifTime}>{formatTimeAgo(n.createdAt)}</Text>
              </View>
              {!n.readAt && <View style={styles.dot} />}
              <TouchableOpacity onPress={() => deleteMut.mutate(n.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={16} color={COLORS.gray[300]} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.gray[50] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.gray[900] },
  unread: { fontSize: 12, color: COLORS.brand[600], marginTop: 2 },
  markAllBtn: { marginTop: 4 },
  markAllText: { fontSize: 13, color: COLORS.brand[600], fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.gray[100],
  },
  cardUnread: { borderColor: COLORS.brand[100], backgroundColor: '#eff6ff' },
  iconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifTitle: { fontSize: 14, fontWeight: '700', color: COLORS.gray[900] },
  notifBody: { fontSize: 13, color: COLORS.gray[600], marginTop: 2, lineHeight: 18 },
  notifTime: { fontSize: 11, color: COLORS.gray[400], marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.brand[600], marginTop: 4 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.gray[700] },
  emptySub: { fontSize: 14, color: COLORS.gray[400], marginTop: 4 },
});
