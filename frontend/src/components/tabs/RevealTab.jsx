import React, { useState } from 'react';
import { KeyRound, ShieldAlert, CheckCircle2, XCircle, Lock, AlertTriangle, FileText, UserCheck } from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import { api } from '../../services/api';

export default function RevealTab() {
  const { role } = useRole();
  const [customerId, setCustomerId] = useState('C001');
  const [field, setField] = useState('EMAIL');
  const [purpose, setPurpose] = useState('CUSTOMER_SUPPORT');
  const [ticketRef, setTicketRef] = useState('TICKET-98214');
  const [requesting, setRequesting] = useState(false);
  const [result, setResult] = useState(null);
  const [deniedError, setDeniedError] = useState(null);

  const handleReveal = async (e) => {
    e.preventDefault();
    setRequesting(true);
    setResult(null);
    setDeniedError(null);

    const payload = {
      customer_id: customerId.trim(),
      field: field,
      actor: role.actorName,
      role: role.id,
      purpose: purpose,
      reference: ticketRef.trim(),
    };

    try {
      const data = await api.requestReveal(payload);
      setResult({
        ...data,
        timestamp: new Date().toLocaleTimeString(),
        actor: role.actorName,
        roleName: role.name,
      });
    } catch (err) {
      const errData = err.response?.data?.detail || err.message;
      setDeniedError({
        status: err.response?.status || 500,
        message: typeof errData === 'object' ? errData.detail || 'Access Denied' : errData,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-600" />
                Controlled Exception Reveal
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                PBAC Enforced
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Dual-custody exception unmasking &bull; Requires declared purpose, authorized role, and ticket reference
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
            <UserCheck className="h-4 w-4 text-indigo-600" />
            <div className="text-left">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">Current Acting Role</span>
              <span className="text-xs font-bold text-slate-900">{role.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: PBAC Exception Form */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl space-y-4 border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs uppercase font-bold text-slate-800 tracking-wider">
              Request Plaintext Decryption
            </h3>
            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              POST /api/reveal
            </span>
          </div>

          <form onSubmit={handleReveal} className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-700">
                  Customer Identifier
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Quick Suggestions:</span>
              </div>

              {/* Quick Suggested Customer ID Pills */}
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                {['C052', 'C053', 'C001', 'C002'].map((cid) => (
                  <button
                    key={cid}
                    type="button"
                    onClick={() => setCustomerId(cid)}
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border transition-all ${
                      customerId === cid
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {cid === 'C052' ? '★ C052 (Your Record)' : cid}
                  </button>
                ))}
              </div>

              <input
                type="text"
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="e.g. C052, C001..."
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>


            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Target Sensitive Field
              </label>
              <select
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="EMAIL">EMAIL (Vault AES-GCM Decryption)</option>
                <option value="PHONE">PHONE (FPE FF1 Decryption)</option>
                <option value="NAME">NAME (Vault AES-GCM Decryption)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Declared Business Purpose
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="CUSTOMER_SUPPORT">CUSTOMER_SUPPORT (Authorized for Support/Admin)</option>
                <option value="FRAUD_INVESTIGATION">FRAUD_INVESTIGATION (Authorized for Admin/Auditor)</option>
                <option value="REGULATORY_AUDIT">REGULATORY_AUDIT (Authorized for Auditor/Admin)</option>
                <option value="MARKETING_OPTIMIZATION">MARKETING_OPTIMIZATION (Unauthorized / Denied)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Mandatory Ticket / Incident Reference
              </label>
              <input
                type="text"
                required
                value={ticketRef}
                onChange={(e) => setTicketRef(e.target.value)}
                placeholder="e.g. TICKET-10492"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={requesting}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
            >
              {requesting ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying Policy & Decrypting...
                </>
              ) : (
                <>
                  <KeyRound className="h-3.5 w-3.5 fill-white" />
                  Request Plaintext Exception
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Execution & Security Feedback */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl space-y-4 border border-slate-200">
          <h3 className="text-xs uppercase font-bold text-slate-800 tracking-wider border-b border-slate-100 pb-3 flex items-center justify-between">
            <span>PBAC Decision & Decrypted Output</span>
            <span className="text-[10px] text-slate-500 font-mono">Policy: strict_purpose_role_binding</span>
          </h3>

          {!result && !deniedError && (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
              <Lock className="h-8 w-8 text-slate-400 mb-2" />
              <span className="font-semibold text-slate-600">Awaiting reveal request. Submit the exception form to evaluate policy.</span>
              <span className="text-[11px] text-slate-400 mt-1">
                Tip: Switch roles in the top header to test both authorized and denied scenarios.
              </span>
            </div>
          )}

          {/* ACCESS DENIED Feedback */}
          {deniedError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2.5 text-sm font-bold text-rose-700">
                <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                <span>ACCESS DENIED (HTTP {deniedError.status} FORBIDDEN)</span>
              </div>
              <p className="text-xs text-rose-800 font-medium leading-relaxed">
                {deniedError.message}
              </p>
              <div className="p-3 rounded-lg bg-white border border-rose-200 text-[11px] font-mono text-slate-700 space-y-1">
                <div>Violation Reason: Role <strong className="text-rose-700">{role.name}</strong> or Purpose <strong className="text-rose-700">{purpose}</strong> not in allowlist.</div>
                <div>Audit Log: <span className="text-rose-700 font-bold">ACCESS_DENIED</span> written to audit_store.audit_logs at {deniedError.timestamp}.</div>
              </div>
            </div>
          )}

          {/* ACCESS GRANTED Feedback */}
          {result && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>ACCESS GRANTED (HTTP 200 OK)</span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                  {result.timestamp}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Decrypted Plaintext Value ({result.field})
                </span>
                <span className="text-xl font-mono font-extrabold text-emerald-950 selection:bg-emerald-500 selection:text-white">
                  {result.plaintext_value}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600 bg-white p-3 rounded-lg border border-emerald-200">
                <div>Customer ID: <span className="text-slate-900 font-bold">{result.customer_id}</span></div>
                <div>Authorized By: <span className="text-emerald-700 font-bold">{result.actor}</span></div>
                <div>Role: <span className="text-slate-700">{result.roleName}</span></div>
                <div>Audit Stamp: <span className="text-emerald-700 font-bold">ACCESS_GRANTED</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
