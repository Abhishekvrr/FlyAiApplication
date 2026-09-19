import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, KeyRound, Mail, Lock, User, CheckCircle2, AlertCircle, ArrowRight, ExternalLink, RefreshCw, X } from 'lucide-react';

export const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { login, complete2FA, register, switchPersona, DEMO_USERS, currentUser } = useAuth();

  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | '2fa' | 'personas'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('PRIVACY_ADMIN');
  const [otpCode, setOtpCode] = useState('');
  const [pendingChallenge, setPendingChallenge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await login(email, password);
      if (res.status === '2FA_REQUIRED') {
        setPendingChallenge(res);
        setMode('2fa');
        setOtpCode(res.demo_code || '');
        setSuccessMsg(`2FA code generated and dispatched to ${email}!`);
      } else {
        setSuccessMsg('Login successful!');
        setTimeout(() => onClose(), 600);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (e) => {
    e?.preventDefault();
    if (!pendingChallenge) return;
    setLoading(true);
    setError(null);

    try {
      const res = await complete2FA(pendingChallenge.challenge_id, otpCode);
      if (res.status === 'AUTHENTICATED') {
        setSuccessMsg('Two-Factor Authentication verified successfully!');
        setTimeout(() => {
          onClose();
        }, 700);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await register({
        full_name: fullName,
        email,
        password,
        role,
      });
      setPendingChallenge(res);
      setMode('2fa');
      setSuccessMsg(`Account created! 2FA code sent to ${email}.`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Account registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPersona = (personaKey) => {
    switchPersona(personaKey);
    setSuccessMsg(`Switched active user to ${DEMO_USERS[personaKey].full_name} (${personaKey})`);
    setTimeout(() => onClose(), 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-50/80 via-white to-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {mode === '2fa' && 'Two-Factor Authentication'}
                {mode === 'login' && 'User Authentication'}
                {mode === 'register' && 'Create Enterprise Account'}
                {mode === 'personas' && 'Switch Active Role'}
              </h3>
              <p className="text-xs text-slate-600">
                {mode === '2fa' ? 'Verify identity via OTP' : 'Role-Based Access Control (RBAC/PBAC)'}
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

        {/* Tab switchers */}
        <div className="px-6 pt-4 pb-2 flex gap-2 border-b border-slate-100 bg-slate-50/60">
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'login'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setError(null); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'register'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            New User
          </button>
          <button
            onClick={() => { setMode('personas'); setError(null); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mode === 'personas'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Demo Personas
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@flyyy.ai"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Authenticate & Send 2FA OTP'}
                </button>
              </div>

              {/* Quick Fill Demo Credentials */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] text-slate-500 mb-2 font-medium">Quick-fill Demo Credentials:</p>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => { setEmail('admin@flyyy.ai'); setPassword('admin123'); }}
                    className="py-1 px-2 text-left bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded text-slate-700 text-[11px]"
                  >
                    Admin: <span className="font-mono text-indigo-600">admin123</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmail('support@flyyy.ai'); setPassword('support123'); }}
                    className="py-1 px-2 text-left bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded text-slate-700 text-[11px]"
                  >
                    Support: <span className="font-mono text-indigo-600">support123</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* 2. REGISTRATION FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alice Sharma"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alice@flyyy.ai"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role Assignment
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="PRIVACY_ADMIN">PRIVACY_ADMIN (Full Audit & Reveal)</option>
                  <option value="CUSTOMER_SUPPORT">CUSTOMER_SUPPORT (Masked + Support Reveal)</option>
                  <option value="MARKETING">MARKETING (Protected Segments Only)</option>
                  <option value="AUDITOR">AUDITOR (Read-Only Compliance & Logs)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Register User & Issue 2FA'}
                </button>
              </div>
            </form>
          )}

          {/* 3. 2FA VERIFICATION FORM */}
          {mode === '2fa' && (
            <form onSubmit={handle2FAVerify} className="space-y-4">
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg text-xs text-indigo-900">
                <div className="font-semibold mb-1 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  2FA OTP Dispatched via Mailpit
                </div>
                <p className="text-[11px] text-indigo-700 leading-relaxed mb-2">
                  A 6-digit authentication token has been generated and sent to <span className="font-semibold">{pendingChallenge?.email}</span>.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href="http://localhost:8025"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold underline"
                  >
                    Open Mailpit Web Inbox (:8025)
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {pendingChallenge?.demo_code && (
                    <span className="text-[11px] text-slate-500">
                      • Demo OTP: <span className="font-mono font-bold text-indigo-600">{pendingChallenge.demo_code}</span>
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enter 6-Digit 2FA Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full text-center tracking-widest font-mono text-lg py-2.5 border-2 border-indigo-300 rounded-lg bg-white text-indigo-950 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm 2FA & Enter Platform'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          )}

          {/* 4. DEMO PERSONAS QUICK SWITCHER */}
          {mode === 'personas' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-600 mb-3">
                Switch instantly between pre-configured enterprise personas to test RBAC and PBAC policies:
              </p>
              {Object.entries(DEMO_USERS).map(([roleKey, persona]) => {
                const isSelected = currentUser?.role === roleKey;
                return (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => handleQuickPersona(roleKey)}
                    className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-400 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{persona.full_name}</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {roleKey}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{persona.email}</p>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
