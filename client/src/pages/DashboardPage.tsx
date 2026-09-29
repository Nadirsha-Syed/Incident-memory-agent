import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  Activity,
  Flame,
  BrainCircuit,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Server,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from 'recharts';
import { api } from '../api/client';
import { IDashboardStats, IIncident, IMemoryEntry } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';

export const DashboardPage: React.FC<{
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}> = ({ onToast }) => {
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [recentIncidents, setRecentIncidents] = useState<IIncident[]>([]);
  const [memoryActivity, setMemoryActivity] = useState<IMemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, incidentsRes, memoryRes] = await Promise.all([
        api.getDashboardStats(),
        api.getIncidents({ limit: 6 }),
        api.getMemoryActivity(6),
      ]);

      setStats(statsRes.stats);
      setRecentIncidents(incidentsRes.incidents);
      setMemoryActivity(memoryRes.activity);
    } catch (err: any) {
      onToast(err.message || 'Failed to load dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !stats) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-800/60 rounded-xl border border-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-72 bg-slate-800/60 rounded-xl" />
          <div className="h-72 bg-slate-800/60 rounded-xl" />
        </div>
      </div>
    );
  }

  const learningRate = stats && stats.totalIncidents > 0
    ? ((stats.resolvedIncidents / stats.totalIncidents) * 100).toFixed(0)
    : '0';

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Incident Operations Center</h2>
          <p className="text-xs text-slate-400 mt-1">
            Every resolved incident is retained in Hindsight to accelerate future investigations.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/demo"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-300 bg-indigo-950/70 border border-indigo-800/60 hover:bg-indigo-900/80 transition shadow-sm"
          >
            <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
            <span>Before vs After Demo</span>
          </Link>
          <Link
            to="/incidents/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>+ Report Incident</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Incidents */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Incidents</span>
            <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono">{stats?.totalIncidents ?? 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">Operational records logged</p>
          </div>
        </div>

        {/* Active Incidents */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Incidents</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-400 font-mono">{stats?.activeIncidents ?? 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">Under active triage & investigation</p>
          </div>
        </div>

        {/* Resolved Incidents & Learning */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Resolved & Retained</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400 font-mono flex items-center gap-2">
              {stats?.resolvedIncidents ?? 0}
              <span className="text-xs font-sans font-medium px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-emerald-300">
                {learningRate}% retained
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Ingested into Hindsight memory bank</p>
          </div>
        </div>

        {/* Critical Incidents */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Critical Incidents</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400 font-mono">{stats?.criticalIncidents ?? 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">High severity production outages</p>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Distribution Donut */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Severity Distribution
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Breakdown</span>
          </div>

          <div className="h-56 w-full">
            {stats && stats.severityDistribution.some((s) => s.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.severityDistribution}
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {stats.severityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No incident records yet
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
            {stats?.severityDistribution.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                </span>
                <span className="font-mono text-slate-200">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 7-Day Incident Trend Area Chart */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Incident Velocity & Resolution Rate
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Daily Trend</span>
          </div>

          <div className="h-64 w-full">
            {stats && stats.trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trendData}>
                  <defs>
                    <linearGradient id="incidentsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="incidents"
                    name="Logged"
                    stroke="#6366F1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#incidentsGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    name="Resolved & Retained"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#resolvedGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Awaiting incident trend data
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-5 text-xs text-slate-400 font-mono pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-indigo-500" />
              Incidents Logged
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
              Resolved & Ingested into Hindsight
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Incidents vs Hindsight Memory Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Incidents Feed */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Recent Incidents
            </h3>
            <Link
              to="/incidents"
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentIncidents.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No recent incidents recorded.</div>
          ) : (
            <div className="space-y-2.5">
              {recentIncidents.map((inc) => (
                <Link
                  key={inc.incidentId}
                  to={`/incidents/${inc.incidentId}`}
                  className="block p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/50 border border-slate-800/80 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-indigo-400">
                        {inc.incidentId}
                      </span>
                      <span className="text-xs font-medium text-slate-300">{inc.service}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={inc.severity} size="sm" />
                      <StatusBadge status={inc.status} size="sm" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 font-sans line-clamp-1">{inc.title}</p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">{inc.errorMessage}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Hindsight Memory Activity Stream */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
              Hindsight Persistent Memory Feed
            </h3>
            <Link
              to="/memory"
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Explore Bank <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {memoryActivity.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No memory activity recorded. Resolve incidents or click &quot;Seed Incidents&quot; to populate.
            </div>
          ) : (
            <div className="space-y-2.5">
              {memoryActivity.map((mem) => (
                <div
                  key={mem.memoryId}
                  className="p-3 rounded-xl bg-slate-950/60 border border-indigo-950/70 hover:border-indigo-800/50 transition space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-indigo-400 font-medium">{mem.memoryId}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-900/40 text-indigo-300 border border-indigo-800/40 uppercase">
                        {mem.memoryType.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {mem.incidentId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono line-clamp-2 bg-black/30 p-2 rounded border border-slate-800/60">
                    {mem.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
