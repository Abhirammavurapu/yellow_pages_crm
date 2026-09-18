import React from 'react';

const PRIORITY_STYLES = {
  LOW: 'text-slate-600 bg-slate-100',
  MEDIUM: 'text-blue-700 bg-blue-50 border border-blue-200',
  HIGH: 'text-amber-700 bg-amber-50 border border-amber-200 font-medium',
  URGENT: 'text-red-700 bg-red-50 border border-red-200 font-semibold animate-pulse'
};

export default function PriorityBadge({ priority = 'MEDIUM' }) {
  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.MEDIUM;
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs uppercase tracking-wider ${style}`}>
      {priority}
    </span>
  );
}
