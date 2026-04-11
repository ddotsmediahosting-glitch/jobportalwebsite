import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { PageSpinner } from '../../components/ui/Spinner';

export function ShortRedirect() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!shortCode) { navigate('/', { replace: true }); return; }
    api
      .get(`/jobs/short/${shortCode}`)
      .then((r) => navigate(`/job/${r.data.data.slug}`, { replace: true }))
      .catch(() => navigate('/', { replace: true }));
  }, [shortCode, navigate]);

  return <PageSpinner />;
}
