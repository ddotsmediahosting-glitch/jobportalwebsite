import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';
import { resetPasswordSchema } from '@uaejobs/shared';
import { z } from 'zod';
import { api, getApiError } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

type ResetInput = z.infer<typeof resetPasswordSchema>;

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [done, setDone] = useState(false);
  const token = searchParams.get('token') || '';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const onSubmit = async (data: ResetInput) => {
    try {
      await api.post('/auth/reset-password', data);
      setDone(true);
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-red-600 font-medium">Invalid or missing reset token.</p>
          <Link to="/forgot-password" className="text-brand-600 hover:underline text-sm mt-2 block">Request a new one</Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Password reset!</h1>
          <p className="text-gray-500">Your password has been updated successfully.</p>
          <Link to="/login" className="inline-block bg-brand-600 text-white px-6 py-2 rounded-xl hover:bg-brand-700 transition-colors text-sm font-medium">
            Sign in now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
          <p className="text-gray-500 mt-2">Choose a strong password for your account.</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-gray-200 p-8 space-y-4">
          <input type="hidden" {...register('token')} />
          <Input
            {...register('password')}
            label="New Password"
            type="password"
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            error={errors.password?.message}
            required
          />
          <Input
            {...register('confirmPassword')}
            label="Confirm Password"
            type="password"
            placeholder="Repeat new password"
            error={errors.confirmPassword?.message}
            required
          />
          <Button type="submit" loading={isSubmitting} className="w-full">
            Reset Password
          </Button>
        </form>
      </div>
    </div>
  );
}
