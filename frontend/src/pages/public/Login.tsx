import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { loginSchema, LoginInput } from '@uaejobs/shared';
import { useAuth } from '../../hooks/useAuth';
import { getApiError } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { SocialLoginButtons, useSocialProviders } from '../../components/SocialLoginButtons';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { any: hasSocialProviders } = useSocialProviders();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      const userData = await login(data.email, data.password);
      toast.success('Welcome back!');
      // Smart redirect based on role
      if (userData.role === 'ADMIN' || userData.role === 'SUB_ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (userData.role === 'EMPLOYER') {
        navigate(from !== '/' ? from : '/employer/dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      const msg = getApiError(err);
      if (msg.includes('verify your email')) {
        toast('Please verify your email first.', { icon: '📧' });
        navigate('/verify-email');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left decorative panel — hidden on small screens */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 bg-gradient-hero text-white p-10 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-60 h-60 bg-brand-300/10 rounded-full blur-3xl" />
        </div>
        <Link to="/" className="relative flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
            <span className="text-white font-black text-sm">D</span>
          </div>
          <span className="font-bold text-white text-[15px]">Ddotsmedia<span className="text-brand-200">Jobs</span></span>
        </Link>

        <div className="relative">
          <h2 className="text-3xl font-extrabold leading-tight mb-4">
            Your next big career move starts here
          </h2>
          <p className="text-brand-200 text-sm leading-relaxed mb-8">
            Access thousands of jobs across the UAE, AI-powered career tools, and personalized job alerts.
          </p>
          <div className="space-y-3">
            {[
              '10,000+ active positions across all Emirates',
              'AI CV analyzer & career advisor',
              'One-click apply & application tracking',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-brand-100">
                <div className="h-5 w-5 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-brand-300">© {new Date().getFullYear()} Ddotsmedia Jobs</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                <span className="text-white font-black text-sm">D</span>
              </div>
              <span className="font-bold text-gray-900">Ddotsmedia<span className="text-brand-600">Jobs</span></span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1">
              Sign in to continue to your account
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-soft p-7">
            {/* Social login */}
            {hasSocialProviders && (
              <>
                <SocialLoginButtons role="SEEKER" label="Sign in" />
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-gray-400">or sign in with email</span>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input
                {...register('email')}
                label="Email address"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                required
                autoComplete="email"
              />

              <div className="relative">
                <Input
                  {...register('password')}
                  label="Password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Your password"
                  error={errors.password?.message}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-[30px] text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="flex justify-end -mt-1">
                <Link to="/forgot-password" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Sign In
              </Button>
            </form>

            <div className="mt-5 text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-600 font-semibold hover:text-brand-700">
                Create one free →
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
