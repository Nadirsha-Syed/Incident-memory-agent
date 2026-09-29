import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, AlertTriangle, PlusCircle, ArrowUpDown } from 'lucide-react';
import { api } from '../api/client';
import { IIncident } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';

export const IncidentsPage: React.FC<{
  onToast: (msg: string, type: 'success' | 'error') => void;
}> = ({ onToast }) => {
  const [incidents, setIncidents] = useState<IIncident[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [service, setService] = useState('');

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await api.getIncidents({
        search: search || undefined,
        status: status || undefined,
        severity: severity || undefined,
        service: service || undefined,
        limit: 100,
      });
      setIncidents(res.incidents);
      setTotal(res.total);
    } catch (err: any) {
      onToast(err.message || 'Failed to fetch incidents', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [status, severity, service]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchIncidents();
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Incident History</h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse, search, and inspect past production incidents and their memory-backed investigations.
          </p>
        </div>
        <Link
          to="/incidents/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition self-start sm:self-auto"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Report Incident</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, title, error message, or service..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {(search || status || severity || service) && (
            <button
              onClick={() => {
                setSearch('');
                setStatus('');
                setSeverity('');
                setService('');
              }}
              className="px-2.5 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700 transition"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Incidents Table */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading incidents...</div>
        ) : incidents.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-slate-400 font-medium">No incidents matched your query.</p>
            <p className="text-slate-600">Try adjusting your filters or seed realistic incidents.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold font-mono">
                  <th className="py-3 px-4">Incident ID</th>
                  <th className="py-3 px-4">Service & Title</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Environment</th>
                  <th className="py-3 px-4">Reported</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {incidents.map((inc) => (
                  <tr
                    key={inc.incidentId}
                    className="hover:bg-slate-800/40 transition group cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-indigo-400">
                      <Link to={`/incidents/${inc.incidentId}`} className="hover:underline">
                        {inc.incidentId}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="font-semibold text-slate-200 group-hover:text-indigo-300 transition">
                        {inc.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                        <span className="text-slate-400 font-medium">{inc.service}</span>
                        <span>•</span>
                        <span className="truncate max-w-xs">{inc.errorMessage}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <SeverityBadge severity={inc.severity} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={inc.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {inc.environment}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {new Date(inc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/incidents/${inc.incidentId}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition font-medium"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
