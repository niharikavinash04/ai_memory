import React from 'react';
import type { KnowledgeStatus, ClassificationType, ProviderType } from '../../api/types';

interface BadgeProps {
  type?: 'status' | 'classification' | 'provider' | 'default';
  value: string | KnowledgeStatus | ClassificationType | ProviderType;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ type = 'default', value, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs font-medium' : 'px-3 py-1 text-sm font-medium';
  const valUpper = value.toUpperCase();

  if (type === 'status') {
    if (valUpper === 'APPROVED') {
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
          Approved
        </span>
      );
    }
    if (valUpper === 'PENDING') {
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 animate-pulse"></span>
          Pending Review
        </span>
      );
    }
    if (valUpper === 'REJECTED') {
      return (
        <span className={`inline-flex items-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5"></span>
          Rejected
        </span>
      );
    }
  }

  if (type === 'classification') {
    let colorClass = 'bg-slate-800 text-slate-300 border-slate-700';
    if (value === 'private') colorClass = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    if (value === 'project-confidential') colorClass = 'bg-rose-500/10 text-rose-300 border-rose-500/20';
    if (value === 'restricted') colorClass = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
    if (value === 'internal') colorClass = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';

    return (
      <span className={`inline-flex items-center rounded-md border ${colorClass} ${sizeClasses}`}>
        {value}
      </span>
    );
  }

  if (type === 'provider') {
    return (
      <span className={`inline-flex items-center rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60 uppercase tracking-wider ${sizeClasses}`}>
        {value}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-md bg-slate-800 text-slate-300 border border-slate-700 ${sizeClasses}`}>
      {value}
    </span>
  );
};
