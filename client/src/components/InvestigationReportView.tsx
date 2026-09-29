import React from 'react';
import {
  BrainCircuit,
  CheckCircle2,
  AlertOctagon,
  ShieldAlert,
  HelpCircle,
  FileCheck2,
  Stethoscope,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { IInvestigation } from '../types';

interface InvestigationReportViewProps {
  investigation: IInvestigation;
  onOpenResolveModal?: () => void;
  isResolved?: boolean;
}

export const InvestigationReportView: React.FC<InvestigationReportViewProps> = ({
  investigation,
  onOpenResolveModal,
  isResolved = false,
}) => {
  const { report, recalledMemories, withMemory, modelUsed, createdAt } = investigation;

  return (
    <div className="space-y-6">
      {/* Investigation Meta Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white font-mono">
                {investigation.investigationId}
              </span>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                  withMemory
                    ? 'bg-indigo-950/70 text-indigo-300 border-indigo-700/60'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {withMemory ? 'Hindsight Memory Enabled' : 'Memory Recall Disabled (Baseline)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Model: <span className="text-slate-300">{modelUsed}</span> • {new Date(createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>

        {!isResolved && onOpenResolveModal && (
          <button
            onClick={onOpenResolveModal}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-800/80 transition shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirm Resolution & Teach Hindsight</span>
          </button>
        )}
      </div>

      {/* Recalled Persistent Memories (Crucial Hindsight section) */}
      {withMemory && (
        <div className="rounded-xl border border-indigo-900/60 bg-gradient-to-b from-indigo-950/30 to-slate-900/80 p-5 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-indigo-200">
                Memories Recalled from Hindsight Persistent Bank
              </h3>
            </div>
            <span className="text-xs font-mono text-indigo-400 px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800/60">
              {recalledMemories.length} relevant record{recalledMemories.length === 1 ? '' : 's'} found
            </span>
          </div>

          {recalledMemories.length === 0 ? (
            <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-400 italic">
              No matching historical incidents were found in Hindsight persistent memory. The agent generated this analysis from baseline telemetry.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {recalledMemories.map((mem, i) => (
                <div
                  key={mem.id || i}
                  className="p-3.5 rounded-lg bg-slate-900/90 border border-indigo-800/40 hover:border-indigo-700/60 transition space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-indigo-400 font-medium">
                        {mem.sourceIncidentId || `Historical Memory #${i + 1}`}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-[11px] px-1.5 py-0.2 rounded bg-indigo-900/40 text-indigo-300 border border-indigo-700/40">
                        {mem.memoryType}
                      </span>
                    </div>
                    {mem.score && (
                      <span className="text-[11px] text-slate-400 font-mono">
                        Match score: <strong className="text-indigo-300">{(mem.score * 100).toFixed(0)}%</strong>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-200 font-mono bg-black/40 p-2.5 rounded border border-slate-800/80">
                    {mem.content}
                  </p>
                  {mem.relevanceReason && (
                    <p className="text-[11px] text-indigo-300/80 flex items-center gap-1.5 pt-0.5">
                      <span className="font-semibold text-indigo-400">Relevance:</span> {mem.relevanceReason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Executive Summary */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
        <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-2">
          <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" />
          Executive Incident Summary
        </h4>
        <p className="text-sm text-slate-200 leading-relaxed font-sans">
          {report.summary}
        </p>
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span className="font-semibold text-slate-300">Confidence Analysis:</span>
          <span>{report.confidenceExplanation}</span>
        </div>
      </div>

      {/* Grid: Possible Root Causes (Hypotheses) vs Recommended Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Possible Causes (Hypotheses) */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-amber-400 flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5" />
              Possible Root Causes (Hypotheses)
            </h4>
            <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
              Needs Verification
            </span>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            {report.possibleCauses.map((cause, i) => (
              <li key={i} className="flex items-start gap-2 p-2 rounded bg-slate-800/40 border border-slate-800">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 font-mono text-[10px]">
                  {i + 1}
                </span>
                <span className="leading-snug">{cause}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommended Diagnostic Steps */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <h4 className="text-xs uppercase tracking-wider font-semibold text-indigo-400 flex items-center gap-2">
            <Stethoscope className="w-3.5 h-3.5" />
            Recommended Diagnostic Steps
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            {report.recommendedDiagnosticSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 p-2 rounded bg-slate-800/40 border border-slate-800">
                <input
                  type="checkbox"
                  id={`diag-${i}`}
                  className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500/20"
                />
                <label htmlFor={`diag-${i}`} className="leading-snug select-none cursor-pointer">
                  {step}
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Suggested Resolution & Safety Safeguards */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div>
          <h4 className="text-xs uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Suggested Resolution Plan
          </h4>
          <div className="p-3.5 rounded-lg bg-black/40 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-line leading-relaxed">
            {report.suggestedResolution}
          </div>
        </div>

        {/* Safety Considerations & Human Confirmation */}
        <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-800/40 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Safety Considerations & Blast Radius
          </div>
          <ul className="list-disc list-inside text-xs text-amber-200/90 space-y-1">
            {report.safetyConsiderations.map((safety, i) => (
              <li key={i}>{safety}</li>
            ))}
          </ul>
          {report.humanConfirmationRequired && (
            <div className="pt-2 border-t border-amber-900/40 flex items-center gap-2 text-[11px] text-amber-400 font-medium">
              <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
              <span>Human confirmation required before applying changes to production.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
