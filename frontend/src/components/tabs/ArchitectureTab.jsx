import React, { useState } from 'react';
import {
  Database,
  ScanSearch,
  Lock,
  ShieldCheck,
  Building2,
  KeyRound,
  Send,
  FileCheck2,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  Server
} from 'lucide-react';

export default function ArchitectureTab({ onSelectTab }) {
  const [activeStep, setActiveStep] = useState(null);

  const steps = [
    {
      id: 1,
      title: '1. Data Sources',
      sub: 'Operational Databases / CSV Ingestion',
      icon: Database,
      color: 'bg-blue-50 border-blue-200 text-blue-700',
      description: 'Raw customer data residing in source_store.customers. Contains plaintext PII (name, email, 10-digit mobile, city, segment). Normal downstream applications have ZERO direct access.',
      tab: 'batch'
    },
    {
      id: 2,
      title: '2. Discovery & Classification',
      sub: 'Automated Profiling & Sensitivity Assessment',
      icon: ScanSearch,
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      description: 'Heuristic & regex PII scanner evaluating sample records. Computes confidence scores, identifies entity types (PHONE_NUMBER, EMAIL_ADDRESS, PERSON_NAME), and assigns protection actions.',
      tab: 'discovery'
    },
    {
      id: 3,
      title: '3. Protection Processing',
      sub: 'FPE, Tokenization & Ingestion',
      icon: Lock,
      color: 'bg-purple-50 border-purple-200 text-purple-700',
      description: 'Executes chunked, idempotent batch transformations. Phone numbers encrypted with pyffx FF1 (preserving strictly 10 digits). Emails and names tokenized with deterministic HMAC-SHA256.',
      tab: 'policy'
    },
    {
      id: 4,
      title: '4. Protected Data Store',
      sub: 'De-identified Database (protected_store)',
      icon: ShieldCheck,
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      description: 'Physical & logical schema separation. Contains only de-identified customer records (name_token, email_token, mobile_fpe). Safe for all downstream applications and CSV exports.',
      tab: 'customers'
    },
    {
      id: 5,
      title: '5. Business Applications',
      sub: 'Marketing, Analytics & Support',
      icon: Building2,
      color: 'bg-amber-50 border-amber-200 text-amber-700',
      description: 'Downstream business workflows consume protected_store directly. Analytics run on tokens and FPE integers with 0% PII exposure, proving complete referential usability.',
      tab: 'governance'
    },
    {
      id: 6,
      title: '6. Privacy Gateway',
      sub: 'Control Point & Secure Mapping Vault',
      icon: KeyRound,
      color: 'bg-rose-50 border-rose-200 text-rose-700',
      description: 'Single gatekeeper holding AES-256-GCM vault keys. Resolves tokens strictly in volatile RAM for authorized actions. Downstream apps never touch vault_store directly.',
      tab: 'campaign'
    },
    {
      id: 7,
      title: '7. External Execution',
      sub: 'Blind Email / SMS & Webhook Remapping',
      icon: Send,
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      description: 'Dispatches real emails via Mailpit SMTP using recipient tokens. Inbound provider bounce callbacks are reverse-resolved and updated without storing raw PII downstream.',
      tab: 'webhook'
    },
    {
      id: 8,
      title: '8. Governance & Audit',
      sub: 'PBAC Exception Reveal & Immutable Trail',
      icon: FileCheck2,
      color: 'bg-teal-50 border-teal-200 text-teal-700',
      description: 'Policy-Based Access Control allows plaintext decryption only by exception for verified tickets. All attempts (ACCESS_GRANTED & ACCESS_DENIED) are immutably logged in audit_store.',
      tab: 'reveal'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden bg-gradient-to-r from-white via-indigo-50/20 to-slate-50 border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                SECTION 5 SPECIFICATION
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Flyyy.AI Privacy Data Protection Platform
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Target End-to-End System Flow Architecture
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Demonstrates the core architectural principle: <strong className="text-indigo-600">"PROTECTED BY DEFAULT. REVEAL OR USE PLAINTEXT ONLY BY EXCEPTION."</strong> Downstream systems operate exclusively on de-identified tokens and format-preserving encrypted data.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab('discovery')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all"
            >
              <span>Explore Interactive Screens</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 8-Stage Interactive Architecture Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step) => {
          const Icon = step.icon;
          const isSelected = activeStep === step.id;
          return (
            <div
              key={step.id}
              onClick={() => setActiveStep(isSelected ? null : step.id)}
              className={`glass-panel p-5 rounded-2xl border transition-all cursor-pointer hover:translate-y-[-2px] relative flex flex-col justify-between ${
                isSelected ? 'border-indigo-500 shadow-md ring-1 ring-indigo-300 bg-indigo-50/30' : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl border ${step.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    STAGE {step.id}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 tracking-tight">{step.title}</h3>
                <p className="text-[11px] font-semibold text-indigo-600 mt-0.5">{step.sub}</p>

                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTab(step.tab);
                  }}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                >
                  Open Screen &rarr;
                </button>
                <span className="text-[10px] font-mono text-slate-400 font-medium">Live Backend API</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Target Flow Legend & Core Principles Banner */}
      <div className="glass-panel p-5 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4 border border-slate-200">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Direct Access Strictly Blocked</h4>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Downstream applications never directly query <code className="text-rose-600 font-semibold">vault_store</code> or <code className="text-rose-600 font-semibold">source_store</code>. All operational requests route through the Privacy Gateway.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 shrink-0">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Format & Referential Integrity</h4>
            <p className="text-[11px] text-slate-600 mt-0.5">
              10-digit phone numbers retain exact numeric structure via FF1 FPE. Deterministic tokens allow cross-dataset analytics without revealing original identities.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 shrink-0">
            <FileCheck2 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Tamper-Evident PBAC Auditing</h4>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Decryption is an exception requiring purpose justification and ticket reference. Both granted and denied attempts are immutably logged to <code className="text-amber-700 font-semibold">audit_logs</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
