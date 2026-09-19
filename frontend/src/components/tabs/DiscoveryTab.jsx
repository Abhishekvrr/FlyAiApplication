import React, { useState, useEffect } from 'react';
import { ScanSearch, Play, AlertCircle, CheckCircle2, Shield, Lock, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

export default function DiscoveryTab() {
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState([]);
  const [sampleCount, setSampleCount] = useState(0);
  const [error, setError] = useState(null);

  const runScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.discoverPII(20);
      setColumns(data.columns || []);
      setSampleCount(data.sample_count || 0);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Discovery scan failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runScan();
  }, []);

  const getActionBadge = (action) => {
    switch (action) {
      case 'FPE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Lock className="h-3 w-3 text-emerald-600" />
            FPE (FF1 Radix-10)
          </span>
        );
      case 'TOKENIZE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <Shield className="h-3 w-3 text-indigo-600" />
            HMAC Deterministic Token
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Passthrough
          </span>
        );
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'PHONE_NUMBER':
        return <span className="text-xs font-mono font-bold text-emerald-700">PHONE_NUMBER</span>;
      case 'EMAIL_ADDRESS':
        return <span className="text-xs font-mono font-bold text-indigo-700">EMAIL_ADDRESS</span>;
      case 'PERSON_NAME':
        return <span className="text-xs font-mono font-bold text-blue-700">PERSON_NAME</span>;
      default:
        return <span className="text-xs font-mono font-medium text-slate-500">NON_SENSITIVE</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with trigger button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ScanSearch className="h-5 w-5 text-indigo-600" />
            PII Discovery & Protection Policy Profiler
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Automated schema inspection of raw data in <code className="text-indigo-700 bg-slate-100 px-1.5 py-0.5 rounded font-mono font-semibold">source_store.customers</code>.
            Recommends cryptographic protection rules based on statistical sampling.
          </p>
        </div>

        <button
          type="button"
          onClick={runScan}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Scanning Schema...
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-white" />
              Run Discovery Scan
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Discovery Results Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 shadow-2xs">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            Detected Source Columns ({columns.length})
          </span>
          <span className="text-xs text-slate-500">
            Sample records analyzed: <strong className="text-indigo-700">{sampleCount}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 uppercase text-[11px] font-bold text-slate-600 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="px-5 py-3">Column Name</th>
                <th className="px-5 py-3">Detected PII Entity</th>
                <th className="px-5 py-3">Confidence Meter</th>
                <th className="px-5 py-3">Recommended Policy</th>
                <th className="px-5 py-3">Client-Safe Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {columns.length === 0 && !loading ? (
                <tr>
                  <td colSpan="5" className="px-5 py-8 text-center text-slate-500 text-xs">
                    No column profiling data available. Click "Run Discovery Scan" to analyze source records.
                  </td>
                </tr>
              ) : (
                columns.map((col) => {
                  const confPct = Math.round((col.confidence || 0) * 100);
                  return (
                    <tr key={col.column_name} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                        {col.column_name}
                      </td>
                      <td className="px-5 py-3.5">
                        {getTypeBadge(col.detected_type)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full transition-all"
                              style={{ width: `${confPct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-semibold text-slate-600">{confPct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {getActionBadge(col.suggested_action)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs px-2 py-1 rounded bg-slate-100 border border-slate-200 text-indigo-950 font-medium">
                          {col.masked_preview || '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Policy Mapping Explanation Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl border-l-4 border-emerald-500 border-slate-200">
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-emerald-600" />
            Format-Preserving Encryption (FF1)
          </h4>
          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
            Enforced on mobile numbers. Preserves strictly 10 numeric digits, enabling legacy database compatibility and analytics without exposing actual subscriber digits.
          </p>
        </div>

        <div className="glass-panel p-4 rounded-xl border-l-4 border-indigo-500 border-slate-200">
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-indigo-600" />
            Deterministic Tokenization (HMAC)
          </h4>
          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
            Enforced on email addresses and names. Preserves relational joins across disparate datasets while raw values are locked in the isolated AES-256-GCM vault.
          </p>
        </div>

        <div className="glass-panel p-4 rounded-xl border-l-4 border-slate-400 border-slate-200">
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-slate-500" />
            Passthrough De-identification
          </h4>
          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
            City, segment, and anonymous customer IDs are non-identifiable and pass through unchanged to enable full-fidelity BI segmentation.
          </p>
        </div>
      </div>
    </div>
  );
}
