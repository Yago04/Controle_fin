'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Dumbbell,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Play,
  Edit2,
  Save,
  X,
  Info,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { ExerciseMediaBadge } from './ExerciseMediaBadge';

interface RoutineExerciseInput {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  equipment: string;
  targetSets: number;
  targetReps: string;
  targetWeightKg?: number | null;
  restSeconds: number;
  instructions: string;
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

const COLOR_PRESETS = [
  '#06b6d4', // Ciano
  '#8b5cf6', // Roxo
  '#10b981', // Verde
  '#f59e0b', // Âmbar
  '#ef4444', // Vermelho
  '#ec4899', // Rosa
  '#3b82f6', // Azul
];

const WEEK_DAYS = [
  { code: 'MON', label: 'Seg' },
  { code: 'TUE', label: 'Ter' },
  { code: 'WED', label: 'Qua' },
  { code: 'THU', label: 'Qui' },
  { code: 'FRI', label: 'Sex' },
  { code: 'SAT', label: 'Sáb' },
  { code: 'SUN', label: 'Dom' },
];

export function WorkoutRoutineBuilder({
  routines,
  exercises,
  onRefresh,
  onStartWorkout,
}: {
  routines: any[];
  exercises: any[];
  onRefresh: () => void;
  onStartWorkout: (routine: any) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form de Ficha
  const [routineName, setRoutineName] = useState('');
  const [routineCode, setRoutineCode] = useState('D');
  const [routineDescription, setRoutineDescription] = useState('');
  const [routineColor, setRoutineColor] = useState('#06b6d4');
  const [selectedDays, setSelectedDays] = useState<string[]>(['MON', 'THU']);
  const [builderExercises, setBuilderExercises] = useState<RoutineExerciseInput[]>([]);

  // Sub-modal ou form de adicionar exercício na ficha
  const [showAddExForm, setShowAddExForm] = useState(false);
  const [selectedExId, setSelectedExId] = useState('');
  const [customExName, setCustomExName] = useState('');
  const [customMuscleGroup, setCustomMuscleGroup] = useState('CHEST');
  const [exEquipment, setExEquipment] = useState('Halter');
  const [exSets, setExSets] = useState(4);
  const [exReps, setExReps] = useState('8-12');
  const [exWeight, setExWeight] = useState('');
  const [exRest, setExRest] = useState(90);
  const [exInstructions, setExInstructions] = useState('');

  const handleToggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAddExerciseToRoutine = async () => {
    let finalExId = selectedExId;
    let finalExName = '';
    let finalMuscle = customMuscleGroup;

    // Se estiver criando exercício novo
    if (!finalExId && customExName.trim()) {
      try {
        const res = await fetch('/api/gym', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'CREATE_EXERCISE',
            name: customExName.trim(),
            muscleGroup: customMuscleGroup,
            equipment: exEquipment,
            defaultRestSeconds: exRest,
            instructions: exInstructions || null,
          }),
        });
        const json = await res.json();
        if (json.success) {
          finalExId = json.data.id;
          finalExName = json.data.name;
          onRefresh();
        }
      } catch (e) {
        console.error('Erro ao cadastrar novo exercício:', e);
      }
    } else {
      const found = exercises.find((e) => e.id === finalExId);
      if (found) {
        finalExName = found.name;
        finalMuscle = found.muscleGroup;
      }
    }

    if (!finalExId || !finalExName) {
      alert('Selecione ou digite o nome de um exercício.');
      return;
    }

    setBuilderExercises((prev) => [
      ...prev,
      {
        exerciseId: finalExId,
        exerciseName: finalExName,
        muscleGroup: finalMuscle,
        equipment: exEquipment,
        targetSets: exSets,
        targetReps: exReps,
        targetWeightKg: exWeight ? Number(exWeight.replace(',', '.')) : null,
        restSeconds: exRest,
        instructions: exInstructions.trim(),
      },
    ]);

    // Limpar form de exercício
    setSelectedExId('');
    setCustomExName('');
    setExWeight('');
    setExInstructions('');
    setShowAddExForm(false);
  };

  const handleRemoveExercise = (idx: number) => {
    setBuilderExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleMoveExercise = (idx: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && idx === 0) return;
    if (direction === 'DOWN' && idx === builderExercises.length - 1) return;

    setBuilderExercises((prev) => {
      const copy = [...prev];
      const targetIdx = direction === 'UP' ? idx - 1 : idx + 1;
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleSaveRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineName.trim()) return;

    if (builderExercises.length === 0) {
      alert('Adicione pelo menos 1 exercício à sua ficha de treino.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        action: 'CREATE_ROUTINE',
        name: routineName.trim(),
        code: routineCode.trim().toUpperCase() || 'T',
        description: routineDescription.trim() || null,
        color: routineColor,
        suggestedDays: selectedDays,
        exercises: builderExercises.map((e, idx) => ({
          exerciseId: e.exerciseId,
          order: idx + 1,
          targetSets: e.targetSets,
          targetReps: e.targetReps,
          targetWeightKg: e.targetWeightKg || null,
          restSeconds: e.restSeconds,
        })),
      };

      const res = await fetch('/api/gym', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        resetRoutineForm();
        onRefresh();
      } else {
        alert(json.error || 'Erro ao salvar ficha');
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro de conexão ao salvar ficha de treino');
    } finally {
      setSubmitting(false);
    }
  };

  const resetRoutineForm = () => {
    setRoutineName('');
    setRoutineCode('D');
    setRoutineDescription('');
    setRoutineColor('#06b6d4');
    setSelectedDays(['MON', 'THU']);
    setBuilderExercises([]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-foreground">
              Montador de Treinos & Fichas Personalizadas
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Crie suas próprias fichas (A, B, C, D), configure aparelhos, cargas-alvo, repetições e dicas técnicas de execução.
          </p>
        </div>

        <Button
          onClick={() => {
            resetRoutineForm();
            setIsModalOpen(true);
          }}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold gap-2 shadow-sm text-xs sm:text-sm self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          Montar Nova Ficha
        </Button>
      </div>

      {/* Lista de Fichas Existentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {routines.map((routine) => (
          <Card
            key={routine.id}
            className="overflow-hidden border-border/80 hover:border-cyan-500/50 transition-all flex flex-col justify-between bg-card"
          >
            <div>
              {/* Faixa superior com a cor da ficha */}
              <div className="h-2 w-full" style={{ backgroundColor: routine.color || '#06b6d4' }} />

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-extrabold text-white shadow-sm shrink-0"
                      style={{ backgroundColor: routine.color || '#06b6d4' }}
                    >
                      {routine.code || 'A'}
                    </span>
                    <div>
                      <CardTitle className="text-sm sm:text-base font-bold text-foreground leading-snug">
                        {routine.name}
                      </CardTitle>
                      {routine.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {routine.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dias sugeridos */}
                {routine.suggestedDays?.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Dias:</span>
                    {routine.suggestedDays.map((d: string) => {
                      const dayObj = WEEK_DAYS.find((w) => w.code === d);
                      return (
                        <span
                          key={d}
                          className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold text-foreground"
                        >
                          {dayObj?.label || d}
                        </span>
                      );
                    })}
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-3 pb-4">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground border-b border-border/60 pb-2">
                  <span>Exercícios ({routine.exercises?.length || 0})</span>
                  <span>Séries • Carga</span>
                </div>

                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {(routine.exercises || []).map((item: any, idx: number) => {
                    const ex = item.exercise;
                    return (
                      <div
                        key={item.id || idx}
                        className="p-3 rounded-xl bg-muted/30 border border-border/50 text-xs space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <ExerciseMediaBadge
                              exerciseName={ex?.name || 'Exercício'}
                              equipment={ex?.equipment}
                              muscleGroup={ex?.muscleGroup}
                              instructions={ex?.instructions}
                              variant="thumbnail"
                              className="h-10 w-10 rounded-xl shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-foreground truncate">
                                  {idx + 1}. {ex?.name || 'Exercício'}
                                </span>
                                <ExerciseMediaBadge
                                  exerciseName={ex?.name || 'Exercício'}
                                  equipment={ex?.equipment}
                                  muscleGroup={ex?.muscleGroup}
                                  instructions={ex?.instructions}
                                  variant="compact"
                                />
                              </div>
                              <span className="text-[10px] text-muted-foreground font-medium block">
                                {MUSCLE_GROUP_LABELS[ex?.muscleGroup] || ex?.muscleGroup} •{' '}
                                {ex?.equipment || 'Aparelho'}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-extrabold text-cyan-400 block">
                              {item.targetSets} x {item.targetReps}
                            </span>
                            {item.targetWeightKg && (
                              <span className="text-[10px] text-muted-foreground">
                                {Number(item.targetWeightKg)} kg
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Dica Técnica de Execução */}
                        {ex?.instructions && (
                          <div className="p-2 rounded-lg bg-background/60 border border-border/40 text-[11px] text-muted-foreground flex items-start gap-1.5">
                            <Info className="h-3 w-3 text-cyan-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{ex.instructions}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </div>

            <div className="p-4 pt-0">
              <Button
                onClick={() => onStartWorkout(routine)}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold gap-2 text-xs h-10 shadow-sm"
              >
                <Play className="h-4 w-4 fill-current" /> Iniciar Treino com Esta Ficha
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal Construtor de Ficha */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-bold text-foreground">Montar Nova Ficha de Treino</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoutine} className="space-y-4">
              {/* Nome e Código */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3 space-y-1">
                  <label className="text-xs font-semibold text-foreground">Nome da Ficha *</label>
                  <input
                    type="text"
                    required
                    value={routineName}
                    onChange={(e) => setRoutineName(e.target.value)}
                    placeholder="Ex: Treino D — Ombros & Trapézio"
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-cyan-500 outline-none"
                  />
                </div>

                <div className="col-span-1 space-y-1">
                  <label className="text-xs font-semibold text-foreground">Código</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={routineCode}
                    onChange={(e) => setRoutineCode(e.target.value)}
                    placeholder="D"
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-bold text-center text-foreground outline-none uppercase"
                  />
                </div>
              </div>

              {/* Cor e Dias da Semana */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Cor da Ficha</label>
                  <div className="flex items-center gap-2 pt-1">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setRoutineColor(c)}
                        className={`h-7 w-7 rounded-full transition-transform cursor-pointer ${
                          routineColor === c ? 'scale-125 ring-2 ring-white ring-offset-2' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Dias Sugeridos</label>
                  <div className="flex items-center gap-1 pt-1">
                    {WEEK_DAYS.map((d) => (
                      <button
                        type="button"
                        key={d.code}
                        onClick={() => handleToggleDay(d.code)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          selectedDays.includes(d.code)
                            ? 'bg-cyan-500 text-white shadow-xs'
                            : 'bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Foco / Descrição (Opcional)
                </label>
                <input
                  type="text"
                  value={routineDescription}
                  onChange={(e) => setRoutineDescription(e.target.value)}
                  placeholder="Ex: Ênfase em deltoide lateral e posterior com cadência controlada"
                  className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground outline-none"
                />
              </div>

              {/* Lista de Exercícios Adicionados */}
              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Exercícios Planejados ({builderExercises.length})
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setShowAddExForm(true)}
                    className="h-7 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar Exercício
                  </Button>
                </div>

                {builderExercises.length === 0 ? (
                  <div className="p-6 text-center rounded-xl border border-dashed border-border text-xs text-muted-foreground space-y-1">
                    <p>Nenhum exercício adicionado a esta ficha ainda.</p>
                    <p>Clique em "+ Adicionar Exercício" para selecionar da biblioteca ou criar um novo.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {builderExercises.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-border bg-muted/40 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <ExerciseMediaBadge
                            exerciseName={item.exerciseName}
                            equipment={item.equipment}
                            muscleGroup={item.muscleGroup}
                            instructions={item.instructions}
                            variant="thumbnail"
                            className="h-9 w-9 rounded-lg shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-foreground block truncate">
                              {idx + 1}. {item.exerciseName}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {MUSCLE_GROUP_LABELS[item.muscleGroup] || item.muscleGroup} •{' '}
                              {item.equipment} • {item.targetSets}x{item.targetReps} • Descanso:{' '}
                              {item.restSeconds}s
                            </span>
                            {item.instructions && (
                              <p className="text-[10px] text-cyan-400 italic truncate mt-0.5">
                                💡 {item.instructions}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveExercise(idx, 'UP')}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveExercise(idx, 'DOWN')}
                            disabled={idx === builderExercises.length - 1}
                            className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveExercise(idx)}
                            className="p-1 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive ml-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mini Form para Adicionar Exercício */}
              {showAddExForm && (
                <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-3 animate-in zoom-in-95">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400">
                      Configurar Exercício, Aparelho e Execução
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddExForm(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Seletor de Exercício da Biblioteca OU Novo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-foreground">
                        Selecionar da Biblioteca
                      </label>
                      <select
                        value={selectedExId}
                        onChange={(e) => {
                          setSelectedExId(e.target.value);
                          if (e.target.value) setCustomExName('');
                        }}
                        className="w-full h-9 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground outline-none"
                      >
                        <option value="">-- Escolher existente ou criar abaixo --</option>
                        {exercises.map((ex) => (
                          <option key={ex.id} value={ex.id}>
                            {ex.name} ({MUSCLE_GROUP_LABELS[ex.muscleGroup] || ex.muscleGroup})
                          </option>
                        ))}
                      </select>
                    </div>

                    {!selectedExId && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-foreground">
                          Ou Digitar Novo Exercício
                        </label>
                        <input
                          type="text"
                          value={customExName}
                          onChange={(e) => setCustomExName(e.target.value)}
                          placeholder="Ex: Elevação Lateral no Banco Inclinado"
                          className="w-full h-9 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Aparelho, Séries, Reps, Carga e Descanso */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <label className="text-[10px] font-semibold text-foreground">Aparelho</label>
                      <input
                        type="text"
                        value={exEquipment}
                        onChange={(e) => setExEquipment(e.target.value)}
                        placeholder="Halter, Barra, Máquina..."
                        className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs text-foreground outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-foreground">Séries</label>
                      <input
                        type="number"
                        min="1"
                        value={exSets}
                        onChange={(e) => setExSets(Number(e.target.value))}
                        className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs text-foreground outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-foreground">Reps</label>
                      <input
                        type="text"
                        value={exReps}
                        onChange={(e) => setExReps(e.target.value)}
                        placeholder="8-12"
                        className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs text-foreground outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-foreground">Carga Alvo (kg)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={exWeight}
                        onChange={(e) => setExWeight(e.target.value)}
                        placeholder="Ex: 24"
                        className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs text-foreground outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-foreground">Descanso (s)</label>
                      <input
                        type="number"
                        value={exRest}
                        onChange={(e) => setExRest(Number(e.target.value))}
                        placeholder="90"
                        className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs text-foreground outline-none"
                      />
                    </div>
                  </div>

                  {/* Instruções de Execução / Dica Técnica */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-foreground">
                      Instruções de Execução / Técnica Correta (Como fazer)
                    </label>
                    <input
                      type="text"
                      value={exInstructions}
                      onChange={(e) => setExInstructions(e.target.value)}
                      placeholder="Ex: Banco a 75°, cotovelos levemente à frente, descer controlando em 2 segundos sem bater os halteres no topo"
                      className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddExForm(false)}
                      className="h-7 text-xs"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddExerciseToRoutine}
                      className="h-7 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                    >
                      Incluir Exercício na Ficha
                    </Button>
                  </div>
                </div>
              )}

              {/* Botões do Rodapé */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || builderExercises.length === 0}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  {submitting ? 'Salvando Ficha...' : 'Concluir & Salvar Ficha'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}