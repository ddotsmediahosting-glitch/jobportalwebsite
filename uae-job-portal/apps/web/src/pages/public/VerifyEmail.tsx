import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { Button } from '../../components/ui/Button';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Missing verification token.'); return; }
    api.post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch((err) => { setStatus('error'); setMessage(getApiError(err)); });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-brand-500 mx-auto" />
            <h1 className="text-xl font-semibold text-gray-900">Verifying your email…</h1>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Email verified!</h1>
            <p className="text-gray-500">Your account is now active. You can sign in.</p>
            <Link to="/login">
              <Button>Go to Login</Button>
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Verification failed</h1>
            <p className="text-gray-500">{message || 'This link may have expired or already been used.'}</p>
            <Link to="/login" className="text-brand-600 hover:underline text-sm">Back to login</Link>
          </>
        )}
      </div>
    </div>
  );
}
