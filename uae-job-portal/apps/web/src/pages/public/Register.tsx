import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Briefcase, User, Building2 } from 'lucide-react';
import { registerSchema, RegisterInput } from '@uaejobs/shared';
import { api, getApiError } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'SEEKER' | 'EMPLOYER'>('SEEKER');
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
      await api.post('/auth/register', { ...data, role });
      setEmailSent(true);
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 mb-6">We sent a 6-digit verification code to your email. Enter it to activate your account.</p>
          <Link to="/login" className="text-brand-600 font-medium hover:text-brand-700">
            Already verified? Sign in →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="bg-brand-600 text-white p-2 rounded-xl">
              <Briefcase className="h-6 w-6" />
            </div>
            <span className="font-bold text-xl">UAE<span className="text-brand-600">Jobs</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {/* Role toggle */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => handleRoleChange('SEEKER')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                role === 'SEEKER' ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <User className={`h-6 w-6 ${role === 'SEEKER' ? 'text-brand-600' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${role === 'SEEKER' ? 'text-brand-700' : 'text-gray-600'}`}>
                Job Seeker
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('EMPLOYER')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                role === 'EMPLOYER' ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Building2 className={`h-6 w-6 ${role === 'EMPLOYER' ? 'text-brand-600' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${role === 'EMPLOYER' ? 'text-brand-700' : 'text-gray-600'}`}>
                Employer
              </span>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {role === 'SEEKER' && (
              <div className="grid grid-cols-2 gap-3">
                <Input {...register('firstName')} label="First Name" placeholder="Ahmed" error={errors.firstName?.message} required />
                <Input {...register('lastName')} label="Last Name" placeholder="Al Rashid" error={errors.lastName?.message} required />
              </div>
            )}

            {role === 'EMPLOYER' && (
              <Input {...register('companyName')} label="Company Name" placeholder="ACME Corp" error={errors.companyName?.message} required />
            )}

            <Input {...register('email')} label="Email address" type="email" placeholder="you@example.com" error={errors.email?.message} required autoComplete="email" />

            <Input {...register('password')} label="Password" type="password" placeholder="Min 8 chars, 1 uppercase, 1 number" error={errors.password?.message} required autoComplete="new-password" />

            <Input {...register('confirmPassword')} label="Confirm Password" type="password" placeholder="Repeat password" error={errors.confirmPassword?.message} required />

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:text-brand-700">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
