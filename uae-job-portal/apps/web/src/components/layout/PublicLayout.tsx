import React, { useState } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { Menu, X, Bell, User, ChevronDown, LogOut, Briefcase, BookmarkCheck, FileText } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function PublicLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-brand-600 text-white p-1.5 rounded-lg">
                <Briefcase className="h-5 w-5" />
              </div>
              <span className="font-bold text-gray-900">UAE<span className="text-brand-600">Jobs</span></span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <Link to="/jobs" className="hover:text-brand-600 transition-colors">Browse Jobs</Link>
              <Link to="/categories" className="hover:text-brand-600 transition-colors">Categories</Link>
              <Link to="/pages/about" className="hover:text-brand-600 transition-colors">About</Link>
            </nav>

            {/* Auth */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-brand-600" />
                    </div>
                    {user.email.split('@')[0]}
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 animate-fade-in">
                      {user.role === 'SEEKER' && (
                        <>
                          <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <User className="h-4 w-4" /> My Profile
                          </Link>
                          <Link to="/applications" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <FileText className="h-4 w-4" /> Applications
                          </Link>
                          <Link to="/saved-jobs" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <BookmarkCheck className="h-4 w-4" /> Saved Jobs
                          </Link>
                        </>
                      )}
                      {user.role === 'EMPLOYER' && (
                        <Link to="/employer" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <Briefcase className="h-4 w-4" /> Employer Dashboard
                        </Link>
                      )}
                      {(user.role === 'ADMIN' || user.role === 'SUB_ADMIN') && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          Admin Panel
                        </Link>
                      )}
                      <hr className="my-1" />
                      <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full">
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-brand-600">Sign In</Link>
                  <Link to="/register" className="text-sm font-medium bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors">
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2 animate-fade-in">
            <Link to="/jobs" className="block py-2 text-sm text-gray-700">Browse Jobs</Link>
            <Link to="/categories" className="block py-2 text-sm text-gray-700">Categories</Link>
            {!user && (
              <>
                <Link to="/login" className="block py-2 text-sm text-gray-700">Sign In</Link>
                <Link to="/register" className="block py-2 text-sm font-medium text-brand-600">Get Started</Link>
              </>
            )}
            {user && (
              <>
                {user.role === 'SEEKER' && <Link to="/profile" className="block py-2 text-sm text-gray-700">My Profile</Link>}
                {user.role === 'EMPLOYER' && <Link to="/employer" className="block py-2 text-sm text-gray-700">Dashboard</Link>}
                <button onClick={handleLogout} className="block py-2 text-sm text-red-600 w-full text-left">Sign Out</button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Main */}
      <main><Outlet /></main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-3">
                <div className="bg-brand-600 text-white p-1.5 rounded-lg">
                  <Briefcase className="h-5 w-5" />
                </div>
                <span className="font-bold text-white">UAE<span className="text-brand-400">Jobs</span></span>
              </Link>
              <p className="text-sm">The leading job portal for UAE opportunities across all seven Emirates.</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3 text-sm">Job Seekers</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/jobs" className="hover:text-white transition-colors">Browse Jobs</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Create Account</Link></li>
                <li><Link to="/profile" className="hover:text-white transition-colors">Upload Resume</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3 text-sm">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/pages/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="/pages/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/pages/terms" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link to="/pages/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-xs">
            © {new Date().getFullYear()} UAE Jobs Portal. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
