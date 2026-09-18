import React from 'react';

const STATUS_STYLES = {
  NEW: 'bg-sky-50 text-sky-700 border-sky-200',
  INTERESTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  READY_FOR_PAYMENT: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold',
  PAYMENT_COMPLETED: 'bg-teal-50 text-teal-800 border-teal-300 font-semibold',
  ENROLLED: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold',
  FOLLOW_UP_REQUIRED: 'bg-blue-50 text-blue-700 border-blue-200',
  CALL_ME_LATER: 'bg-purple-50 text-purple-700 border-purple-200',
  CALLBACK: 'bg-purple-50 text-purple-700 border-purple-200',
  NOT_INTERESTED: 'bg-rose-50 text-rose-700 border-rose-200',
  PHONE_NOT_LIFTED: 'bg-slate-100 text-slate-700 border-slate-200',
  BUSY: 'bg-orange-50 text-orange-700 border-orange-200',
  SWITCHED_OFF: 'bg-gray-100 text-gray-700 border-gray-200',
  WRONG_NUMBER: 'bg-red-50 text-red-700 border-red-200',
  INVALID_NUMBER: 'bg-red-50 text-red-700 border-red-200',
  CLOSED: 'bg-slate-200 text-slate-800 border-slate-300',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ON_LEAVE: 'bg-amber-50 text-amber-700 border-amber-200',
  RESIGNED: 'bg-slate-100 text-slate-600 border-slate-300',
  DEACTIVATED: 'bg-rose-50 text-rose-700 border-rose-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200'
};

export default function StatusBadge({ status, className = '' }) {
  if (!status) return null;
  const style = STATUS_STYLES[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  const label = status.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {label}
    </span>
  );
}
