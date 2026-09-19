import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  KeyRound,
  ArrowRight,
  Send,
  Database,
  ScanSearch,
  ScrollText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  HelpCircle,
  RefreshCw,
  Cpu,
  Volume2
} from 'lucide-react';
import Interactive3DBackground from './Interactive3DBackground';
import { soundFX } from '../../utils/audio';

const SAMPLE_TRANSFORMATIONS = [
  {
    rawName: 'Alice Sharma',
    rawEmail: 'alice.sharma@example.com',
    rawPhone: '9876543210',
    tokenName: 'NAME_E7B1A940',
    tokenEmail: 'EMAIL_8B4A9C12',
    fpePhone: '3948271049',
    city: 'Bengaluru',
    segment: 'Premium'
  },
  {
    rawName: 'Rohan Gupta',
    rawEmail: 'rohan.gupta@corp.org',
    rawPhone: '9123456789',
    tokenName: 'NAME_C3A894D1',
    tokenEmail: 'EMAIL_F158D7C9',
    fpePhone: '7829104523',
    city: 'Mumbai',
    segment: 'Enterprise'
  },
  {
    rawName: 'Priya Iyer',
    rawEmail: 'priya.iyer@fintech.io',
    rawPhone: '9845012345',
    tokenName: 'NAME_B5927F38',
    tokenEmail: 'EMAIL_3389DC1A',
    fpePhone: '5610943821',
    city: 'Chennai',
    segment: 'Standard'
  }
];

export default function IntroLandingView({
  onLaunchConsole,
  onOpenTour,
  onNavigateTab,
  onReplaySplash
}) {
  const [activeSampleIndex, setActiveSampleIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLockOpen, setIsLockOpen] = useState(false);
  const [isUnlockingTransition, setIsUnlockingTransition] = useState(false);
  const [selectedPipelineStep, setSelectedPipelineStep] = useState(1);

  const currentSample = SAMPLE_TRANSFORMATIONS[activeSampleIndex];

  // Auto-cycle simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsProcessing(true);
      setTimeout(() => {
        setActiveSampleIndex((prev) => (prev + 1) % SAMPLE_TRANSFORMATIONS.length);
        setIsProcessing(false);
      }, 400);
    }, 5500);
    return () => clearInterval(interval);
  }, []);

  const triggerManualCycle = () => {
    soundFX.playClick();
    setIsProcessing(true);
    setTimeout(() => {
      setActiveSampleIndex((prev) => (prev + 1) % SAMPLE_TRANSFORMATIONS.length);
      setIsProcessing(false);
    }, 350);
  };

  // Launch Console with Mechanical Lock Opening Animation & Web Audio Sound
  const handleLaunchWithLockOpening = () => {
    if (isUnlockingTransition) return;

    // Trigger audio
    soundFX.playLockOpen();

    // Trigger visual lock spring open & shockwave
    setIsLockOpen(true);
    setIsUnlockingTransition(true);

    // Smooth transition to console after sound and shackle animation complete
    setTimeout(() => {
      onLaunchConsole();
    }, 850);
  };

  // Toggle lock manually for testing
  const toggleLockManually = () => {
    if (!isLockOpen) {
      soundFX.playLockOpen();
      setIsLockOpen(true);
    } else {
      soundFX.playClick();
      setIsLockOpen(false);
    }
  };

  const pipelineSteps = [
    {
      step: 1,
      title: 'Discover & Classify',
      tabId: 'discovery',
      icon: ScanSearch,
      badge: 'Automated Profiler',
      color: 'bg-indigo-100/90 border-indigo-300 text-indigo-800',
      description: 'Scans source schemas to detect raw emails, 10-digit mobile numbers, and personal names with confidence scoring.',
      benefit: 'Identifies PII vulnerability surface before ingestion.'
    },
    {
      step: 2,
      title: 'Protect & Vault',
      tabId: 'batch',
      icon: Lock,
      badge: 'FF1 FPE & AES-256',
      color: 'bg-emerald-100/90 border-emerald-300 text-emerald-800',
      description: 'Preserves 10-digit telephone format via FF1 FPE while sealing deterministic HMAC tokens in hardware-isolated vault storage.',
      benefit: 'Zero plaintext stored in downstream operational layers.'
    },
    {
      step: 3,
      title: 'Blind Execution',
      tabId: 'campaign',
      icon: Send,
      badge: 'Token Proxy Gateway',
      color: 'bg-cyan-100/90 border-cyan-300 text-cyan-800',
      description: 'Marketing campaigns and automated messages dispatch through the gateway proxy using tokens with zero plaintext exposure.',
      benefit: 'Delivers real customer communications without leaking addresses.'
    },
    {
      step: 4,
      title: 'Audited Reveal Exception',
      tabId: 'reveal',
      icon: KeyRound,
      badge: 'PBAC & Immutable Trail',
      color: 'bg-purple-100/90 border-purple-300 text-purple-800',
      description: 'Decryption is locked by default and permitted strictly by exception for verified tickets with permanent audit trail logging.',
      benefit: 'Meets GDPR, HIPAA, and DPDP strict privacy mandates.'
    }
  ];

  return (
    <div className="relative min-h-screen flex flex-col bg-[#eaf0fa] overflow-hidden text-slate-900 selection:bg-indigo-500 selection:text-white">
      
      {/* 1. True 3D Spatial Canvas Moving Background (Not 2D rotating circles) */}
      <Interactive3DBackground />

      {/* Cyber Grid Texture Overlay for High-Tech Feel */}
      <div className="absolute inset-0 bg-cyber-grid opacity-70 pointer-events-none z-0" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-300/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-cyan-300/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Floating Glass Navigation Header */}
      <header className="relative z-20 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-2">
        <div className="flex items-center justify-between glass-panel px-5 py-3 rounded-2xl border border-slate-300/80 shadow-sm">
          
          {/* Logo & Platform Tag */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-300">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-900">
                  Flyy<span className="text-indigo-600">.AI</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">
                  PRIVACY CDP
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                Cryptographic Zero-Plaintext Vault Platform
              </p>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2.5">
            {onReplaySplash && (
              <button
                onClick={onReplaySplash}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e2eaf6] hover:bg-[#d5e2f3] text-indigo-900 border border-indigo-200 text-xs font-semibold shadow-2xs transition-all"
                title="Replay DATA. CONVERT. SECURE. Opening Reveal"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Replay Intro</span>
              </button>
            )}

            <button
              onClick={onOpenTour}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#edf3fc] hover:bg-[#e2eaf6] text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>13-Point Tour</span>
            </button>

            {/* Launch Console CTA with Lock Opening Action */}
            <button
              onClick={handleLaunchWithLockOpening}
              disabled={isUnlockingTransition}
              className="group relative inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-300 transition-all hover:shadow-indigo-400 hover:translate-y-[-1px] disabled:opacity-80"
            >
              {isLockOpen ? (
                <Unlock className="w-3.5 h-3.5 text-emerald-300 animate-bounce" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-white" />
              )}
              <span>{isUnlockingTransition ? 'Opening Vault...' : 'Launch Secure Console'}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Showcase */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col justify-center">
        
        {/* Core Headline & Mission */}
        <div className="text-center max-w-3xl mx-auto space-y-3.5 pt-2 pb-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-100/90 border border-indigo-300 text-indigo-800 text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>NIST SP 800-38G FF1 Format-Preserving Encryption Engine</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Privacy-Preserving <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-indigo-600 to-cyan-600">
              Customer Data Platform
            </span>
          </h1>

          <p className="text-sm sm:text-base font-bold text-slate-800 tracking-wide">
            Core Philosophy:{' '}
            <span className="text-indigo-700 font-extrabold underline decoration-indigo-400 decoration-2">
              Protected by Default.
            </span>{' '}
            <span className="text-amber-800 font-extrabold underline decoration-amber-400 decoration-2">
              Reveal by Exception.
            </span>
          </p>

          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Eliminate PII data breach liabilities across analytics, machine learning, and marketing pipelines.
            Customer records are de-identified in-flight at the perimeter, with raw identities locked in a hardware-isolated vault.
          </p>

          {/* Primary CTA Buttons with Vault Audio & Animation */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleLaunchWithLockOpening}
              disabled={isUnlockingTransition}
              className="group flex items-center gap-2.5 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-300/90 transition-all hover:shadow-indigo-400 hover:translate-y-[-1px] disabled:opacity-80"
            >
              {isLockOpen ? (
                <Unlock className="w-4 h-4 text-emerald-300 animate-pulse" />
              ) : (
                <Lock className="w-4 h-4 text-white" />
              )}
              <span>{isUnlockingTransition ? 'Vault Opening...' : 'Launch Secure Console'}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={onOpenTour}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#edf3fc] hover:bg-[#e2eaf6] text-slate-700 border border-slate-300 text-sm font-semibold shadow-2xs transition-all hover:border-slate-400"
            >
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <span>Guided Evaluation Tour</span>
            </button>
          </div>
        </div>

        {/* Centerpiece 3D Vault Padlock & Live Ingestion Showcase */}
        <div className="my-4 glass-panel-glow rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-indigo-300 shadow-xl bg-gradient-to-b from-[#f2f7fd] via-[#eaf0fa] to-[#e4edf8]">
          
          {/* Header Bar of the Simulation Card */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 mb-5 border-b border-slate-300/80 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Cryptographic Vault Perimeter &amp; In-Flight Tokenization</span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    FF1 Radix-10 Active
                  </span>
                </h3>
                <p className="text-xs text-slate-600">
                  Simulate raw PII converting in-flight to format-preserving numbers and deterministic tokens.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={triggerManualCycle}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#eef4fd] hover:bg-[#e2eaf6] text-slate-700 border border-slate-300 text-xs font-semibold transition-all shadow-2xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>Next Sample Data</span>
              </button>

              <button
                onClick={toggleLockManually}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  !isLockOpen
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-900'
                    : 'bg-emerald-100 border-emerald-300 text-emerald-900'
                }`}
                title="Toggle lock state with mechanical sound"
              >
                {!isLockOpen ? <Lock className="w-3.5 h-3.5 text-indigo-600" /> : <Unlock className="w-3.5 h-3.5 text-emerald-600" />}
                <span>{!isLockOpen ? 'Lock Engaged' : 'Vault Opened'}</span>
              </button>
            </div>
          </div>

          {/* Transformation Pipeline Visualizer: Raw PII -> Mechanical Lock -> Protected Tokens */}
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-6">
            
            {/* Left Box: Incoming Raw PII (Vulnerable Source Store) */}
            <div className="lg:col-span-4 bg-[#fae8e8]/70 rounded-2xl p-5 border border-rose-300 shadow-2xs relative">
              <div className="flex items-center justify-between pb-3 border-b border-rose-200 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                    Raw Source PII
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                  source_store
                </span>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="p-2.5 rounded-xl bg-[#fff6f6] border border-rose-200 shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-rose-700 mb-0.5">Raw Name</div>
                  <div className="font-bold text-slate-800 truncate">{currentSample.rawName}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#fff6f6] border border-rose-200 shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-rose-700 mb-0.5">Raw Email (Plaintext)</div>
                  <div className="font-bold text-slate-800 truncate">{currentSample.rawEmail}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#fff6f6] border border-rose-200 shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-rose-700 mb-0.5">Raw Mobile (10-Digits)</div>
                  <div className="font-bold text-slate-800">{currentSample.rawPhone}</div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-rose-800">
                <span className="flex items-center gap-1 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> High Breach Risk
                </span>
                <span className="font-mono text-[10px]">GDPR / DPDP Regulated</span>
              </div>
            </div>

            {/* Center: 3D Digital Vault Padlock with Physical Opening Animation */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center relative py-2">
              
              {/* Padlock Assembly Container */}
              <div className="relative w-44 h-48 flex flex-col items-center justify-center cursor-pointer" onClick={toggleLockManually}>
                
                {/* Emerald Shockwave Effect when Unlocking */}
                {isLockOpen && (
                  <div className="absolute w-36 h-36 rounded-full bg-emerald-400/30 border-2 border-emerald-400 animate-shockwave pointer-events-none" />
                )}

                {/* Shackle SVG (Springs open and rotates when unlocked!) */}
                <div className="relative z-10 -mb-3">
                  <svg
                    className={`w-24 h-20 transition-transform duration-500 origin-top-right ${
                      isLockOpen ? 'animate-shackle-open' : 'translate-y-0 rotate-0'
                    }`}
                    viewBox="0 0 100 80"
                    fill="none"
                  >
                    {/* Metallic 3D Shackle Arc */}
                    <path
                      d="M 22 75 L 22 36 C 22 14, 78 14, 78 36 L 78 75"
                      stroke="url(#shackleGradient)"
                      strokeWidth="14"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="shackleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#cbd5e1" />
                        <stop offset="40%" stopColor="#64748b" />
                        <stop offset="70%" stopColor="#94a3b8" />
                        <stop offset="100%" stopColor="#475569" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Heavy Padlock Vault Body */}
                <div
                  className={`relative z-20 w-36 h-28 rounded-2xl p-3 flex flex-col items-center justify-between shadow-xl border-2 transition-all duration-500 ${
                    isLockOpen
                      ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 border-emerald-300 shadow-emerald-300 text-white'
                      : 'bg-gradient-to-tr from-indigo-700 via-indigo-600 to-slate-800 border-indigo-400 shadow-indigo-300 text-white'
                  }`}
                >
                  {/* Status Indicator Bar */}
                  <div className="flex items-center justify-between w-full px-1">
                    <span className="text-[9px] font-mono font-bold tracking-wider text-indigo-200">
                      {isLockOpen ? 'UNLOCKED' : 'AES-256 VAULT'}
                    </span>
                    <span className={`h-2 w-2 rounded-full ${isLockOpen ? 'bg-emerald-300 animate-ping' : 'bg-indigo-300'}`} />
                  </div>

                  {/* Center Keyhole / Shield Emblem */}
                  <div className="p-2 rounded-full bg-black/20 border border-white/20 shadow-inner">
                    {isLockOpen ? (
                      <Unlock className="w-7 h-7 text-emerald-200 drop-shadow-md" />
                    ) : (
                      <Lock className="w-7 h-7 text-white drop-shadow-md" />
                    )}
                  </div>

                  {/* Lock Bottom Label */}
                  <div className="text-[10px] font-mono font-extrabold tracking-wider text-center text-indigo-100">
                    {isLockOpen ? 'VAULT OPENED' : 'PROTECTED BY DEFAULT'}
                  </div>
                </div>

              </div>

              {/* Data Flow Direction Caption */}
              <div className="mt-2 text-center">
                <span className="text-xs font-mono font-bold text-indigo-900 flex items-center justify-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Click Launch to Unlock with Sound</span>
                </span>
              </div>
            </div>

            {/* Right Box: Protected Store Output (Safe Zero-Plaintext Zone) */}
            <div className="lg:col-span-4 bg-[#e6f4ea]/70 rounded-2xl p-5 border border-emerald-300 shadow-2xs relative">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-200 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    Protected Store (Zero PII)
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                  protected_store
                </span>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="p-2.5 rounded-xl bg-[#f2faf4] border border-emerald-200 shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-emerald-800 mb-0.5">Deterministic Name Token</div>
                  <div className="font-bold text-indigo-950 truncate">{currentSample.tokenName}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#f2faf4] border border-emerald-200 shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-emerald-800 mb-0.5">Deterministic Email Token</div>
                  <div className="font-bold text-indigo-950 truncate">{currentSample.tokenEmail}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#f2faf4] border border-emerald-200 shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-emerald-800 mb-0.5">FPE Encrypted Mobile (10 Digits)</div>
                  <div className="font-bold text-emerald-800 tracking-wider">{currentSample.fpePhone}</div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px] text-emerald-800 font-semibold">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 100% Safe For Analytics
                </span>
                <span className="font-mono text-[10px]">Zero Leakage</span>
              </div>
            </div>

          </div>

        </div>

        {/* 4-Step Interactive Pipeline Architecture Grid */}
        <div className="my-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3.5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <span>How the Zero-Plaintext Pipeline Operates</span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Click any step to inspect its mechanics or jump straight into its functional console module.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 mt-1 sm:mt-0">
              4-Stage Defensive Architecture
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pipelineSteps.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedPipelineStep === item.step;
              return (
                <div
                  key={item.step}
                  onClick={() => setSelectedPipelineStep(item.step)}
                  className={`glass-panel p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between hover:translate-y-[-2px] ${
                    isSelected
                      ? 'border-indigo-400 ring-2 ring-indigo-300 shadow-md bg-[#eaf1fb]'
                      : 'border-slate-300 hover:border-slate-400 hover:shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2.5 rounded-xl border ${item.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-600 bg-[#e2eaf6] px-2 py-0.5 rounded border border-slate-300">
                        STAGE {item.step}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                      {item.title}
                    </h3>
                    <span className="text-[10px] font-mono font-semibold text-indigo-700 block mt-0.5">
                      {item.badge}
                    </span>

                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundFX.playClick();
                        onNavigateTab(item.tabId);
                      }}
                      className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 transition-colors"
                    >
                      <span>Open Module</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] font-medium text-slate-500">Interactive</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Platform Guarantee Trust Ticker */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          <div className="glass-panel p-4 rounded-xl border border-slate-300 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Multi-Schema Isolation</h4>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                PostgreSQL logical separation across <code className="font-mono text-emerald-800 font-bold">source_store</code>, <code className="font-mono text-indigo-800 font-bold">vault_store</code>, and <code className="font-mono text-slate-800 font-bold">protected_store</code>.
              </p>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-300 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 border border-indigo-300 text-indigo-800 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">NIST FF1 Format Integrity</h4>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Preserves strictly 10 numeric digits for phone numbers, guaranteeing compatibility with legacy telephony without exposing subscriber identities.
              </p>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-xl border border-slate-300 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-100 border border-purple-300 text-purple-800 shrink-0">
              <ScrollText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Tamper-Evident PBAC Audit</h4>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                Every exception unmasking requires dual-custody purpose declaration and ticket reference, immutably stamped in <code className="font-mono text-purple-800 font-bold">audit_logs</code>.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Enterprise Light Footer */}
      <footer className="relative z-10 border-t border-slate-300/80 bg-[#edf3fc]/90 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Flyy.AI Privacy-Preserving Customer Data Platform</span>
            <span className="text-slate-400">|</span>
            <span className="font-mono text-[11px] text-indigo-700 font-bold">Zero-Plaintext Guarantee</span>
          </div>
          <div className="font-mono text-[11px] text-slate-600">
            FF1 Radix-10 FPE &bull; AES-256-GCM Vault &bull; HMAC Pseudonymization
          </div>
        </div>
      </footer>

    </div>
  );
}
