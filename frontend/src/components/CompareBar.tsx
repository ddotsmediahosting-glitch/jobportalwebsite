import React from 'react';
import { Link } from 'react-router-dom';
import { GitCompare, X } from 'lucide-react';
import { useJobCompare } from '../hooks/useJobCompare';

/**
 * Floating bar that appears at the bottom of the screen when the user has
 * 1+ jobs in their compare list. Click "Compare" to open the side-by-side view.
 */
export function CompareBar() {
  const { items, remove, clear, max } = useJobCompare();

  if (items.length === 0) return null;

  const compareUrl = `/compare?slugs=${items.map((i) => i.slug).join(',')}`;
  const canCompare = items.length >= 2;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-3xl w-[95%]">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2 text-brand-600 flex-shrink-0">
          <GitCompare className="h-5 w-5" />
          <span className="font-semibold text-sm hidden sm:inline">Compare</span>
          <span className="text-xs text-gray-400">({items.length}/{max})</span>
        </div>

        <div className="flex gap-1.5 flex-1 min-w-0 overflow-x-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-1.5 bg-brand-50 border border-brand-100 rounded-lg px-2.5 py-1 text-xs text-brand-700 flex-shrink-0"
            >
              <span className="truncate max-w-[140px]">{item.title}</span>
              <button
                onClick={() => remove(item.id)}
                aria-label={`Remove ${item.title}`}
                className="text-brand-400 hover:text-brand-700"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={clear}
          className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0 hidden sm:block"
        >
          Clear
        </button>

        {canCompare ? (
          <Link
            to={compareUrl}
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-lg flex-shrink-0 transition-colors"
          >
            Compare →
          </Link>
        ) : (
          <span className="text-xs text-gray-400 flex-shrink-0">Add 1 more</span>
        )}
      </div>
    </div>
  );
}
