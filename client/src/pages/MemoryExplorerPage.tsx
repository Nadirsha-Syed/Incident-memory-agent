import React, { useEffect, useState } from 'react';
import {
  BrainCircuit,
  Search,
  Database,
  CheckCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Activity,
  Layers,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../api/client';
import { IMemoryEntry } from '../types';

export const MemoryExplorerPage: React.FC<{
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}> = ({ onToast }) => {
  const [stats, setStats] = useState<{
    totalMemories: number;
    confirmedResolutions: number;
    symptoms: number;
    failedApproaches: number;
    syncedCount: number;
  } | null>(null);

  const [memoryEntries, setMemoryEntries] = useState<IMemoryEntry[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Semantic Search Box
  const [searchQuery, setSearchQuery] = useState('');
  const [searchService, setSearchService] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);

  // Reflection Console
  const [reflectQuery, setReflectQuery] = useState('What are the recurring failure patterns in payment and database services?');
  const [reflectionResult, setReflectionResult] = useState<string | null>(null);
  const [reflecting, setReflecting] = useState(false);

  const fetchMemoryData = async () => {
    try {
      setLoading(true);
      const [activityRes, healthRes] = await Promise.all([
        api.getMemoryActivity(50),
        api.getMemoryHealth(),
      ]);

      setStats(activityRes.stats);
      setMemoryEntries(activityRes.activity);
      setHealth(healthRes.health);
    } catch (err: any) {
      onToast(err.message || 'Failed to load memory bank data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemoryData();
  }, []);

  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const res = await api.searchMemory(searchQuery, searchService || undefined);
      setSearchResults(res.memories);
      onToast(`Retrieved ${res.count} memory candidates from Hindsight bank.`, 'success');
    } catch (err: any) {
      onToast(err.message || 'Recall query failed', 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleRunReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectQuery.trim()) return;

    try {
      setReflecting(true);
      const res = await api.reflectMemory(reflectQuery);
      setReflectionResult(res.reflection);
      onToast('Hindsight reflection generated successfully.', 'success');
    } catch (err: any) {
      onToast(err.message || 'Reflection failed', 'error');
    } finally {
      setReflecting(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Hindsight Memory Explorer</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Inspect persistent memory banks, test multi-strategy semantic recall, and synthesize operational reflections.
          </p>
        </div>

        {/* Health status badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border ${
              health?.connected
                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                : health?.configured
                ? 'bg-blue-950 text-blue-400 border-blue-800'
                : 'bg-amber-950 text-amber-400 border-amber-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                health?.connected
                  ? 'bg-emerald-400 animate-pulse'
                  : health?.configured
                  ? 'bg-blue-400'
                  : 'bg-amber-400'
              }`}
            />
            {health?.connected
              ? 'Hindsight Cloud Connected'
              : health?.configured
              ? 'Configured (Standby)'
              : 'Local Memory Store Active'}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-slate-500 font-mono">TOTAL RETAINED MEMORIES</span>
          <div className="text-2xl font-bold text-white font-mono">{stats?.totalMemories ?? 0}</div>
          <p className="text-[11px] text-slate-400">In bank: {health?.bankId || 'default'}</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-emerald-400 font-mono">CONFIRMED RESOLUTIONS</span>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {stats?.confirmedResolutions ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">Verified SRE resolutions</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-amber-400 font-mono">FAILED ATTEMPTS AVOIDED</span>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {stats?.failedApproaches ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">Negative examples preserved</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-indigo-400 font-mono">SYNC STATUS</span>
          <div className="text-2xl font-bold text-indigo-400 font-mono">
            {stats?.syncedCount ?? 0} / {stats?.totalMemories ?? 0}
          </div>
          <p className="text-[11px] text-slate-400">Synchronized with Hindsight</p>
        </div>
      </div>

      {/* Interactive Semantic Recall Test Console */}
      <div className="p-6 rounded-2xl bg-gradient-to-b from-indigo-950/20 via-slate-900 to-slate-900 border border-indigo-900/60 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Live Hindsight Recall Query Test</h3>
          </div>
          <span className="text-[11px] text-indigo-300 font-mono">
            Dense + Sparse BM25 + Entity Graph
          </span>
        </div>

        <form onSubmit={handleSemanticSearch} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type error symptom or query (e.g. 'Hikari connection timeout' or 'Redis flap')..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <input
                type="text"
                value={searchService}
                onChange={(e) => setSearchService(e.target.value)}
                placeholder="Service (optional)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Quick tests:</span>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('connection pool exhausted waiting for socket');
                  setSearchService('Payment-API');
                }}
                className="hover:text-indigo-400 underline"
              >
                Pool Exhaustion
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('redis connection refused failover');
                  setSearchService('Session-Gateway');
                }}
                className="hover:text-indigo-400 underline"
              >
                Redis Failover
              </button>
            </div>

            <button
              type="submit"
              disabled={searching}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{searching ? 'Querying Bank...' : 'Execute Recall'}</span>
            </button>
          </div>
        </form>

        {/* Search Results Display */}
        {searchResults !== null && (
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                Recall Results: <strong>{searchResults.length}</strong> matches retrieved
              </span>
              <button
                onClick={() => setSearchResults(null)}
                className="text-slate-500 hover:text-slate-300 text-[11px]"
              >
                Clear Results
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-4 rounded-lg bg-black/40 text-xs text-slate-400 italic">
                No memories matched the query in this bank.
              </div>
            ) : (
              <div className="space-y-2.5">
                {searchResults.map((result, i) => (
                  <div
                    key={result.id || i}
                    className="p-3.5 rounded-lg bg-slate-950 border border-indigo-800/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-medium text-indigo-400">
                        {result.sourceIncidentId || result.id}
                      </span>
                      {result.score && (
                        <span className="font-mono text-emerald-400 font-semibold">
                          Relevance: {(result.score * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-200 bg-black/50 p-2.5 rounded border border-slate-800">
                      {result.content}
                    </p>
                    {result.relevanceReason && (
                      <p className="text-[11px] text-indigo-300/80">
                        <strong className="text-indigo-400">Why Relevant:</strong>{' '}
                        {result.relevanceReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hindsight Reflection Engine Console */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Hindsight Reflection Engine</h3>
          </div>
          <span className="text-[11px] text-purple-300 font-mono">Synthesizes High-Level Beliefs</span>
        </div>

        <form onSubmit={handleRunReflection} className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={reflectQuery}
              onChange={(e) => setReflectQuery(e.target.value)}
              placeholder="Ask Hindsight to reflect on accumulated knowledge..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-sans"
            />
            <button
              type="submit"
              disabled={reflecting}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/30 transition disabled:opacity-50 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{reflecting ? 'Reflecting...' : 'Reflect on Memories'}</span>
            </button>
          </div>
        </form>

        {reflectionResult && (
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-2">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-purple-300 block">
              Synthesized Operational Insight:
            </span>
            <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed font-sans">
              {reflectionResult}
            </p>
          </div>
        )}
      </div>

      {/* Memory Bank Entries Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Retained Memory Bank Activity</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical memory records stored in the primary partition.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {memoryEntries.length} entries shown
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading memory bank...</div>
        ) : memoryEntries.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Database className="w-8 h-8 text-slate-600 mx-auto" />
            <p>No memory records found in bank.</p>
            <p className="text-slate-600">Resolve incidents or click &quot;Seed Incidents&quot; to populate.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {memoryEntries.map((mem) => (
              <div
                key={mem.memoryId}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-semibold text-indigo-400">{mem.memoryId}</span>
                    <span className="text-slate-600">•</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border uppercase font-medium ${
                        mem.memoryType === 'confirmed_resolution'
                          ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60'
                          : mem.memoryType === 'failed_approach'
                          ? 'bg-red-950/70 text-red-300 border-red-800/60'
                          : 'bg-indigo-950/70 text-indigo-300 border-indigo-800/60'
                      }`}
                    >
                      {mem.memoryType.replace('_', ' ')}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400 font-medium">{mem.metadata.service}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                    <span>Incident: <strong className="text-slate-300">{mem.incidentId}</strong></span>
                    <span>{new Date(mem.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-slate-800/80 font-mono text-xs text-slate-200 leading-relaxed">
                  {mem.content}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                  <span>Bank: {mem.bankId}</span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        mem.syncedWithHindsight ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                    {mem.syncedWithHindsight ? 'Ingested to Hindsight' : 'Local Ingest'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
