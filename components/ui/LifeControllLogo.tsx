'use client';

import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export function LifeControllLogo({ size = 'md', showText = false, className = '' }: LogoProps) {
  const sizeMap = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Minimalist Black & Blue Emblem */}
      <div
        className={`${sizeMap[size]} relative rounded-xl bg-[#030712] border border-sky-500/30 p-1.5 flex items-center justify-center shadow-lg shadow-sky-500/15 overflow-hidden group`}
      >
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-sky-600/20 to-blue-500/10 opacity-70 group-hover:opacity-100 transition-opacity" />

        {/* Minimalist Geometric SVG Vector */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full relative z-10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoBlue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#38bdf8" />
              <stop offset="100%" stop-color="#0284c7" />
            </linearGradient>
            <linearGradient id="logoCyan" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#00f2fe" />
              <stop offset="100%" stop-color="#38bdf8" />
            </linearGradient>
          </defs>

          {/* 'C' Outer Curve */}
          <path
            d="M 68 28 C 60 18 36 18 26 30 C 14 44 14 62 26 74 C 38 84 62 84 70 70"
            stroke="url(#logoBlue)"
            strokeWidth="9"
            strokeLinecap="round"
          />

          {/* 'L' Dynamic Vector */}
          <path
            d="M 38 27 L 38 67 C 38 69 40 71 42 71 L 68 71"
            stroke="url(#logoCyan)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Precision Neon Dot */}
          <circle cx="70" cy="28" r="4.5" fill="#00f2fe" />
          <circle cx="70" cy="28" r="2" fill="#ffffff" />
        </svg>
      </div>

      {showText && (
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm tracking-tight text-foreground">
              Life<span className="text-sky-400">Controll</span>
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-sky-500/10 text-sky-400 font-mono font-semibold border border-sky-500/20">
              PRO
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block truncate">
            Personal Life OS
          </span>
        </div>
      )}
    </div>
  );
}
