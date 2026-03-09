import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, Users, CreditCard, Building2, LogOut, Menu, X, Share2, Home, ExternalLink,
  BarChart3, Search, Calendar,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const nav = [
  { to: '/employer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/employer/jobs', label: 'Manage Jobs', icon: Briefcase },
  { to: '/employer/applications', label: 'Applications', icon: Users },
  { to: '/employer/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/employer/candidates', label: 'Find Candidates', icon: Search },
  { to: '/employer/interviews', label: 'Interviews', icon: Calendar },
  { to: '/employer/social-marketing', label: 'Social Marketing', icon: Share2 },
  { to: '/employer/company', label: 'Company Profile', icon: Building2 },
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
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col h-full shadow-sm">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-50">
        <Link to="/" className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
            <span className="text-white font-black text-xs">D</span>
          </div>
          <span className="font-bold text-sm text-gray-900">Ddotsmedia<span className="text-brand-600">Jobs</span></span>
        </Link>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-700 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-full tracking-wide uppercase">
          <Briefcase size={9} /> Employer
        </span>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || (to !== '/employer' && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-brand-50 text-brand-700 border border-brand-100'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-brand-600' : 'text-gray-400'}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100">
        {/* Home / View Site button */}
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 w-full rounded-xl text-sm text-gray-500 hover:bg-brand-50 hover:text-brand-700 transition-all duration-150 mb-0.5"
        >
          <Home className="h-3.5 w-3.5" />
          <span className="flex-1">View Site</span>
          <ExternalLink className="h-3 w-3 opacity-50" />
        </Link>

        <div className="flex items-center gap-2.5 px-2 py-2 mb-1 rounded-xl bg-gray-50">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {user?.email[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">{user?.email.split('@')[0]}</p>
            <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 w-full rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
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
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-60 animate-slide-up">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <span className="font-semibold text-gray-900 text-sm flex-1">Employer Portal</span>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-brand-600 border border-gray-200 hover:border-brand-300 rounded-lg px-2.5 py-1.5 transition-all"
          >
            <Home className="h-3.5 w-3.5" /> Home
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
