import React from 'react';
import { IncidentSeverity } from '../types';

interface SeverityBadgeProps {
  severity: IncidentSeverity;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const styles: Record<IncidentSeverity, string> = {
    Critical: 'bg-red-950/80 text-red-400 border-red-800/60 shadow-red-950/40',
    High: 'bg-orange-950/80 text-orange-400 border-orange-800/60 shadow-orange-950/40',
    Medium: 'bg-amber-950/80 text-amber-400 border-amber-800/60 shadow-amber-950/40',
    Low: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60 shadow-emerald-950/40',
  };

  const dots: Record<IncidentSeverity, string> = {
    Critical: 'bg-red-400 animate-pulse',
    High: 'bg-orange-400',
    Medium: 'bg-amber-400',
    Low: 'bg-emerald-400',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border shadow-sm ${styles[severity] || styles.Medium} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dots[severity] || dots.Medium}`} />
      {severity}
    </span>
  );
};
