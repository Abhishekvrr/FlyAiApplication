import React from 'react';
import {
  Network,
  ScanSearch,
  Sliders,
  Cpu,
  ShieldCheck,
  Send,
  RotateCcw,
  KeyRound,
  FileCheck2,
  Sparkles
} from 'lucide-react';

export const TABS = [
  { id: 'architecture', name: 'Target Flow Architecture', icon: Network, badge: 'Section 5' },
  { id: 'discovery', name: 'Data Discovery', icon: ScanSearch, badge: null },
  { id: 'policy', name: 'Protection Policies & Sandbox', icon: Sliders, badge: 'POST /protect' },
  { id: 'batch', name: 'Batch Pipeline Monitor', icon: Cpu, badge: null },
  { id: 'customers', name: 'Protected Customer Store', icon: ShieldCheck, badge: 'Live DB' },
  { id: 'campaign', name: 'Blind Marketing Execution', icon: Send, badge: null },
  { id: 'webhook', name: 'Bounce Webhook Remapping', icon: RotateCcw, badge: null },
  { id: 'reveal', name: 'Controlled Exception Reveal', icon: KeyRound, badge: 'PBAC' },
  { id: 'governance', name: 'Audit Trail & Analytics', icon: FileCheck2, badge: null },
];

export default function Navigation({ activeTab, onSelectTab, onOpenTour }) {
  return (
    <div className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-[64px] z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 py-2">
          
          {/* Scrollable Tabs */}
          <nav className="flex space-x-1.5 overflow-x-auto no-scrollbar flex-1 py-1" aria-label="Tabs">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
                  <span>{tab.name}</span>
                  {tab.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                        isActive
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* 13-Point Guided Tour Button */}
          <button
            type="button"
            onClick={onOpenTour}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold shrink-0 shadow-2xs transition-all"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span className="hidden md:inline">13-Point Tour</span>
            <span className="md:hidden">Tour</span>
          </button>

        </div>
      </div>
    </div>
  );
}
