'use client';

import React, { useEffect, useState } from 'react';
import {
  Search,
  PlusCircle,
  Timer,
  CheckSquare,
  FileText,
  Dumbbell,
  Droplets,
  Calendar,
  Sparkles,
  X,
  CheckCircle2,
  Flame,
  Target,
} from 'lucide-react';
import { usePomodoro } from '@/components/pomodoro/PomodoroContext';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: string) => void;
  onOpenNewTransaction: () => void;
  onRefreshGlobal: () => void;
}

export function CommandPaletteModal({
  isOpen,
  onClose,
  onNavigate,
  onOpenNewTransaction,
  onRefreshGlobal,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState('');
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickEventTitle, setQuickEventTitle] = useState('');
  const [modeView, setModeView] = useState<'LIST' | 'NEW_TASK' | 'NEW_EVENT'>('LIST');
  const [feedback, setFeedback] = useState<string | null>(null);
  const { startTimer } = usePomodoro();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setModeView('LIST');
      setFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => {
      setFeedback(null);
      onClose();
      onRefreshGlobal();
    }, 650);
  };

  const handleDrinkWater = async () => {
    await fetch('/api/gym/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'DAILY_LOG', addWaterMl: 500 }),
    });
    showToast('💧 +500ml de água registrados no banco!');
  };

  const handleCheckCreatine = async () => {
    await fetch('/api/gym/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'DAILY_LOG', creatineChecked: true }),
    });
    showToast('⚡ Creatina do dia marcada como tomada!');
  };

  const handleOpenDailyNote = async () => {
    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'OPEN_DAILY_NOTE' }),
    });
    onNavigate('notes');
    onClose();
  };

  const handleCreateQuickTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: quickTaskTitle.trim(),
        priority: 'HIGH',
        dueDate: new Date().toISOString(),
        estimatedPomodoros: 1,
      }),
    });
    setQuickTaskTitle('');
    showToast('✅ Tarefa criada para hoje!');
  };

  const handleCreateQuickEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEventTitle.trim()) return;
    await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: quickEventTitle.trim(),
        startDate: new Date().toISOString(),
        type: 'PERSONAL',
        color: '#3b82f6',
      }),
    });
    setQuickEventTitle('');
    showToast('📅 Evento adicionado ao Calendário 360°!');
  };

  const commands = [
    {
      id: 'new-tx',
      label: 'Nova Transação (Receita / Despesa / PIX)',
      category: 'Finanças',
      icon: PlusCircle,
      color: 'text-emerald-500',
      action: () => {
        onClose();
        onOpenNewTransaction();
      },
    },
    {
      id: 'start-pomodoro',
      label: 'Iniciar Pomodoro de 25 min Agora',
      category: 'Foco & Produtividade',
      icon: Timer,
      color: 'text-rose-500',
      action: () => {
        startTimer(undefined, 'FOCUS');
        onNavigate('pomodoro');
        onClose();
      },
    },
    {
      id: 'new-task',
      label: 'Criar Nova Tarefa Rápida',
      category: 'Foco & Produtividade',
      icon: CheckSquare,
      color: 'text-amber-500',
      action: () => setModeView('NEW_TASK'),
    },
    {
      id: 'daily-note',
      label: 'Abrir / Criar Nota de Hoje (Daily Note)',
      category: 'Segundo Cérebro',
      icon: FileText,
      color: 'text-blue-500',
      action: handleOpenDailyNote,
    },
    {
      id: 'start-workout-a',
      label: 'Iniciar Treino (Fichas A / B / C)',
      category: 'Academia & Saúde',
      icon: Dumbbell,
      color: 'text-cyan-500',
      action: () => {
        onNavigate('gym');
        onClose();
      },
    },
    {
      id: 'water-500',
      label: 'Beber +500ml de Água',
      category: 'Academia & Saúde',
      icon: Droplets,
      color: 'text-sky-400',
      action: handleDrinkWater,
    },
    {
      id: 'creatine-check',
      label: 'Marcar Creatina Tomada (5g)',
      category: 'Academia & Saúde',
      icon: Flame,
      color: 'text-orange-500',
      action: handleCheckCreatine,
    },
    {
      id: 'new-event',
      label: 'Novo Evento no Calendário 360°',
      category: 'Calendário',
      icon: Calendar,
      color: 'text-purple-500',
      action: () => setModeView('NEW_EVENT'),
    },
    {
      id: 'view-goals',
      label: 'Ver Metas & Prazos (Curto, Médio e Longo Prazo)',
      category: 'Metas & Planejamento',
      icon: Target,
      color: 'text-emerald-500',
      action: () => {
        onNavigate('goals');
        onClose();
      },
    },
  ];

  const filtered = commands.filter(
    (c) =>
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-12 sm:pt-24 px-3 sm:px-4 animate-in fade-in duration-150 pt-safe"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-muted/30">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite um comando ou ação rápida (ex: PIX, Pomodoro, Água, Treino)..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono bg-background border border-border rounded text-muted-foreground">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {feedback ? (
          <div className="p-8 text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto animate-bounce" />
            <p className="text-sm font-bold text-foreground">{feedback}</p>
          </div>
        ) : modeView === 'NEW_TASK' ? (
          <form onSubmit={handleCreateQuickTask} className="p-5 space-y-4">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-amber-500" />
              Nova Tarefa para Hoje
            </h4>
            <input
              type="text"
              autoFocus
              required
              value={quickTaskTitle}
              onChange={(e) => setQuickTaskTitle(e.target.value)}
              placeholder="O que precisa ser feito hoje?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModeView('LIST')}
                className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground"
              >
                Salvar Tarefa
              </button>
            </div>
          </form>
        ) : modeView === 'NEW_EVENT' ? (
          <form onSubmit={handleCreateQuickEvent} className="p-5 space-y-4">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              Novo Compromisso para Hoje
            </h4>
            <input
              type="text"
              autoFocus
              required
              value={quickEventTitle}
              onChange={(e) => setQuickEventTitle(e.target.value)}
              placeholder="Título do evento ou lembrete..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModeView('LIST')}
                className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground"
              >
                Criar Evento
              </button>
            </div>
          </form>
        ) : (
          <div className="max-h-[65vh] overflow-y-auto p-2 divide-y divide-border/40">
            <div className="py-1">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary" />
                Ações Rápidas em 2 Segundos
              </p>
              {filtered.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted/80 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-background border border-border flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Icon className={`h-4 w-4 ${cmd.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{cmd.label}</p>
                        <p className="text-[11px] text-muted-foreground">{cmd.category}</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground group-hover:text-foreground">
                      Executar →
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
