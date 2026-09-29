import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  PlusCircle,
  BrainCircuit,
  GitCompare,
  Settings,
  Sparkles,
  Database,
} from 'lucide-react';
import { ISystemHealth } from '../types';

interface SidebarProps {
  health?: ISystemHealth | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ health }) => {
  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/incidents', label: 'Incidents', icon: AlertTriangle },
    { to: '/incidents/new', label: 'Report Incident', icon: PlusCircle },
    { to: '/memory', label: 'Memory Explorer', icon: BrainCircuit, badge: 'Hindsight' },
    { to: '/demo', label: 'Memory Demo', icon: GitCompare, badge: 'Judge View' },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0F172A] border-r border-slate-800 flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
              Incident Memory
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AGENT
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">Every incident teaches</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.exact}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {link.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Integration Status Footer */}
      <div className="p-4 m-3 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
            Hindsight Memory
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              health?.integrations.hindsight.configured ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400'
            }`}
            title={health?.integrations.hindsight.configured ? 'Connected' : 'Local Standby'}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Groq LLM
          </span>
          <span className="text-[11px] font-mono text-slate-300 truncate max-w-[100px]" title={health?.integrations.groq.model}>
            {health?.integrations.groq.model || 'llama-3.3-70b'}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <Database className="w-3 h-3 text-slate-400" />
            Bank:
          </span>
          <span className="truncate max-w-[120px] text-slate-300" title={health?.integrations.hindsight.bankId}>
            {health?.integrations.hindsight.bankId || 'default'}
          </span>
        </div>
      </div>
    </aside>
  );
};
