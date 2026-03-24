import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Menu, X, User, ChevronDown, LogOut, BookmarkCheck, FileText,
  Zap, Wand2, Bot, Building2, Bell, Mic, Briefcase,
  Search, MapPin, LayoutList, Home,
  Linkedin, Twitter, Facebook, Instagram, Youtube,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';

const WHATSAPP_SVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.524 5.845L.057 23.5l5.784-1.516A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.927a9.905 9.905 0 01-5.058-1.38l-.361-.214-3.754.984.999-3.647-.235-.374A9.86 9.86 0 012.073 12C2.073 6.513 6.513 2.073 12 2.073c5.488 0 9.927 4.44 9.927 9.927 0 5.488-4.44 9.927-9.927 9.927z"/>
  </svg>
);

export function PublicLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Single public endpoint — includes social links + announcement banner.
  // Must NOT use /admin/settings (requires auth → causes 401 redirect loop for guests).
  const { data: allSettings } = useQuery<Record<string, string>>({
    queryKey: ['site-settings-public'],
    queryFn: () => api.get('/seo/site-settings').then((r) => r.data.data),
    staleTime: 5 * 60_000,
  });

  // Keep socialSettings as alias so footer social links still work
  const socialSettings = allSettings;

  const announcement = {
    active: allSettings?.['announcement_active'] === 'true',
    text: allSettings?.['announcement_text'] || '',
    type: allSettings?.['announcement_type'] || 'info',
    link: allSettings?.['announcement_link'] || '',
    linkLabel: allSettings?.['announcement_link_label'] || '',
  };

  const announcementColors: Record<string, string> = {
    info:    'bg-brand-600 text-white',
    success: 'bg-green-600 text-white',
    warning: 'bg-amber-500 text-white',
    error:   'bg-red-600 text-white',
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const NavLink = ({ to, children, className = '' }: { to: string; children: React.ReactNode; className?: string }) => (
    <Link
      to={to}
      className={`relative text-sm font-medium transition-colors duration-150 ${
        isActive(to) ? 'text-brand-600' : 'text-gray-600 hover:text-brand-600'
      } ${className}`}
    >
      {children}
      {isActive(to) && (
        <span className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-brand-500 rounded-t-full" />
      )}
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Announcement banner */}
      {announcement.active && announcement.text && (
        <div className={`${announcementColors[announcement.type] ?? announcementColors.info} text-sm py-2 px-4 text-center flex items-center justify-center gap-3`}>
          <span>{announcement.text}</span>
          {announcement.link && announcement.linkLabel && (
            <Link to={announcement.link} className="underline font-semibold whitespace-nowrap">
              {announcement.linkLabel} →
            </Link>
          )}
        </div>
      )}
      {/* Header */}
      <header
        className={`sticky top-0 z-40 transition-all duration-200 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-soft border-b border-gray-100'
            : 'bg-white border-b border-gray-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Left — Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow-brand">
                <span className="text-white font-black text-sm">D</span>
              </div>
              <span className="font-bold text-gray-900 text-[15px]">
                DdotsMedia<span className="text-brand-600">Jobs</span>
              </span>
            </Link>

            {/* Center — Desktop nav */}
            <nav className="hidden lg:flex items-center h-16">
              {[
                { to: '/', label: 'Home' },
                { to: '/jobs', label: 'Browse Jobs' },
                { to: '/companies', label: 'Companies' },
                { to: '/career-services', label: 'Career Services' },
                { to: '/contact', label: 'Contact' },
              ].map(({ to, label }, i, arr) => (
                <React.Fragment key={to}>
                  <NavLink to={to}>{label}</NavLink>
                  {i < arr.length - 1 && (
                    <span className="text-gray-300 mx-4 select-none">|</span>
                  )}
                </React.Fragment>
              ))}
            </nav>

            {/* Right — Post a Job + Auth */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/post-job"
                className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
              >
                <Briefcase size={13} /> Post a Job
              </Link>

              {user ? (
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50 text-sm font-medium text-gray-700 transition-all duration-150"
                  >
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="max-w-[100px] truncate">{user.email.split('@')[0]}</span>
                    <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-card-hover py-2 animate-slide-down z-50">
                      {/* User info */}
                      <div className="px-4 py-2 mb-1 border-b border-gray-50">
                        <p className="text-xs font-semibold text-gray-900 truncate">{user.email.split('@')[0]}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>

                      {user.role === 'SEEKER' && (
                        <>
                          <Link to="/seeker-dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-600 transition-colors">
                            <Home className="h-3.5 w-3.5 text-gray-400" /> Dashboard
                          </Link>
                          <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-600 transition-colors">
                            <User className="h-3.5 w-3.5 text-gray-400" /> My Profile
                          </Link>
                          <Link to="/my-applications" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-600 transition-colors">
                            <FileText className="h-3.5 w-3.5 text-gray-400" /> Applications
                          </Link>
                          <Link to="/application-tracker" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-600 transition-colors">
                            <LayoutList className="h-3.5 w-3.5 text-gray-400" /> Application Tracker
                          </Link>
                          <Link to="/saved-jobs" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-600 transition-colors">
                            <BookmarkCheck className="h-3.5 w-3.5 text-gray-400" /> Saved Jobs
                          </Link>
                          <Link to="/job-alerts" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-600 transition-colors">
                            <Bell className="h-3.5 w-3.5 text-gray-400" /> Job Alerts
                          </Link>
                          <div className="my-1 mx-3 border-t border-gray-100" />
                          <p className="px-4 pt-1 pb-0.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Post a Job</p>
                          <Link to="/post-job" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-brand-700 hover:bg-brand-50 transition-colors">
                            <Briefcase className="h-3.5 w-3.5" /> Post a Job
                          </Link>
                          <Link to="/my-posts" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand-600 transition-colors">
                            <LayoutList className="h-3.5 w-3.5 text-gray-400" /> My Posts
                          </Link>
                          <div className="my-1 mx-3 border-t border-gray-100" />
                          <p className="px-4 pt-1 pb-0.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">AI Tools</p>
                          <Link to="/cv-analyzer" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-indigo-700 hover:bg-indigo-50 transition-colors">
                            <Zap className="h-3.5 w-3.5" /> ATS CV Analyzer
                          </Link>
                          <Link to="/cv-builder" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors">
                            <Wand2 className="h-3.5 w-3.5" /> AI CV Builder
                          </Link>
                          <Link to="/career-advisor" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-violet-700 hover:bg-violet-50 transition-colors">
                            <Bot className="h-3.5 w-3.5" /> Career Advisor
                          </Link>
                        </>
                      )}
                      {user.role === 'EMPLOYER' && (
                        <Link to="/employer" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Briefcase className="h-3.5 w-3.5 text-gray-400" /> Employer Dashboard
                        </Link>
                      )}
                      {(user.role === 'ADMIN' || user.role === 'SUB_ADMIN') && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Zap className="h-3.5 w-3.5 text-gray-400" /> Admin Panel
                        </Link>
                      )}
                      <div className="my-1 mx-3 border-t border-gray-100" />
                      <Link to="/notifications" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Bell className="h-3.5 w-3.5 text-gray-400" /> Notifications
                      </Link>
                      <button onClick={handleLogout} className="flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full transition-colors">
                        <LogOut className="h-3.5 w-3.5" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-brand-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-150"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white/98 backdrop-blur-sm px-4 pb-4 pt-2 animate-slide-down shadow-soft">
            <div className="space-y-0.5">
              <MobileNavLink to="/" icon={<Home size={15} />} onClick={() => setMobileOpen(false)}>Home</MobileNavLink>
              <MobileNavLink to="/jobs" icon={<Search size={15} />} onClick={() => setMobileOpen(false)}>Browse Jobs</MobileNavLink>
              <MobileNavLink to="/companies" icon={<Building2 size={15} />} onClick={() => setMobileOpen(false)}>Companies</MobileNavLink>
              <MobileNavLink to="/interview-prep" icon={<Mic size={15} className="text-purple-500" />} onClick={() => setMobileOpen(false)}>Interview Prep</MobileNavLink>
              <Link
                to="/community"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors mt-1"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Community Q&A
              </Link>
              <Link
                to="/whatsapp-groups"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-white bg-[#25D366] hover:bg-[#20bc5a] rounded-xl transition-colors mt-1"
              >
                <span className="text-white">{WHATSAPP_SVG}</span> Join WA Groups
              </Link>
            </div>

            {!user ? (
              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-center py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:border-brand-300 transition-colors">
                  Sign In
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="text-center py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 transition-colors">
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-0.5">
                {user.role === 'SEEKER' && (
                  <>
                    <MobileNavLink to="/seeker-dashboard" icon={<Home size={15} />} onClick={() => setMobileOpen(false)}>Dashboard</MobileNavLink>
                    <MobileNavLink to="/profile" icon={<User size={15} />} onClick={() => setMobileOpen(false)}>My Profile</MobileNavLink>
                    <MobileNavLink to="/my-applications" icon={<FileText size={15} />} onClick={() => setMobileOpen(false)}>Applications</MobileNavLink>
                    <MobileNavLink to="/saved-jobs" icon={<BookmarkCheck size={15} />} onClick={() => setMobileOpen(false)}>Saved Jobs</MobileNavLink>
                  </>
                )}
                {user.role === 'EMPLOYER' && (
                  <MobileNavLink to="/employer" icon={<Briefcase size={15} />} onClick={() => setMobileOpen(false)}>Dashboard</MobileNavLink>
                )}
                {(user.role === 'ADMIN' || user.role === 'SUB_ADMIN') && (
                  <MobileNavLink to="/admin" icon={<Zap size={15} />} onClick={() => setMobileOpen(false)}>Admin Panel</MobileNavLink>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main */}
      <main><Outlet /></main>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 mt-20">
        {/* Top section */}
        <div className="border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
              {/* Brand */}
              <div className="col-span-2 md:col-span-1">
                <Link to="/" className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                    <span className="text-white font-black text-sm">D</span>
                  </div>
                  <span className="font-bold text-white text-[15px]">
                    Ddotsmedia<span className="text-brand-400">Jobs</span>
                  </span>
                </Link>
                <p className="text-sm leading-relaxed text-gray-500 mb-4">
                  The leading job portal for UAE opportunities across all seven Emirates.
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    10,000+ Active Jobs
                  </span>
                </div>
                {/* Social media icons — driven by Admin → Settings → Social Media */}
                <div className="flex items-center gap-2 flex-wrap">
                  {([
                    { key: 'social_linkedin',  icon: <Linkedin size={15} />,  label: 'LinkedIn',  color: 'hover:bg-blue-600 hover:border-blue-600' },
                    { key: 'social_twitter',   icon: <Twitter size={15} />,   label: 'Twitter/X', color: 'hover:bg-sky-500 hover:border-sky-500' },
                    { key: 'social_facebook',  icon: <Facebook size={15} />,  label: 'Facebook',  color: 'hover:bg-blue-700 hover:border-blue-700' },
                    { key: 'social_instagram', icon: <Instagram size={15} />, label: 'Instagram', color: 'hover:bg-pink-600 hover:border-pink-600' },
                    { key: 'social_youtube',   icon: <Youtube size={15} />,   label: 'YouTube',   color: 'hover:bg-red-600 hover:border-red-600' },
                    { key: 'social_whatsapp',  icon: <span className="scale-110">{WHATSAPP_SVG}</span>, label: 'WhatsApp', color: 'hover:bg-green-600 hover:border-green-600' },
                    { key: 'social_tiktok',    icon: <span className="text-xs font-black">TT</span>, label: 'TikTok', color: 'hover:bg-gray-700 hover:border-gray-700' },
                  ] as { key: string; icon: React.ReactNode; label: string; color: string }[])
                    .filter(({ key }) => socialSettings?.[key])
                    .map(({ key, icon, label, color }) => (
                      <a
                        key={key}
                        href={socialSettings![key]}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={label}
                        className={`h-8 w-8 rounded-lg border border-gray-700 bg-gray-900 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-150 ${color}`}
                      >
                        {icon}
                      </a>
                    ))}
                </div>
              </div>

              {/* Job Seekers */}
              <div>
                <h4 className="text-white font-semibold mb-4 text-sm">For Job Seekers</h4>
                <ul className="space-y-2.5 text-sm">
                  {[
                    { to: '/jobs', label: 'Browse Jobs' },
                    { to: '/companies', label: 'Companies' },
                    { to: '/trending', label: 'Trending Jobs' },
                    { to: '/salary-explorer', label: 'Salary Explorer' },
                    { to: '/career-advisor', label: 'Career AI' },
                    { to: '/community', label: 'Community Q&A' },
                    { to: '/whatsapp-groups', label: 'WhatsApp Groups' },
                    { to: '/cv-analyzer', label: 'ATS CV Analyzer' },
                    { to: '/cv-builder', label: 'AI CV Builder' },
                    { to: '/interview-prep', label: 'Interview Prep' },
                  ].map(({ to, label }) => (
                    <li key={to}>
                      <Link to={to} className="hover:text-brand-400 transition-colors duration-150">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Employers */}
              <div>
                <h4 className="text-white font-semibold mb-4 text-sm">For Employers</h4>
                <ul className="space-y-2.5 text-sm">
                  {[
                    { to: '/register', label: 'Post a Job' },
                    { to: '/employer', label: 'Employer Dashboard' },
                    { to: '/pages/pricing', label: 'Pricing' },
                  ].map(({ to, label }) => (
                    <li key={to}>
                      <Link to={to} className="hover:text-brand-400 transition-colors duration-150">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 className="text-white font-semibold mb-4 text-sm">Company</h4>
                <ul className="space-y-2.5 text-sm">
                  {[
                    { to: '/about', label: 'About Us' },
                    { to: '/career-services', label: 'Career Services' },
                    { to: '/contact', label: 'Contact Us' },
                    { to: '/pages/privacy-policy', label: 'Privacy Policy' },
                    { to: '/pages/terms', label: 'Terms of Use' },
                  ].map(({ to, label }) => (
                    <li key={to}>
                      <Link to={to} className="hover:text-brand-400 transition-colors duration-150">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Ddotsmedia Jobs. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <Link to="/pages/privacy-policy" className="hover:text-gray-400 transition-colors">Privacy</Link>
            <Link to="/pages/terms" className="hover:text-gray-400 transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-gray-400 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function MobileNavLink({
  to, icon, children, onClick,
}: { to: string; icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 rounded-xl transition-colors"
    >
      <span className="text-gray-400">{icon}</span>
      {children}
    </Link>
  );
}
