import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Shield, Sparkles, UserPlus, CheckCircle2, AlertCircle, RefreshCw, X, ArrowRight, Lock, Key, Database } from 'lucide-react';
import { soundFX } from '../../utils/audio';

export const AddCustomerModal = ({ isOpen, onClose, onCustomerCreated }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [segment, setSegment] = useState('Premium');
  const [autoProtect, setAutoProtect] = useState(true);

  // Live preview states
  const [previewFpe, setPreviewFpe] = useState('—');
  const [previewToken, setPreviewToken] = useState('—');
  const [previewLoading, setPreviewLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdResult, setCreatedResult] = useState(null);

  // Debounced live preview calculation
  useEffect(() => {
    let active = true;
    const cleanPhone = mobile.replace(/\D/g, '');

    if (cleanPhone.length === 10) {
      setPreviewLoading(true);
      api.protectSandbox(cleanPhone, 'FPE', 'PHONE')
        .then((res) => {
          if (active) setPreviewFpe(res.protected_value);
        })
        .catch(() => {})
        .finally(() => {
          if (active) setPreviewLoading(false);
        });
    } else {
      setPreviewFpe('— (Enter 10 digits)');
    }

    if (email && email.includes('@')) {
      api.protectSandbox(email, 'TOKENIZE', 'EMAIL')
        .then((res) => {
          if (active) setPreviewToken(res.protected_value);
        })
        .catch(() => {});
    } else {
      setPreviewToken('— (Enter valid email)');
    }

    return () => {
      active = false;
    };
  }, [mobile, email]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCreatedResult(null);

    const cleanPhone = mobile.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Mobile number must be exactly 10 digits for FF1 Radix-10 Format-Preserving Encryption.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.createSourceCustomer({
        name,
        email,
        mobile: cleanPhone,
        city,
        segment,
        auto_protect: autoProtect,
      });
      setCreatedResult(res);
      soundFX.playSuccessChime();
      if (onCustomerCreated) onCustomerCreated(res);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create customer record.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setMobile('');
    setCreatedResult(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50/80 via-white to-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Add New Customer Record
              </h3>
              <p className="text-xs text-slate-600">
                Permanent PostgreSQL Ingestion with Live Cryptographic De-Identification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {/* Permanent Database Storage Guarantee Banner */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-50/90 via-blue-50/80 to-slate-50 border border-indigo-200/90 text-xs flex items-start gap-2.5 shadow-2xs">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Database className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span>Guaranteed Permanent PostgreSQL Storage</span>
                <span className="text-[9px] font-mono font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                  Active DB Commit
                </span>
              </div>
              <p className="text-slate-600 text-[11px] mt-0.5 leading-snug">
                Customer records are committed to disk in PostgreSQL (<code className="font-mono text-indigo-700 font-semibold">cdp_platform</code>). Your data persists permanently across server restarts and browser reloads.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!createdResult ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vikram Joshi"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address (PII)
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vikram.joshi@example.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Phone (10 Digits)
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City Location
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Pune">Pune</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Segment
                  </label>
                  <select
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Premium">Premium</option>
                    <option value="Standard">Standard</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              {/* Real-time In-Flight Cryptographic Transformation Card */}
              <div className="bg-slate-50 border border-indigo-100 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Live Privacy Gateway De-identification Preview
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-indigo-100 text-indigo-700">
                    Real-time FF1 & HMAC
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                    <div className="text-[10px] text-slate-500 font-sans font-semibold mb-1 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-indigo-600" />
                      FF1 Radix-10 Phone Ciphertext:
                    </div>
                    <div className="text-indigo-900 font-bold tracking-wide break-all">
                      {previewLoading ? 'Encrypting...' : previewFpe}
                    </div>
                    <div className="text-[9px] text-slate-400 font-sans mt-0.5">
                      Preserves 10 numeric digits format for telecom compatibility
                    </div>
                  </div>

                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                    <div className="text-[10px] text-slate-500 font-sans font-semibold mb-1 flex items-center gap-1">
                      <Key className="w-3 h-3 text-indigo-600" />
                      Deterministic Email Token:
                    </div>
                    <div className="text-indigo-900 font-bold tracking-wide break-all">
                      {previewToken}
                    </div>
                    <div className="text-[9px] text-slate-400 font-sans mt-0.5">
                      HMAC-SHA256 Peppered deterministic pseudonym
                    </div>
                  </div>
                </div>
              </div>

              {/* Auto Protect Checkbox */}
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={autoProtect}
                  onChange={(e) => setAutoProtect(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium">
                  Auto-protect and sync to Protected CDP Store immediately
                </span>
              </label>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Ingest & Apply Protection'}
                </button>
              </div>
            </form>
          ) : (
            /* SUCCESS CONFIRMATION VIEW */
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 flex items-start gap-3 shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold">Permanently Stored in PostgreSQL Database!</h4>
                    <span className="text-[10px] font-mono bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                      Committed to Disk
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    Customer record <span className="font-mono font-bold text-slate-900 bg-white/90 px-1.5 py-0.5 rounded border border-emerald-200">{createdResult.source_record?.customer_id}</span> has been permanently saved in PostgreSQL (<code className="font-mono font-semibold">cdp_platform</code>) and transformed into the Protected CDP Store. You can reopen the application anytime; your records persist.
                  </p>
                </div>
              </div>


              {/* Side by side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                {/* Source Store */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[11px] font-sans font-bold text-slate-800 pb-1.5 mb-2 border-b border-slate-200 flex items-center justify-between">
                    <span>source_store.customers</span>
                    <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-medium">
                      Raw Plaintext
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-700 text-[11px]">
                    <div>ID: <span className="font-bold">{createdResult.source_record?.customer_id}</span></div>
                    <div>Name: <span>{createdResult.source_record?.name}</span></div>
                    <div>Email: <span className="text-amber-800 font-semibold">{createdResult.source_record?.email}</span></div>
                    <div>Mobile: <span className="text-amber-800 font-semibold">{createdResult.source_record?.mobile}</span></div>
                    <div>City: <span>{createdResult.source_record?.city}</span></div>
                  </div>
                </div>

                {/* Protected Store */}
                <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl">
                  <div className="text-[11px] font-sans font-bold text-indigo-950 pb-1.5 mb-2 border-b border-indigo-100 flex items-center justify-between">
                    <span>protected_store.customers</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-medium">
                      De-identified Safe
                    </span>
                  </div>
                  <div className="space-y-1 text-indigo-900 text-[11px]">
                    <div>ID: <span className="font-bold">{createdResult.protected_preview?.customer_id}</span></div>
                    <div>Name Token: <span className="text-indigo-700">{createdResult.protected_preview?.name_token}</span></div>
                    <div>Email Token: <span className="text-indigo-700">{createdResult.protected_preview?.email_token}</span></div>
                    <div>Mobile FPE: <span className="text-indigo-700">{createdResult.protected_preview?.mobile_fpe}</span></div>
                    <div>Status: <span className="text-emerald-700 font-bold">{createdResult.protected_preview?.bounce_status}</span></div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  + Add Another Customer
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  View in Protected Customers Table
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
