import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PageSpinner } from '../../components/ui/Spinner';

const ACCESS_KEY = 'uaejobs_access_token';
const REFRESH_KEY = 'uaejobs_refresh_token';

export function SocialCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Tokens come in the URL fragment (hash) for security
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const role = params.get('role');

    // Also check for error from query string (set by backend on failure)
    const errorMsg = searchParams.get('error');
    if (errorMsg) {
      setError(decodeURIComponent(errorMsg));
      return;
    }

    if (!accessToken || !refreshToken) {
      setError('Social login failed. Please try again.');
      return;
    }

    // Store tokens
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);

    // Refresh auth context then redirect
    refreshUser().then(() => {
      if (role === 'ADMIN' || role === 'SUB_ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === 'EMPLOYER') {
        navigate('/employer/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }).catch(() => {
      navigate('/', { replace: true });
    });
  }, [navigate, searchParams, refreshUser]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign-in failed</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return <PageSpinner />;
}
