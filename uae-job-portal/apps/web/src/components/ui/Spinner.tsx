import React from 'react';
import { Loader2 } from 'lucide-react';

export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const s = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }[size];
  return <Loader2 className={`animate-spin text-brand-600 ${s} ${className}`} />;
}

export function PageSpinner() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
