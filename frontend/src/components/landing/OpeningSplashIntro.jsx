import React, { useState, useEffect } from 'react';
import { Shield, Lock, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { soundFX } from '../../utils/audio';

export default function OpeningSplashIntro({ onComplete }) {
  const [step, setStep] = useState(0); // 0: Start, 1: DATA, 2: CONVERT, 3: SECURE, 4: Ready

  useEffect(() => {
    // Step 1: DATA
    const t1 = setTimeout(() => {
      setStep(1);
      soundFX.playClick();
    }, 400);

    // Step 2: CONVERT
    const t2 = setTimeout(() => {
      setStep(2);
      soundFX.playClick();
    }, 1200);

    // Step 3: SECURE
    const t3 = setTimeout(() => {
      setStep(3);
      soundFX.playLockOpen(); // Auditory affirmation on SECURE
    }, 2000);

    // Step 4: Auto-complete into main landing
    const t4 = setTimeout(() => {
      setStep(4);
      onComplete();
    }, 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 text-white select-none overflow-hidden">
      {/* Dynamic 3D ambient radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/60 via-slate-900 to-slate-950 pointer-events-none" />
      <div className="absolute w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />

      {/* Centerpiece Content Box */}
      <div className="relative z-10 flex flex-col items-center max-w-xl mx-auto px-6 text-center space-y-6">
        
        {/* Brand Icon Shield */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-indigo-500/50 border border-indigo-300/40 animate-bounce">
            <Shield className="w-10 h-10 text-white drop-shadow-md" />
          </div>
          {step >= 3 && (
            <div className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-emerald-500 text-white shadow-lg animate-in zoom-in">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Brand Name */}
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>Flyy</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">.AI</span>
          </h1>
          <p className="text-xs font-mono tracking-widest text-indigo-300 uppercase font-semibold">
            Privacy-Preserving Customer Data Platform
          </p>
        </div>

        {/* Sequence Words: DATA. CONVERT. SECURE. */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 py-4 text-2xl sm:text-4xl font-extrabold tracking-wider font-mono">
          {/* DATA */}
          <span
            className={`transition-all duration-500 ${
              step >= 1
                ? 'opacity-100 scale-100 text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]'
                : 'opacity-10 scale-90 text-slate-600'
            }`}
          >
            DATA.
          </span>

          {/* CONVERT */}
          <span
            className={`transition-all duration-500 ${
              step >= 2
                ? 'opacity-100 scale-100 text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]'
                : 'opacity-10 scale-90 text-slate-600'
            }`}
          >
            CONVERT.
          </span>

          {/* SECURE */}
          <span
            className={`transition-all duration-500 ${
              step >= 3
                ? 'opacity-100 scale-100 text-emerald-400 drop-shadow-[0_0_18px_rgba(16,185,129,0.9)]'
                : 'opacity-10 scale-90 text-slate-600'
            }`}
          >
            SECURE.
          </span>
        </div>

        {/* Status Indicator */}
        <div className="h-6 flex items-center justify-center">
          {step === 1 && (
            <span className="text-xs font-mono text-indigo-300 animate-in fade-in">
              &bull; Ingesting Raw Multi-Source PII...
            </span>
          )}
          {step === 2 && (
            <span className="text-xs font-mono text-cyan-300 animate-in fade-in">
              &bull; Applying NIST FF1 Format-Preserving Encryption...
            </span>
          )}
          {step >= 3 && (
            <span className="text-xs font-mono text-emerald-300 font-bold animate-in fade-in flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Hardware-Isolated Zero-Plaintext Vault Enforced
            </span>
          )}
        </div>

        {/* Skip Button */}
        <button
          onClick={onComplete}
          className="pt-2 text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1 transition-colors underline underline-offset-4"
        >
          <span>Enter Vault Console</span>
          <ArrowRight className="w-3 h-3" />
        </button>

      </div>
    </div>
  );
}
