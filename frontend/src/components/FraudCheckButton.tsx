import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, ShieldX, Loader2 } from 'lucide-react';
import { api, getApiError } from '../lib/api';
import toast from 'react-hot-toast';

interface FraudResult {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  flags: string[];
  explanation: string;
  recommendation: 'APPROVE' | 'REVIEW' | 'REJECT';
  isLikelyFraud: boolean;
}

interface Props {
  jobId: string;
  existingRiskLevel?: string | null;
  /** Compact mode: shows only the trigger button + risk badge; no inline details panel */
  compact?: boolean;
}

function RiskBadge({ level }: { level: string }) {
  const config: Record<string, { icon: React.ReactNode; className: string }> = {
    LOW: { icon: <ShieldCheck size={14} />, className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    MEDIUM: { icon: <Shield size={14} />, className: 'bg-amber-100 text-amber-700 border-amber-200' },
    HIGH: { icon: <ShieldAlert size={14} />, className: 'bg-red-100 text-red-700 border-red-200' },
    CRITICAL: { icon: <ShieldX size={14} />, className: 'bg-red-200 text-red-900 border-red-300' },
  };

  const { icon, className } = config[level] || config.LOW;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${className}`}>
      {icon} {level}
    </span>
  );
}

export function FraudCheckButton({ jobId, existingRiskLevel, compact = false }: Props) {
  const [result, setResult] = useState<FraudResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const runCheck = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/ai/fraud-check/${jobId}`);
      setResult(res.data.data);
      setShowDetails(true);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const displayLevel = result?.riskLevel || existingRiskLevel;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {displayLevel && <RiskBadge level={displayLevel} />}
        <button
          onClick={runCheck}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Shield size={12} />}
          {loading ? 'Checking...' : 'AI Fraud Check'}
        </button>
      </div>

      {!compact && showDetails && result && (
        <div className={`rounded-xl border p-3 text-xs space-y-2 ${
          result.isLikelyFraud ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-800">Risk Score: {result.riskScore}/100</span>
            <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${
              result.recommendation === 'APPROVE' ? 'bg-emerald-200 text-emerald-800' :
              result.recommendation === 'REVIEW' ? 'bg-amber-200 text-amber-800' :
              'bg-red-200 text-red-800'
            }`}>
              {result.recommendation}
            </span>
          </div>
          <p className="text-gray-600">{result.explanation}</p>
          {result.flags.length > 0 && (
            <div>
              <p className="font-semibold text-red-700 mb-1">Flags:</p>
              <ul className="space-y-0.5">
                {result.flags.map((f, i) => (
                  <li key={i} className="text-red-600 flex items-start gap-1">
                    <span className="mt-0.5">&bull;</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600 text-xs">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
