import React from 'react';

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="animate-pulse space-y-4 py-3">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex items-center gap-4 px-4 py-3 border-b border-slate-100">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className="h-4 bg-slate-200 rounded flex-1"
              style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
            ></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="animate-pulse bg-white p-5 rounded-xl border border-slate-200">
          <div className="h-4 bg-slate-200 rounded w-1/2 mb-3"></div>
          <div className="h-8 bg-slate-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-slate-100 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );
}
