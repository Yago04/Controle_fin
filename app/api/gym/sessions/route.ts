import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { invalidateGymCache } from '@/lib/gymCache';

export const dynamic = 'force-dynamic';

const setInputSchema = z.object({
  exerciseId: z.string().min(1),
  setNumber: z.number().int().min(1),
  setType: z.enum(['WARMUP', 'WORKING', 'DROPSET', 'FAILURE']).default('WORKING'),
  weightKg: z.number().min(0),
  reps: z.number().int().min(0),
  rpe: z.number().min(1).max(10).optional().nullable(),
  completed: z.boolean().default(true),
});

const finishWorkoutSchema = z.object({
  routineId: z.string().optional().nullable(),
  title: z.string().min(1, 'Título do treino é obrigatório'),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  durationMinutes: z.number().int().min(1).optional(),
  energyLevel: z.number().int().min(1).max(5).optional().nullable(),
  notes: z.string().optional().nullable(),
  sets: z.array(setInputSchema).min(1, 'Registre pelo menos 1 série concluída'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = finishWorkoutSchema.parse(body);

    const endedAt = parsed.endedAt ? new Date(parsed.endedAt) : new Date();
    const startedAt = parsed.startedAt
      ? new Date(parsed.startedAt)
      : new Date(endedAt.getTime() - (parsed.durationMinutes || 45) * 60 * 1000);

    const durationMinutes =
      parsed.durationMinutes ||
      Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000));

    // Buscar histórico anterior dos exercícios para detectar Recorde Pessoal (isPR)
    const exerciseIds = Array.from(new Set(parsed.sets.map((s) => s.exerciseId)));
    const historicalSets = await prisma.workoutSetLog.findMany({
      where: {
        exerciseId: { in: exerciseIds },
        completed: true,
      },
      select: {
        exerciseId: true,
        weightKg: true,
        reps: true,
      },
    });

    const maxByExercise: Record<string, { maxWeight: number; max1RM: number }> = {};
    for (const h of historicalSets) {
      const w = Number(h.weightKg);
      const rm = w * (1 + h.reps / 30);
      if (!maxByExercise[h.exerciseId]) {
        maxByExercise[h.exerciseId] = { maxWeight: w, max1RM: rm };
      } else {
        if (w > maxByExercise[h.exerciseId].maxWeight) maxByExercise[h.exerciseId].maxWeight = w;
        if (rm > maxByExercise[h.exerciseId].max1RM) maxByExercise[h.exerciseId].max1RM = rm;
      }
    }

    let totalVolumeKg = 0;
    let prsHitCount = 0;

    const preparedSets = parsed.sets
      .filter((s) => s.completed && s.reps > 0)
      .map((s) => {
        const volume = s.weightKg * s.reps;
        totalVolumeKg += volume;

        const epley1RM = s.weightKg * (1 + s.reps / 30);
        const prev = maxByExercise[s.exerciseId];
        let isPR = false;

        if (s.weightKg > 0) {
          if (!prev) {
            isPR = true;
            maxByExercise[s.exerciseId] = { maxWeight: s.weightKg, max1RM: epley1RM };
          } else if (s.weightKg > prev.maxWeight || epley1RM > prev.max1RM) {
            isPR = true;
            if (s.weightKg > prev.maxWeight) prev.maxWeight = s.weightKg;
            if (epley1RM > prev.max1RM) prev.max1RM = epley1RM;
          }
        }

        if (isPR) prsHitCount += 1;

        return {
          exerciseId: s.exerciseId,
          setNumber: s.setNumber,
          setType: s.setType,
          weightKg: s.weightKg,
          reps: s.reps,
          rpe: s.rpe ?? null,
          isPR,
          completed: true,
        };
      });

    const createdSession = await prisma.workoutSession.create({
      data: {
        routineId: parsed.routineId || null,
        title: parsed.title,
        startedAt,
        endedAt,
        durationMinutes,
        totalVolumeKg,
        energyLevel: parsed.energyLevel ?? null,
        notes: parsed.notes || null,
        setLogs: {
          create: preparedSets,
        },
      },
      include: {
        routine: true,
        setLogs: {
          include: { exercise: true },
        },
      },
    });

    invalidateGymCache();

    return NextResponse.json(
      {
        success: true,
        data: {
          ...createdSession,
          totalVolumeKg: Number(createdSession.totalVolumeKg),
          prsHitCount,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao finalizar sessão de treino' },
      { status: 500 }
    );
  }
}
