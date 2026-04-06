import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MailCheck, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState(searchParams.get('token') || '');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [autoStatus, setAutoStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');

  // Auto-verify when both token and email are present in URL (clicked from email)
  useEffect(() => {
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');
    if (token && emailParam) {
      setAutoStatus('verifying');
      api.post('/auth/verify-email', { email: emailParam, otp: token })
        .then(() => {
          setAutoStatus('success');
          setTimeout(() => navigate('/login'), 3000);
        })
        .catch(() => {
          setAutoStatus('error');
        });
    }
  }, []);

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
      toast.success('Verification email resent! Check your inbox.');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setResending(false);
    }
  };

  // Auto-verify states (clicked link from email)
  if (autoStatus === 'verifying') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-brand-500 mx-auto" />
          <h1 className="text-xl font-semibold text-gray-900">Verifying your email…</h1>
          <p className="text-gray-400 text-sm">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  if (autoStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md space-y-4">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Email verified!</h1>
          <p className="text-gray-500">Your account is now active. Redirecting to login…</p>
          <Link to="/login">
            <Button>Sign In Now →</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (autoStatus === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md space-y-4">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Link expired or already used</h1>
          <p className="text-gray-500">Request a new verification email below.</p>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 text-left">
            <Input
              label="Your email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button className="w-full" onClick={handleResend} loading={resending}>
              Resend Verification Email
            </Button>
          </div>
          <Link to="/login" className="text-sm text-gray-400 hover:text-gray-600">← Back to login</Link>
        </div>
      </div>
    );
  }

  // Manual entry fallback
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MailCheck className="h-8 w-8 text-brand-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Verify your email</h1>
          <p className="text-gray-500 text-sm mt-2">
            Check your inbox and click the <strong>Verify My Email</strong> button,<br />
            or enter the 6-digit code below manually.
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
              label="6-digit verification code"
              type="text"
              placeholder="123456"
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
            Didn't receive the email?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-brand-600 font-semibold hover:text-brand-700 disabled:opacity-50"
            >
              {resending ? 'Sending…' : 'Resend email'}
            </button>
          </div>

          <div className="text-center text-sm">
            <Link to="/login" className="text-gray-400 hover:text-gray-600">← Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
