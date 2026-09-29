import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../api/client';

interface NavbarProps {
  onRefresh?: () => void;
  onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onRefresh, onToast }) => {
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const res = await api.seedDemoData(false);
      onToast?.(res.message || 'Demo incidents seeded successfully!', 'success');
      onRefresh?.();
    } catch (err: any) {
      onToast?.(err.message || 'Failed to seed demo data', 'error');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <header className="h-14 border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur px-6 flex items-center justify-between shrink-0 z-10">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-slate-400 font-mono">
          Incident Response Agent v1.0
        </span>
        <span className="text-slate-600">•</span>
        <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 font-mono">
          Memory Learning Loop Active
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition disabled:opacity-50"
          title="Seed realistic production incidents and ingest confirmed solutions to Hindsight"
        >
          <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${seeding ? 'animate-spin' : ''}`} />
          <span>{seeding ? 'Seeding...' : 'Seed Incidents'}</span>
        </button>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/60 transition"
            title="Refresh current view"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}

        <Link
          to="/incidents/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-600/30 transition"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Report Incident</span>
        </Link>
      </div>
    </header>
  );
};
