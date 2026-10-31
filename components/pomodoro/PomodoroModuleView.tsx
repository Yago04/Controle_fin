'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { usePomodoro, PomodoroModeType } from './PomodoroContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Plus,
  Flame,
  Clock,
  Target,
  Trash2,
  FolderPlus,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';

export function PomodoroModuleView() {
  const {
    mode,
    isRunning,
    secondsLeft,
    elapsedSeconds,
    activeTask,
    setMode,
    setActiveTask,
    startTimer,
    pauseTimer,
    resetTimer,
    completeSessionNow,
    formatTime,
    lastCompletedAt,
  } = usePomodoro();

  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form Nova Tarefa
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Form Novo Projeto
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#3b82f6');

  const [filterProject, setFilterProject] = useState('ALL');

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [tasksRes, pomoRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/pomodoro'),
      ]);
      const tasksJson = await tasksRes.json();
      const pomoJson = await pomoRes.json();

      if (tasksJson.success) {
        setTasks(tasksJson.data.tasks || []);
        setProjects(tasksJson.data.projects || []);
      }
      if (pomoJson.success) {
        setStats(pomoJson.data);
      }
    } catch (e) {
      console.error('Erro ao carregar dados de Pomodoro & Tarefas:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll, lastCompletedAt]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        priority,
        estimatedPomodoros: Number(estimatedPomodoros),
        projectId: selectedProjectId || null,
        dueDate: dueDate || null,
      }),
    });
    setTitle('');
    setEstimatedPomodoros(1);
    fetchAll();
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'PROJECT',
        name: newProjectName.trim(),
        color: newProjectColor,
      }),
    });
    setNewProjectName('');
    setShowNewProject(false);
    fetchAll();
  };

  const handleToggleTaskDone = async (task: any) => {
    const nextStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    fetchAll();
  };

  const handleDeleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (activeTask?.id === id) {
      setActiveTask(null);
    }
    fetchAll();
  };

  const displayTime = mode === 'STOPWATCH' ? formatTime(elapsedSeconds) : formatTime(secondsLeft);

  const modes: Array<{ id: PomodoroModeType; label: string }> = [
    { id: 'FOCUS', label: '🍅 Foco (25m)' },
    { id: 'SHORT_BREAK', label: '☕ Pausa Curta (5m)' },
    { id: 'LONG_BREAK', label: '🌴 Pausa Longa (15m)' },
    { id: 'STOPWATCH', label: '⏱️ Cronômetro Livre' },
  ];

  const filteredTasks = tasks.filter((t) =>
    filterProject === 'ALL' ? true : t.projectId === filterProject
  );

  const priorityBadge: Record<string, string> = {
    URGENT: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
    HIGH: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    MEDIUM: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    LOW: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };

  return (
    <div className="space-y-6">
      {/* Header da Aba */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            🍅 Foco & Pomodoro
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Gestão de atenção profunda, tarefas estimadas por blocos de foco e métricas reais.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNewProject(!showNewProject)}
          className="gap-2 self-start sm:self-auto"
        >
          <FolderPlus className="h-4 w-4 text-primary" />
          Novo Projeto
        </Button>
      </div>

      {/* Formulário de Novo Projeto */}
      {showNewProject && (
        <form
          onSubmit={handleCreateProject}
          className="p-4 rounded-xl bg-card border border-border flex flex-wrap items-center gap-3 animate-in fade-in"
        >
          <input
            type="text"
            required
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Nome do projeto (ex: SaaS, Inglês, Certificação)..."
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-background border border-input text-sm"
          />
          <input
            type="color"
            value={newProjectColor}
            onChange={(e) => setNewProjectColor(e.target.value)}
            className="h-9 w-12 rounded cursor-pointer bg-transparent"
          />
          <Button type="submit" size="sm">
            Salvar Projeto
          </Button>
        </form>
      )}

      {/* Métricas de Produtividade no Topo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Focado Hoje</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                {stats?.todayMinutes || 0} <span className="text-xs font-normal">min</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Meta: {stats?.dailyGoalMinutes || 100}m ({stats?.todaySessionsCount || 0} sessões)
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Foco na Semana</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                {stats ? (stats.weekMinutes / 60).toFixed(1) : '0.0'}{' '}
                <span className="text-xs font-normal">horas</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {stats?.weekMinutes || 0} minutos totais
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
              <Target className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Foco no Mês</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                {stats ? (stats.monthMinutes / 60).toFixed(1) : '0.0'}{' '}
                <span className="text-xs font-normal">horas</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Acumulado mensal
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Sequência (Streak)</p>
              <p className="text-xl sm:text-2xl font-bold text-amber-500 mt-1">
                {stats?.streakDays || 0} <span className="text-xs font-normal">dias</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Consistência diária
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Flame className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid Principal: Timer + Lista de Tarefas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Timer Central & Distribuição por Projeto */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-primary/20 shadow-lg">
            <CardContent className="p-6 flex flex-col items-center text-center space-y-6">
              {/* Seletor de Modo */}
              <div className="flex flex-wrap justify-center gap-1.5 bg-muted/60 p-1.5 rounded-xl w-full">
                {modes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      mode === m.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Relógio Gigante */}
              <div className="py-4">
                <div className="text-6xl sm:text-7xl font-mono font-extrabold tracking-tighter text-foreground select-none">
                  {displayTime}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {activeTask ? (
                    <span className="text-primary font-semibold">
                      🎯 Focando em: {activeTask.title}
                    </span>
                  ) : (
                    'Selecione uma tarefa ao lado ou inicie um foco livre'
                  )}
                </p>
              </div>

              {/* Controles do Timer */}
              <div className="flex items-center justify-center gap-3 w-full">
                {!isRunning ? (
                  <Button
                    onClick={() => startTimer()}
                    className="flex-1 h-12 text-base font-bold gap-2 bg-rose-600 hover:bg-rose-500 text-white"
                  >
                    <Play className="h-5 w-5 fill-current" />
                    Iniciar Timer
                  </Button>
                ) : (
                  <Button
                    onClick={pauseTimer}
                    variant="outline"
                    className="flex-1 h-12 text-base font-bold gap-2 border-amber-500/50 text-amber-500"
                  >
                    <Pause className="h-5 w-5" />
                    Pausar
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={completeSessionNow}
                  title="Concluir e Registrar no Banco"
                  className="h-12 px-4 gap-1.5 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="hidden sm:inline text-xs font-bold">Concluir</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={resetTimer}
                  title="Reiniciar"
                  className="h-12 px-3 text-muted-foreground"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Distribuição de Foco por Projeto */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Distribuição por Projeto (Mês)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats?.projectDistribution?.length > 0 ? (
                stats.projectDistribution.map((p: any) => {
                  const pct = Math.min(
                    100,
                    Math.round((p.minutes / Math.max(1, stats.monthMinutes)) * 100)
                  );
                  return (
                    <div key={p.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: p.color }}
                          />
                          {p.name}
                        </span>
                        <span className="text-muted-foreground">
                          {p.minutes} min ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: p.color }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Conclua sua primeira sessão Pomodoro para visualizar o gráfico por projeto.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita: Lista de Tarefas & Estimativa de Pomodoros */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-base font-bold">Fila de Tarefas & Projetos</CardTitle>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setFilterProject('ALL')}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer ${
                    filterProject === 'ALL'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  Todas
                </button>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setFilterProject(p.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      filterProject === p.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.name}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Form Criar Tarefa */}
              <form
                onSubmit={handleCreateTask}
                className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-3"
              >
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Adicionar nova tarefa para focar..."
                    className="flex-1 px-3 py-2 rounded-lg bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button type="submit" size="sm" className="gap-1.5 h-9">
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-background border border-input"
                  >
                    <option value="">Sem Projeto</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-lg bg-background border border-input"
                  >
                    <option value="LOW">Prioridade Baixa</option>
                    <option value="MEDIUM">Prioridade Média</option>
                    <option value="HIGH">Prioridade Alta</option>
                    <option value="URGENT">Urgente 🔥</option>
                  </select>

                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background border border-input">
                    <span>🍅 Est.:</span>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={estimatedPomodoros}
                      onChange={(e) => setEstimatedPomodoros(Number(e.target.value))}
                      className="w-12 bg-transparent font-bold text-center focus:outline-none"
                    />
                  </div>

                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-background border border-input"
                  />
                </div>
              </form>

              {/* Lista de Tarefas */}
              {loading ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Carregando tarefas do banco...
                </p>
              ) : filteredTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Nenhuma tarefa encontrada neste filtro.
                </p>
              ) : (
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {filteredTasks.map((task) => {
                    const isSelected = activeTask?.id === task.id;
                    const isDone = task.status === 'DONE';
                    return (
                      <div
                        key={task.id}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-rose-500 bg-rose-500/5'
                            : 'border-border bg-card hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <button
                            onClick={() => handleToggleTaskDone(task)}
                            className="text-muted-foreground hover:text-primary shrink-0 cursor-pointer"
                          >
                            {isDone ? (
                              <CheckSquare className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <Square className="h-5 w-5" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm font-medium truncate ${
                                isDone ? 'line-through text-muted-foreground' : 'text-foreground'
                              }`}
                            >
                              {task.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {task.project && (
                                <span
                                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                                  style={{
                                    backgroundColor: `${task.project.color}20`,
                                    color: task.project.color,
                                  }}
                                >
                                  {task.project.name}
                                </span>
                              )}
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                                  priorityBadge[task.priority] || ''
                                }`}
                              >
                                {task.priority}
                              </span>
                              <span className="text-[11px] text-muted-foreground font-mono">
                                🍅 {task.completedPomodoros}/{task.estimatedPomodoros}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {!isDone && (
                            <Button
                              size="sm"
                              variant={isSelected ? 'primary' : 'outline'}
                              onClick={() => {
                                setActiveTask({
                                  id: task.id,
                                  title: task.title,
                                  projectId: task.projectId,
                                });
                                startTimer(
                                  {
                                    id: task.id,
                                    title: task.title,
                                    projectId: task.projectId,
                                  },
                                  'FOCUS'
                                );
                              }}
                              className="h-8 text-xs gap-1"
                            >
                              <Play className="h-3.5 w-3.5" />
                              Focar
                            </Button>
                          )}

                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                            title="Excluir tarefa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
