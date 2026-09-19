import React, { useState, useEffect } from 'react';
import { FileCheck2, BarChart3, RefreshCw, ShieldAlert, CheckCircle2, XCircle, Search, Filter, PieChart, MapPin, Users } from 'lucide-react';
import { api } from '../../services/api';

export default function GovernanceTab() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsData, analyticsData] = await Promise.all([
        api.getAuditLogs({ limit: 100 }),
        api.getAnalyticsSummary(),
      ]);
      setAuditLogs(logsData || []);
      setAnalytics(analyticsData || null);
    } catch (err) {
      console.error('Failed to load governance and analytics data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLogs = auditLogs.filter((log) => {
    if (outcomeFilter && log.outcome !== outcomeFilter) return false;
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      log.actor.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.purpose.toLowerCase().includes(q) ||
      log.reference.toLowerCase().includes(q)
    );
  });

  const getOutcomeBadge = (outcome) => {
    switch (outcome) {
      case 'ACCESS_GRANTED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            ACCESS_GRANTED
          </span>
        );
      case 'ACCESS_DENIED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
            <XCircle className="h-3 w-3 text-rose-600" />
            ACCESS_DENIED
          </span>
        );
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
            <CheckCircle2 className="h-3 w-3 text-indigo-600" />
            SUCCESS
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-mono font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
            {outcome}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-indigo-600" />
            Governance, Immutable Audit Trail & Referential Analytics
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Tamper-evident logs in <code className="text-indigo-700 bg-slate-100 px-1.5 py-0.5 rounded font-mono font-semibold">audit_store.audit_logs</code> record every PII operation.
            Referential analytics prove high-value business intelligence operates seamlessly across tokenized datasets.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-semibold text-slate-700 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Governance Data
        </button>
      </div>

      {/* Proof of Usability Explanatory Badge */}
      <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Proof of Usability:</strong> High-value business analytics executed directly across deterministic tokens and FPE columns with 0% PII exposure.
          </span>
        </div>
        <span className="hidden sm:inline-block text-[10px] font-mono text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
          Zero-Plaintext BI
        </span>
      </div>

      {/* Section B: Referential Integrity Analytics */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Customers by Segment */}
          <div className="glass-panel p-4 rounded-xl space-y-3 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-purple-600" />
                Customer Segments
              </span>
              <span className="text-xs font-mono font-bold text-purple-700">
                {analytics.total_customers} Total
              </span>
            </div>
            <div className="space-y-2">
              {Object.entries(analytics.by_segment || {}).map(([seg, count]) => {
                const pct = Math.round((count / (analytics.total_customers || 1)) * 100);
                return (
                  <div key={seg} className="text-xs">
                    <div className="flex justify-between text-slate-700 mb-1">
                      <span className="font-medium">{seg}</span>
                      <span className="font-mono text-slate-500">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Health */}
          <div className="glass-panel p-4 rounded-xl space-y-3 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <PieChart className="h-4 w-4 text-indigo-600" />
                Delivery Health Status
              </span>
              <span className="text-xs font-mono text-indigo-700 font-bold">
                Clean vs Bounced
              </span>
            </div>
            <div className="space-y-2">
              {Object.entries(analytics.by_bounce_status || {}).map(([status, count]) => {
                const pct = Math.round((count / (analytics.total_customers || 1)) * 100);
                const isClean = status === 'CLEAN';
                return (
                  <div key={status} className="text-xs">
                    <div className="flex justify-between text-slate-700 mb-1">
                      <span className={isClean ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-bold'}>{status}</span>
                      <span className="font-mono text-slate-500">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isClean ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Geographic Distribution */}
          <div className="glass-panel p-4 rounded-xl space-y-3 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-600" />
                Geographic Footprint
              </span>
              <span className="text-xs font-mono text-slate-500 font-medium">Top Metros</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(analytics.by_city || {}).slice(0, 6).map(([city, count]) => (
                <div key={city} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-700 font-medium">{city}</span>
                  <span className="font-mono text-indigo-700 font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section A: Immutable Audit Log Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 shadow-2xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
              Immutable Access Audit Trail
            </span>
            <span className="text-[11px] text-slate-500">
              Querying <code className="text-indigo-700 font-semibold">audit_store.audit_logs</code> (Showing {filteredLogs.length} events)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3 w-3 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                placeholder="Search actor, action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            >
              <option value="">All Outcomes</option>
              <option value="ACCESS_GRANTED">ACCESS_GRANTED</option>
              <option value="ACCESS_DENIED">ACCESS_DENIED</option>
              <option value="SUCCESS">SUCCESS</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 uppercase text-[11px] font-bold text-slate-600 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Resource / Subject</th>
                <th className="px-4 py-3">Purpose</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-8 text-center text-slate-500 text-xs">
                    {loading ? 'Fetching audit trail...' : 'No audit records found.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {log.actor}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-semibold">
                        {log.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-indigo-700 font-medium">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {log.resource_id || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-[11px]">
                      {log.purpose}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                      {log.reference || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getOutcomeBadge(log.outcome)}
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
