import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Users, Building2, Briefcase, Tag, Flag, ScrollText,
  Settings, LogOut, Menu, Shield, BarChart3, CreditCard, X, ChevronRight,
  Bell, RefreshCw, Share2, MessageCircle, BookOpen,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';

const nav = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, badgeKey: '' },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3, badgeKey: '' },
  { to: '/admin/users', label: 'Users', icon: Users, badgeKey: '' },
  { to: '/admin/employers', label: 'Employers', icon: Building2, badgeKey: 'pendingVerifications' },
  { to: '/admin/jobs', label: 'Jobs', icon: Briefcase, badgeKey: 'pendingJobs' },
  { to: '/admin/categories', label: 'Categories', icon: Tag, badgeKey: '' },
  { to: '/admin/reports', label: 'Reports', icon: Flag, badgeKey: 'pendingReports' },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard, badgeKey: '' },
  { to: '/admin/marketing', label: 'Marketing & SEO', icon: Share2, badgeKey: '' },
  { to: '/admin/whatsapp-bot', label: 'WhatsApp Bot', icon: MessageCircle, badgeKey: '' },
  { to: '/admin/whatsapp-links', label: 'WA Groups Page', icon: Share2, badgeKey: '' },
  { to: '/admin/community', label: 'Community Q&A', icon: MessageCircle, badgeKey: 'pendingDiscussions' },
  { to: '/admin/blog', label: 'Blog Manager', icon: BookOpen, badgeKey: '' },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText, badgeKey: '' },
  { to: '/admin/settings', label: 'Settings', icon: Settings, badgeKey: '' },
];

function useBreadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.replace(/^\/admin\/?/, '').split('/').filter(Boolean);
  const crumbs: { label: string; to?: string }[] = [{ label: 'Admin', to: '/admin/dashboard' }];
  let path = '/admin';
  for (const seg of segments) {
    path += `/${seg}`;
    const item = nav.find((n) => n.to === path);
    crumbs.push({ label: item?.label ?? seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '), to: path });
  }
  return crumbs;
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const breadcrumbs = useBreadcrumbs();

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data.data),
    refetchInterval: 60000,
  });

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const pendingJobs = stats?.pendingJobs ?? 0;
  const pendingVerifs = stats?.pendingVerifications ?? 0;
  const pendingReports = stats?.pendingReports ?? 0;
  const pendingDiscussions = stats?.pendingDiscussions ?? 0;
  const totalPending = pendingJobs + pendingVerifs + pendingReports + pendingDiscussions;

  const badges: Record<string, number> = {
    pendingJobs,
    pendingVerifications: pendingVerifs,
    pendingReports,
    pendingDiscussions,
  };

  const SidebarContent = () => (
    <aside className="w-64 bg-[#0f1117] text-white flex flex-col h-full border-r border-white/[0.06]">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between">
        <Link to="/admin/dashboard" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-glow-brand flex-shrink-0">
            <span className="text-white font-black text-sm">D</span>
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight">Ddotsmedia Jobs</div>
            <div className="text-[10px] text-gray-500 font-medium tracking-wide uppercase">Admin Console</div>
          </div>
        </Link>
        <button className="md:hidden text-gray-500 hover:text-white p-1 rounded" onClick={() => setSidebarOpen(false)}>
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Role badge */}
      <div className="px-4 pb-3">
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide ${
          user?.role === 'ADMIN'
            ? 'bg-red-500/15 text-red-400 border border-red-500/20'
            : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
        }`}>
          <Shield className="h-3 w-3" />
          {user?.role === 'ADMIN' ? 'SUPER ADMIN' : 'SUB ADMIN'}
        </span>
      </div>

      <div className="mx-4 mb-3 border-t border-white/[0.06]" />

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-2">
        {nav.map(({ to, label, icon: Icon, badgeKey }) => {
          const active = location.pathname === to || (to !== '/admin/dashboard' && location.pathname.startsWith(to));
          const badgeCount = badgeKey ? (badges[badgeKey] ?? 0) : 0;
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-brand-600/90 text-white shadow-glow-brand'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              <Icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-white' : ''}`} />
              <span className="flex-1">{label}</span>
              {badgeCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center leading-tight ${
                  active ? 'bg-white/25 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2.5 px-2 py-2 mb-1 rounded-xl bg-white/[0.03]">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-200 truncate">{user?.email?.split('@')[0]}</div>
            <div className="text-[10px] text-gray-500 truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 w-full rounded-xl text-sm text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 flex-shrink-0">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header bar */}
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 h-14 flex items-center gap-4 flex-shrink-0 shadow-sm">
          {/* Mobile menu button */}
          <button
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-sm flex-1 min-w-0">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />}
                {crumb.to && i < breadcrumbs.length - 1 ? (
                  <Link to={crumb.to} className="text-gray-400 hover:text-gray-600 transition-colors truncate text-xs">{crumb.label}</Link>
                ) : (
                  <span className="text-gray-900 font-semibold truncate text-sm">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => refetchStats()}
              className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-all"
              title="Refresh stats"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            {/* Pending actions bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
              >
                <Bell className="h-4 w-4" />
                {totalPending > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {totalPending > 9 ? '9+' : totalPending}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-11 z-30 bg-white border border-gray-100 rounded-2xl shadow-card-hover w-72 animate-slide-down">
                  <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Pending Actions</p>
                    {totalPending > 0 && (
                      <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{totalPending} total</span>
                    )}
                  </div>
                  <div className="py-1">
                    {pendingJobs > 0 && (
                      <Link to="/admin/jobs?status=PENDING_APPROVAL" onClick={() => setNotifOpen(false)} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors">
                        <span className="text-gray-700 text-xs">{pendingJobs} job{pendingJobs > 1 ? 's' : ''} awaiting approval</span>
                        <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold">{pendingJobs}</span>
                      </Link>
                    )}
                    {pendingVerifs > 0 && (
                      <Link to="/admin/employers?verificationStatus=PENDING" onClick={() => setNotifOpen(false)} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors">
                        <span className="text-gray-700 text-xs">{pendingVerifs} employer{pendingVerifs > 1 ? 's' : ''} to verify</span>
                        <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold">{pendingVerifs}</span>
                      </Link>
                    )}
                    {pendingReports > 0 && (
                      <Link to="/admin/reports?status=PENDING" onClick={() => setNotifOpen(false)} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors">
                        <span className="text-gray-700 text-xs">{pendingReports} open report{pendingReports > 1 ? 's' : ''}</span>
                        <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold">{pendingReports}</span>
                      </Link>
                    )}
                    {totalPending === 0 && (
                      <div className="px-4 py-6 text-center">
                        <div className="text-2xl mb-1">✅</div>
                        <p className="text-sm text-gray-400">All clear! No pending actions.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-brand-600 border border-gray-200 hover:border-brand-300 rounded-lg px-3 py-1.5 ml-1 transition-all"
            >
              View Site ↗
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50/80 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
