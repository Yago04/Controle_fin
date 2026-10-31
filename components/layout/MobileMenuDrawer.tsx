'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import {
  LayoutDashboard,
  X,
  Calculator,
  Upload,
  DownloadCloud,
  Moon,
  Sun,
  ShieldCheck,
  TrendingUp,
  FileText,
  Calendar,
  Timer,
  Dumbbell,
  Zap,
  Wallet,
  Command,
  Check,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenImport: () => void;
  onOpenBackup: () => void;
  onScrollToSimulator: () => void;
  activeSection?: string;
  onSelectSection?: (section: string) => void;
  onOpenCommandPalette?: () => void;
}

export function MobileMenuDrawer({
  isOpen,
  onClose,
  onOpenImport,
  onOpenBackup,
  onScrollToSimulator,
  activeSection = 'my-day',
  onSelectSection,
  onOpenCommandPalette,
}: MobileMenuDrawerProps) {
  const [isDark, setIsDark] = React.useState(true);

  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, [isOpen]);

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

  if (!isOpen) return null;

  const navigate = (sec: string) => {
    onClose();
    if (onSelectSection) onSelectSection(sec);
  };

  const modules = [
    {
      id: 'dashboard',
      label: 'Dashboard Geral',
      desc: 'Hub Central & Produtividade',
      icon: LayoutDashboard,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      id: 'finances',
      label: 'Painel Financeiro',
      desc: 'Saldos, Dívidas & Contas',
      icon: Wallet,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      id: 'pomodoro',
      label: 'Foco & Pomodoro',
      desc: 'Timer & Sessões',
      icon: Timer,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
    },
    {
      id: 'notes',
      label: 'Notas & Cérebro',
      desc: 'Segundo Cérebro & Tags',
      icon: FileText,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      id: 'calendar',
      label: 'Calendário 360°',
      desc: 'Eventos & Vencimentos',
      icon: Calendar,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      id: 'gym',
      label: 'Academia & Saúde',
      desc: 'Fichas, Água & Creatina',
      icon: Dumbbell,
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10',
    },
    {
      id: 'goals',
      label: 'Metas & Prazos',
      desc: 'Curto, Médio & Longo Prazo',
      icon: Target,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center md:hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full bg-card border-t border-border/80 rounded-t-3xl p-5 pb-[max(2rem,env(safe-area-inset-bottom))] space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Pull Handle Bar */}
        <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30 mx-auto -mt-1 mb-2" />

        {/* Header do Drawer */}
        <div className="flex items-center justify-between pb-3 border-b border-border/70">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Personal Life OS 360°</h3>
              <p className="text-[11px] text-muted-foreground">Todos os Módulos & Ferramentas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all"
            aria-label="Fechar navegação"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Grid dos 6 Módulos do Life OS */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-2.5 px-1">
            Módulos do Sistema
          </p>
          <div className="grid grid-cols-2 gap-2">
            {modules.map((m) => {
              const Icon = m.icon;
              const isActive = activeSection === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => navigate(m.id)}
                  className={cn(
                    'flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all active:scale-95 cursor-pointer touch-manipulation',
                    isActive
                      ? 'border-primary bg-primary/10 text-foreground font-bold shadow-xs'
                      : 'border-border/70 bg-background/60 hover:bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  <div
                    className={cn(
                      'h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                      m.bg
                    )}
                  >
                    <Icon className={cn('h-4 w-4', m.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate flex items-center justify-between">
                      {m.label}
                      {isActive && <Check className="h-3 w-3 text-primary ml-1 shrink-0" />}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{m.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ferramentas & Ações */}
        <div className="space-y-2 pt-2 border-t border-border/70">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-1">
            Ações Rápidas & Dados
          </p>

          <div className="grid grid-cols-1 gap-2">
            {onOpenCommandPalette && (
              <Button
                variant="outline"
                className="justify-start gap-3 h-11 text-xs rounded-xl active:scale-98"
                onClick={() => {
                  onClose();
                  onOpenCommandPalette();
                }}
              >
                <Command className="h-4 w-4 text-primary" />
                <span className="font-semibold">Comando Rápido 360° (⌘K)</span>
              </Button>
            )}

            <Button
              variant="outline"
              className="justify-start gap-3 h-11 text-xs rounded-xl active:scale-98"
              onClick={() => {
                onClose();
                onScrollToSimulator();
              }}
            >
              <Calculator className="h-4 w-4 text-emerald-500" />
              <span>Simulador: Posso Comprar?</span>
            </Button>

            <Button
              variant="outline"
              className="justify-start gap-3 h-11 text-xs rounded-xl active:scale-98"
              onClick={() => {
                onClose();
                onOpenImport();
              }}
            >
              <Upload className="h-4 w-4 text-blue-500" />
              <span>Importar Extrato Bancário (CSV/OFX)</span>
            </Button>

            <Button
              variant="outline"
              className="justify-start gap-3 h-11 text-xs rounded-xl active:scale-98"
              onClick={() => {
                onClose();
                onOpenBackup();
              }}
            >
              <DownloadCloud className="h-4 w-4 text-purple-500" />
              <span>Backup Completo & Restauração</span>
            </Button>

            <Button
              variant="outline"
              className="justify-start gap-3 h-11 text-xs rounded-xl active:scale-98"
              onClick={toggleTheme}
            >
              {isDark ? (
                <>
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span>Alternar para Tema Claro</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-primary" />
                  <span>Alternar para Tema Escuro</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Informações de Privacidade e Sincronização */}
        <div className="p-3 rounded-2xl bg-muted/30 border border-border/60 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-foreground">Ambiente Pessoal & 100% Privado</p>
            <p className="text-muted-foreground text-[10px]">
              Sincronizado diretamente com seu PostgreSQL local.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
