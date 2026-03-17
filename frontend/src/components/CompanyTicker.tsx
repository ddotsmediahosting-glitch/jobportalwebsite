import React from 'react';

// Well-known UAE employers — text-based logos rendered with brand colours
const COMPANIES = [
  { name: 'ADNOC', color: '#00853e' },
  { name: 'Emirates NBD', color: '#d4a017' },
  { name: 'Etisalat (e&)', color: '#6d2077' },
  { name: 'Dubai Holding', color: '#0047ba' },
  { name: 'Mubadala', color: '#003087' },
  { name: 'DP World', color: '#e05206' },
  { name: 'DEWA', color: '#007749' },
  { name: 'Abu Dhabi ADQ', color: '#1a1a2e' },
  { name: 'FAB Bank', color: '#005f6e' },
  { name: 'Majid Al Futtaim', color: '#c8102e' },
  { name: 'Aldar Properties', color: '#0097b2' },
  { name: 'Emaar', color: '#e31837' },
];

// Duplicate for seamless loop
const DOUBLED = [...COMPANIES, ...COMPANIES];

export function CompanyTicker() {
  return (
    <div className="bg-white border-y border-gray-100 py-4 overflow-hidden">
      <p className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
        Trusted by professionals from
      </p>
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        {/* Scrolling strip */}
        <div
          className="flex gap-8 items-center animate-ticker whitespace-nowrap"
          style={{ width: 'max-content' }}
        >
          {DOUBLED.map((company, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-100 bg-gray-50/60 flex-shrink-0"
            >
              {/* Colour dot as logo substitute */}
              <span
                className="h-5 w-5 rounded-md flex-shrink-0"
                style={{ backgroundColor: company.color }}
              />
              <span className="text-xs font-semibold text-gray-700">{company.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
