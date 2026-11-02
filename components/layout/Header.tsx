'use client';

import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Calendar as CalendarIcon,
  Moon,
  Sun,
  Command,
  Plus,
  Zap,
  Wallet,
  Timer,
  FileText,
  Dumbbell,
  Target,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface HeaderProps {
  freeMoney?: number;
  activeSection?: string;
  onOpenCommandPalette?: () => void;
}

const sectionInfoMap: Record<
  string,
  { title: string; shortTitle: string; icon: React.ElementType; color: string }
> = {
  dashboard: {
    title: 'Dashboard Geral 360°',
    shortTitle: 'Dashboard',
    icon: LayoutDashboard,
    color: 'text-primary',
  },
  'my-day': {
    title: 'Dashboard Geral 360°',
    shortTitle: 'Dashboard',
    icon: LayoutDashboard,
    color: 'text-primary',
  },
  finances: {
    title: 'Painel Financeiro',
    shortTitle: 'Finanças',
    icon: Wallet,
    color: 'text-emerald-500',
  },
  pomodoro: {
    title: 'Foco & Pomodoro',
    shortTitle: 'Foco',
    icon: Timer,
    color: 'text-rose-500',
  },
  notes: {
    title: 'Notas & Segundo Cérebro',
    shortTitle: 'Notas',
    icon: FileText,
    color: 'text-blue-500',
  },
  calendar: {
    title: 'Calendário Unificado 360°',
    shortTitle: 'Calendário',
    icon: CalendarIcon,
    color: 'text-purple-500',
  },
  gym: {
    title: 'Academia & Saúde Integrada',
    shortTitle: 'Treino',
    icon: Dumbbell,
    color: 'text-cyan-500',
  },
  goals: {
    title: 'Metas & Planejamento Estratégico',
    shortTitle: 'Metas',
    icon: Target,
    color: 'text-emerald-500',
  },
};

export function Header({
  freeMoney,
  activeSection = 'my-day',
  onOpenCommandPalette,
}: HeaderProps) {
  const [isDark, setIsDark] = React.useState(true);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('fincontrol-theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else {
      setIsDark(document.documentElement.classList.contains('dark'));
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fincontrol-theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('fincontrol-theme', 'dark');
      setIsDark(true);
    }
  };

  const todayStr = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date());

  const currentInfo = sectionInfoMap[activeSection] || sectionInfoMap['my-day'];
  const SectionIcon = currentInfo.icon;

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-card/85 backdrop-blur-xl transition-all pt-safe">
      <div className="h-16 px-4 sm:px-8 flex items-center justify-between gap-3">
        {/* Esquerda: Identidade & Breadcrumb do Módulo Atual */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <SectionIcon className={`h-4 w-4 ${currentInfo.color}`} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-xs font-semibold text-muted-foreground/80">
                  LifeControll /
                </span>
                <h1 className="text-sm sm:text-base font-bold text-foreground truncate">
                  <span className="sm:hidden">{currentInfo.shortTitle}</span>
                  <span className="hidden sm:inline">{currentInfo.title}</span>
                </h1>
                <span className="hidden md:inline-flex text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  OS 360°
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground capitalize flex items-center gap-1 truncate">
                <CalendarIcon className="h-3 w-3 shrink-0" />
                {todayStr}
              </p>
            </div>
          </div>
        </div>

        {/* Direita: Ações Rápidas (Cmd+K no Mac / Toque Rápido no iPhone), Dinheiro Livre, Tema */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Botão Command Palette */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/80 bg-background/80 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Ação Rápida (⌘K no Mac)"
            >
              <Command className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Ações</span>
              <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border border-border text-foreground font-semibold">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Status Badge / Destaque Dinheiro Livre */}
          {activeSection === 'finances' && freeMoney !== undefined && freeMoney > 0 ? (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] sm:text-xs font-semibold shadow-sm select-none"
              title="Dinheiro livre para gastar com tranquilidade este mês"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-500 animate-pulse" />
              <span className="hidden xs:inline">Livre:</span>
              <span className="font-bold">{formatCurrency(freeMoney)}</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] sm:text-xs font-semibold shadow-sm select-none"
              title="Personal Life OS Conectado"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span>Life OS 360°</span>
            </div>
          )}

          {/* Theme Toggle Button com animação suave */}
          <button
            onClick={toggleTheme}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg border border-border/80 bg-background/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95 cursor-pointer shadow-sm"
            title={isDark ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            aria-label="Alternar tema de cores"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-500 hover:-rotate-12 transition-transform" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
