import React, { useState } from 'react';
import {
  GitCompare,
  Sparkles,
  BrainCircuit,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Flame,
  FileCode,
} from 'lucide-react';
import { api } from '../api/client';

export const MemoryDemoPage: React.FC<{
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}> = ({ onToast }) => {
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [demoResult, setDemoResult] = useState<any>(null);

  const handleRunComparison = async () => {
    try {
      setLoading(true);
      const res = await api.runMemoryComparison();
      setDemoResult(res);
      onToast('Comparison completed! See side-by-side results below.', 'success');
    } catch (err: any) {
      onToast(err.message || 'Failed to run memory comparison', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemoData = async () => {
    try {
      setResetting(true);
      const res = await api.resetDemoData();
      onToast(res.message || 'Demo data reset and re-seeded successfully.', 'success');
      setDemoResult(null);
    } catch (err: any) {
      onToast(err.message || 'Failed to reset demo data', 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <GitCompare className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Memory Value Demonstration: Before & After Hindsight
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Judge View: Run a controlled side-by-side comparison on identical incident symptoms with vs without Hindsight persistent memory.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetDemoData}
            disabled={resetting || loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition disabled:opacity-50"
            title="Reset and re-seed clean historical incidents and Hindsight memories"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Resetting...' : 'Reset & Reseed Demo Data'}</span>
          </button>

          <button
            onClick={handleRunComparison}
            disabled={loading || resetting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Running Side-by-Side Analysis...' : 'Run Live Comparison Demo'}</span>
          </button>
        </div>
      </div>

      {/* Controlled Scenario Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-400">
            Controlled Hackathon Scenario
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
            Payment-API Recurring Incident
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block text-[11px] uppercase">
              1. PREVIOUS INCIDENT (INC-2026-0001)
            </span>
            <p className="text-slate-300 font-mono">
              ConnectionPoolTimeoutException on Payment-API under high load.
            </p>
            <p className="text-emerald-400/90 font-mono text-[11px] pt-1">
              ✓ Resolved by increasing Hikari maxPoolSize from 20 to 75 & tuning connection timeout. Ingested into Hindsight!
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-indigo-400 font-semibold block text-[11px] uppercase">
              2. NEW INCIDENT TODAY (DEMO-TARGET-INC-002)
            </span>
            <p className="text-slate-300 font-mono">
              SQLTransientConnectionException: HikariPool-1 - Connection is not available, request timed out after 30005ms.
            </p>
            <p className="text-indigo-300 font-mono text-[11px] pt-1">
              → How does the agent investigate with vs without memory of the previous fix?
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Results */}
      {loading ? (
        <div className="p-16 text-center space-y-4 rounded-2xl bg-slate-900 border border-slate-800">
          <BrainCircuit className="w-12 h-12 text-indigo-400 mx-auto animate-pulse" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">Running Parallel Investigations...</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              1. Running Investigation A with zero historical memory.<br />
              2. Running Investigation B with Hindsight semantic recall and prompt synthesis.
            </p>
          </div>
        </div>
      ) : demoResult ? (
        <div className="space-y-6">
          {/* Key Findings Callout Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-emerald-950/70 border border-indigo-700/60 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Comparative Analysis & Key Memory Takeaway</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {demoResult.comparisonSummary.keyDifference}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
              <span>
                Historical Incident Recalled:{' '}
                <strong className="text-indigo-300">
                  {demoResult.comparisonSummary.primaryPastIncidentRecalled}
                </strong>
              </span>
              <span>•</span>
              <span>
                Memory Candidates Found:{' '}
                <strong className="text-emerald-400">
                  {demoResult.comparisonSummary.recalledCount}
                </strong>
              </span>
            </div>
          </div>

          {/* Side-by-Side Comparison Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left Column: Investigation A (Without Memory) */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Investigation A: Without Memory
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    Baseline LLM (Memory Recall Disabled)
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Zero Historical Recall
                </span>
              </div>

              {/* Memory Recall Status */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300 block">Retrieved Memories:</span>
                <p className="italic text-slate-500">
                  None. The agent has no awareness of prior incidents or confirmed resolutions.
                </p>
              </div>

              {/* Summary */}
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] block">
                  Diagnosis Summary
                </span>
                <p className="text-slate-200 leading-relaxed bg-black/30 p-3 rounded-lg border border-slate-800 font-sans">
                  {demoResult.investigationA_withoutMemory.report.summary}
                </p>
              </div>

              {/* Hypotheses */}
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-amber-400 uppercase tracking-wider text-[10px] block">
                  Proposed Hypotheses (Generic)
                </span>
                <ul className="space-y-1.5">
                  {demoResult.investigationA_withoutMemory.report.possibleCauses.map((c: string, i: number) => (
                    <li key={i} className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300">
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resolution Proposal */}
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] block">
                  Suggested Action
                </span>
                <div className="p-3 rounded-lg bg-black/40 border border-slate-800 font-mono text-slate-300 whitespace-pre-line text-[11px]">
                  {demoResult.investigationA_withoutMemory.report.suggestedResolution}
                </div>
              </div>

              {/* Drawbacks */}
              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-300 space-y-1">
                <strong className="block">Drawback:</strong>
                Engineer must manually rediscover the pool sizing issue from scratch and risks attempting ineffective pod restarts.
              </div>
            </div>

            {/* Right Column: Investigation B (With Hindsight Memory) */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-indigo-700/60 shadow-xl shadow-indigo-950/30 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-indigo-400" />
                    Investigation B: With Hindsight
                  </h3>
                  <span className="text-[11px] font-mono text-indigo-300">
                    Hindsight Persistent Memory Injected
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60">
                  Memory Active
                </span>
              </div>

              {/* Memory Recall Status */}
              <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/60 text-xs text-indigo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    Recalled from Hindsight Bank:
                  </span>
                  <span className="font-mono text-[11px] text-indigo-300">
                    {demoResult.investigationB_withMemory.recalledMemories.length} match
                  </span>
                </div>
                {demoResult.investigationB_withMemory.recalledMemories.map((m: any, idx: number) => (
                  <div key={idx} className="bg-slate-950 p-2.5 rounded border border-indigo-900/60 text-[11px] font-mono text-slate-200">
                    <div className="text-indigo-400 font-bold mb-0.5">{m.sourceIncidentId || 'Past Incident'}</div>
                    <div>{m.content}</div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-indigo-400 uppercase tracking-wider text-[10px] block">
                  Diagnosis Summary (Context-Enriched)
                </span>
                <p className="text-slate-200 leading-relaxed bg-black/30 p-3 rounded-lg border border-slate-800 font-sans">
                  {demoResult.investigationB_withMemory.report.summary}
                </p>
              </div>

              {/* Hypotheses */}
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[10px] block">
                  Root Cause Hypotheses (Memory-Informed)
                </span>
                <ul className="space-y-1.5">
                  {demoResult.investigationB_withMemory.report.possibleCauses.map((c: string, i: number) => (
                    <li key={i} className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-200 font-medium">
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resolution Proposal */}
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[10px] block">
                  Verified Historical Resolution
                </span>
                <div className="p-3 rounded-lg bg-black/40 border border-emerald-800/40 font-mono text-slate-200 whitespace-pre-line text-[11px]">
                  {demoResult.investigationB_withMemory.report.suggestedResolution}
                </div>
              </div>

              {/* Advantages */}
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/60 text-[11px] text-emerald-300 space-y-1">
                <strong className="block flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Hindsight Advantage:
                </strong>
                Directly provides the verified pool sizing fix and warns against futile restarts, cutting MTTR (Mean Time to Resolution) from hours to minutes!
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-16 text-center space-y-4 rounded-2xl bg-slate-900 border border-slate-800">
          <GitCompare className="w-12 h-12 text-indigo-400 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">Ready to Run Memory Comparison</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Click &quot;Run Live Comparison Demo&quot; above to execute side-by-side investigations on the simulated Payment API outage and see how persistent memory transforms AI recommendations.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
