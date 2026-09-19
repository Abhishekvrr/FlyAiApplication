import React, { useState } from 'react';
import { Shield, ArrowRight, Lock, Database, Mail, Eye, KeyRound, Sparkles, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';

export const HeroExplainer = ({ onOpenAddCustomer, onOpenTour, onOpenSettings }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [isExpanded, setIsExpanded] = useState(true);

  const steps = [
    {
      step: 1,
      title: '1. Ingest Raw PII',
      icon: Database,
      badge: 'Source Store',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      description: 'Incoming customer data (names, 10-digit phone numbers, emails) lands in the isolated source schema.',
      sample: {
        label: 'Raw Customer Input',
        phone: '9876543210',
        email: 'alice.sharma@example.com',
        name: 'Alice Sharma',
      },
    },
    {
      step: 2,
      title: '2. Privacy Gateway De-identification',
      icon: Shield,
      badge: 'FF1 FPE + HMAC Tokens + AES Vault',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      description: 'The cryptographic engine transforms PII in-flight. Phones get format-preserving encrypted; emails and names get deterministically tokenized.',
      sample: {
        label: 'Cryptographic Transformations',
        phone: '3948271049 (FF1 Radix-10: 10 Digits)',
        email: 'EMAIL_8B4A9C12 (Deterministic Token)',
        vault: 'AES-256-GCM Vault Sealed',
      },
    },
    {
      step: 3,
      title: '3. Protected CDP Analytics & Execution',
      icon: Lock,
      badge: 'Protected Store',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      description: 'Internal dashboards, analysts, and marketing work exclusively with protected tokens. Safe actions (like email campaigns) dispatch securely.',
      sample: {
        label: 'Safe Queryable Record',
        phone: '3948271049 (Zero Leakage)',
        email: 'EMAIL_8B4A9C12',
        status: 'CLEAN / Segments Active',
      },
    },
    {
      step: 4,
      title: '4. Controlled Reveal by Exception',
      icon: Eye,
      badge: 'PBAC + 2FA + Audit Log',
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      description: 'Plaintext is NEVER shown by default. Only authorized roles with valid business justification and 2FA can reveal specific fields with full audit trails.',
      sample: {
        label: 'Audited Unmasking',
        role: 'PRIVACY_ADMIN only',
        log: 'Immutable entry in audit_store',
        vault_read: 'AES-256-GCM decrypted once',
      },
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 overflow-hidden transition-all duration-300">
      {/* Header bar */}
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-50/70 via-white to-slate-50/50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                How Flyyy.AI Privacy-Preserving CDP Works
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                Protected by Default
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Interactive Architectural Walkthrough • Zero Plaintext Exposure Across Application Layers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenAddCustomer && onOpenAddCustomer()}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Add Customer Data
          </button>
          <button
            onClick={() => onOpenSettings && onOpenSettings()}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
            Privacy Settings
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            {isExpanded ? 'Collapse' : 'Expand Flow'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6">
          {/* Step Selector Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {steps.map((item) => {
              const Icon = item.icon;
              const isActive = activeStep === item.step;
              return (
                <button
                  key={item.step}
                  onClick={() => setActiveStep(item.step)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-indigo-50/80 border-indigo-400 shadow-sm ring-1 ring-indigo-300'
                      : 'bg-slate-50/60 hover:bg-slate-100/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${item.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-bold ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
                        {item.title}
                      </span>
                    </div>
                    {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active Flow Visualization Card */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
              {/* Left explanation */}
              <div className="md:w-1/2 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-600 text-white rounded">
                    Step {activeStep} of 4
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {steps[activeStep - 1].title}
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {steps[activeStep - 1].description}
                </p>

                <div className="pt-2 flex items-center gap-3">
                  {activeStep > 1 && (
                    <button
                      onClick={() => setActiveStep(activeStep - 1)}
                      className="text-xs text-slate-600 hover:text-slate-900 font-medium underline"
                    >
                      ← Previous Phase
                    </button>
                  )}
                  {activeStep < 4 ? (
                    <button
                      onClick={() => setActiveStep(activeStep + 1)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md shadow-sm flex items-center gap-1"
                    >
                      Next: {steps[activeStep].title}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveStep(1)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-md shadow-sm flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Restart Walkthrough
                    </button>
                  )}
                </div>
              </div>

              {/* Right Live Simulation Box */}
              <div className="md:w-1/2 bg-white rounded-lg p-4 border border-slate-200 shadow-sm font-mono text-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-800 uppercase tracking-wider">
                    {steps[activeStep - 1].sample.label}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                    {steps[activeStep - 1].badge}
                  </span>
                </div>

                <div className="space-y-1.5 text-slate-700">
                  {Object.entries(steps[activeStep - 1].sample).map(([k, v]) => {
                    if (k === 'label') return null;
                    return (
                      <div key={k} className="flex justify-between items-center py-1 px-2 rounded bg-slate-50 border border-slate-100">
                        <span className="text-slate-600 capitalize font-medium">{k}:</span>
                        <span className="text-indigo-900 font-bold">{v}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
