import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, Users, CreditCard, BarChart2, Building2, LogOut, Menu, X, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const nav = [
  { to: '/employer', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/employer/jobs', label: 'Manage Jobs', icon: Briefcase },
  { to: '/employer/applications', label: 'Applications', icon: Users },
  { to: '/employer/profile', label: 'Company Profile', icon: Building2 },
  { to: '/employer/team', label: 'Team', icon: Users },
  { to: '/employer/billing', label: 'Billing', icon: CreditCard },
];

export function EmployerLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const Sidebar = () => (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-5 border-b border-gray-100">
        <Link to="/" className="flex items-center gap-2 mb-1">
          <div className="bg-brand-600 text-white p-1 rounded-lg">
            <Briefcase className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm">UAE<span className="text-brand-600">Jobs</span></span>
        </Link>
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Employer Portal</span>
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
                active ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
              {active && <ChevronRight className="h-3 w-3 ml-auto text-brand-400" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2 px-3 py-2 mb-1">
          <div className="h-7 w-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700">
            {user?.email[0].toUpperCase()}
          </div>
          <span className="text-xs text-gray-700 truncate">{user?.email}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 animate-slide-up">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-900">Employer Portal</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
