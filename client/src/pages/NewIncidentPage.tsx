import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Sparkles, Send, FileCode, Tag, Layers, CheckCircle } from 'lucide-react';
import { api } from '../api/client';
import { IncidentSeverity, IncidentEnvironment } from '../types';

export const NewIncidentPage: React.FC<{
  onToast: (msg: string, type: 'success' | 'error') => void;
}> = ({ onToast }) => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [service, setService] = useState('Payment-API');
  const [severity, setSeverity] = useState<IncidentSeverity>('Critical');
  const [environment, setEnvironment] = useState<IncidentEnvironment>('Production');
  const [errorMessage, setErrorMessage] = useState('');
  const [logs, setLogs] = useState('');
  const [tagsInput, setTagsInput] = useState('database, connection-pool');
  const [autoInvestigate, setAutoInvestigate] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Quick Preset Scenarios
  const handleLoadPreset = (preset: 'pool' | 'redis' | 'webhook') => {
    if (preset === 'pool') {
      setTitle('Payment API database connection pool exhausted');
      setService('Payment-API');
      setSeverity('Critical');
      setEnvironment('Production');
      setErrorMessage('java.sql.SQLTransientConnectionException: HikariPool-1 - Connection is not available, request timed out after 30002ms');
      setLogs(`2026-09-28T10:14:02.190Z [ERROR] [com.payments.service.TransactionManager] Failed to acquire connection
  at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:213)
  at com.payments.repository.LedgerRepository.acquireLock(LedgerRepository.java:65)
  at com.payments.service.PaymentProcessor.execute(PaymentProcessor.java:119)`);
      setTagsInput('database, connection-pool, hikari, timeout');
    } else if (preset === 'redis') {
      setTitle('Session Gateway Redis cluster connection failure');
      setService('Session-Gateway');
      setSeverity('High');
      setEnvironment('Production');
      setErrorMessage('io.lettuce.core.RedisConnectionException: Unable to connect to redis-cluster-node-0.redis.internal:6379');
      setLogs(`2026-09-28T11:05:22.012Z [FATAL] [io.lettuce.core.RedisClient] Connection refused: /10.244.1.88:6379
  at io.lettuce.core.protocol.ConnectionWatchdog.run(ConnectionWatchdog.java:140)`);
      setTagsInput('redis, cache, cluster, session');
    } else if (preset === 'webhook') {
      setTitle('Checkout Service outbound webhook connection reset');
      setService('Checkout-Service');
      setSeverity('Medium');
      setEnvironment('Production');
      setErrorMessage('FetchError: request to https://api.stripe-gateway.internal/v1/webhook failed, reason: read ECONNRESET');
      setLogs(`2026-09-28T09:40:11.890Z [ERROR] [checkout-service] Payment webhook failed to deliver
  code: 'ECONNRESET', errno: -4077, syscall: 'read'`);
      setTagsInput('checkout, webhook, network, tls');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !service.trim() || !errorMessage.trim()) {
      onToast('Please fill out all required fields.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const res = await api.createIncident({
        title,
        service,
        severity,
        environment,
        errorMessage,
        logs,
        tags,
        autoInvestigate,
      });

      onToast(`Incident ${res.incident.incidentId} submitted!`, 'success');
      navigate(`/incidents/${res.incident.incidentId}`);
    } catch (err: any) {
      onToast(err.message || 'Failed to submit incident', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Report New Incident</h2>
          <p className="text-xs text-slate-400 mt-1">
            Submit an incident. The agent will query Hindsight memory and generate an immediate investigation.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 font-medium">Quick Presets:</span>
          <button
            type="button"
            onClick={() => handleLoadPreset('pool')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700"
          >
            Connection Pool
          </button>
          <button
            type="button"
            onClick={() => handleLoadPreset('redis')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700"
          >
            Redis Flap
          </button>
          <button
            type="button"
            onClick={() => handleLoadPreset('webhook')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700"
          >
            Webhook Reset
          </button>
        </div>
      </div>

      {/* Incident Submission Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 text-xs">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-200 block">
            Incident Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Payment API connection pool exhausted under flash sale load"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans text-sm"
          />
        </div>

        {/* Service, Severity, Environment Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-200 block">
              Affected Service <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="e.g. Payment-API"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-200 block">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
            >
              <option value="Critical">Critical (P1 Outage)</option>
              <option value="High">High (P2 Degraded)</option>
              <option value="Medium">Medium (P3 Partial)</option>
              <option value="Low">Low (P4 Minor)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-200 block">Environment</label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as IncidentEnvironment)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
            >
              <option value="Production">Production</option>
              <option value="Staging">Staging</option>
              <option value="Development">Development</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-200 block">
            Error Message / Primary Symptom <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={errorMessage}
            onChange={(e) => setErrorMessage(e.target.value)}
            placeholder="e.g. ConnectionPoolTimeoutException: Timeout waiting for idle connection from pool"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        {/* Stack Trace / Logs */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-200 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              Incident Logs or Stack Trace (Optional)
            </label>
            <span className="text-[11px] text-slate-500">Treated as untrusted input</span>
          </div>
          <textarea
            rows={5}
            value={logs}
            onChange={(e) => setLogs(e.target.value)}
            placeholder="Paste application stack trace, container stderr, or alert log snippet..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
          />
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. database, pool, hikari, postgresql"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
          />
        </div>

        {/* Auto Investigate Toggle */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="font-semibold text-slate-200 block">
                Auto-trigger AI Investigation with Hindsight Memory
              </span>
              <span className="text-slate-400 text-[11px]">
                Immediately queries Hindsight for past resolutions and prompts Groq LLM.
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={autoInvestigate}
            onChange={(e) => setAutoInvestigate(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/incidents')}
            className="px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Submitting & Investigating...' : 'Submit Incident & Triage'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
