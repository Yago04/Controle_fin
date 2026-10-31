import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock do Prisma
vi.mock('../../lib/prisma', () => {
  return {
    prisma: {
      exercise: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      workoutSession: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      workoutSetLog: {
        findMany: vi.fn(),
        create: vi.fn(),
        aggregate: vi.fn(),
      },
    },
  };
});

import { prisma } from '../../lib/prisma';
import { GET as exerciseEvolutionGET } from '../../app/api/gym/exercise-evolution/[id]/route';

describe('API Route - /api/gym/exercise-evolution/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve retornar 404 se o exercício não existir', async () => {
    (prisma.exercise.findUnique as any).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/gym/exercise-evolution/ex-inexistente');
    const res = await exerciseEvolutionGET(req, { params: { id: 'ex-inexistente' } });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error).toContain('não encontrado');
  });

  it('deve retornar a evolução completa com 1RM, volume e percentual de aumento', async () => {
    (prisma.exercise.findUnique as any).mockResolvedValue({
      id: 'ex-supino',
      name: 'Supino Reto com Barra',
      muscleGroup: 'CHEST',
      equipment: 'Barra',
      defaultRestSeconds: 120,
    });

    (prisma.workoutSetLog.findMany as any).mockResolvedValue([
      {
        id: 'log-1',
        sessionId: 'sess-1',
        exerciseId: 'ex-supino',
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
        sessionId: 'sess-2',
        exerciseId: 'ex-supino',
        setNumber: 1,
        setType: 'WORKING',
        weightKg: 75,
        reps: 10,
        rpe: 8.5,
        isPR: true,
        completed: true,
        createdAt: new Date('2026-10-15T10:00:00Z'),
        session: { id: 'sess-2', title: 'Treino A', startedAt: new Date('2026-10-15T10:00:00Z') },
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/gym/exercise-evolution/ex-supino');
    const res = await exerciseEvolutionGET(req, { params: { id: 'ex-supino' } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.exercise.name).toBe('Supino Reto com Barra');
    expect(json.data.summary.initialMaxWeightKg).toBe(60);
    expect(json.data.summary.currentMaxWeightKg).toBe(75);
    // (75 - 60) / 60 = +25%
    expect(json.data.summary.weightEvolutionPercentage).toBe(25);
    expect(json.data.timeline).toHaveLength(2);
    expect(json.data.timeline[1].weightProgressionPercentage).toBe(25);
  });
});
