'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { usePomodoro } from '@/components/pomodoro/PomodoroContext';
import {
  LayoutDashboard,
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
  Target,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Clock,
  Award,
  ChevronRight,
  Smile,
  Zap,
  Trash2,
  Plus,
  Filter,
} from 'lucide-react';

interface LifeOSDashboardProps {
  onNavigate: (section: string) => void;
  onOpenNewTask?: () => void;
}

export function LifeOSDashboard({ onNavigate, onOpenNewTask }: LifeOSDashboardProps) {
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
  const [goals, setGoals] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do To-Do List Interativo
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'TODO' | 'DONE'>('ALL');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [quickPomodoros, setQuickPomodoros] = useState(1);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Saudação personalizada
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const fetchDashboardData = useCallback(async () => {
    try {
      const now = new Date();
      const m = now.getMonth() + 1;
      const y = now.getFullYear();

      const [tRes, pRes, hRes, gRes, cRes, goalsRes, nRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/pomodoro'),
        fetch('/api/gym/health'),
        fetch('/api/gym'),
        fetch(`/api/calendar?month=${m}&year=${y}`),
        fetch('/api/goals'),
        fetch('/api/notes'),
      ]);

      const [tJson, pJson, hJson, gJson, cJson, goalsJson, nJson] = await Promise.all([
        tRes.json(),
        pRes.json(),
        hRes.json(),
        gRes.json(),
        cRes.json(),
        goalsRes.json(),
        nRes.json(),
      ]);

      if (tJson.success) setTasks(tJson.data.tasks || []);
      if (pJson.success) setPomoStats(pJson.data);
      if (hJson.success) setHealth(hJson.data);
      if (gJson.success) setGym(gJson.data);
      if (goalsJson.success) setGoals(goalsJson.data.goals || []);
      if (nJson.success) setNotes((nJson.data.notes || []).slice(0, 4));

      if (cJson.success) {
        const todayNum = now.getDate();
        const itemsToday = (cJson.data.items || []).filter((it: any) => {
          const d = new Date(it.date);
          return d.getDate() === todayNum;
        });
        setTodayEvents(itemsToday);
      }
    } catch (e) {
      console.error('Erro ao carregar Dashboard Geral:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, lastCompletedAt]);

  const handleToggleTask = async (task: any) => {
    const nextStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    // Atualização otimista imediata
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    fetchDashboardData();
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || isSubmittingTask) return;
    try {
      setIsSubmittingTask(true);
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quickTitle.trim(),
          priority: quickPriority,
          estimatedPomodoros: quickPomodoros,
          status: 'TODO',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setQuickTitle('');
        setQuickPomodoros(1);
        setQuickPriority('MEDIUM');
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Erro ao adicionar tarefa:', err);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleDeleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    fetchDashboardData();
  };

  const handleQuickWater = async (ml: number) => {
    await fetch('/api/gym/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'DAILY_LOG', addWaterMl: ml }),
    });
    fetchDashboardData();
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
    fetchDashboardData();
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

  // Cálculos de métricas do dia
  const completedTasksCount = tasks.filter((t) => t.status === 'DONE').length;
  const totalTasksCount = tasks.length;
  const tasksProgressPct =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const todayMinutes = pomoStats?.todayMinutes || 0;
  const focusGoalMinutes = pomoStats?.dailyGoalMinutes || 100;
  const focusProgressPct = Math.min(Math.round((todayMinutes / focusGoalMinutes) * 100), 100);

  const waterMl = health?.todayLog?.waterMl || 0;
  const waterGoal = health?.dailyWaterGoalMl || 3000;
  const waterProgressPct = Math.min(Math.round((waterMl / waterGoal) * 100), 100);

  const activeGoalsCount = goals.filter((g) => g.status === 'IN_PROGRESS').length;

  return (
    <div className="space-y-6">
      {/* 1. HERO BANNER DO DASHBOARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/20 via-card to-cyan-500/10 border border-primary/25 p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/20 text-primary text-xs font-bold tracking-wide uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Personal Life OS • Hub Central</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground capitalize">
              {getGreeting()}, Produtividade! ⚡
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 capitalize">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              {todayFormatted}
            </p>
          </div>

          {/* Ações Rápidas em Destaque */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => startTimer(undefined, 'FOCUS')}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold gap-2 shadow-sm text-xs sm:text-sm"
            >
              <Timer className="h-4 w-4" />
              Iniciar Foco
            </Button>

            <Button
              variant="outline"
              onClick={handleOpenTodayNote}
              className="gap-2 border-amber-500/40 text-amber-500 hover:bg-amber-500/10 font-semibold text-xs sm:text-sm"
            >
              <FileText className="h-4 w-4" />
              Nota do Dia
            </Button>

            <Button
              variant="outline"
              onClick={() => onNavigate('gym')}
              className="gap-2 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 font-semibold text-xs sm:text-sm"
            >
              <Dumbbell className="h-4 w-4" />
              Treinar
            </Button>

            <Button
              variant="outline"
              onClick={() => onNavigate('goals')}
              className="gap-2 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-semibold text-xs sm:text-sm"
            >
              <Target className="h-4 w-4" />
              Metas
            </Button>
          </div>
        </div>
      </div>

      {/* 2. OS 4 CARDS DE PERFORMANCE GERAL (SEM DADOS FINANCEIROS FICTÍCIOS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Foco & Produtividade */}
        <Card
          onClick={() => onNavigate('pomodoro')}
          className="cursor-pointer hover:border-rose-500/50 transition-all hover:shadow-md"
        >
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                <Timer className="h-4 w-4" /> Foco Profundo
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 flex items-center gap-1">
                <Flame className="h-3 w-3" /> {pomoStats?.streakDays || 0}d streak
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {todayMinutes} <span className="text-sm font-normal text-muted-foreground">min</span>
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  Meta: {focusGoalMinutes}m
                </span>
              </div>

              {/* Barra de progresso */}
              <div className="w-full h-2 rounded-full bg-muted mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full transition-all duration-500"
                  style={{ width: `${focusProgressPct}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              {focusProgressPct >= 100
                ? '🏆 Meta diária atingida!'
                : `${focusGoalMinutes - todayMinutes} min restantes para a meta`}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Tarefas & Execução */}
        <Card
          onClick={() => onNavigate('pomodoro')}
          className="cursor-pointer hover:border-blue-500/50 transition-all hover:shadow-md"
        >
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-500 flex items-center gap-1.5">
                <CheckSquare className="h-4 w-4" /> Tarefas de Hoje
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
                {tasksProgressPct}% feito
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {completedTasksCount}{' '}
                  <span className="text-sm font-normal text-muted-foreground">
                    / {totalTasksCount}
                  </span>
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {totalTasksCount - completedTasksCount} pendentes
                </span>
              </div>

              {/* Barra de progresso */}
              <div className="w-full h-2 rounded-full bg-muted mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                  style={{ width: `${tasksProgressPct}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground truncate">
              {totalTasksCount === 0
                ? 'Nenhuma tarefa cadastrada'
                : completedTasksCount === totalTasksCount
                ? '🎉 Todas as tarefas concluídas!'
                : `Próxima: ${tasks.find((t) => t.status !== 'DONE')?.title || 'Nenhuma'}`}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Hidratação & Hábitos */}
        <Card
          onClick={() => onNavigate('gym')}
          className="cursor-pointer hover:border-sky-500/50 transition-all hover:shadow-md"
        >
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Droplets className="h-4 w-4" /> Água & Hábitos
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickCreatine();
                }}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                  health?.todayLog?.creatineChecked
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                Creatina {health?.todayLog?.creatineChecked ? '✓' : 'pendente'}
              </button>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {waterMl}{' '}
                  <span className="text-sm font-normal text-muted-foreground">
                    / {waterGoal} ml
                  </span>
                </span>
                <span className="text-xs font-medium text-muted-foreground">{waterProgressPct}%</span>
              </div>

              {/* Barra de progresso */}
              <div className="w-full h-2 rounded-full bg-muted mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${waterProgressPct}%` }}
                />
              </div>
            </div>

            {/* Ações rápidas de água */}
            <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickWater(250)}
                className="h-6 text-[11px] px-2 border-sky-500/30 text-sky-400 hover:bg-sky-500/10 flex-1"
              >
                +250ml
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickWater(500)}
                className="h-6 text-[11px] px-2 border-sky-500/30 text-sky-400 hover:bg-sky-500/10 flex-1"
              >
                +500ml
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Metas & Planejamento */}
        <Card
          onClick={() => onNavigate('goals')}
          className="cursor-pointer hover:border-emerald-500/50 transition-all hover:shadow-md"
        >
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Target className="h-4 w-4" /> Metas Ativas
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                {activeGoalsCount} em foco
              </span>
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {goals.length}{' '}
                  <span className="text-sm font-normal text-muted-foreground">cadastradas</span>
                </span>
                <span className="text-xs font-medium text-emerald-400">Horizonte 360°</span>
              </div>

              {/* Mini lista de metas */}
              <div className="mt-2 space-y-1">
                {goals.slice(0, 2).map((g) => {
                  const pct =
                    g.targetValue > 0
                      ? Math.min(Math.round((g.currentValue / g.targetValue) * 100), 100)
                      : 0;
                  return (
                    <div key={g.id} className="text-[11px] flex items-center justify-between">
                      <span className="truncate max-w-[130px] text-muted-foreground">{g.title}</span>
                      <span className="font-bold text-foreground">{pct}%</span>
                    </div>
                  );
                })}
                {goals.length === 0 && (
                  <p className="text-[11px] text-muted-foreground">Crie sua primeira meta</p>
                )}
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Planejamento Estratégico</span>
              <ArrowRight className="h-3 w-3 text-primary" />
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. GRID PRINCIPAL COM PAINEIS INTERATIVOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA 1: TIMER DE FOCO + LISTA DE TAREFAS DE HOJE */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              🍅 Foco & Tarefas de Hoje
            </CardTitle>
            <button
              onClick={() => onNavigate('pomodoro')}
              className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              Ver todas <ArrowRight className="h-3 w-3" />
            </button>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Widget Pomodoro Interativo */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-transparent border border-rose-500/25 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                  {mode === 'FOCUS' ? 'Modo Foco' : mode === 'SHORT_BREAK' ? 'Pausa Curta' : 'Cronômetro'}
                </span>
                <p className="font-mono text-3xl font-extrabold text-foreground tracking-tight">
                  {displayTime}
                </p>
                <p className="text-xs text-muted-foreground truncate max-w-[180px] mt-0.5">
                  {activeTask ? activeTask.title : 'Pronto para 25 min de imersão'}
                </p>
              </div>

              {!isRunning ? (
                <Button
                  size="sm"
                  onClick={() => startTimer(undefined, 'FOCUS')}
                  className="bg-rose-600 hover:bg-rose-500 text-white gap-1.5 font-bold shadow-sm"
                >
                  <Play className="h-4 w-4 fill-current" /> Focar
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={pauseTimer}
                  className="gap-1.5 border-rose-500/40 text-rose-400 font-bold"
                >
                  <Pause className="h-4 w-4" /> Pausar
                </Button>
              )}
            </div>

            {/* To-Do List Interativo Completo */}
            <div className="space-y-3">
              {/* Controles de Filtro e Contadores */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border/50 text-[11px] font-semibold">
                  <button
                    onClick={() => setTaskFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      taskFilter === 'ALL'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Todas ({tasks.length})
                  </button>
                  <button
                    onClick={() => setTaskFilter('TODO')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      taskFilter === 'TODO'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Pendentes ({tasks.filter((t) => t.status !== 'DONE').length})
                  </button>
                  <button
                    onClick={() => setTaskFilter('DONE')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      taskFilter === 'DONE'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Concluídas ({tasks.filter((t) => t.status === 'DONE').length})
                  </button>
                </div>

                <span className="text-[11px] font-bold text-muted-foreground">
                  {tasksProgressPct}% feito
                </span>
              </div>

              {/* Form de Adição Rápida de Tarefa (Linear Style) */}
              <form onSubmit={handleCreateTask} className="space-y-2">
                <div className="flex items-center gap-2 p-1.5 rounded-xl border border-border/80 bg-background/80 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <input
                    type="text"
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    placeholder="Adicionar tarefa rápida... (pressione Enter)"
                    className="flex-1 bg-transparent px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none"
                  />

                  {/* Seletor de Prioridade */}
                  <select
                    value={quickPriority}
                    onChange={(e: any) => setQuickPriority(e.target.value)}
                    className="bg-muted text-[10px] font-semibold px-2 py-1 rounded-lg border border-border/60 text-muted-foreground outline-none cursor-pointer"
                    title="Prioridade"
                  >
                    <option value="LOW">⚪ Baixa</option>
                    <option value="MEDIUM">🔵 Média</option>
                    <option value="HIGH">🟡 Alta</option>
                    <option value="URGENT">🔴 Urgente</option>
                  </select>

                  {/* Seletor de Pomodoros */}
                  <select
                    value={quickPomodoros}
                    onChange={(e) => setQuickPomodoros(Number(e.target.value))}
                    className="bg-muted text-[10px] font-semibold px-2 py-1 rounded-lg border border-border/60 text-muted-foreground outline-none cursor-pointer"
                    title="Estimativa de Pomodoros"
                  >
                    <option value={1}>🍅 1</option>
                    <option value={2}>🍅 2</option>
                    <option value={3}>🍅 3</option>
                    <option value={4}>🍅 4</option>
                    <option value={5}>🍅 5</option>
                  </select>

                  <Button
                    type="submit"
                    size="sm"
                    disabled={!quickTitle.trim() || isSubmittingTask}
                    className="h-7 px-2.5 text-xs font-bold gap-1 shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Adicionar</span>
                  </Button>
                </div>
              </form>

              {/* Lista Filtrada de Tarefas */}
              {tasks.filter((t) => {
                if (taskFilter === 'TODO') return t.status !== 'DONE';
                if (taskFilter === 'DONE') return t.status === 'DONE';
                return true;
              }).length === 0 ? (
                <div className="p-6 text-center rounded-2xl border border-dashed border-border/70 bg-muted/20 space-y-2">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500/80 mx-auto" />
                  <p className="text-xs font-bold text-foreground">
                    {taskFilter === 'DONE'
                      ? 'Nenhuma tarefa concluída ainda.'
                      : 'Tudo limpo por aqui! 🎉'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {taskFilter === 'DONE'
                      ? 'Conclua tarefas da sua lista para vê-las aqui.'
                      : 'Você concluiu todas as tarefas ou ainda não adicionou nenhuma.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {tasks
                    .filter((t) => {
                      if (taskFilter === 'TODO') return t.status !== 'DONE';
                      if (taskFilter === 'DONE') return t.status === 'DONE';
                      return true;
                    })
                    .map((t) => {
                      const isDone = t.status === 'DONE';
                      return (
                        <div
                          key={t.id}
                          className={`group flex items-center justify-between gap-2.5 p-3 rounded-xl border transition-all ${
                            isDone
                              ? 'bg-muted/30 border-border/40 opacity-70'
                              : 'bg-card border-border hover:border-primary/50 shadow-xs'
                          }`}
                        >
                          {/* Checkbox de área de toque de 44px */}
                          <button
                            type="button"
                            onClick={() => handleToggleTask(t)}
                            className="flex items-center gap-2.5 text-left min-w-0 flex-1 cursor-pointer min-h-[36px]"
                          >
                            <div className="shrink-0 flex items-center justify-center h-6 w-6 rounded-lg transition-transform active:scale-75">
                              {isDone ? (
                                <CheckSquare className="h-5 w-5 text-emerald-500" />
                              ) : (
                                <Square className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-xs truncate transition-all ${
                                  isDone
                                    ? 'line-through text-muted-foreground'
                                    : 'font-medium text-foreground'
                                }`}
                              >
                                {t.title}
                              </p>
                              {t.project && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <span
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{ backgroundColor: t.project.color || '#f59e0b' }}
                                  />
                                  {t.project.name}
                                </span>
                              )}
                            </div>
                          </button>

                          {/* Prioridade & Pomodoro Badge */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {t.priority === 'URGENT' && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                Urgente
                              </span>
                            )}
                            {t.priority === 'HIGH' && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                Alta
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                startTimer(t, 'FOCUS');
                                onNavigate('pomodoro');
                              }}
                              className="font-mono text-[10px] text-muted-foreground hover:text-rose-400 bg-muted/70 hover:bg-rose-500/10 px-2 py-0.5 rounded-md border border-border/60 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Iniciar Pomodoro nesta tarefa"
                            >
                              🍅 {t.completedPomodoros}/{t.estimatedPomodoros}
                            </button>

                            {/* Botão de Excluir */}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteTask(t.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-all cursor-pointer"
                              title="Excluir tarefa"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* COLUNA 2: TREINO & PERFORMANCE FÍSICA */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              🏋️ Treino & Saúde
            </CardTitle>
            <button
              onClick={() => onNavigate('gym')}
              className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              Fichas <ArrowRight className="h-3 w-3" />
            </button>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Banner de Hábitos Diários */}
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Dumbbell className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Sessões este Mês</p>
                  <p className="text-lg font-extrabold text-cyan-400">
                    {gym?.healthRoi?.monthWorkoutsCount || 0}{' '}
                    <span className="text-xs font-normal text-muted-foreground">treinos feitos</span>
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => onNavigate('gym')}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold gap-1 text-xs"
              >
                Treinar Agora
              </Button>
            </div>

            {/* Fichas Prontas */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground px-1">
                Fichas de Treino Disponíveis:
              </p>
              {(gym?.routines || []).map((r: any) => (
                <div
                  key={r.id}
                  onClick={() => onNavigate('gym')}
                  className="p-3 rounded-xl border border-border bg-card hover:border-cyan-500/50 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-extrabold text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: r.color || '#06b6d4' }}
                    >
                      {r.code || 'T'}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {r.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {r.exercises?.length || 0} exercícios estruturados
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* COLUNA 3: AGENDA UNIFICADA & SEGUNDO CÉREBRO */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              📅 Agenda & Segundo Cérebro
            </CardTitle>
            <button
              onClick={() => onNavigate('calendar')}
              className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              Calendário <ArrowRight className="h-3 w-3" />
            </button>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Eventos de Hoje */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground px-1 block">
                Compromissos de Hoje
              </span>

              {todayEvents.length === 0 ? (
                <div className="p-4 rounded-xl bg-muted/20 border border-border text-center space-y-1">
                  <Calendar className="h-5 w-5 text-muted-foreground mx-auto" />
                  <p className="text-xs font-medium text-foreground">
                    Nenhum compromisso marcado para hoje.
                  </p>
                  <p className="text-[11px] text-muted-foreground">Dia livre para focar nas metas!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
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
                      <span className="text-[10px] text-muted-foreground shrink-0 capitalize">
                        {ev.type?.toLowerCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Segundo Cérebro: Notas Recentes */}
            <div className="pt-2 border-t border-border/70 space-y-2">
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-amber-500" /> Notas Recentes
                </span>
                <button
                  onClick={() => onNavigate('notes')}
                  className="text-primary hover:underline font-medium text-[11px] cursor-pointer"
                >
                  Ver notas
                </button>
              </div>

              <div className="space-y-1.5">
                {notes.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => onNavigate('notes')}
                    className="p-2.5 rounded-lg border border-border bg-card hover:border-amber-500/50 transition-colors cursor-pointer flex items-center justify-between text-xs"
                  >
                    <span className="font-medium truncate text-foreground">{n.title}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(n.updatedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                ))}

                {notes.length === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenTodayNote}
                    className="w-full text-xs gap-1.5 border-amber-500/30 text-amber-500"
                  >
                    <FileText className="h-3.5 w-3.5" /> Criar Nota Diária de Hoje
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}