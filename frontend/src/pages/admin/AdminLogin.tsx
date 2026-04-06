import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getApiError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter your email and password');
      return;
    }
    setLoading(true);
    try {
      const userData = await login(email.trim(), password);
      if (userData.role !== 'ADMIN' && userData.role !== 'SUB_ADMIN') {
        toast.error('Access denied. This login is for administrators only.');
        return;
      }
      toast.success('Welcome, Admin!');
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Admin Portal</h1>
          <p className="text-gray-400 text-sm mt-1">Ddotsmedia Jobs — Staff Access Only</p>
        </div>

        <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Admin Email"
              type="email"
              placeholder="admin@ddotsmedia.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-[30px] text-gray-400 hover:text-gray-200 p-1"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Sign In to Admin Panel
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-700 text-center">
            <a
              href="/login"
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Not an admin? Go to regular login →
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Unauthorized access is prohibited and monitored.
        </p>
      </div>
    </div>
  );
}
