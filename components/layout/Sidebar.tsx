'use client';

import React from 'react';
import {
  LayoutDashboard,
  Zap,
  Wallet,
  Timer,
  FileText,
  Calendar,
  Dumbbell,
  Calculator,
  FileSpreadsheet,
  DownloadCloud,
  TrendingUp,
  ShieldCheck,
  Command,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePomodoro } from '@/components/pomodoro/PomodoroContext';

interface SidebarProps {
  activeSection?: string;
  onSelectSection?: (section: string) => void;
  onOpenImport?: () => void;
  onOpenBackup?: () => void;
  onOpenCommandPalette?: () => void;
}

export function Sidebar({
  activeSection = 'my-day',
  onSelectSection,
  onOpenImport,
  onOpenBackup,
  onOpenCommandPalette,
}: SidebarProps) {
  const { isRunning, mode, secondsLeft, elapsedSeconds, formatTime } = usePomodoro();

  const pomodoroTimeStr = mode === 'STOPWATCH' ? formatTime(elapsedSeconds) : formatTime(secondsLeft);

  const mainModules = [
    {
      id: 'dashboard',
      title: 'Dashboard Geral',
      icon: LayoutDashboard,
      shortcut: '⌘1',
      badge: 'Hub',
    },
    {
      id: 'finances',
      title: 'Finanças',
      icon: Wallet,
      shortcut: '⌘2',
    },
    {
      id: 'pomodoro',
      title: 'Foco & Pomodoro',
      icon: Timer,
      shortcut: '⌘3',
      dynamicBadge: isRunning ? pomodoroTimeStr : undefined,
    },
    {
      id: 'notes',
      title: 'Notas & Cérebro',
      icon: FileText,
      shortcut: '⌘4',
    },
    {
      id: 'calendar',
      title: 'Calendário 360°',
      icon: Calendar,
      shortcut: '⌘5',
    },
    {
      id: 'gym',
      title: 'Academia & Saúde',
      icon: Dumbbell,
      shortcut: '⌘6',
    },
    {
      id: 'goals',
      title: 'Metas & Prazos',
      icon: Target,
      shortcut: '⌘7',
    },
  ];

  const handleNav = (id: string) => {
    if (onSelectSection) {
      onSelectSection(id);
    }
  };

  return (
    <aside className="hidden md:flex w-64 border-r border-border/70 bg-card/65 backdrop-blur-2xl flex-col h-screen sticky top-0 select-none shrink-0 transition-colors">
      {/* Brand Logo - Apple App Header Style */}
      <div className="h-16 flex items-center px-5 border-b border-border/70 gap-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground flex items-center justify-center shadow-md shadow-primary/25">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <span className="font-bold text-sm tracking-tight text-foreground block truncate">
            FinControl OS
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block truncate">
            Personal Life OS 360°
          </span>
        </div>
      </div>

      {/* Atalho Command Palette Cmd + K no Mac */}
      <div className="px-3 pt-3.5 pb-1">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-muted/50 hover:bg-muted/80 border border-border/70 text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer group shadow-sm active:scale-[0.99]"
          title="Abrir Command Palette (⌘K)"
        >
          <span className="flex items-center gap-2 font-medium">
            <Command className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
            <span>Ações Rápidas...</span>
          </span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-background/80 rounded border border-border/80 shadow-xs font-semibold text-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation Links com atalhos do Mac (⌘1 - ⌘6) */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-2">
            Módulos Principais
          </p>
          {mainModules.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group text-left cursor-pointer relative',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25 font-bold'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 transition-transform group-hover:scale-110 shrink-0',
                    isActive
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                <span className="flex-1 truncate">{item.title}</span>

                {/* Dynamic Timer Badge */}
                {item.dynamicBadge && (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-rose-500 text-white animate-pulse shadow-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                    {item.dynamicBadge}
                  </span>
                )}

                {/* Static Badge */}
                {!item.dynamicBadge && item.badge && (
                  <span
                    className={cn(
                      'text-[9px] font-bold px-1.5 py-0.5 rounded border tracking-wide uppercase',
                      isActive
                        ? 'bg-white/20 text-white border-white/30'
                        : 'bg-primary/10 text-primary border-primary/20'
                    )}
                  >
                    {item.badge}
                  </span>
                )}

                {/* macOS Shortcut Badge */}
                {!item.dynamicBadge && !item.badge && item.shortcut && (
                  <kbd
                    className={cn(
                      'text-[10px] font-mono px-1 py-0.5 rounded transition-opacity',
                      isActive
                        ? 'text-primary-foreground/75 bg-primary-foreground/15'
                        : 'text-muted-foreground/60 group-hover:text-foreground group-hover:bg-background/80'
                    )}
                  >
                    {item.shortcut}
                  </kbd>
                )}
              </button>
            );
          })}
        </div>

        {/* Ferramentas Financeiras & Sistema */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-2">
            Ferramentas & Dados
          </p>

          <button
            onClick={() => {
              handleNav('finances');
              setTimeout(() => {
                document.getElementById('simulator')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all text-left cursor-pointer group"
          >
            <Calculator className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform shrink-0" />
            <span className="flex-1 truncate">Simulador: Posso Comprar?</span>
          </button>

          <button
            onClick={onOpenImport}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all text-left cursor-pointer group"
          >
            <FileSpreadsheet className="h-4 w-4 text-primary group-hover:scale-110 transition-transform shrink-0" />
            <span className="flex-1 truncate">Importar Extrato (CSV/OFX)</span>
          </button>

          <button
            onClick={onOpenBackup}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all text-left cursor-pointer group"
          >
            <DownloadCloud className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform shrink-0" />
            <span className="flex-1 truncate">Backup Completo (JSON)</span>
          </button>
        </div>
      </div>

      {/* Local Status Footer estilo Apple macOS */}
      <div className="p-3 border-t border-border/70 bg-muted/20">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-background/60 border border-border/60 shadow-xs">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-foreground truncate flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              100% Pessoal & Offline-first
            </p>
            <p className="text-[9px] text-muted-foreground truncate">
              Mac & iPhone • PostgreSQL Local
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
