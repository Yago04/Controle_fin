'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Dumbbell,
  Play,
  Check,
  Trophy,
  Timer,
  Droplets,
  Flame,
  Scale,
  History,
  Plus,
  Wallet,
  Sparkles,
  X,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ChevronRight,
  Zap,
  Info,
  RotateCcw,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { WorkoutRoutineBuilder } from './WorkoutRoutineBuilder';
import { ExerciseMediaBadge } from './ExerciseMediaBadge';

interface SetRowState {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  setType: 'WARMUP' | 'WORKING' | 'DROPSET' | 'FAILURE';
  weightKg: number;
  reps: number;
  completed: boolean;
  previousText: string;
  maxHistoricalWeight: number;
  restSeconds: number;
}

interface ProgressionSession {
  sessionId: string;
  date: string;
  sessionTitle: string;
  maxWeightKg: number;
  best1RM: number;
  totalVolumeKg: number;
  setsCount: number;
  bestReps: number;
  sets: Array<{
    setNumber: number;
    weightKg: number;
    reps: number;
    setType: string;
    isPR: boolean;
  }>;
}

interface ExerciseProgression {
  exerciseId: string;
  initialWeightKg: number;
  currentWeightKg: number;
  initial1RM: number;
  current1RM: number;
  maxWeightAllTime: number;
  best1RMAllTime: number;
  percentGain: number;
  totalVolumeAllTime: number;
  totalSessions: number;
  totalSets: number;
  sessions: ProgressionSession[];
}

const MUSCLE_GROUP_LABELS: Record<string, string> = {
  CHEST: 'Peitoral',
  BACK: 'Costas',
  SHOULDERS: 'Ombros',
  BICEPS: 'Bíceps',
  TRICEPS: 'Tríceps',
  LEGS: 'Pernas',
  GLUTES: 'Glúteos',
  ABS: 'Abdômen',
  CARDIO: 'Cardio',
  FULL_BODY: 'Corpo Inteiro',
};

const GYM_CACHE_KEY = 'fincontrol_gym_cache_v1';
const HEALTH_CACHE_KEY = 'fincontrol_health_cache_v1';

export function GymModuleView() {
  const [subTab, setSubTab] = useState<'WORKOUT' | 'BUILDER' | 'HISTORY' | 'HEALTH'>('WORKOUT');
  
  // Cache imediato com SWR (Stale-While-Revalidate) - Renderiza a 0ms se houver cache
  const [gymData, setGymData] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(GYM_CACHE_KEY);
        if (cached) return JSON.parse(cached);
      } catch (err) {
        console.warn('Erro ao restaurar cache do gymData:', err);
      }
    }
    return null;
  });

  const [healthData, setHealthData] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(HEALTH_CACHE_KEY);
        if (cached) return JSON.parse(cached);
      } catch (err) {
        console.warn('Erro ao restaurar cache do healthData:', err);
      }
    }
    return null;
  });

  // Se já temos cache, não exibe tela de loading inicial
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return !localStorage.getItem(GYM_CACHE_KEY);
      } catch {
        return true;
      }
    }
    return true;
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Estado de Treino Ao Vivo
  const [activeRoutine, setActiveRoutine] = useState<any | null>(null);
  const [workoutStartedAt, setWorkoutStartedAt] = useState<string | null>(null);
  const [setsState, setSetsState] = useState<SetRowState[]>([]);
  const [energyLevel, setEnergyLevel] = useState<number>(4);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [savingWorkout, setSavingWorkout] = useState(false);
  const [workoutResultBanner, setWorkoutResultBanner] = useState<string | null>(null);

  // Timer de Descanso Automático (baseado em Date.now())
  const [restSecondsLeft, setRestSecondsLeft] = useState<number>(0);
  const restEndRef = useRef<number | null>(null);

  // Estado da Sub-aba 'Histórico & Evolução de Cargas'
  const [selectedEvolutionExId, setSelectedEvolutionExId] = useState<string>('');
  const [chartMetric, setChartMetric] = useState<'MAX_WEIGHT' | 'ESTIMATED_1RM' | 'VOLUME'>('MAX_WEIGHT');
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);

  // Form Medidas Corporais
  const [weightKg, setWeightKg] = useState('');
  const [bodyFatPct, setBodyFatPct] = useState('');
  const [waistCm, setWaistCm] = useState('');
  const [armCm, setArmCm] = useState('');

  const fetchAllGym = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setIsSyncing(true);
      }
      const [gRes, hRes] = await Promise.all([
        fetch('/api/gym'),
        fetch('/api/gym/health'),
      ]);
      const gJson = await gRes.json();
      const hJson = await hRes.json();
      if (gJson.success && gJson.data) {
        setGymData(gJson.data);
        try {
          localStorage.setItem(GYM_CACHE_KEY, JSON.stringify(gJson.data));
        } catch (e) {
          console.warn('Falha ao persistir cache do gym:', e);
        }
      }
      if (hJson.success && hJson.data) {
        setHealthData(hJson.data);
        try {
          localStorage.setItem(HEALTH_CACHE_KEY, JSON.stringify(hJson.data));
        } catch (e) {
          console.warn('Falha ao persistir cache da saúde:', e);
        }
      }
    } catch (e) {
      console.error('Erro ao carregar Academia & Saúde:', e);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    // Se já havia dados em cache, busca silenciosamente em segundo plano (SWR)
    fetchAllGym(!!gymData);
  }, []);

  // Selecionar o primeiro exercício com histórico quando os dados forem carregados
  useEffect(() => {
    if (!selectedEvolutionExId && gymData?.exercises?.length) {
      // Prioriza exercício que já tenha histórico na progressão
      const exWithProg = gymData.exercises.find(
        (ex: any) => gymData.progressionByExercise?.[ex.id]?.sessions?.length > 0
      );
      if (exWithProg) {
        setSelectedEvolutionExId(exWithProg.id);
      } else {
        setSelectedEvolutionExId(gymData.exercises[0].id);
      }
    }
  }, [gymData, selectedEvolutionExId]);

  // Loop do Timer de Descanso Automático
  useEffect(() => {
    if (restSecondsLeft <= 0 || !restEndRef.current) return;
    const interval = setInterval(() => {
      if (!restEndRef.current) return;
      const rem = Math.max(0, Math.round((restEndRef.current - Date.now()) / 1000));
      setRestSecondsLeft(rem);
      if (rem <= 0) {
        restEndRef.current = null;
      }
    }, 250);
    return () => clearInterval(interval);
  }, [restSecondsLeft]);

  const startRestTimer = (seconds: number) => {
    restEndRef.current = Date.now() + seconds * 1000;
    setRestSecondsLeft(seconds);
  };

  const adjustRestTimer = (deltaSeconds: number) => {
    const next = Math.max(0, restSecondsLeft + deltaSeconds);
    if (next === 0) {
      restEndRef.current = null;
      setRestSecondsLeft(0);
    } else {
      restEndRef.current = Date.now() + next * 1000;
      setRestSecondsLeft(next);
    }
  };

  const handleStartRoutine = (routine: any) => {
    setActiveRoutine(routine);
    setWorkoutStartedAt(new Date().toISOString());
    setWorkoutResultBanner(null);

    const rows: SetRowState[] = [];
    for (const item of routine.exercises) {
      const prev = item.previousLog;
      const defaultWeight = prev ? prev.weightKg : item.targetWeightKg || 20;
      const defaultReps = prev
        ? prev.reps
        : parseInt(String(item.targetReps).split('-')[0] || '10', 10);

      for (let s = 1; s <= item.targetSets; s++) {
        rows.push({
          exerciseId: item.exerciseId,
          exerciseName: item.exercise.name,
          setNumber: s,
          setType: 'WORKING',
          weightKg: Number(defaultWeight),
          reps: Number(defaultReps),
          completed: false,
          previousText: prev ? `${prev.weightKg}kg x ${prev.reps}` : '1ª vez',
          maxHistoricalWeight: prev ? prev.maxWeightKg : 0,
          restSeconds: item.restSeconds || 90,
        });
      }
    }
    setSetsState(rows);
  };

  const handleToggleSetCompleted = (index: number) => {
    setSetsState((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      item.completed = !item.completed;
      next[index] = item;
      if (item.completed) {
        startRestTimer(item.restSeconds || 90);
      }
      return next;
    });
  };

  const handleUpdateSetField = (
    index: number,
    field: 'weightKg' | 'reps' | 'setType',
    value: any
  ) => {
    setSetsState((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddExtraSet = (exerciseId: string, exerciseName: string, restSeconds: number) => {
    setSetsState((prev) => {
      const existingForEx = prev.filter((s) => s.exerciseId === exerciseId);
      const last = existingForEx[existingForEx.length - 1];
      const newSetNumber = existingForEx.length + 1;
      return [
        ...prev,
        {
          exerciseId,
          exerciseName,
          setNumber: newSetNumber,
          setType: 'WORKING',
          weightKg: last ? last.weightKg : 20,
          reps: last ? last.reps : 10,
          completed: false,
          previousText: last ? last.previousText : 'Extra',
          maxHistoricalWeight: last ? last.maxHistoricalWeight : 0,
          restSeconds,
        },
      ];
    });
  };

  const handleFinishWorkout = async () => {
    const completedSets = setsState.filter((s) => s.completed && s.reps > 0);
    if (completedSets.length === 0) {
      alert('Marque pelo menos 1 série como concluída (✓) antes de finalizar o treino.');
      return;
    }

    setSavingWorkout(true);
    try {
      const res = await fetch('/api/gym/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routineId: activeRoutine?.id || null,
          title: activeRoutine?.name || 'Treino Livre',
          startedAt: workoutStartedAt || new Date().toISOString(),
          endedAt: new Date().toISOString(),
          energyLevel,
          notes: workoutNotes || null,
          sets: completedSets.map((s) => ({
            exerciseId: s.exerciseId,
            setNumber: s.setNumber,
            setType: s.setType,
            weightKg: Number(s.weightKg),
            reps: Number(s.reps),
            completed: true,
          })),
        }),
      });
      const json = await res.json();
      if (json.success) {
        const vol = Number(json.data.totalVolumeKg).toLocaleString('pt-BR');
        const prs = json.data.prsHitCount || 0;
        setWorkoutResultBanner(
          `🎉 Treino salvo com sucesso! Volume total: ${vol} kg • ${prs} Recorde(s) Pessoal(is) 🏆`
        );
        setActiveRoutine(null);
        setSetsState([]);
        restEndRef.current = null;
        setRestSecondsLeft(0);
        fetchAllGym();
      }
    } finally {
      setSavingWorkout(false);
    }
  };

  // Hábitos de Saúde
  const handleAddWater = async (ml: number) => {
    await fetch('/api/gym/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'DAILY_LOG', addWaterMl: ml }),
    });
    fetchAllGym();
  };

  const handleToggleSupplement = async (field: 'creatineChecked' | 'wheyChecked') => {
    if (!healthData?.todayLog) return;
    await fetch('/api/gym/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'DAILY_LOG',
        [field]: !healthData.todayLog[field],
      }),
    });
    fetchAllGym();
  };

  const handleSaveBodyMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weightKg) return;
    await fetch('/api/gym/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'BODY_METRIC',
        weightKg: Number(weightKg),
        bodyFatPct: bodyFatPct ? Number(bodyFatPct) : null,
        waistCm: waistCm ? Number(waistCm) : null,
        armCm: armCm ? Number(armCm) : null,
      }),
    });
    setWeightKg('');
    setBodyFatPct('');
    setWaistCm('');
    setArmCm('');
    fetchAllGym();
  };

  const currentVolumeLive = setsState
    .filter((s) => s.completed)
    .reduce((acc, s) => acc + s.weightKg * s.reps, 0);

  // Dados calculados para a sub-aba de Evolução
  const selectedProgression: ExerciseProgression | undefined =
    gymData?.progressionByExercise?.[selectedEvolutionExId];

  const selectedExerciseObj = gymData?.exercises?.find(
    (e: any) => e.id === selectedEvolutionExId
  );

  // Exercícios que possuem sessões registradas
  const exercisesWithHistory = useMemo(() => {
    if (!gymData?.exercises) return [];
    return gymData.exercises.filter(
      (ex: any) => gymData.progressionByExercise?.[ex.id]?.sessions?.length > 0
    );
  }, [gymData]);

  return (
    <div className="space-y-6 pb-12">
      {/* Topo e Sub-navegação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              🏋️ Academia, Performance & Saúde
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              Voz & IA Ativos 🎙️
            </span>
            {isSyncing && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border flex items-center gap-1.5 animate-in fade-in">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Atualizando...
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Registro por voz, progressão de 1RM estimado, timer de descanso inteligente e fichas A/B/C.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl self-start sm:self-auto shadow-inner flex-wrap">
          <button
            onClick={() => setSubTab('WORKOUT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'WORKOUT'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🏋️ Treinar Agora
          </button>
          <button
            onClick={() => setSubTab('BUILDER')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'BUILDER'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🛠️ Montar Treino
          </button>
          <button
            onClick={() => setSubTab('HISTORY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'HISTORY'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            📈 Evolução de Cargas
          </button>
          <button
            onClick={() => setSubTab('HEALTH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'HEALTH'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            💧 Corpo & Hábitos
          </button>
        </div>
      </div>

      {workoutResultBanner && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-sm font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {workoutResultBanner}
          </span>
          <button onClick={() => setWorkoutResultBanner(null)} className="p-1 hover:bg-emerald-500/20 rounded-lg">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Indicador Financeiro x Saúde: Investimento em Saúde & Custo por Treino */}
      {gymData?.healthRoi && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-cyan-500/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Treinos Concluídos (Mês)</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {gymData.healthRoi.monthWorkoutsCount}{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    / meta {gymData.healthRoi.weeklyWorkoutGoal * 4}
                  </span>
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center">
                <Dumbbell className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Investimento em Saúde (Mês)</p>
                <p className="text-2xl font-bold text-emerald-500 mt-1">
                  {formatCurrency(gymData.healthRoi.monthlyHealthInvestment)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <Wallet className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Custo Real por Treino</p>
                <p className="text-2xl font-bold text-amber-500 mt-1">
                  {formatCurrency(gymData.healthRoi.costPerWorkout)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Quanto mais você treina, menor o custo!
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-ABA 1: TREINAR AGORA / MINHAS FICHAS                                   */}
      {/* ========================================================================= */}
      {subTab === 'WORKOUT' && (
        <div className="space-y-6">
          {!activeRoutine ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(gymData?.routines || []).map((routine: any) => (
                <Card
                  key={routine.id}
                  className="border-border hover:border-primary/50 transition-all flex flex-col justify-between shadow-sm"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <span
                        className="px-2.5 py-1 rounded-lg text-xs font-extrabold text-white"
                        style={{ backgroundColor: routine.color || '#06b6d4' }}
                      >
                        FICHA {routine.code || 'A'}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {routine.exercises?.length || 0} exercícios
                      </span>
                    </div>
                    <CardTitle className="text-base font-bold mt-2">{routine.name}</CardTitle>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {routine.description}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2 border-t border-border pt-3 text-xs">
                      {routine.exercises.slice(0, 5).map((exItem: any) => (
                        <div
                          key={exItem.id}
                          className="flex items-center justify-between text-muted-foreground"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <ExerciseMediaBadge
                              exerciseName={exItem.exercise?.name}
                              equipment={exItem.exercise?.equipment}
                              muscleGroup={exItem.exercise?.muscleGroup}
                              instructions={exItem.exercise?.instructions}
                              variant="thumbnail"
                              className="h-6 w-6 rounded-md"
                            />
                            <span className="truncate text-foreground font-medium">
                              {exItem.order}. {exItem.exercise.name}
                            </span>
                          </div>
                          <span className="font-mono text-[11px] shrink-0">
                            {exItem.targetSets}x{exItem.targetReps}
                          </span>
                        </div>
                      ))}
                      {routine.exercises.length > 5 && (
                        <p className="text-[11px] text-muted-foreground">
                          +{routine.exercises.length - 5} exercícios...
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={() => handleStartRoutine(routine)}
                      className="w-full gap-2 font-bold min-h-[44px]"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      Iniciar Treino Ao Vivo
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* MODO DE EXECUÇÃO AO VIVO OTIMIZADO PARA CELULAR & DESKTOP */
            <div className="space-y-6">
              {/* Barra Superior Fixa de Treino Ativo + Timer de Descanso Automático */}
              <Card className="border-cyan-500/50 bg-card/95 backdrop-blur sticky top-16 z-20 shadow-xl">
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400">
                      Treino em Execução
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                      {activeRoutine.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Tonelagem acumulada hoje:{' '}
                      <strong className="text-cyan-400">
                        {currentVolumeLive.toLocaleString('pt-BR')} kg
                      </strong>
                    </p>
                  </div>

                  {/* Timer de Descanso Automático */}
                  <div className="flex items-center gap-2 bg-muted/70 px-3.5 py-2 rounded-xl border border-border">
                    <Timer
                      className={`h-5 w-5 ${
                        restSecondsLeft > 0 ? 'text-amber-500 animate-bounce' : 'text-muted-foreground'
                      }`}
                    />
                    <div>
                      <p className="text-[10px] uppercase text-muted-foreground font-semibold">
                        Descanso
                      </p>
                      <p className="font-mono text-base font-extrabold text-foreground">
                        {Math.floor(restSecondsLeft / 60)}:
                        {String(restSecondsLeft % 60).padStart(2, '0')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 pl-2">
                      <button
                        onClick={() => adjustRestTimer(-15)}
                        className="px-2 py-1 rounded bg-background border border-border text-[11px] font-bold hover:bg-muted cursor-pointer"
                      >
                        -15s
                      </button>
                      <button
                        onClick={() => adjustRestTimer(15)}
                        className="px-2 py-1 rounded bg-background border border-border text-[11px] font-bold hover:bg-muted cursor-pointer"
                      >
                        +15s
                      </button>
                      <button
                        onClick={() => startRestTimer(90)}
                        className="px-2 py-1 rounded bg-cyan-500/15 text-cyan-400 text-[11px] font-bold cursor-pointer"
                      >
                        90s
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveRoutine(null)}
                      className="min-h-[38px]"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleFinishWorkout}
                      disabled={savingWorkout}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1.5 min-h-[38px]"
                    >
                      <Check className="h-4 w-4" />
                      {savingWorkout ? 'Salvando...' : 'Finalizar Treino'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tabelas de Séries por Exercício */}
              <div className="space-y-4">
                {activeRoutine.exercises.map((exItem: any) => {
                  const exSets = setsState
                    .map((s, globalIdx) => ({ ...s, globalIdx }))
                    .filter((s) => s.exerciseId === exItem.exerciseId);

                  return (
                    <Card key={exItem.id}>
                      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <ExerciseMediaBadge
                            exerciseName={exItem.exercise?.name || exItem.exerciseName}
                            equipment={exItem.exercise?.equipment}
                            muscleGroup={exItem.exercise?.muscleGroup}
                            instructions={exItem.exercise?.instructions || exItem.notes}
                            variant="thumbnail"
                            className="h-11 w-11 rounded-xl shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="text-sm sm:text-base font-bold text-foreground">
                                {exItem.order}. {exItem.exercise?.name || exItem.exerciseName}
                              </CardTitle>
                              <ExerciseMediaBadge
                                exerciseName={exItem.exercise?.name || exItem.exerciseName}
                                equipment={exItem.exercise?.equipment}
                                muscleGroup={exItem.exercise?.muscleGroup}
                                instructions={exItem.exercise?.instructions || exItem.notes}
                                variant="pill"
                              />
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Meta: {exItem.targetSets} séries de {exItem.targetReps} reps • Descanso:{' '}
                              {exItem.restSeconds}s
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleAddExtraSet(
                              exItem.exerciseId,
                              exItem.exercise?.name || exItem.exerciseName,
                              exItem.restSeconds
                            )
                          }
                          className="h-8 text-xs gap-1 min-h-[36px]"
                        >
                          <Plus className="h-3.5 w-3.5" /> +Série
                        </Button>
                      </CardHeader>

                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-muted-foreground border-b border-border text-left">
                                <th className="py-2 pr-2">Série</th>
                                <th className="py-2 px-2">Anterior</th>
                                <th className="py-2 px-2">Peso (kg)</th>
                                <th className="py-2 px-2">Reps</th>
                                <th className="py-2 pl-2 text-right">Concluir</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                              {exSets.map((row) => {
                                const isNewPR =
                                  row.weightKg > 0 && row.weightKg > row.maxHistoricalWeight;
                                return (
                                  <tr
                                    key={`${row.exerciseId}-${row.setNumber}`}
                                    className={row.completed ? 'bg-emerald-500/10' : ''}
                                  >
                                    <td className="py-2.5 pr-2 font-bold">
                                      #{row.setNumber}
                                      {isNewPR && (
                                        <span
                                          className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px]"
                                          title="Novo Recorde Pessoal de Carga!"
                                        >
                                          🏆 PR
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-2 text-muted-foreground font-mono">
                                      {row.previousText}
                                    </td>
                                    <td className="py-2.5 px-2">
                                      <input
                                        type="number"
                                        step="0.5"
                                        value={row.weightKg}
                                        onChange={(e) =>
                                          handleUpdateSetField(
                                            row.globalIdx,
                                            'weightKg',
                                            Number(e.target.value)
                                          )
                                        }
                                        className="w-20 px-2 py-1.5 rounded-lg bg-background border border-input font-mono font-bold text-center"
                                      />
                                    </td>
                                    <td className="py-2.5 px-2">
                                      <input
                                        type="number"
                                        value={row.reps}
                                        onChange={(e) =>
                                          handleUpdateSetField(
                                            row.globalIdx,
                                            'reps',
                                            Number(e.target.value)
                                          )
                                        }
                                        className="w-16 px-2 py-1.5 rounded-lg bg-background border border-input font-mono font-bold text-center"
                                      />
                                    </td>
                                    <td className="py-2.5 pl-2 text-right">
                                      <button
                                        onClick={() => handleToggleSetCompleted(row.globalIdx)}
                                        className={`h-9 w-11 rounded-lg inline-flex items-center justify-center font-bold transition-all cursor-pointer ${
                                          row.completed
                                            ? 'bg-emerald-500 text-white shadow-sm'
                                            : 'bg-muted text-muted-foreground hover:text-foreground'
                                        }`}
                                      >
                                        <Check className="h-4 w-4" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-ABA 2: MONTAR TREINO / WORKOUT BUILDER                                */}
      {/* ========================================================================= */}
      {subTab === 'BUILDER' && (
        <WorkoutRoutineBuilder
          routines={gymData?.routines || []}
          exercises={gymData?.exercises || []}
          onRefresh={fetchAllGym}
          onStartWorkout={(routine) => {
            setSubTab('WORKOUT');
            handleStartRoutine(routine);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* SUB-ABA 3: HISTÓRICO & EVOLUÇÃO DE CARGAS COMPLETO                         */}
      {/* ========================================================================= */}
      {subTab === 'HISTORY' && (
        <div className="space-y-6">
          {/* Seletor de Exercício & Barra de Filtros */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-cyan-400" />
                    Visualizador de Evolução por Exercício
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Acompanhe progressão de carga máxima, 1RM estimado (fórmula de Epley) e ganho de força percentual.
                  </p>
                </div>

                {/* Seletor dropdown */}
                <div className="w-full sm:w-80">
                  <select
                    value={selectedEvolutionExId}
                    onChange={(e) => {
                      setSelectedEvolutionExId(e.target.value);
                      setHoveredPointIdx(null);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-input text-xs font-bold text-foreground cursor-pointer focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="" disabled>
                      Selecione um exercício...
                    </option>
                    {exercisesWithHistory.length > 0 && (
                      <optgroup label="Exercícios com Histórico">
                        {exercisesWithHistory.map((ex: any) => (
                          <option key={`hist-${ex.id}`} value={ex.id}>
                            🏆 {ex.name} ({gymData.progressionByExercise[ex.id].totalSessions} treinos)
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="Todos os Exercícios">
                      {(gymData?.exercises || []).map((ex: any) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name} — {MUSCLE_GROUP_LABELS[ex.muscleGroup] || ex.muscleGroup}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Pílulas de acesso rápido aos exercícios com histórico */}
              {exercisesWithHistory.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pt-2 no-scrollbar">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase shrink-0">
                    Atalhos:
                  </span>
                  {exercisesWithHistory.slice(0, 8).map((ex: any) => {
                    const isSelected = ex.id === selectedEvolutionExId;
                    return (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => {
                          setSelectedEvolutionExId(ex.id);
                          setHoveredPointIdx(null);
                        }}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500 text-white shadow-sm'
                            : 'bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {ex.name.split(' ')[0]} {ex.name.split(' ')[1] || ''}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardHeader>
          </Card>

          {/* Se o exercício tem histórico de evolução */}
          {selectedProgression && selectedProgression.sessions.length > 0 ? (
            <div className="space-y-6">
              {/* Cards de Métricas e Ganho Percentual */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Ganho de Força Total */}
                <Card className="border-emerald-500/30 bg-gradient-to-br from-card to-emerald-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Ganho de Força Total</span>
                      <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
                        {selectedProgression.percentGain >= 0 ? '+' : ''}
                        {selectedProgression.percentGain}%
                      </span>
                      <span className="text-[11px] font-bold text-muted-foreground">de evolução</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      1RM: {selectedProgression.initial1RM}kg ➔ {selectedProgression.current1RM}kg
                    </p>
                  </CardContent>
                </Card>

                {/* 2. Carga Máxima: Inicial vs Atual */}
                <Card className="border-cyan-500/30 bg-gradient-to-br from-card to-cyan-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Carga (Inicial ➔ Atual)</span>
                      <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                        <Dumbbell className="h-4 w-4" />
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-xl sm:text-2xl font-extrabold text-foreground">
                        {selectedProgression.initialWeightKg} kg
                      </span>
                      <span className="text-cyan-400 font-bold">➔</span>
                      <span className="text-xl sm:text-2xl font-extrabold text-cyan-400">
                        {selectedProgression.currentWeightKg} kg
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Delta:{' '}
                      <strong className="text-foreground">
                        {selectedProgression.currentWeightKg - selectedProgression.initialWeightKg >= 0
                          ? `+${selectedProgression.currentWeightKg - selectedProgression.initialWeightKg}`
                          : selectedProgression.currentWeightKg - selectedProgression.initialWeightKg}{' '}
                        kg
                      </strong>
                    </p>
                  </CardContent>
                </Card>

                {/* 3. Recorde Pessoal Absoluto (PR) */}
                <Card className="border-amber-500/30 bg-gradient-to-br from-card to-amber-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Recorde Pessoal (PR)</span>
                      <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                        <Trophy className="h-4 w-4" />
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">
                        {selectedProgression.maxWeightAllTime} kg
                      </span>
                      <span className="text-[11px] font-bold text-muted-foreground">🏆 PR</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Melhor 1RM Est.: {selectedProgression.best1RMAllTime} kg
                    </p>
                  </CardContent>
                </Card>

                {/* 4. Tonelagem & Sessões */}
                <Card className="border-purple-500/30 bg-gradient-to-br from-card to-purple-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Tonelagem Acumulada</span>
                      <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                        <Activity className="h-4 w-4" />
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                        {selectedProgression.totalVolumeAllTime.toLocaleString('pt-BR')} kg
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {selectedProgression.totalSessions} treinos • {selectedProgression.totalSets} séries feitas
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Gráfico Interativo de Evolução */}
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-cyan-400" />
                        Gráfico de Progressão ao Longo do Tempo
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {selectedExerciseObj?.name} • Toque em uma barra para inspecionar os detalhes
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs self-start sm:self-auto">
                      <button
                        onClick={() => setChartMetric('MAX_WEIGHT')}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                          chartMetric === 'MAX_WEIGHT'
                            ? 'bg-cyan-500 text-white shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Carga Máx (kg)
                      </button>
                      <button
                        onClick={() => setChartMetric('ESTIMATED_1RM')}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                          chartMetric === 'ESTIMATED_1RM'
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        1RM Estimado (kg)
                      </button>
                      <button
                        onClick={() => setChartMetric('VOLUME')}
                        className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                          chartMetric === 'VOLUME'
                            ? 'bg-purple-500 text-white shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Volume (kg)
                      </button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-2">
                  {/* Container SVG Responsivo com Grid */}
                  {(() => {
                    const sessions = selectedProgression.sessions;
                    const count = sessions.length;

                    const getValue = (s: ProgressionSession) => {
                      if (chartMetric === 'ESTIMATED_1RM') return s.best1RM;
                      if (chartMetric === 'VOLUME') return s.totalVolumeKg;
                      return s.maxWeightKg;
                    };

                    const values = sessions.map(getValue);
                    const maxVal = Math.max(...values, 10);
                    const minVal = Math.min(...values, 0);
                    const yMax = Math.ceil(maxVal * 1.15);

                    // Dimensões do SVG
                    const svgWidth = 720;
                    const svgHeight = 220;
                    const paddingLeft = 50;
                    const paddingRight = 30;
                    const paddingTop = 25;
                    const paddingBottom = 40;
                    const plotWidth = svgWidth - paddingLeft - paddingRight;
                    const plotHeight = svgHeight - paddingTop - paddingBottom;

                    const barWidth = Math.min(48, Math.max(18, plotWidth / (count * 1.6)));

                    const points = sessions.map((s, idx) => {
                      const val = getValue(s);
                      const x =
                        count === 1
                          ? paddingLeft + plotWidth / 2
                          : paddingLeft + (idx / (count - 1)) * (plotWidth - barWidth) + barWidth / 2;
                      const y = paddingTop + plotHeight - (val / yMax) * plotHeight;
                      return { x, y, val, session: s, idx };
                    });

                    // Construção do caminho SVG da linha de tendência
                    const pathD = points.reduce((acc, p, i) => {
                      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                    }, '');

                    const activeHoverPoint =
                      hoveredPointIdx !== null ? points[hoveredPointIdx] : points[points.length - 1];

                    return (
                      <div className="space-y-3">
                        <div className="w-full overflow-x-auto">
                          <svg
                            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                            className="w-full h-auto min-w-[500px]"
                            style={{ overflow: 'visible' }}
                          >
                            <defs>
                              <linearGradient id="barGradientCyan" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
                                <stop offset="100%" stopColor="#0891b2" stopOpacity="0.3" />
                              </linearGradient>
                              <linearGradient id="barGradientAmber" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                                <stop offset="100%" stopColor="#d97706" stopOpacity="0.3" />
                              </linearGradient>
                              <linearGradient id="barGradientPurple" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.9" />
                                <stop offset="100%" stopColor="#7e22ce" stopOpacity="0.3" />
                              </linearGradient>
                            </defs>

                            {/* Linhas de Grade Horizontais */}
                            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                              const y = paddingTop + plotHeight * (1 - pct);
                              const gridVal = Math.round(yMax * pct);
                              return (
                                <g key={pct}>
                                  <line
                                    x1={paddingLeft}
                                    y1={y}
                                    x2={svgWidth - paddingRight}
                                    y2={y}
                                    stroke="currentColor"
                                    strokeOpacity="0.1"
                                    strokeDasharray="4 4"
                                  />
                                  <text
                                    x={paddingLeft - 8}
                                    y={y + 3}
                                    textAnchor="end"
                                    className="fill-muted-foreground text-[10px] font-mono font-bold"
                                  >
                                    {gridVal}
                                    {chartMetric === 'VOLUME' ? 'k' : ''}
                                  </text>
                                </g>
                              );
                            })}

                            {/* Barras Verticais */}
                            {points.map((p) => {
                              const isHovered = hoveredPointIdx === p.idx;
                              const barHeight = paddingTop + plotHeight - p.y;
                              const grad =
                                chartMetric === 'ESTIMATED_1RM'
                                  ? 'url(#barGradientAmber)'
                                  : chartMetric === 'VOLUME'
                                  ? 'url(#barGradientPurple)'
                                  : 'url(#barGradientCyan)';

                              return (
                                <g
                                  key={p.session.sessionId}
                                  onClick={() => setHoveredPointIdx(p.idx)}
                                  onMouseEnter={() => setHoveredPointIdx(p.idx)}
                                  className="cursor-pointer group"
                                >
                                  <rect
                                    x={p.x - barWidth / 2}
                                    y={p.y}
                                    width={barWidth}
                                    height={barHeight}
                                    rx={6}
                                    fill={grad}
                                    stroke={isHovered ? '#ffffff' : 'transparent'}
                                    strokeWidth={isHovered ? 2 : 0}
                                    className="transition-all duration-200"
                                  />

                                  {/* Rótulo de Data no Eixo X */}
                                  <text
                                    x={p.x}
                                    y={svgHeight - 12}
                                    textAnchor="middle"
                                    className={`text-[10px] font-mono transition-colors ${
                                      isHovered
                                        ? 'fill-cyan-400 font-bold'
                                        : 'fill-muted-foreground'
                                    }`}
                                  >
                                    {new Date(p.session.date).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                    })}
                                  </text>

                                  {/* Valor no Topo da Barra */}
                                  <text
                                    x={p.x}
                                    y={p.y - 8}
                                    textAnchor="middle"
                                    className={`text-[11px] font-bold font-mono ${
                                      isHovered ? 'fill-cyan-400 scale-110' : 'fill-foreground'
                                    }`}
                                  >
                                    {Math.round(p.val)}
                                    {chartMetric !== 'VOLUME' ? 'kg' : ''}
                                  </text>
                                </g>
                              );
                            })}

                            {/* Linha de Tendência Conectada */}
                            {count > 1 && (
                              <path
                                d={pathD}
                                fill="none"
                                stroke={
                                  chartMetric === 'ESTIMATED_1RM'
                                    ? '#f59e0b'
                                    : chartMetric === 'VOLUME'
                                    ? '#a855f7'
                                    : '#06b6d4'
                                }
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity="0.85"
                              />
                            )}

                            {/* Pontos nas Junções da Linha */}
                            {points.map((p) => {
                              const isHovered = hoveredPointIdx === p.idx;
                              return (
                                <circle
                                  key={`dot-${p.idx}`}
                                  cx={p.x}
                                  cy={p.y}
                                  r={isHovered ? 6 : 4}
                                  fill="#0f172a"
                                  stroke={
                                    chartMetric === 'ESTIMATED_1RM'
                                      ? '#f59e0b'
                                      : chartMetric === 'VOLUME'
                                      ? '#a855f7'
                                      : '#06b6d4'
                                  }
                                  strokeWidth="2.5"
                                />
                              );
                            })}
                          </svg>
                        </div>

                        {/* Card Detalhado da Sessão Selecionada / Hover */}
                        {activeHoverPoint && (
                          <div className="p-4 rounded-xl bg-muted/50 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold">
                                <Calendar className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-bold text-foreground text-sm">
                                  {activeHoverPoint.session.sessionTitle}
                                </p>
                                <p className="text-muted-foreground text-[11px]">
                                  {new Date(activeHoverPoint.session.date).toLocaleDateString('pt-BR', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                  })}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                              <div>
                                <span className="text-muted-foreground block text-[10px]">Carga Máx</span>
                                <span className="font-bold text-foreground">
                                  {activeHoverPoint.session.maxWeightKg} kg
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px]">1RM Estimado</span>
                                <span className="font-bold text-amber-400">
                                  {Math.round(activeHoverPoint.session.best1RM * 10) / 10} kg
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px]">Volume Total</span>
                                <span className="font-bold text-purple-400">
                                  {activeHoverPoint.session.totalVolumeKg.toLocaleString('pt-BR')} kg
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px]">Séries Feitas</span>
                                <span className="font-bold text-foreground">
                                  {activeHoverPoint.session.setsCount} séries
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Lista Cronológica de Sessões do Exercício */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    Histórico Cronológico de Sessões ({selectedExerciseObj?.name})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedProgression.sessions
                    .slice()
                    .reverse()
                    .map((sess, idx) => (
                      <div
                        key={sess.sessionId}
                        className="p-4 rounded-xl border border-border bg-card hover:border-cyan-500/40 transition-all space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-cyan-400" />
                            <p className="text-sm font-bold text-foreground">{sess.sessionTitle}</p>
                            <span className="text-xs text-muted-foreground">
                              • {new Date(sess.date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-muted-foreground">
                              Carga Máx:{' '}
                              <strong className="text-foreground">{sess.maxWeightKg} kg</strong>
                            </span>
                            <span className="text-muted-foreground">
                              1RM:{' '}
                              <strong className="text-amber-400">
                                {Math.round(sess.best1RM)} kg
                              </strong>
                            </span>
                            <span className="text-muted-foreground">
                              Vol:{' '}
                              <strong className="text-cyan-400">
                                {sess.totalVolumeKg.toLocaleString('pt-BR')} kg
                              </strong>
                            </span>
                          </div>
                        </div>

                        {/* Pills com detalhamento de cada série */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {sess.sets.map((st) => (
                            <div
                              key={st.setNumber}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-medium flex items-center gap-1.5 ${
                                st.isPR
                                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                  : 'bg-muted/40 border-border text-foreground'
                              }`}
                            >
                              <span>#{st.setNumber}:</span>
                              <strong>{st.weightKg}kg</strong>
                              <span>×</span>
                              <span>{st.reps} reps</span>
                              {st.isPR && <span title="Recorde Pessoal!">🏆</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Estado Vazio: Exercício sem registros ainda */
            <Card className="border-border p-8 text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                <Dumbbell className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  Nenhum registro para {selectedExerciseObj?.name || 'este exercício'}
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Inicie um treino das suas <strong>Fichas A, B ou C</strong> para começar a traçar sua curva de evolução e 1RM!
                </p>
              </div>
              <div>
                <Button
                  onClick={() => setSubTab('WORKOUT')}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs gap-2"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Ir para Fichas de Treino
                </Button>
              </div>
            </Card>
          )}

          {/* Hall da Fama de Recordes Pessoais Gerais */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                Hall da Fama — Recordes Pessoais (PRs)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(gymData?.exercises || [])
                  .filter((ex: any) => gymData.exerciseHistoryMap?.[ex.id])
                  .map((ex: any) => {
                    const rec = gymData.exerciseHistoryMap[ex.id];
                    const isSelected = ex.id === selectedEvolutionExId;
                    return (
                      <div
                        key={ex.id}
                        onClick={() => {
                          setSelectedEvolutionExId(ex.id);
                          setHoveredPointIdx(null);
                        }}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-cyan-500 bg-cyan-500/10 shadow-sm'
                            : 'border-border bg-card hover:border-border/80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-xs text-foreground truncate pr-2">
                            {ex.name}
                          </p>
                          <span className="font-mono font-bold text-xs text-amber-400 shrink-0">
                            🏆 {rec.maxWeightKg} kg
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 font-mono">
                          <span>Última: {rec.weightKg}kg × {rec.reps}</span>
                          <span className="text-cyan-400 font-semibold">
                            1RM: {Math.round(rec.best1RM)} kg
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-ABA 3: CORPO & HÁBITOS DIÁRIOS                                        */}
      {/* ========================================================================= */}
      {subTab === 'HEALTH' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Água, Creatina e Whey */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Droplets className="h-5 w-5 text-sky-400" />
                Hidratação & Suplementação de Hoje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-foreground">
                    💧 Água Ingerida: {healthData?.todayLog?.waterMl || 0} ml
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Meta: {healthData?.dailyWaterGoalMl || 3000} ml
                  </span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((healthData?.todayLog?.waterMl || 0) /
                            (healthData?.dailyWaterGoalMl || 3000)) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddWater(250)}
                    className="flex-1 gap-1.5 border-sky-500/30 text-sky-400 min-h-[38px]"
                  >
                    +250ml (Copo)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddWater(500)}
                    className="flex-1 gap-1.5 border-sky-500/30 text-sky-400 min-h-[38px]"
                  >
                    +500ml (Garrafa)
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                <button
                  onClick={() => handleToggleSupplement('creatineChecked')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    healthData?.todayLog?.creatineChecked
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                      : 'border-border bg-muted/30 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Flame className="h-5 w-5" />
                    <span className="text-xs font-bold">
                      {healthData?.todayLog?.creatineChecked ? 'TOMADA ✓' : 'PENDENTE'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-foreground mt-2">Creatina (5g)</p>
                </button>

                <button
                  onClick={() => handleToggleSupplement('wheyChecked')}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    healthData?.todayLog?.wheyChecked
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                      : 'border-border bg-muted/30 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Check className="h-5 w-5" />
                    <span className="text-xs font-bold">
                      {healthData?.todayLog?.wheyChecked ? 'TOMADO ✓' : 'PENDENTE'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-foreground mt-2">Proteína / Whey</p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Registro de Peso Corporal e Medidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Scale className="h-5 w-5 text-emerald-500" />
                Peso Corporal & Bioimpedância
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSaveBodyMetric} className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-muted-foreground block mb-1">Peso Corporal (kg)*</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="Ex: 78.5"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-input"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground block mb-1">Gordura Corporal (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={bodyFatPct}
                    onChange={(e) => setBodyFatPct(e.target.value)}
                    placeholder="Ex: 14.2"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-input"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground block mb-1">Cintura (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={waistCm}
                    onChange={(e) => setWaistCm(e.target.value)}
                    placeholder="Ex: 80"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-input"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground block mb-1">Braço Contraído (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={armCm}
                    onChange={(e) => setArmCm(e.target.value)}
                    placeholder="Ex: 39.5"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-input"
                  />
                </div>
                <div className="col-span-2">
                  <Button type="submit" size="sm" className="w-full min-h-[40px]">
                    Registrar Medida Corporal
                  </Button>
                </div>
              </form>

              <div className="space-y-2 pt-2 border-t border-border max-h-48 overflow-y-auto">
                {(healthData?.bodyMetrics || []).map((m: any) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 text-xs"
                  >
                    <span className="text-muted-foreground">
                      {new Date(m.date).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="font-bold text-foreground">{m.weightKg} kg</span>
                    {m.bodyFatPct && (
                      <span className="text-emerald-500">BF: {m.bodyFatPct}%</span>
                    )}
                    {m.armCm && <span className="text-muted-foreground">Braço: {m.armCm}cm</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
