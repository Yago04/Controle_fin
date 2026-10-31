'use client';

import React from 'react';
import {
  LayoutDashboard,
  Zap,
  Wallet,
  Plus,
  Timer,
  Menu,
  Dumbbell,
  FileText,
  Calendar,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePomodoro } from '@/components/pomodoro/PomodoroContext';

interface BottomNavProps {
  onNewTransaction: () => void;
  onOpenMenu: () => void;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
}

export function BottomNav({
  onNewTransaction,
  onOpenMenu,
  activeTab = 'dashboard',
  onSelectTab,
}: BottomNavProps) {
  const { isRunning } = usePomodoro();

  const isDashboard = activeTab === 'dashboard' || activeTab === 'my-day';

  const select = (tab: string) => {
    if (onSelectTab) {
      onSelectTab(tab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Se a aba ativa for uma das do menu "Mais", mostraremos um badge/ícone inteligente
  const isMoreActive = ['notes', 'calendar', 'gym', 'goals'].includes(activeTab);

  const getMoreIcon = () => {
    if (activeTab === 'notes') return FileText;
    if (activeTab === 'calendar') return Calendar;
    if (activeTab === 'gym') return Dumbbell;
    if (activeTab === 'goals') return Target;
    return Menu;
  };

  const getMoreLabel = () => {
    if (activeTab === 'notes') return 'Notas';
    if (activeTab === 'calendar') return 'Agenda';
    if (activeTab === 'gym') return 'Treino';
    if (activeTab === 'goals') return 'Metas';
    return 'Mais';
  };

  const MoreIcon = getMoreIcon();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-2xl border-t border-border/80 px-2 pt-1 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-2xl select-none transition-colors">
      {/* 1. Dashboard */}
      <button
        onClick={() => select('dashboard')}
        className={cn(
          'flex flex-1 flex-col items-center justify-center min-h-[46px] min-w-[48px] py-1 px-1 rounded-xl active:scale-90 transition-all touch-manipulation cursor-pointer',
          isDashboard
            ? 'text-primary font-bold'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-label="Dashboard"
      >
        <div className="relative">
          <LayoutDashboard className={cn('h-5 w-5', isDashboard && 'stroke-[2.5]')} />
          {isDashboard && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
          )}
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">Dashboard</span>
      </button>

      {/* 2. Finanças */}
      <button
        onClick={() => select('finances')}
        className={cn(
          'flex flex-1 flex-col items-center justify-center min-h-[46px] min-w-[48px] py-1 px-1 rounded-xl active:scale-90 transition-all touch-manipulation cursor-pointer',
          activeTab === 'finances'
            ? 'text-primary font-bold'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-label="Finanças"
      >
        <div className="relative">
          <Wallet className={cn('h-5 w-5', activeTab === 'finances' && 'stroke-[2.5]')} />
          {activeTab === 'finances' && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
          )}
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">Finanças</span>
      </button>

      {/* 3. Botão Central em Destaque: Ação Rápida */}
      <div className="-mt-4 flex flex-col items-center px-1">
        <button
          onClick={onNewTransaction}
          className="h-12 w-12 rounded-full bg-gradient-to-tr from-primary to-primary/85 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90 transition-all touch-manipulation cursor-pointer border-[3px] border-background"
          title="Ação Rápida Life OS"
          aria-label="Ação Rápida"
        >
          <Plus className="h-6 w-6 stroke-[2.75]" />
        </button>
        <span className="text-[9px] font-bold text-foreground/80 mt-0.5 tracking-tight">
          Rápido
        </span>
      </div>

      {/* 4. Foco / Pomodoro */}
      <button
        onClick={() => select('pomodoro')}
        className={cn(
          'flex flex-1 flex-col items-center justify-center min-h-[46px] min-w-[48px] py-1 px-1 rounded-xl active:scale-90 transition-all touch-manipulation cursor-pointer',
          activeTab === 'pomodoro'
            ? 'text-primary font-bold'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-label="Foco e Pomodoro"
      >
        <div className="relative">
          <Timer className={cn('h-5 w-5', activeTab === 'pomodoro' && 'stroke-[2.5]')} />
          {isRunning ? (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
          ) : activeTab === 'pomodoro' ? (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
          ) : null}
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight">Foco</span>
      </button>

      {/* 5. Mais (ou Módulo Ativo no Drawer) */}
      <button
        onClick={onOpenMenu}
        className={cn(
          'flex flex-1 flex-col items-center justify-center min-h-[46px] min-w-[48px] py-1 px-1 rounded-xl active:scale-90 transition-all touch-manipulation cursor-pointer',
          isMoreActive
            ? 'text-primary font-bold'
            : 'text-muted-foreground hover:text-foreground'
        )}
        aria-label="Mais opções e navegação"
      >
        <div className="relative">
          <MoreIcon className={cn('h-5 w-5', isMoreActive && 'stroke-[2.5]')} />
          {isMoreActive && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
          )}
        </div>
        <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[50px]">
          {getMoreLabel()}
        </span>
      </button>
    </nav>
  );
}
