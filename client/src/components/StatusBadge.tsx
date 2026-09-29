import React from 'react';
import { IncidentStatus } from '../types';

interface StatusBadgeProps {
  status: IncidentStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const styles: Record<IncidentStatus, string> = {
    New: 'bg-blue-950/70 text-blue-400 border-blue-800/60',
    Investigating: 'bg-purple-950/70 text-purple-400 border-purple-800/60',
    Resolved: 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60',
    Closed: 'bg-gray-800 text-gray-400 border-gray-700',
  };

  const icons: Record<IncidentStatus, string> = {
    New: '⚡',
    Investigating: '🔍',
    Resolved: '✓',
    Closed: '✕',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${styles[status] || styles.New} ${sizeClasses}`}
    >
      <span className="text-[10px]">{icons[status] || '•'}</span>
      {status}
    </span>
  );
};
