import React, { useState, useEffect } from 'react';
import { Shield, Server, Database, Mail, UserCheck, ChevronDown, KeyRound, Sparkles, UserPlus, HelpCircle, Lock } from 'lucide-react';
import { useRole } from '../context/RoleContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Header({ onOpenAddCustomer, onOpenSettings, onOpenAuth, onOpenTour }) {
  const { role, roleKey, setRoleKey, allRoles } = useRole();
  const { currentUser, is2FAVerified } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const [checking, setChecking] = useState(true);

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
    <header className="border-b border-slate-200 bg-white/95 sticky top-0 z-40 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          {/* Brand & Philosophy */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  Flyy.AI
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  PRIVACY CDP
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Lock className="w-3 h-3" />
                  2FA Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                <span className="text-indigo-600 font-semibold">Protected by Default</span>,{' '}
                <span className="text-amber-600 font-semibold">Reveal by Exception</span>
              </p>
            </div>
          </div>

          {/* Action Bar & Role Switcher */}
          <div className="flex items-center flex-wrap gap-2.5">
            
            {/* Quick Actions */}
            <button
              onClick={onOpenAddCustomer}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Customer
            </button>

            <button
              onClick={onOpenSettings}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              Privacy & 2FA
            </button>

            <button
              onClick={onOpenTour}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              Architecture Tour
            </button>

            {/* Health Indicators */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-600">
              <div className="flex items-center gap-1.5" title="FastAPI Privacy Gateway">
                <Server className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-500">Gateway:</span>
                <span className="flex items-center gap-1 font-mono">
                  <span className={`h-2 w-2 rounded-full ${apiOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  <span className={apiOnline ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                    {checking ? 'Checking' : apiOnline ? ':8000' : 'Offline'}
                  </span>
                </span>
              </div>

              <span className="text-slate-300">|</span>

              <div className="flex items-center gap-1.5" title="Mailpit SMTP Service">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-500">Mailpit:</span>
                <a
                  href="http://localhost:8025"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold font-mono underline"
                >
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  :8025
                </a>
              </div>
            </div>

            {/* User Login / Auth Modal Trigger */}
            <button
              onClick={onOpenAuth}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
              title="Manage User & Two-Factor Authentication"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{currentUser?.full_name?.split(' ')[0] || 'User'}</span>
            </button>

            {/* Persistent Role Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${role.badgeColor} hover:shadow-xs`}
              >
                <UserCheck className="h-4 w-4" />
                <span>{role.name}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                    <div className="px-3.5 py-2 border-b border-slate-100 bg-slate-50">
                      <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
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

        </div>
      </div>
    </header>
  );
}
