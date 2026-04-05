import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { User, Building2 } from 'lucide-react';
import { registerSchema, RegisterInput } from '@uaejobs/shared';
import { api, getApiError } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { SocialLoginButtons, useSocialProviders } from '../../components/SocialLoginButtons';

export function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'SEEKER' | 'EMPLOYER'>('SEEKER');
  const { any: hasSocialProviders } = useSocialProviders();
  const [emailSent, setEmailSent] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'SEEKER' },
  });

  const handleRoleChange = (r: 'SEEKER' | 'EMPLOYER') => {
    setRole(r);
    setValue('role', r);
  };

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { ...data, role });
      if (res.data?.data?.verified) {
        toast.success('Account created! You can now sign in.');
        navigate('/login');
      } else {
        setEmailSent(true);
      }
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account created!</h2>
          <p className="text-gray-500 mb-2">
            We're sending a 6-digit verification code to your email address.
          </p>
          <p className="text-gray-400 text-sm mb-8">
            Emails may take a few minutes. You can sign in right away — we'll remind you to verify later.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-brand-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-brand-700 transition-colors"
            >
              Sign in to your account →
            </Link>
            <Link
              to="/verify-email"
              className="text-sm text-brand-600 font-medium hover:text-brand-700 py-2"
            >
              Enter verification code instead
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-1">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow-brand">
              <span className="text-white font-black">D</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Ddotsmedia<span className="text-brand-600">Jobs</span></span>
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-3">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">Join thousands of professionals in the UAE job market</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-soft">
          {/* Role toggle */}
          <div className="grid grid-cols-2 gap-3 mb-6 p-1 bg-gray-50 rounded-xl mx-7 mt-7">
            {([
              { r: 'SEEKER' as const, icon: User, label: 'Job Seeker', sub: 'Find your next role' },
              { r: 'EMPLOYER' as const, icon: Building2, label: 'Employer', sub: 'Hire top talent' },
            ]).map(({ r, icon: Icon, label, sub }) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleChange(r)}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-150 text-left ${
                  role === r
                    ? 'border-brand-500 bg-white shadow-sm'
                    : 'border-transparent hover:bg-white/60'
                }`}
              >
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                  role === r ? 'bg-gradient-to-br from-brand-400 to-brand-600 shadow-sm' : 'bg-gray-200'
                }`}>
                  <Icon className={`h-4 w-4 ${role === r ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${role === r ? 'text-brand-700' : 'text-gray-700'}`}>{label}</p>
                  <p className="text-[10px] text-gray-400">{sub}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Social signup */}
          {hasSocialProviders && (
            <div className="px-7 pt-7">
              <SocialLoginButtons role={role} label="Sign up" />
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-gray-400">or create account with email</span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit, (errs) => { const msgs = Object.values(errs).map((e: any) => e?.message).filter(Boolean); if (msgs.length) toast.error(String(msgs[0])); })} className="space-y-4 px-7 pb-7" noValidate>
            {role === 'SEEKER' && (
              <div className="grid grid-cols-2 gap-3">
                <Input {...register('firstName')} label="First Name" placeholder="Ahmed" error={errors.firstName?.message} required />
                <Input {...register('lastName')} label="Last Name" placeholder="Al Rashid" error={errors.lastName?.message} required />
              </div>
            )}

            {role === 'EMPLOYER' && (
              <Input {...register('companyName')} label="Company Name" placeholder="ACME Corp LLC" error={errors.companyName?.message} required />
            )}

            <Input {...register('email')} label="Email address" type="email" placeholder="you@company.com" error={errors.email?.message} required autoComplete="email" />
            <Input {...register('password')} label="Password" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" error={errors.password?.message} required autoComplete="new-password" />
            <Input {...register('confirmPassword')} label="Confirm Password" type="password" placeholder="Repeat password" error={errors.confirmPassword?.message} required />

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Create Account →
            </Button>

            <p className="text-[11px] text-center text-gray-400">
              By creating an account you agree to our{' '}
              <Link to="/pages/terms" className="text-brand-600 hover:underline">Terms</Link>
              {' '}and{' '}
              <Link to="/pages/privacy-policy" className="text-brand-600 hover:underline">Privacy Policy</Link>
            </p>
          </form>

          <div className="px-7 pb-7 mt-2 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700">Sign in →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
