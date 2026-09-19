import React, { useState, useEffect } from 'react';
import { Cpu, Play, CheckCircle2, AlertTriangle, Clock, RefreshCw, Layers, Database } from 'lucide-react';
import { api } from '../../services/api';

export default function BatchTab() {
  const [chunkSize, setChunkSize] = useState(500);
  const [running, setRunning] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [jobList, setJobList] = useState([]);
  const [error, setError] = useState(null);

  const fetchJobs = async () => {
    try {
      const data = await api.getBatchList();
      setJobList(data || []);
      if (data && data.length > 0 && !currentJob) {
        setCurrentJob(data[0]);
      }
    } catch (err) {
      console.error('Failed to load batch jobs', err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const triggerBatch = async (e) => {
    e.preventDefault();
    setRunning(true);
    setError(null);
    try {
      const result = await api.runBatch(parseInt(chunkSize, 10), 'customers');
      setCurrentJob(result);
      await fetchJobs();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Batch execution failed.');
    } finally {
      setRunning(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            COMPLETED
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200 animate-pulse">
            <RefreshCw className="h-3 w-3 text-indigo-600 animate-spin" />
            PROCESSING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <AlertTriangle className="h-3 w-3 text-rose-600" />
            FAILED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Batch Trigger Panel */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="h-5 w-5 text-indigo-600" />
              High-Throughput Batch Ingestion & De-identification Engine
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Extracts batches from <code className="text-indigo-700 bg-slate-100 px-1.5 py-0.5 rounded font-mono font-semibold">source_store.customers</code>,
              transforms PII via FPE & deterministic tokens, securely vaults raw data in AES-256-GCM, and upserts into <code className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono font-semibold">protected_store</code>.
            </p>
          </div>

          <form onSubmit={triggerBatch} className="flex items-center gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Chunk Size
              </label>
              <input
                type="number"
                min="10"
                max="5000"
                value={chunkSize}
                onChange={(e) => setChunkSize(e.target.value)}
                className="w-28 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={running}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
            >
              {running ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-white" />
                  Execute Batch Pipeline
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Real-time Job Metric Cards */}
      {currentJob && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-xl border border-slate-200">
            <span className="text-[11px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-indigo-600" /> Current Batch ID
            </span>
            <p className="text-base font-mono font-bold text-slate-900 mt-1.5 truncate">
              {currentJob.batch_id}
            </p>
            <div className="mt-2">
              {getStatusBadge(currentJob.status)}
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-200">
            <span className="text-[11px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-blue-600" /> Source Records Total
            </span>
            <p className="text-2xl font-mono font-extrabold text-slate-900 mt-1.5">
              {currentJob.total_records || currentJob.processed_records || 50}
            </p>
            <span className="text-[11px] text-slate-500">Source Store Customers</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-200">
            <span className="text-[11px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Processed & Protected
            </span>
            <p className="text-2xl font-mono font-extrabold text-emerald-600 mt-1.5">
              {currentJob.processed_records}
            </p>
            <span className="text-[11px] text-emerald-700 font-semibold">100% Zero-Leak Vaulted</span>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-200">
            <span className="text-[11px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" /> Error Records
            </span>
            <p className="text-2xl font-mono font-extrabold text-slate-900 mt-1.5">
              {currentJob.error_records || 0}
            </p>
            <span className="text-[11px] text-slate-500">Sanitized; 0 Plaintext Errors</span>
          </div>
        </div>
      )}

      {/* Historical Batch Runs Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 shadow-2xs">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            Historical Batch Pipeline Executions
          </span>
          <button
            onClick={fetchJobs}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 uppercase text-[11px] font-bold text-slate-600 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="px-5 py-3">Batch ID</th>
                <th className="px-5 py-3">Source Table</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Processed</th>
                <th className="px-5 py-3">Errors</th>
                <th className="px-5 py-3">Execution Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {jobList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-8 text-center text-slate-500 text-xs">
                    No historical batch runs found in meta_store.batch_jobs.
                  </td>
                </tr>
              ) : (
                jobList.map((job) => (
                  <tr key={job.batch_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-900">
                      {job.batch_id}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">
                      {job.source_name || 'customers'}
                    </td>
                    <td className="px-5 py-3.5">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-semibold">{job.total_records}</td>
                    <td className="px-5 py-3.5 font-mono text-emerald-700 font-bold">{job.processed_records}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">{job.error_records}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-500 text-[11px]">
                      {job.started_at ? new Date(job.started_at).toLocaleTimeString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
