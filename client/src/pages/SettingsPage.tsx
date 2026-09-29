import React, { useEffect, useState } from 'react';
import { Settings, BrainCircuit, Sparkles, Database, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { ISystemHealth } from '../types';

export const SettingsPage: React.FC<{
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}> = ({ onToast }) => {
  const [health, setHealth] = useState<ISystemHealth | null>(null);
  const [memoryHealth, setMemoryHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [hRes, mRes] = await Promise.all([
        api.getHealth(),
        api.getMemoryHealth(),
      ]);
      setHealth(hRes);
      setMemoryHealth(mRes.health);
    } catch (err: any) {
      onToast(err.message || 'Failed to fetch settings and health info', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">System Settings & Integrations</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Operational status of Hindsight persistent memory, Groq LLM engine, and MongoDB.
          </p>
        </div>

        <button
          onClick={fetchSettings}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Integration Cards */}
      <div className="space-y-4">
        {/* Hindsight Persistent Memory Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Hindsight Persistent Memory (Vectorize)</h3>
                <p className="text-xs text-slate-400 font-mono">Official SDK @vectorize-io/hindsight-client</p>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border ${
                memoryHealth?.connected
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : memoryHealth?.configured
                  ? 'bg-blue-950 text-blue-400 border-blue-800'
                  : 'bg-amber-950 text-amber-400 border-amber-800'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  memoryHealth?.connected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              {memoryHealth?.connected
                ? 'Cloud Connected'
                : memoryHealth?.configured
                ? 'Configured'
                : 'Local Memory Active'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[11px]">API ENDPOINT</span>
              <span className="text-slate-300 truncate block">
                {memoryHealth?.apiUrl || 'https://api.hindsight.vectorize.io'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">MEMORY BANK ID</span>
              <span className="text-indigo-400 block font-medium">
                {memoryHealth?.bankId || 'incident-memory-agent-prod'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">AUTHENTICATION</span>
              <span className="text-slate-300 block">
                {health?.integrations.hindsight.configured ? 'API Key Configured' : 'Local Fallback'}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-400 leading-relaxed space-y-1">
            <p>
              To connect to your own Hindsight Cloud bank, obtain your key at{' '}
              <a
                href="https://hindsight.vectorize.io"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline"
              >
                hindsight.vectorize.io
              </a>{' '}
              and set <code className="text-indigo-300 font-mono">HINDSIGHT_API_KEY</code> in <code className="text-indigo-300 font-mono">server/.env</code>.
            </p>
          </div>
        </div>

        {/* Groq LLM Engine Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Groq AI Inference Engine</h3>
                <p className="text-xs text-slate-400 font-mono">Ultra-low latency Llama-3 / OSS LLM inference</p>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border ${
                health?.integrations.groq.configured
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border-amber-800'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  health?.integrations.groq.configured ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              {health?.integrations.groq.configured ? 'API Key Configured' : 'Deterministic SRE Engine Active'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[11px]">ACTIVE MODEL</span>
              <span className="text-purple-300 block font-medium">
                {health?.integrations.groq.model || 'llama-3.3-70b-versatile'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">SUPPORTED MODELS</span>
              <span className="text-slate-300 block">
                llama-3.3-70b-versatile, openai/gpt-oss-120b, qwen/qwen3-32b
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-400 leading-relaxed">
            <p>
              Set <code className="text-purple-300 font-mono">GROQ_API_KEY</code> in <code className="text-purple-300 font-mono">server/.env</code> to route completions directly to Groq&apos;s LPUs.
            </p>
          </div>
        </div>

        {/* Database & Persistence Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Application Persistence</h3>
                <p className="text-xs text-slate-400 font-mono">MongoDB with Mongoose</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border bg-emerald-950 text-emerald-400 border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Connected & Auto-Seeded
            </span>
          </div>

          <div className="text-xs text-slate-400 leading-relaxed space-y-1">
            <p>
              Connects to your MongoDB Atlas cluster via <code className="text-emerald-300 font-mono">MONGODB_URI</code>. If no external URI is provided, the backend seamlessly initializes an in-memory MongoDB instance for instant local review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
