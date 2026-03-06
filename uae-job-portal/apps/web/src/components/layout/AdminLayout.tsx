import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, Briefcase, Tag, Flag, ScrollText, Settings, LogOut, Menu, Shield, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/employers', label: 'Employers', icon: Building2 },
  { to: '/admin/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/admin/categories', label: 'Categories', icon: Tag },
  { to: '/admin/reports', label: 'Reports', icon: Flag },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const Sidebar = () => (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-full">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="bg-brand-600 p-1.5 rounded-lg">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-bold">UAE Jobs</div>
            <div className="text-xs text-gray-400">Admin Panel</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-800">
        <div className="px-3 py-2 text-xs text-gray-400 mb-1 truncate">{user?.email}</div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden bg-gray-900 text-white px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-semibold">Admin Panel</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
