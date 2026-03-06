import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Briefcase, Eye, EyeOff } from 'lucide-react';
import { loginSchema, LoginInput } from '@uaejobs/shared';
import { useAuth } from '../../hooks/useAuth';
import { getApiError } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="bg-brand-600 text-white p-2 rounded-xl">
              <Briefcase className="h-6 w-6" />
            </div>
            <span className="font-bold text-xl text-gray-900">UAE<span className="text-brand-600">Jobs</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-brand-600 hover:text-brand-700">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-medium hover:text-brand-700">
              Create one
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">Admin? <Link to="/admin" className="text-brand-600">Admin login →</Link></p>
        </div>
      </div>
    </div>
  );
}
