import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MailCheck } from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function VerifyEmail() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !otp.trim()) {
      toast.error('Please enter your email and verification code');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/verify-email', { email: email.trim(), otp: otp.trim() });
      toast.success('Email verified! You can now sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address first');
      return;
    }
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email: email.trim() });
      toast.success('Verification code resent! Check your inbox.');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MailCheck className="h-8 w-8 text-brand-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Verify your email</h1>
          <p className="text-gray-500 text-sm mt-2">
            Enter your email and the 6-digit code we sent you.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-soft p-7 space-y-4">
          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label="Verification code"
              type="text"
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              maxLength={6}
            />
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Verify Email
            </Button>
          </form>

          <div className="text-center text-sm text-gray-500 pt-2 border-t border-gray-100">
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-brand-600 font-semibold hover:text-brand-700 disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Resend code'}
            </button>
          </div>

          <div className="text-center text-sm">
            <Link to="/login" className="text-gray-400 hover:text-gray-600">
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
