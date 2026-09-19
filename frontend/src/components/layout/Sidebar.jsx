import React from 'react';
import {
  Shield,
  ShieldCheck,
  Layers,
  Database,
  Send,
  RotateCcw,
  KeyRound,
  ScrollText,
  HelpCircle,
  Settings,
  ArrowLeft,
  Lock,
  Sparkles,
  UserPlus
} from 'lucide-react';

export const SIDEBAR_ITEMS = [
  {
    id: 'discovery',
    name: 'Discovery & Policies',
    icon: ShieldCheck,
    badge: 'Profiler',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    description: 'PII detection, sensitivity analysis & rule sandbox'
  },
  {
    id: 'batch',
    name: 'Batch Processing',
    icon: Layers,
    badge: 'Engine',
    badgeColor: 'bg-blue-100 text-blue-700',
    description: 'High-throughput FPE encryption & vault ingestion'
  },
  {
    id: 'customers',
    name: 'Protected Store & CSV',
    icon: Database,
    badge: 'Zero PII',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    description: 'Downstream de-identified records & clean CSV exports'
  },
  {
    id: 'campaign',
    name: 'Marketing Blind Dispatch',
    icon: Send,
    badge: 'Proxy',
    badgeColor: 'bg-cyan-100 text-cyan-800',
    description: 'Execute campaigns using tokens with 0% email exposure'
  },
  {
    id: 'webhook',
    name: 'Bounce Remapping Webhook',
    icon: RotateCcw,
    badge: 'HMAC',
    badgeColor: 'bg-purple-100 text-purple-700',
    description: 'Reverse-resolve provider bounce events to tokens'
  },
  {
    id: 'reveal',
    name: 'Controlled Reveal',
    icon: KeyRound,
    badge: 'PBAC',
    badgeColor: 'bg-amber-100 text-amber-800',
    description: 'Dual-custody exception unmasking with ticket justification'
  },
  {
    id: 'governance',
    name: 'Audit & Analytics',
    icon: ScrollText,
    badge: 'Immutable',
    badgeColor: 'bg-slate-200 text-slate-700',
    description: 'Tamper-evident logs & referential integrity metrics'
  }
];

export default function Sidebar({
  activeTab,
  onSelectTab,
  onReturnToIntro,
  onOpenTour,
  onOpenSettings,
  onOpenAddCustomer
}) {
  return (
    <aside className="w-64 bg-[#f0f5fc]/95 backdrop-blur-md border-r border-[#cbd5e1] flex flex-col h-screen sticky top-0 z-30 select-none shadow-sm">
      
      {/* Brand & Platform Identity Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-base">Flyy.AI</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  CDP
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
                Zero-Plaintext Vault
              </p>
            </div>
          </div>
        </div>

        {/* Prominent High-Visibility Add Customer CTA */}
        <div className="mt-3 pt-3 border-t border-slate-200/80">
          <button
            type="button"
            onClick={onOpenAddCustomer}
            className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-2.5 sm:p-3 text-left text-white shadow-md shadow-indigo-300/40 hover:shadow-lg hover:shadow-indigo-400/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border border-indigo-500/50"
            title="Add a new customer: permanently written to PostgreSQL and encrypted"
          >
            {/* Glowing gradient aura */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/20 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="relative flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform shadow-xs">
                <UserPlus className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs tracking-tight text-white block">
                    + Add Customer
                  </span>
                  <span className="text-[8px] font-mono font-bold bg-white/25 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">
                    PostgreSQL
                  </span>
                </div>
                <p className="text-[10px] text-indigo-100/90 font-medium truncate mt-0.5">
                  Permanent DB &bull; Auto-Vault
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Core Workspaces
        </div>

        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-600'
                  }`}
                />
                <span className="truncate text-left">{item.name}</span>
              </div>

              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 font-bold ${
                  isActive ? 'bg-indigo-700/80 text-white' : item.badgeColor
                }`}
              >
                {item.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Utility & Context Navigation */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-1">
        {/* Return to Intro / Architecture */}
        <button
          type="button"
          onClick={onReturnToIntro}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-white text-xs font-semibold transition-all border border-transparent hover:border-slate-200 shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-indigo-600" />
          <span>Landing &amp; Intro View</span>
        </button>

        {/* Guided Tour */}
        <button
          type="button"
          onClick={onOpenTour}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white text-xs font-semibold transition-all border border-transparent hover:border-slate-200 shadow-2xs"
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
          <span>13-Point Guided Tour</span>
        </button>

        {/* Privacy & Key Fingerprints */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white text-xs font-semibold transition-all border border-transparent hover:border-slate-200 shadow-2xs"
        >
          <Settings className="w-3.5 h-3.5 text-slate-500" />
          <span>Privacy &amp; 2FA Settings</span>
        </button>
      </div>

    </aside>
  );
}
