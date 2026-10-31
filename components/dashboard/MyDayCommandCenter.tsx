'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { usePomodoro } from '@/components/pomodoro/PomodoroContext';
import { formatCurrency } from '@/lib/utils';
import {
  Sparkles,
  Wallet,
  Timer,
  CheckSquare,
  Square,
  Dumbbell,
  Droplets,
  Flame,
  Calendar,
  FileText,
  Play,
  Pause,
  PlusCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface MyDayCommandCenterProps {
  financialData: any;
  onNavigate: (section: string) => void;
  onOpenNewTransaction: () => void;
}

export function MyDayCommandCenter({
  financialData,
  onNavigate,
  onOpenNewTransaction,
}: MyDayCommandCenterProps) {
  const {
    mode,
    isRunning,
    secondsLeft,
    elapsedSeconds,
    activeTask,
    startTimer,
    pauseTimer,
    formatTime,
    lastCompletedAt,
  } = usePomodoro();

  const [tasks, setTasks] = useState<any[]>([]);
  const [pomoStats, setPomoStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [gym, setGym] = useState<any>(null);
  const [todayEvents, setTodayEvents] = useState<any[]>([]);

  const fetchCommandCenterData = useCallback(async () => {
    try {
      const now = new Date();
      const m = now.getMonth() + 1;
      const y = now.getFullYear();

      const [tRes, pRes, hRes, gRes, cRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/pomodoro'),
        fetch('/api/gym/health'),
        fetch('/api/gym'),
        fetch(`/api/calendar?month=${m}&year=${y}`),
      ]);

      const [tJson, pJson, hJson, gJson, cJson] = await Promise.all([
        tRes.json(),
        pRes.json(),
        hRes.json(),
        gRes.json(),
        cRes.json(),
      ]);

      if (tJson.success) setTasks((tJson.data.tasks || []).slice(0, 6));
      if (pJson.success) setPomoStats(pJson.data);
      if (hJson.success) setHealth(hJson.data);
      if (gJson.success) setGym(gJson.data);
      if (cJson.success) {
        const todayNum = now.getDate();
        const itemsToday = (cJson.data.items || []).filter((it: any) => {
          const d = new Date(it.date);
          return d.getDate() === todayNum;
        });
        setTodayEvents(itemsToday);
      }
    } catch (e) {
      console.error('Erro ao carregar Meu Dia 360°:', e);
    }
  }, []);

  useEffect(() => {
    fetchCommandCenterData();
  }, [fetchCommandCenterData, lastCompletedAt]);

  const handleToggleTask = async (task: any) => {
    const nextStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    fetchCommandCenterData();
  };

  const handleQuickWater = async (ml: number) => {
    await fetch('/api/gym/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'DAILY_LOG', addWaterMl: ml }),
    });
    fetchCommandCenterData();
  };

  const handleQuickCreatine = async () => {
    if (!health?.todayLog) return;
    await fetch('/api/gym/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'DAILY_LOG',
        creatineChecked: !health.todayLog.creatineChecked,
      }),
    });
    fetchCommandCenterData();
  };

  const handleOpenTodayNote = async () => {
    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'OPEN_DAILY_NOTE' }),
    });
    onNavigate('notes');
  };

  const displayTime = mode === 'STOPWATCH' ? formatTime(elapsedSeconds) : formatTime(secondsLeft);

  return (
    <div className="space-y-6">
      {/* Banner Command Center */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-primary/15 via-card to-cyan-500/10 border border-primary/20">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-primary/20 text-primary">
            Personal Life OS • Visão 360°
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground mt-1.5">
            ⚡ Meu Dia — Command Center
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Finanças, Foco Profundo, Segundo Cérebro, Agenda e Performance Física em uma única tela.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={onOpenNewTransaction} size="sm" className="gap-1.5 font-bold">
            <PlusCircle className="h-4 w-4" />
            Novo Gasto / PIX
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenTodayNote}
            className="gap-1.5 border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
          >
            <FileText className="h-4 w-4" />
            Nota de Hoje
          </Button>
        </div>
      </div>

      {/* 4 Cards Executivos Multi-Módulo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Dinheiro Livre Real */}
        <Card
          onClick={() => onNavigate('finances')}
          className="cursor-pointer hover:border-emerald-500/50 transition-all"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Dinheiro Livre Real</p>
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-500 mt-1">
                {formatCurrency(financialData?.freeMoney || 0)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Saldo atual: {formatCurrency(financialData?.currentBalance || 0)}
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <Wallet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* 2. Foco & Pomodoro de Hoje */}
        <Card
          onClick={() => onNavigate('pomodoro')}
          className="cursor-pointer hover:border-rose-500/50 transition-all"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Foco Profundo Hoje</p>
              <p className="text-xl sm:text-2xl font-extrabold text-rose-500 mt-1">
                {pomoStats?.todayMinutes || 0} <span className="text-xs font-normal">min</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Meta: {pomoStats?.dailyGoalMinutes || 100}m • Streak: {pomoStats?.streakDays || 0}d 🔥
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
              <Timer className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* 3. Hidratação & Suplementos */}
        <Card
          onClick={() => onNavigate('gym')}
          className="cursor-pointer hover:border-sky-500/50 transition-all"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Água & Creatina Hoje</p>
              <p className="text-xl sm:text-2xl font-extrabold text-sky-400 mt-1">
                {health?.todayLog?.waterMl || 0}{' '}
                <span className="text-xs font-normal">
                  / {health?.dailyWaterGoalMl || 3000}ml
                </span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Creatina: {health?.todayLog?.creatineChecked ? '✅ Tomada' : '⏳ Pendente'}
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
              <Droplets className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* 4. Academia & Custo por Treino */}
        <Card
          onClick={() => onNavigate('gym')}
          className="cursor-pointer hover:border-cyan-500/50 transition-all"
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Treinos no Mês</p>
              <p className="text-xl sm:text-2xl font-extrabold text-cyan-400 mt-1">
                {gym?.healthRoi?.monthWorkoutsCount || 0}{' '}
                <span className="text-xs font-normal">sessões</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Custo/treino: {formatCurrency(gym?.healthRoi?.costPerWorkout || 0)}
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <Dumbbell className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid Principal do Dia: 3 Colunas Integradas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Timer Rápido + Tarefas Prioritárias de Hoje */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              🍅 Foco & Tarefas de Hoje
            </CardTitle>
            <button
              onClick={() => onNavigate('pomodoro')}
              className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              Abrir <ArrowRight className="h-3 w-3" />
            </button>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Mini Controle de Pomodoro */}
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-rose-400">
                  Timer Sincronizado
                </span>
                <p className="font-mono text-2xl font-extrabold text-foreground">{displayTime}</p>
                <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">
                  {activeTask ? activeTask.title : 'Pronto para iniciar 25m'}
                </p>
              </div>
              {!isRunning ? (
                <Button
                  size="sm"
                  onClick={() => startTimer(undefined, 'FOCUS')}
                  className="bg-rose-600 hover:bg-rose-500 text-white gap-1.5"
                >
                  <Play className="h-4 w-4 fill-current" /> Focar
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={pauseTimer} className="gap-1.5">
                  <Pause className="h-4 w-4" /> Pausar
                </Button>
              )}
            </div>

            {/* Lista de Tarefas */}
            <div className="space-y-2">
              {tasks.map((t) => {
                const isDone = t.status === 'DONE';
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs"
                  >
                    <button
                      onClick={() => handleToggleTask(t)}
                      className="flex items-center gap-2 text-left min-w-0 flex-1 cursor-pointer"
                    >
                      {isDone ? (
                        <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span
                        className={`truncate ${
                          isDone ? 'line-through text-muted-foreground' : 'font-medium text-foreground'
                        }`}
                      >
                        {t.title}
                      </span>
                    </button>
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                      🍅 {t.completedPomodoros}/{t.estimatedPomodoros}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Coluna 2: Treino do Dia & Bio-Hábitos Rápidos */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              🏋️ Treino & Saúde de Hoje
            </CardTitle>
            <button
              onClick={() => onNavigate('gym')}
              className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              Fichas <ArrowRight className="h-3 w-3" />
            </button>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Botões rápidos de Água e Creatina */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickWater(250)}
                className="text-xs border-sky-500/30 text-sky-400"
              >
                💧 +250ml
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickWater(500)}
                className="text-xs border-sky-500/30 text-sky-400"
              >
                💧 +500ml
              </Button>
              <Button
                variant={health?.todayLog?.creatineChecked ? 'primary' : 'outline'}
                size="sm"
                onClick={handleQuickCreatine}
                className="text-xs"
              >
                ⚡ Creatina {health?.todayLog?.creatineChecked ? '✓' : ''}
              </Button>
            </div>

            {/* Fichas Rápidas A, B, C */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Escolher Ficha para Treinar Agora:
              </p>
              {(gym?.routines || []).map((r: any) => (
                <div
                  key={r.id}
                  onClick={() => onNavigate('gym')}
                  className="p-3 rounded-xl border border-border bg-card hover:border-cyan-500/50 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <p className="text-xs font-bold text-foreground">{r.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {r.exercises?.length || 0} exercícios planejados
                    </p>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-lg text-xs font-extrabold text-white"
                    style={{ backgroundColor: r.color || '#06b6d4' }}
                  >
                    Treinar →
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Coluna 3: Agenda Unificada de Hoje & Resumo Financeiro */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              📅 Agenda & Vencimentos de Hoje
            </CardTitle>
            <button
              onClick={() => onNavigate('calendar')}
              className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              Calendário <ArrowRight className="h-3 w-3" />
            </button>
          </CardHeader>

          <CardContent className="space-y-4">
            {todayEvents.length === 0 ? (
              <div className="p-4 rounded-xl bg-muted/30 border border-border text-center space-y-1">
                <Calendar className="h-6 w-6 text-muted-foreground mx-auto" />
                <p className="text-xs font-medium text-foreground">
                  Nenhum vencimento ou evento crítico pendente hoje.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[210px] overflow-y-auto">
                {todayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-2.5 rounded-xl border border-border bg-muted/30 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: ev.color }}
                      />
                      <span className="font-medium truncate">{ev.title}</span>
                    </div>
                    {ev.amount !== undefined && (
                      <span className="font-bold shrink-0">{formatCurrency(ev.amount)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Mini Resumo de Saúde Financeira */}
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" /> Score de Saúde Financeira
                </p>
                <p className="text-lg font-extrabold text-foreground mt-0.5">
                  {financialData?.financialHealth?.score || 0}/100 —{' '}
                  {financialData?.financialHealth?.status || 'Estável'}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => onNavigate('finances')}>
                Ver Finanças
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
