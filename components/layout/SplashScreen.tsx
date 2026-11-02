'use client';

import React, { useEffect, useState } from 'react';

export function SplashScreen() {
  const [stage, setStage] = useState<'initial' | 'animate' | 'exit' | 'hidden'>('initial');

  useEffect(() => {
    // Stage 1: Trigger entrance animation after short mount tick
    const t1 = setTimeout(() => {
      setStage('animate');
    }, 50);

    // Stage 2: Trigger exit fade out after 1400ms
    const t2 = setTimeout(() => {
      setStage('exit');
    }, 1400);

    // Stage 3: Remove from DOM completely after fade out completes
    const t3 = setTimeout(() => {
      setStage('hidden');
    }, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  if (stage === 'hidden') return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#000205] transition-all duration-700 select-none ${
        stage === 'exit'
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Ambient Radial Pulse */}
      <div
        className={`absolute w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-sky-600/25 via-blue-700/15 to-transparent blur-3xl pointer-events-none transition-all duration-1000 ${
          stage === 'animate' ? 'scale-125 opacity-100' : 'scale-75 opacity-0'
        }`}
      />

      {/* Center Emblem Container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Icon */}
        <div
          className={`relative h-24 w-24 rounded-3xl bg-[#040812] border border-sky-400/40 p-3.5 flex items-center justify-center shadow-2xl shadow-sky-500/30 transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${
            stage === 'animate'
              ? 'scale-100 opacity-100 rotate-0'
              : 'scale-50 opacity-0 -rotate-12'
          }`}
        >
          {/* Subtle Outer Glow Ring */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-sky-500/30 to-blue-600/30 blur-sm -z-10 animate-pulse" />

          {/* Minimalist 'LC' Logo Vector */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="splashBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
              <linearGradient id="splashCyan" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00f2fe" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>

            {/* 'C' Outer Curve */}
            <path
              d="M 68 28 C 60 18 36 18 26 30 C 14 44 14 62 26 74 C 38 84 62 84 70 70"
              stroke="url(#splashBlue)"
              strokeWidth="9"
              strokeLinecap="round"
            />

            {/* 'L' Dynamic Vector */}
            <path
              d="M 38 27 L 38 67 C 38 69 40 71 42 71 L 68 71"
              stroke="url(#splashCyan)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Precision Neon Dot */}
            <circle cx="70" cy="28" r="4.5" fill="#00f2fe" />
            <circle cx="70" cy="28" r="2" fill="#ffffff" />
          </svg>
        </div>

        {/* Brand Name Typography Reveal */}
        <div
          className={`mt-6 text-center transition-all duration-700 delay-150 ${
            stage === 'animate'
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          }`}
        >
          <h1 className="text-2xl font-black tracking-wider text-white">
            Life<span className="text-sky-400">Controll</span>
          </h1>
          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-sky-400/80 font-medium">
            Personal Life OS
          </p>
        </div>

        {/* Minimalist Loading Bar */}
        <div
          className={`mt-8 w-32 h-[3px] rounded-full bg-slate-900 overflow-hidden transition-opacity duration-500 delay-300 ${
            stage === 'animate' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className={`h-full bg-gradient-to-r from-sky-400 to-blue-600 rounded-full transition-all duration-1000 ease-out ${
              stage === 'animate' ? 'w-full' : 'w-0'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
