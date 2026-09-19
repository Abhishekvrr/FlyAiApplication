import React, { useState } from 'react';
import { RotateCcw, Play, CheckCircle2, ArrowRight, ShieldCheck, Database, Layers, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

const PRESETS = [
  {
    label: 'Customer C001 (Aarav Sharma)',
    email: 'aarav.sharma1@example.com',
    event: 'BOUNCE',
    reason: 'MAILBOX_NOT_FOUND'
  },
  {
    label: 'Customer C002 (Priya Nair)',
    email: 'priya.nair2@example.com',
    event: 'BOUNCE',
    reason: 'DOMAIN_REJECTED'
  },
  {
    label: 'Customer C003 (Rajesh Iyer)',
    email: 'rajesh.iyer3@example.com',
    event: 'BOUNCE',
    reason: 'SPAM_COMPLAINT'
  }
];

export default function WebhookTab() {
  const [email, setEmail] = useState(PRESETS[0].email);
  const [event, setEvent] = useState(PRESETS[0].event);
  const [reason, setReason] = useState(PRESETS[0].reason);
  const [simulating, setSimulating] = useState(false);
  const [resolutionResult, setResolutionResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSimulate = async (e) => {
    e.preventDefault();
    setSimulating(true);
    setError(null);
    setResolutionResult(null);

    const payload = { email, event, reason };

    try {
      const response = await api.sendBounceWebhook(payload);
      setResolutionResult({
        ...response,
        incomingEmail: email,
        reason: reason,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Webhook simulation failed.');
    } finally {
      setSimulating(false);
    }
  };

  const applyPreset = (preset) => {
    setEmail(preset.email);
    setEvent(preset.event);
    setReason(preset.reason);
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-indigo-600" />
          Inbound Webhook Reverse-Resolution & Bounce Remapping
        </h2>
        <p className="text-xs text-slate-600 mt-1">
          When external email service providers (SendGrid, SES, Mailgun) return bounce or complaint callbacks with raw emails,
          the Privacy Gateway <strong>deterministically remaps the raw address to its token</strong> and updates customer state without persisting raw PII downstream.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Webhook Simulator Form */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl space-y-4 border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs uppercase font-bold text-slate-800 tracking-wider">
              Simulate Inbound ESP Callback
            </h3>
            <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              POST /api/webhooks/email
            </span>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Quick Customer Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] font-medium text-slate-700 transition-colors"
                >
                  {p.label.split('(')[0]}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSimulate} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Raw Inbound Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Event Type
                </label>
                <select
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="BOUNCE">BOUNCE</option>
                  <option value="COMPLAINT">COMPLAINT</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Bounce Reason Code
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={simulating}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
            >
              {simulating ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Resolving Reverse Token...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-white" />
                  Simulate Provider Webhook
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Right Column: 3-Step Live Reverse Resolution Flow */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl space-y-4 border border-slate-200">
          <h3 className="text-xs uppercase font-bold text-slate-800 tracking-wider border-b border-slate-100 pb-3">
            Real-Time Reverse Resolution Flow
          </h3>

          <div className="space-y-3">
            {/* Step 1 */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                1
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-900">Inbound Webhook Received</span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  External callback received with email: <strong className="font-mono text-indigo-700">{email}</strong>
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
              resolutionResult
                ? 'bg-indigo-50/70 border-indigo-300'
                : 'bg-slate-50 border-slate-200 opacity-70'
            }`}>
              <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                2
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-indigo-950">Deterministic Token Derivation</span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Calculates HMAC-SHA256 with pepper without querying raw database:
                </p>
                {resolutionResult ? (
                  <div className="mt-2 p-2 rounded bg-white font-mono text-xs text-indigo-900 border border-indigo-200 flex items-center justify-between">
                    <span>Resolved Token: <strong>{resolutionResult.recipient_token}</strong></span>
                    <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">MATCHED</span>
                  </div>
                ) : (
                  <span className="text-[11px] font-mono text-slate-500 italic">Waiting for webhook trigger...</span>
                )}
              </div>
            </div>

            {/* Step 3 */}
            <div className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
              resolutionResult
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-slate-50 border-slate-200 opacity-70'
            }`}>
              <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                3
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-emerald-950">Protected Store Bounce Flag Updated</span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Executes SQL update directly in <code className="text-emerald-800 font-bold">protected_store.customers_protected</code> setting <code className="text-rose-700 font-bold">bounce_status = 'BOUNCED'</code>.
                </p>
                {resolutionResult && (
                  <div className="mt-2 text-[11px] text-emerald-900 flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Customer successfully marked as <strong>BOUNCED</strong>. Raw PII was never inserted downstream!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
