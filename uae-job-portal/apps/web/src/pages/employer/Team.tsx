import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { UserPlus, Trash2, Crown, Shield, Eye } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api, getApiError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { PageSpinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';

const ROLES = [
  { value: 'ADMIN', label: 'Admin', icon: Crown, desc: 'Full access including billing and team management' },
  { value: 'RECRUITER', label: 'Recruiter', icon: Shield, desc: 'Post jobs, manage applications, view analytics' },
  { value: 'VIEWER', label: 'Viewer', icon: Eye, desc: 'Read-only access to jobs and applications' },
];

const inviteSchema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['ADMIN', 'RECRUITER', 'VIEWER']),
});
type InviteInput = z.infer<typeof inviteSchema>;

type BadgeColor = 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple' | 'orange';
const roleColor: Record<string, BadgeColor> = {
  ADMIN: 'red',
  RECRUITER: 'green',
  VIEWER: 'gray',
};

export function Team() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: members, isLoading } = useQuery({
    queryKey: ['employer-team'],
    queryFn: () => api.get('/employer/team').then((r) => r.data.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'RECRUITER' },
  });

  const inviteMutation = useMutation({
    mutationFn: (data: InviteInput) => api.post('/employer/team/invite', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employer-team'] });
      toast.success('Invitation sent!');
      setInviteOpen(false);
      reset();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => api.delete(`/employer/team/${memberId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employer-team'] }); toast.success('Member removed.'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      api.patch(`/employer/team/${memberId}/role`, { role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employer-team'] }); toast.success('Role updated.'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-500 mt-1">Manage who has access to your employer account.</p>
        </div>
        <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setInviteOpen(true)}>
          Invite Member
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {ROLES.map(({ value, label, icon: Icon, desc }) => (
          <div key={value} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-sm text-gray-900">{label}</span>
            </div>
            <p className="text-xs text-gray-400">{desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {!members?.length ? (
          <div className="text-center py-16 text-gray-400">
            <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No team members yet. Invite your first team member.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Member</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">Joined</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((member: { id: string; role: string; createdAt: string; user: { email: string; id: string } }) => {
                const isMe = member.user.id === user?.id;
                return (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 text-xs font-bold">
                          {member.user.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.user.email}</p>
                          {isMe && <span className="text-xs text-gray-400">You</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isMe ? (
                        <Badge color={roleColor[member.role] ?? 'gray'}>{member.role}</Badge>
                      ) : (
                        <select
                          value={member.role}
                          onChange={(e) => updateRoleMutation.mutate({ memberId: member.id, role: e.target.value })}
                          className="text-xs border border-gray-200 rounded px-2 py-1"
                        >
                          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        {!isMe && (
                          <button
                            onClick={() => { if (confirm('Remove this team member?')) removeMutation.mutate(member.id); }}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={inviteOpen} onClose={() => { setInviteOpen(false); reset(); }} title="Invite Team Member">
        <form onSubmit={handleSubmit((d) => inviteMutation.mutate(d))} className="space-y-4">
          <Input {...register('email')} label="Email Address" type="email" placeholder="colleague@company.com" error={errors.email?.message} required />
          <Select {...register('role')} label="Role" options={ROLES.map((r) => ({ value: r.value, label: r.label }))} error={errors.role?.message} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => { setInviteOpen(false); reset(); }}>Cancel</Button>
            <Button type="submit" loading={inviteMutation.isPending} icon={<UserPlus className="h-4 w-4" />}>Send Invite</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
