import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  CheckCircle,
  FileCode,
  Tag,
  Clock,
  Server,
  BrainCircuit,
  Terminal,
  RefreshCw,
} from 'lucide-react';
import { api } from '../api/client';
import { IIncident, IInvestigation } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { InvestigationReportView } from '../components/InvestigationReportView';
import { ResolutionModal } from '../components/ResolutionModal';

export const IncidentDetailPage: React.FC<{
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}> = ({ onToast }) => {
  const { id } = useParams<{ id: string }>();

  const [incident, setIncident] = useState<IIncident | null>(null);
  const [investigations, setInvestigations] = useState<IInvestigation[]>([]);
  const [selectedInvestigationIndex, setSelectedInvestigationIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [investigating, setInvestigating] = useState(false);
  const [showLogs, setShowLogs] = useState(true);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

  const fetchIncidentDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.getIncidentById(id);
      setIncident(res.incident);
      setInvestigations(res.investigations);
    } catch (err: any) {
      onToast(err.message || 'Failed to load incident details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentDetails();
  }, [id]);

  const handleRunInvestigation = async (withMemory = true) => {
    if (!id) return;
    try {
      setInvestigating(true);
      const res = await api.investigateIncident(id, withMemory);
      onToast(`AI Investigation generated ${withMemory ? 'with Hindsight memory' : 'without memory'}`, 'success');
      setInvestigations([res.investigation, ...investigations]);
      setSelectedInvestigationIndex(0);
      // Refresh incident status
      fetchIncidentDetails();
    } catch (err: any) {
      onToast(err.message || 'Investigation failed', 'error');
    } finally {
      setInvestigating(false);
    }
  };

  if (loading && !incident) {
    return (
      <div className="p-8 space-y-6 max-w-6xl mx-auto animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/4" />
        <div className="h-40 bg-slate-800 rounded-xl" />
        <div className="h-64 bg-slate-800 rounded-xl" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 space-y-3">
        <p className="text-base font-semibold text-white">Incident Not Found</p>
        <p>Could not locate incident record for ID &quot;{id}&quot;.</p>
        <Link to="/incidents" className="text-indigo-400 hover:underline">
          Return to incidents list
        </Link>
      </div>
    );
  }

  const currentInvestigation = investigations[selectedInvestigationIndex];
  const isResolved = incident.status === 'Resolved' || incident.status === 'Closed';

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link to="/incidents" className="hover:text-slate-200 flex items-center gap-1 transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Incidents
        </Link>
        <span>/</span>
        <span className="font-mono text-indigo-400 font-semibold">{incident.incidentId}</span>
      </div>

      {/* Incident Header Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-sm font-bold text-indigo-400">
                {incident.incidentId}
              </span>
              <SeverityBadge severity={incident.severity} />
              <StatusBadge status={incident.status} />
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {incident.environment}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">{incident.title}</h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isResolved ? (
              <button
                onClick={() => setIsResolveModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Resolve & Teach Hindsight</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-800/80">
                <CheckCircle className="w-4 h-4" />
                <span>Resolved & Ingested</span>
              </span>
            )}
          </div>
        </div>

        {/* Telemetry info row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs font-mono text-slate-400">
          <div>
            <span className="text-slate-500 block text-[11px]">AFFECTED SERVICE</span>
            <span className="text-slate-200 font-medium">{incident.service}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">REPORTED AT</span>
            <span className="text-slate-200">{new Date(incident.createdAt).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">ENVIRONMENT</span>
            <span className="text-slate-200">{incident.environment}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">TAGS</span>
            <span className="text-slate-300 truncate block">
              {incident.tags.length > 0 ? incident.tags.join(', ') : 'None'}
            </span>
          </div>
        </div>

        {/* Primary Error Message */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-slate-800 space-y-1 font-mono text-xs">
          <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">
            Error Message / Primary Symptom
          </span>
          <p className="text-red-400 break-all">{incident.errorMessage}</p>
        </div>

        {/* Collapsible Logs / Stack Trace */}
        {incident.logs && (
          <div className="space-y-2">
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 font-mono"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{showLogs ? 'Hide Stack Trace & Logs' : 'View Stack Trace & Logs'}</span>
            </button>
            {showLogs && (
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-60 leading-relaxed">
                {incident.logs}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Confirmed Resolution Banner (if already resolved) */}
      {incident.resolution && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-800/60 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-emerald-300">
                  Confirmed Resolution Record
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Verified by {incident.resolution.resolvedBy || 'SRE'} •{' '}
                  {new Date(incident.resolution.resolvedAt).toLocaleString()}
                </p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 font-mono">
              Permanently Retained in Hindsight
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-black/40 border border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold block text-[11px]">
                CONFIRMED ROOT CAUSE
              </span>
              <p className="text-slate-200">{incident.resolution.confirmedRootCause}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-black/40 border border-slate-800 space-y-1">
              <span className="text-emerald-400 font-semibold block text-[11px]">
                VERIFIED RESOLUTION STEPS
              </span>
              <p className="text-slate-200 whitespace-pre-line">
                {incident.resolution.resolutionSteps}
              </p>
            </div>
          </div>

          {incident.resolution.lessonsLearned && (
            <div className="text-xs text-slate-300 p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <strong className="text-indigo-400">Lesson Learned:</strong>{' '}
              {incident.resolution.lessonsLearned}
            </div>
          )}

          {incident.resolution.failedApproaches && incident.resolution.failedApproaches.length > 0 && (
            <div className="text-xs text-red-300/90 p-3 rounded-lg bg-red-950/20 border border-red-900/40 space-y-1">
              <strong className="text-red-400 block">Failed Approaches (Preserved to avoid repetition):</strong>
              <ul className="list-disc list-inside space-y-0.5 font-mono text-[11px]">
                {incident.resolution.failedApproaches.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* AI Investigation Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              AI Agent Investigation
            </h3>
            {investigations.length > 0 && (
              <span className="text-xs font-mono text-slate-400">
                ({investigations.length} report{investigations.length === 1 ? '' : 's'})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleRunInvestigation(true)}
              disabled={investigating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>{investigating ? 'Investigating...' : 'Re-run with Hindsight'}</span>
            </button>
            <button
              onClick={() => handleRunInvestigation(false)}
              disabled={investigating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition disabled:opacity-50"
              title="Runs baseline LLM investigation without Hindsight memory recall"
            >
              <span>Run without Memory</span>
            </button>
          </div>
        </div>

        {/* Investigation Reports Switcher (if multiple exist) */}
        {investigations.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
            {investigations.map((inv, idx) => (
              <button
                key={inv.investigationId || idx}
                onClick={() => setSelectedInvestigationIndex(idx)}
                className={`px-3 py-1.5 rounded-lg border transition shrink-0 ${
                  selectedInvestigationIndex === idx
                    ? 'bg-indigo-950 text-indigo-300 border-indigo-700 font-semibold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {inv.withMemory ? '🧠 With Hindsight' : '🚫 Baseline'} ({inv.investigationId.slice(0, 10)})
              </button>
            ))}
          </div>
        )}

        {/* Current Investigation Report or Empty State */}
        {currentInvestigation ? (
          <InvestigationReportView
            investigation={currentInvestigation}
            onOpenResolveModal={() => setIsResolveModalOpen(true)}
            isResolved={isResolved}
          />
        ) : (
          <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
            <BrainCircuit className="w-10 h-10 text-indigo-400 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-white">No Investigation Report Yet</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Trigger an AI investigation to retrieve relevant memories from Hindsight and receive structured diagnosis and safety recommendations.
              </p>
            </div>
            <button
              onClick={() => handleRunInvestigation(true)}
              disabled={investigating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>{investigating ? 'Analyzing Telemetry...' : 'Start AI Investigation'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Resolution Confirmation Modal */}
      <ResolutionModal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        incidentId={incident.incidentId}
        service={incident.service}
        onResolved={(updated) => {
          setIncident(updated);
          onToast('Confirmed resolution recorded and ingested into Hindsight!', 'success');
        }}
        onToast={onToast}
      />
    </div>
  );
};
