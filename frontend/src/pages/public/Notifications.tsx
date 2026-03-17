import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Bell, Check, CheckCheck, Trash2,
  Briefcase, User, FileText, AlertCircle, Info, Star
} from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/Pagination';
import { EmptyState } from '../../components/ui/EmptyState';

interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string;
  readAt?: string | null;
  createdAt: string;
  payloadJson?: Record<string, unknown>;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  APPLICATION_STATUS: <Briefcase size={16} className="text-brand-600" />,
  JOB_MATCH: <Star size={16} className="text-yellow-500" />,
  PROFILE_VIEW: <User size={16} className="text-purple-500" />,
  JOB_ALERT: <Bell size={16} className="text-green-500" />,
  DOCUMENT: <FileText size={16} className="text-blue-500" />,
  SYSTEM: <Info size={16} className="text-gray-400" />,
  WARNING: <AlertCircle size={16} className="text-orange-500" />,
};

const TYPE_BG: Record<string, string> = {
  APPLICATION_STATUS: 'bg-brand-50',
  JOB_MATCH: 'bg-yellow-50',
  PROFILE_VIEW: 'bg-purple-50',
  JOB_ALERT: 'bg-green-50',
  DOCUMENT: 'bg-blue-50',
  SYSTEM: 'bg-gray-50',
  WARNING: 'bg-orange-50',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-4">
          <div className="skeleton w-9 h-9 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="skeleton h-4 rounded w-3/4" />
            <div className="skeleton h-3 rounded w-1/2" />
            <div className="skeleton h-3 rounded w-1/4 mt-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isRead = !!notification.readAt;
  const icon = TYPE_ICON[notification.type] || TYPE_ICON.SYSTEM;
  const bg = TYPE_BG[notification.type] || TYPE_BG.SYSTEM;

  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${isRead ? 'bg-white border-gray-100' : 'bg-blue-50/50 border-blue-100 shadow-sm'}`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={`text-sm ${isRead ? 'text-gray-700 font-normal' : 'text-gray-900 font-semibold'}`}>
              {notification.title}
            </p>
            {notification.body && (
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notification.body}</p>
            )}
          </div>
          {!isRead && (
            <span className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0 mt-1.5" />
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">{timeAgo(notification.createdAt)}</span>
          <div className="flex items-center gap-1">
            {!isRead && (
              <button
                onClick={() => onMarkRead(notification.id)}
                className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-white rounded-lg transition-colors"
                title="Mark as read"
              >
                <Check size={13} />
              </button>
            )}
            <button
              onClick={() => onDelete(notification.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () => api.get(`/notifications?page=${page}&limit=20`).then((r) => r.data.data),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (err) => toast.error(getApiError(err)),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read.');
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (err) => toast.error(getApiError(err)),
  });

  const notifications: Notification[] = data?.items || [];
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="h-6 w-6 text-brand-600" /> Notifications
              {unreadCount > 0 && (
                <span className="ml-1 text-xs bg-brand-600 text-white px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="text-gray-500 text-sm mt-1">Stay updated on your job applications and activity.</p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              loading={markAllReadMutation.isPending}
              icon={<CheckCheck size={14} />}
            >
              Mark all read
            </Button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <NotificationsSkeleton />
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200">
            <EmptyState
              illustration="messages"
              title="No notifications yet"
              description="You'll see job alerts and application updates here."
            />
          </div>
        ) : (
          <>
            {/* Unread section */}
            {unreadCount > 0 && (
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">New</h2>
                <div className="space-y-2">
                  {notifications
                    .filter((n) => !n.readAt)
                    .map((n) => (
                      <NotificationItem
                        key={n.id}
                        notification={n}
                        onMarkRead={(id) => markReadMutation.mutate(id)}
                        onDelete={(id) => deleteMutation.mutate(id)}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Read section */}
            {notifications.some((n) => !!n.readAt) && (
              <div>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Earlier</h2>
                <div className="space-y-2">
                  {notifications
                    .filter((n) => !!n.readAt)
                    .map((n) => (
                      <NotificationItem
                        key={n.id}
                        notification={n}
                        onMarkRead={(id) => markReadMutation.mutate(id)}
                        onDelete={(id) => deleteMutation.mutate(id)}
                      />
                    ))}
                </div>
              </div>
            )}

            <Pagination
              page={page}
              totalPages={data?.totalPages}
              total={data?.total}
              limit={20}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
