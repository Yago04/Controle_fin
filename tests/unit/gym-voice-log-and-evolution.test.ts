import { describe, it, expect } from 'vitest';
import {
  ExerciseEvolutionCalculator,
  SetLogHistoricalItem,
} from '../../domain/gym/ExerciseEvolutionCalculator';

describe('ExerciseEvolutionCalculator - Análise Histórica e Progressão de Carga', () => {
  const dummyExercise = {
    id: 'ex-supino-reto',
    name: 'Supino Reto com Barra',
    muscleGroup: 'CHEST',
    equipment: 'Barra',
    defaultRestSeconds: 120,
  };

  const sampleLogs: SetLogHistoricalItem[] = [
    // Sessão 1 (Baseline - 01/10)
    {
      id: 'log-1',
      sessionId: 'sess-1',
      exerciseId: 'ex-supino-reto',
      setNumber: 1,
      setType: 'WORKING',
      weightKg: 60,
      reps: 10,
      rpe: 8,
      isPR: true,
      completed: true,
      createdAt: new Date('2026-10-01T10:00:00Z'),
      session: { id: 'sess-1', title: 'Treino A', startedAt: new Date('2026-10-01T10:00:00Z') },
    },
    {
      id: 'log-2',
      sessionId: 'sess-1',
      exerciseId: 'ex-supino-reto',
      setNumber: 2,
      setType: 'WORKING',
      weightKg: 70,
      reps: 8,
      rpe: 8.5,
      isPR: true,
      completed: true,
      createdAt: new Date('2026-10-01T10:05:00Z'),
      session: { id: 'sess-1', title: 'Treino A', startedAt: new Date('2026-10-01T10:00:00Z') },
    },

    // Sessão 2 (08/10)
    {
      id: 'log-3',
      sessionId: 'sess-2',
      exerciseId: 'ex-supino-reto',
      setNumber: 1,
      setType: 'WORKING',
      weightKg: 75,
      reps: 6,
      rpe: 9,
      isPR: true,
      completed: true,
      createdAt: new Date('2026-10-08T10:00:00Z'),
      session: { id: 'sess-2', title: 'Treino A', startedAt: new Date('2026-10-08T10:00:00Z') },
    },
    {
      id: 'log-4',
      sessionId: 'sess-2',
      exerciseId: 'ex-supino-reto',
      setNumber: 2,
      setType: 'WORKING',
      weightKg: 80,
      reps: 5,
      rpe: 9.5,
      isPR: true,
      completed: true,
      createdAt: new Date('2026-10-08T10:05:00Z'),
      session: { id: 'sess-2', title: 'Treino A', startedAt: new Date('2026-10-08T10:00:00Z') },
    },

    // Sessão 3 (Atual - 15/10)
    {
      id: 'log-5',
      sessionId: 'sess-3',
      exerciseId: 'ex-supino-reto',
      setNumber: 1,
      setType: 'WORKING',
      weightKg: 80,
      reps: 6,
      rpe: 9,
      isPR: false,
      completed: true,
      createdAt: new Date('2026-10-15T10:00:00Z'),
      session: { id: 'sess-3', title: 'Treino A', startedAt: new Date('2026-10-15T10:00:00Z') },
    },
    {
      id: 'log-6',
      sessionId: 'sess-3',
      exerciseId: 'ex-supino-reto',
      setNumber: 2,
      setType: 'WORKING',
      weightKg: 84,
      reps: 6,
      rpe: 10,
      isPR: true,
      completed: true,
      createdAt: new Date('2026-10-15T10:05:00Z'),
      session: { id: 'sess-3', title: 'Treino A', startedAt: new Date('2026-10-15T10:00:00Z') },
    },
  ];

  it('deve retornar estrutura vazia para exercício sem histórico', () => {
    const result = ExerciseEvolutionCalculator.calculate(dummyExercise, []);

    expect(result.summary.totalSessions).toBe(0);
    expect(result.summary.totalSets).toBe(0);
    expect(result.summary.weightEvolutionPercentage).toBe(0);
    expect(result.timeline).toHaveLength(0);
  });

  it('deve agrupar corretamente as sessões e calcular a progressão cronológica', () => {
    const result = ExerciseEvolutionCalculator.calculate(dummyExercise, sampleLogs);

    // 3 sessões históricas
    expect(result.timeline).toHaveLength(3);

    // Sessão 1 (Baseline)
    // Carga máx: 70kg; 1RM Epley: 70 * (1 + 8/30) = 88.67kg
    // Volume: (60*10) + (70*8) = 600 + 560 = 1160kg
    const sess1 = result.timeline[0];
    expect(sess1.maxWeightKg).toBe(70);
    expect(sess1.sessionVolumeKg).toBe(1160);
    expect(sess1.weightProgressionPercentage).toBe(0);

    // Sessão 2
    // Carga máx: 80kg; 1RM Epley: 80 * (1 + 5/30) = 93.33kg
    // Volume: (75*6) + (80*5) = 450 + 400 = 850kg
    // Progresso peso: (80 - 70) / 70 * 100 = 14.3%
    const sess2 = result.timeline[1];
    expect(sess2.maxWeightKg).toBe(80);
    expect(sess2.sessionVolumeKg).toBe(850);
    expect(sess2.weightProgressionPercentage).toBe(14.3);

    // Sessão 3
    // Carga máx: 84kg; 1RM Epley: 84 * (1 + 6/30) = 100.8kg
    // Volume: (80*6) + (84*6) = 480 + 504 = 984kg
    // Progresso peso: (84 - 70) / 70 * 100 = 20.0%
    const sess3 = result.timeline[2];
    expect(sess3.maxWeightKg).toBe(84);
    expect(sess3.sessionVolumeKg).toBe(984);
    expect(sess3.weightProgressionPercentage).toBe(20.0);
  });

  it('deve calcular o sumário global de evolução com precisão', () => {
    const result = ExerciseEvolutionCalculator.calculate(dummyExercise, sampleLogs);

    expect(result.summary.initialMaxWeightKg).toBe(70);
    expect(result.summary.currentMaxWeightKg).toBe(84);
    expect(result.summary.allTimeMaxWeightKg).toBe(84);
    expect(result.summary.totalSessions).toBe(3);
    expect(result.summary.totalSets).toBe(6);
    expect(result.summary.allTimeTotalVolumeKg).toBe(1160 + 850 + 984); // 2994kg
    expect(result.summary.weightEvolutionPercentage).toBe(20.0); // +20%
  });
});
