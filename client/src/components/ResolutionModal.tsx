import React, { useState } from 'react';
import { X, CheckCircle, BrainCircuit, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { api } from '../api/client';

interface ResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidentId: string;
  service: string;
  onResolved: (updatedIncident: any) => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}

export const ResolutionModal: React.FC<ResolutionModalProps> = ({
  isOpen,
  onClose,
  incidentId,
  service,
  onResolved,
  onToast,
}) => {
  const [confirmedRootCause, setConfirmedRootCause] = useState('');
  const [resolutionSteps, setResolutionSteps] = useState('');
  const [worked, setWorked] = useState(true);
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [failedApproaches, setFailedApproaches] = useState<string[]>(['']);
  const [resolvedBy, setResolvedBy] = useState('Senior SRE');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddFailedApproach = () => {
    setFailedApproaches([...failedApproaches, '']);
  };

  const handleFailedApproachChange = (index: number, val: string) => {
    const updated = [...failedApproaches];
    updated[index] = val;
    setFailedApproaches(updated);
  };

  const handleRemoveFailedApproach = (index: number) => {
    setFailedApproaches(failedApproaches.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedRootCause.trim() || !resolutionSteps.trim()) {
      onToast('Please provide both confirmed root cause and resolution steps.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const filteredFailed = failedApproaches.filter(f => f.trim().length > 0);

      const res = await api.resolveIncident(incidentId, {
        confirmedRootCause,
        resolutionSteps,
        worked,
        lessonsLearned,
        failedApproaches: filteredFailed,
        resolvedBy,
      });

      onToast(res.message || 'Incident resolved and retained in Hindsight!', 'success');
      onResolved(res.incident);
      onClose();
    } catch (err: any) {
      onToast(err.message || 'Failed to submit resolution', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Record Verified Resolution</h3>
              <p className="text-xs text-slate-400 font-mono">
                {incidentId} • {service}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice about Hindsight learning */}
        <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/60 flex items-start gap-2.5 text-xs text-indigo-300">
          <BrainCircuit className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block font-medium">Persistent Learning Loop</strong>
            Saving this confirmed resolution permanently ingests the verified fix into Hindsight memory so future engineers investigating {service} incidents will immediately benefit.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Confirmed Root Cause */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-200 block">
              Confirmed Root Cause <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={confirmedRootCause}
              onChange={(e) => setConfirmedRootCause(e.target.value)}
              placeholder="e.g. HikariCP maximumPoolSize was capped at 20 while worker thread count was raised to 200..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>

          {/* Resolution Steps */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-200 block">
              Resolution Steps Applied <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={resolutionSteps}
              onChange={(e) => setResolutionSteps(e.target.value)}
              placeholder="e.g. 1. Increased maxPoolSize to 75 in Helm config. 2. Rolling restart. 3. Active connections stabilized at 45."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Did this fix work? */}
          <div className="flex items-center gap-4 p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
            <span className="font-semibold text-slate-200">Did this resolution solve the issue?</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="radio"
                  name="worked"
                  checked={worked}
                  onChange={() => setWorked(true)}
                  className="text-emerald-500 focus:ring-emerald-400"
                />
                Yes (Verified Fix)
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="radio"
                  name="worked"
                  checked={!worked}
                  onChange={() => setWorked(false)}
                  className="text-red-500 focus:ring-red-400"
                />
                No (Partial / Needs Investigation)
              </label>
            </div>
          </div>

          {/* Failed Approaches (Negative Experience Learning) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-200 block">
                Failed Approaches Attempted (Negative Examples)
              </label>
              <button
                type="button"
                onClick={handleAddFailedApproach}
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                <Plus className="w-3 h-3" /> Add Attempt
              </button>
            </div>
            {failedApproaches.map((val, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={val}
                  onChange={(e) => handleFailedApproachChange(idx, e.target.value)}
                  placeholder="e.g. Restarting pods without increasing pool size immediately locked up again"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                {failedApproaches.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFailedApproach(idx)}
                    className="p-2 text-slate-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Lessons Learned */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-200 block">Lessons Learned / Preventative Advice</label>
            <input
              type="text"
              value={lessonsLearned}
              onChange={(e) => setLessonsLearned(e.target.value)}
              placeholder="e.g. Always benchmark pool sizes against max worker threads in staging"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{submitting ? 'Retaining in Hindsight...' : 'Confirm & Retain in Memory'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
