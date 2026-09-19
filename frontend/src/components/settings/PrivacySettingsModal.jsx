import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Shield, KeyRound, Lock, CheckCircle2, AlertCircle, RefreshCw, X, Save, Sliders, Database, Eye } from 'lucide-react';

export const PrivacySettingsModal = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form controls
  const [enforce2FA, setEnforce2FA] = useState(true);
  const [strictGateway, setStrictGateway] = useState(true);
  const [autoMask, setAutoMask] = useState(true);
  const [auditLogging, setAuditLogging] = useState(true);
  const [retentionDays, setRetentionDays] = useState(90);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPrivacySettings();
      setSettings(data);
      if (data.controls) {
        setEnforce2FA(data.controls.enforce_2fa_for_reveal ?? true);
        setStrictGateway(data.controls.strict_gateway_mode ?? true);
        setAutoMask(data.controls.auto_mask_ui_previews ?? true);
        setAuditLogging(data.controls.audit_logging_enabled ?? true);
        setRetentionDays(data.controls.data_retention_days ?? 90);
      }
    } catch (err) {
      setError('Failed to load privacy and cryptographic configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await api.updatePrivacySettings({
        enforce_2fa_for_reveal: enforce2FA,
        strict_gateway_mode: strictGateway,
        auto_mask_ui_previews: autoMask,
        audit_logging_enabled: auditLogging,
        data_retention_days: Number(retentionDays),
      });
      setSuccess('Privacy governance configuration updated successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update privacy settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50/80 via-white to-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Privacy & Security Settings
              </h3>
              <p className="text-xs text-slate-600">
                Cryptographic Key Fingerprints, Governance Rules & 2FA Enforcement
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
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
              <p className="text-xs">Loading cryptographic parameters...</p>
            </div>
          ) : (
            <>
              {/* Section 1: Cryptographic Key Fingerprints */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  Active Cryptographic Key Fingerprints
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                  {/* FPE Key */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[11px] font-sans font-semibold text-slate-700 mb-1">
                      FF1 FPE Cipher Key
                    </div>
                    <div className="text-indigo-900 font-bold tracking-wider">
                      {settings?.cryptographic_fingerprints?.fpe_scheme?.key_fingerprint || 'fpe_...7890'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-sans mt-1">
                      Radix-10 • 10-digit preserved
                    </div>
                  </div>

                  {/* Vault AES Key */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[11px] font-sans font-semibold text-slate-700 mb-1">
                      Vault AES-256-GCM
                    </div>
                    <div className="text-indigo-900 font-bold tracking-wider">
                      {settings?.cryptographic_fingerprints?.vault_scheme?.key_fingerprint || 'aes_...3344'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-sans mt-1">
                      256-bit AEAD • 96-bit Nonce
                    </div>
                  </div>

                  {/* Token Pepper */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[11px] font-sans font-semibold text-slate-700 mb-1">
                      HMAC Token Pepper
                    </div>
                    <div className="text-indigo-900 font-bold tracking-wider">
                      {settings?.cryptographic_fingerprints?.token_scheme?.pepper_fingerprint || 'pep_...9988'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-sans mt-1">
                      HMAC-SHA256 • Collision-resistant
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Privacy & Security Governance Controls */}
              <form onSubmit={handleSave} className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pt-2 border-t border-slate-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  Policy Enforcements & 2FA Controls
                </h4>

                <div className="space-y-3">
                  {/* Enforce 2FA toggle */}
                  <div className="p-3.5 bg-indigo-50/50 border border-indigo-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>Mandatory Two-Factor Authentication (2FA) for Reveal API</span>
                        <span className="px-2 py-0.5 text-[10px] bg-indigo-100 text-indigo-700 font-bold rounded">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Requires operators to verify identity via 6-digit Mailpit OTP prior to any plaintext unmasking.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enforce2FA}
                        onChange={(e) => setEnforce2FA(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Strict Gateway Mode */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Strict Gateway Isolation Mode
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Blocks consumer endpoints from directly connecting to `source_store` or `vault_store`.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={strictGateway}
                        onChange={(e) => setStrictGateway(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Audit Logging */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Immutable Audit Logging
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Logs all data access, token reveals, and security policy checks to `audit_store.audit_logs`.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={auditLogging}
                        onChange={(e) => setAuditLogging(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Retention Window */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Audit Log Retention Period
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Regulatory compliance window for audit event archival.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={30}
                        max={365}
                        value={retentionDays}
                        onChange={(e) => setRetentionDays(e.target.value)}
                        className="w-20 px-2 py-1 border border-slate-300 rounded text-xs text-right font-mono bg-white text-slate-900"
                      />
                      <span className="text-xs text-slate-600 font-medium">Days</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Security Policies
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
