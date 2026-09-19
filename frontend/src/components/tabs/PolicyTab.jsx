import React, { useState, useEffect } from 'react';
import { Sliders, Play, CheckCircle2, Shield, Lock, EyeOff, Save, RefreshCw, Sparkles, Database } from 'lucide-react';
import { api } from '../../services/api';

export default function PolicyTab() {
  const [policies, setPolicies] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Controlled Testing Sandbox State
  const [testValue, setTestValue] = useState('9876543210');
  const [testPolicy, setTestPolicy] = useState('FPE');
  const [testPiiType, setTestPiiType] = useState('PHONE');
  const [sandboxResult, setSandboxResult] = useState(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxError, setSandboxError] = useState(null);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const data = await api.getPolicies();
      setPolicies(data.policies || {});
    } catch (err) {
      console.error('Failed to load policies', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handlePolicyChange = (field, newAction) => {
    setPolicies((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        action: newAction,
      },
    }));
  };

  const handleSavePolicies = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.updatePolicies(policies);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save protection policies');
    } finally {
      setSaving(false);
    }
  };

  const handleRunSandbox = async (e) => {
    e.preventDefault();
    setSandboxLoading(true);
    setSandboxError(null);
    setSandboxResult(null);

    try {
      const result = await api.protectSandbox(testValue, testPolicy, testPiiType);
      setSandboxResult(result);
    } catch (err) {
      setSandboxError(err.response?.data?.detail || err.message || 'Sandbox test failed.');
    } finally {
      setSandboxLoading(false);
    }
  };

  const setSandboxPreset = (val, pol, ptype) => {
    setTestValue(val);
    setTestPolicy(pol);
    setTestPiiType(ptype);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="h-5 w-5 text-indigo-600" />
            Protection Policy Configuration & Controlled Testing Sandbox
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Complies with Section 20 Screen 3 &amp; Section 16 (<code>POST /api/protect</code>).
            Allows administrators to choose FPE, Tokenization, Encryption, or Passthrough per field, and test protection on arbitrary inputs.
          </p>
        </div>

        <button
          onClick={handleSavePolicies}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving Policies...
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              Save Configured Policies
            </>
          )}
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Protection policies successfully updated and synchronized with batch pipeline!</span>
        </div>
      )}

      {/* Grid: Policy Store Table + Controlled Testing Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Policy Configuration Table */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-5 space-y-4 border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs uppercase font-bold text-slate-800 tracking-wider flex items-center gap-1.5">
              <Database className="h-4 w-4 text-indigo-600" />
              Field-Level Transformation Policy Store
            </h3>
            <span className="text-[10px] font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              meta_store.policy_store
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(policies).map(([field, meta]) => (
              <div
                key={field}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-900">{field}</span>
                    <span className="text-[10px] font-mono text-slate-500">({meta.type})</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">{meta.description}</p>
                </div>

                <select
                  value={meta.action}
                  onChange={(e) => handlePolicyChange(field, e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-indigo-950 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                >
                  <option value="FPE">FPE (FF1 Radix-10)</option>
                  <option value="TOKENIZE">TOKENIZE (HMAC-SHA256)</option>
                  <option value="PASSTHROUGH">PASSTHROUGH (Keep)</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Controlled Testing Sandbox (POST /api/protect) */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-5 space-y-4 border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs uppercase font-bold text-slate-800 tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-600" />
              Controlled Testing Sandbox (POST /api/protect)
            </h3>
            <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              TABLE 16 API
            </span>
          </div>

          {/* Preset Buttons */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
              Sample Protection Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSandboxPreset('9876543210', 'FPE', 'PHONE')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
              >
                10-Digit Mobile (FPE)
              </button>
              <button
                type="button"
                onClick={() => setSandboxPreset('alice.smith@example.com', 'TOKENIZE', 'EMAIL')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-indigo-800 hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
              >
                Email (Tokenize)
              </button>
              <button
                type="button"
                onClick={() => setSandboxPreset('John Smith', 'TOKENIZE', 'NAME')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-blue-800 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                Full Name (Tokenize)
              </button>
              <button
                type="button"
                onClick={() => setSandboxPreset('9876543210', 'MASK', 'PHONE')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                UI Mask (98*****210)
              </button>
            </div>
          </div>

          {/* Test Form */}
          <form onSubmit={handleRunSandbox} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Input Plaintext Value
              </label>
              <input
                type="text"
                required
                value={testValue}
                onChange={(e) => setTestValue(e.target.value)}
                placeholder="e.g. 9876543210 or user@example.com"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Protection Policy
                </label>
                <select
                  value={testPolicy}
                  onChange={(e) => setTestPolicy(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-medium"
                >
                  <option value="FPE">FPE (FF1 Format-Preserving)</option>
                  <option value="TOKENIZE">TOKENIZE (Deterministic HMAC)</option>
                  <option value="ENCRYPT">ENCRYPT (AES-256-GCM Vault)</option>
                  <option value="MASK">MASK (UI Preview Masking)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  PII Entity Type
                </label>
                <select
                  value={testPiiType}
                  onChange={(e) => setTestPiiType(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-medium"
                >
                  <option value="PHONE">PHONE</option>
                  <option value="EMAIL">EMAIL</option>
                  <option value="NAME">NAME</option>
                  <option value="GENERAL">GENERAL</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={sandboxLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
            >
              {sandboxLoading ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Testing Transformation...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-white" />
                  Execute Sandbox Protection (POST /api/protect)
                </>
              )}
            </button>
          </form>

          {sandboxError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {sandboxError}
            </div>
          )}

          {sandboxResult && (
            <div className="p-4 rounded-xl bg-slate-50 border border-indigo-200 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-semibold">Protected Output:</span>
                {sandboxResult.format_preserved ? (
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                    FORMAT PRESERVED (10 DIGITS)
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">
                    PSEUDONYMIZED
                  </span>
                )}
              </div>

              <div className="p-3 rounded-lg bg-white border border-slate-200 font-mono text-sm font-bold text-indigo-950 selection:bg-indigo-500 selection:text-white break-all shadow-xs">
                {sandboxResult.protected_value}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-600">
                <div>Original Length: <span className="text-slate-900 font-bold">{sandboxResult.input_length} chars</span></div>
                <div>Protected Length: <span className="text-slate-900 font-bold">{sandboxResult.output_length} chars</span></div>
                <div>Policy: <span className="text-amber-800 font-bold">{sandboxResult.policy_applied}</span></div>
                <div>Reversible via Vault: <span className={sandboxResult.is_reversible_via_vault ? 'text-emerald-700 font-bold' : 'text-slate-500'}>{sandboxResult.is_reversible_via_vault ? 'Yes (Controlled)' : 'No'}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
