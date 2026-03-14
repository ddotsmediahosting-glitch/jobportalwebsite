import { Link } from 'react-router-dom';
import { SEOHead } from '../../components/SEOHead';

export function NotFound() {
  return (
    <>
      <SEOHead title="Page Not Found" noIndex />
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <div className="max-w-md">
          <p className="text-7xl font-extrabold text-brand-600">404</p>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Page not found</h1>
          <p className="mt-2 text-gray-500">
            Sorry, we couldn&apos;t find the page you were looking for.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
            >
              Go to Homepage
            </Link>
            <Link
              to="/jobs"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Browse Jobs
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
