import React from 'react';
import { AlertTriangle, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';

export const PriorityBadge = ({ classification, score }) => {
  const styles = {
    Critical: 'bg-red-50 text-red-700 border-red-200 ring-red-600/10',
    High: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/10',
    Medium: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/10',
    Low: 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-600/10'
  };

  const badgeStyle = styles[classification] || styles.Low;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${badgeStyle}`}>
      {classification === 'Critical' && <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
      <span>{classification}</span>
      {score !== undefined && (
        <span className="text-[10px] opacity-75 font-mono">({score} pts)</span>
      )}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const styles = {
    'Pending': 'bg-orange-50 text-orange-700 border-orange-200',
    'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
    'Solved': 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };

  const icons = {
    'Pending': <Clock className="w-3.5 h-3.5 text-orange-500" />,
    'In Progress': <Clock className="w-3.5 h-3.5 text-blue-500 animate-spin" />,
    'Solved': <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${styles[status] || styles.Pending}`}>
      {icons[status] || icons.Pending}
      <span>{status}</span>
    </span>
  );
};

export const HazardBadge = ({ isSevere }) => {
  if (!isSevere) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-800 border border-red-300">
      <ShieldAlert className="w-3 h-3 text-red-600" />
      Public Hazard
    </span>
  );
};
