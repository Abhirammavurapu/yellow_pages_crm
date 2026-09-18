import React from 'react';

export default function StatCard({ title, value, icon: Icon, change, subtext, color = 'amber' }) {
  const colorMap = {
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-200'
  };

  const badgeStyle = colorMap[color] || colorMap.amber;

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {Icon && (
          <div className={`p-2.5 rounded-lg border ${badgeStyle}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        {change && (
          <span className="text-xs font-semibold text-emerald-600">{change}</span>
        )}
      </div>
      {subtext && (
        <p className="mt-1 text-xs text-slate-500 truncate">{subtext}</p>
      )}
    </div>
  );
}
