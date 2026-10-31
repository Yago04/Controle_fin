'use client';

import React, { useState, useEffect } from 'react';
import { Landmark } from 'lucide-react';

interface BankLogoProps {
  bankName?: string | null;
  accountName?: string;
  color?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const logoClientCache = new Map<string, string | null>();

export function BankLogo({
  bankName,
  accountName,
  color = '#820AD1',
  className = '',
  size = 'md',
}: BankLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  // Determina o melhor nome para busca
  const displayName = bankName || accountName || 'Banco';
  const cacheKey = displayName.toLowerCase().trim();

  useEffect(() => {
    let isMounted = true;

    // Se estiver no cache do cliente
    if (logoClientCache.has(cacheKey)) {
      setLogoUrl(logoClientCache.get(cacheKey) || null);
      return;
    }

    // Busca via rota interna conectada à API Ninjas
    fetch(`/api/bank-logos?name=${encodeURIComponent(displayName)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.logoUrl) {
          logoClientCache.set(cacheKey, data.logoUrl);
          setLogoUrl(data.logoUrl);
        } else {
          logoClientCache.set(cacheKey, null);
          setLogoUrl(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          logoClientCache.set(cacheKey, null);
          setLogoUrl(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [cacheKey, displayName]);

  const sizeClasses = {
    sm: 'h-7 w-7 text-xs rounded-lg',
    md: 'h-10 w-10 text-sm rounded-xl',
    lg: 'h-12 w-12 text-base rounded-2xl',
  };

  const imgSizeClasses = {
    sm: 'h-7 w-7 p-1',
    md: 'h-10 w-10 p-1.5',
    lg: 'h-12 w-12 p-2',
  };

  const initials = (displayName || 'BK')
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  if (logoUrl && !imgError) {
    return (
      <div
        className={`relative flex items-center justify-center bg-white border border-border/80 shadow-xs shrink-0 overflow-hidden ${
          sizeClasses[size]
        } ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={displayName}
          className={`object-contain max-h-full max-w-full ${imgSizeClasses[size]}`}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback com iniciais estilizadas e cor do banco
  return (
    <div
      className={`flex items-center justify-center text-white font-black tracking-tight shadow-xs shrink-0 ${
        sizeClasses[size]
      } ${className}`}
      style={{ backgroundColor: color }}
      title={displayName}
    >
      {initials.length > 0 ? initials : <Landmark className="h-4 w-4" />}
    </div>
  );
}
