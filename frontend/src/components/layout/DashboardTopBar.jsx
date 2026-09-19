import React, { useState, useEffect } from 'react';
import {
  Server,
  Mail,
  UserCheck,
  ChevronDown,
  Lock,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  KeyRound,
  UserPlus
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { SIDEBAR_ITEMS } from './Sidebar';

export default function DashboardTopBar({
  activeTab,
  onReturnToIntro,
  onOpenAddCustomer,
  onOpenSettings,
  onOpenAuth
}) {
  const { role, roleKey, setRoleKey, allRoles } = useRole();
  const { currentUser } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const [checking, setChecking] = useState(true);

  const currentItem = SIDEBAR_ITEMS.find((i) => i.id === activeTab) || {
    name: 'Secure Console',
    description: 'Privacy-Preserving Customer Data Platform'
  };

  useEffect(() => {
    let mounted = true;
    async function checkBackend() {
      try {
        await api.checkHealth();
        if (mounted) setApiOnline(true);
      } catch (e) {
        if (mounted) setApiOnline(false);
      } finally {
        if (mounted) setChecking(false);
      }
    }

    checkBackend();
    const timer = setInterval(checkBackend, 10000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <header className="h-16 bg-[#f0f5fc]/95 backdrop-blur-md border-b border-[#cbd5e1] sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      
      {/* Current Workspace Breadcrumb */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-none">
              {currentItem.name}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Lock className="w-2.5 h-2.5" />
              Protected Store Active
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium hidden md:block mt-0.5 truncate max-w-md">
            {currentItem.description}
          </p>
        </div>
      </div>

      {/* Right Controls & Role Switcher */}
      <div className="flex items-center gap-2.5">
        
        {/* Live System Health Pills */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-600">
          <div className="flex items-center gap-1.5" title="FastAPI Privacy Gateway">
            <Server className="h-3 w-3 text-slate-400" />
            <span className="text-[11px] text-slate-500">Gateway:</span>
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <span className={`h-2 w-2 rounded-full ${apiOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className={apiOnline ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                {checking ? 'Checking' : apiOnline ? ':8000' : 'Offline'}
              </span>
            </span>
          </div>

          <span className="text-slate-300">|</span>

          <div className="flex items-center gap-1.5" title="Mailpit SMTP Service">
            <Mail className="h-3 w-3 text-slate-400" />
            <span className="text-[11px] text-slate-500">Mailpit:</span>
            <a
              href="http://localhost:8025"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold font-mono text-[11px] underline"
            >
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              :8025
            </a>
          </div>
        </div>

        {/* Prominent Add Customer CTA */}
        <button
          onClick={onOpenAddCustomer}
          className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md hover:shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
          title="Add a new customer to PostgreSQL database"
        >
          <UserPlus className="w-4 h-4 text-white" />
          <span>+ Add Customer</span>
        </button>

        {/* View Intro Button */}
        <button
          onClick={onReturnToIntro}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          title="Return to Animated Intro & Architecture"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">Intro</span>
        </button>

        {/* Persistent Role Switcher Dropdown (PBAC) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-2xs ${role.badgeColor} hover:shadow-xs`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span className="truncate max-w-[120px]">{role.name}</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in">
                <div className="px-3.5 py-2 border-b border-slate-100 bg-slate-50">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Switch Security Persona (PBAC)
                  </p>
                </div>
                {Object.values(allRoles).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setRoleKey(r.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition-colors flex flex-col gap-0.5 ${
                      r.id === roleKey ? 'bg-indigo-50/70 border-l-3 border-indigo-600' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{r.name}</span>
                      {r.revealAllowed ? (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 rounded font-semibold">
                          Reveal OK
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-1.5 rounded font-semibold">
                          Blind Only
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{r.description}</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

      </div>

    </header>
  );
}
