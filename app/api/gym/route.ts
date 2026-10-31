import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getCachedGymData, setCachedGymData, invalidateGymCache } from '@/lib/gymCache';

export const dynamic = 'force-dynamic';

const routineExerciseSchema = z.object({
  exerciseId: z.string(),
  order: z.number().int().optional(),
  targetSets: z.number().int().default(3),
  targetReps: z.string().default('8-12'),
  targetWeightKg: z.number().optional().nullable(),
  restSeconds: z.number().int().default(90),
  notes: z.string().optional().nullable(),
});

const createExerciseSchema = z.object({
  action: z.literal('CREATE_EXERCISE').optional(),
  name: z.string().min(1, 'Nome do exercício é obrigatório'),
  muscleGroup: z.enum([
    'CHEST',
    'BACK',
    'SHOULDERS',
    'BICEPS',
    'TRICEPS',
    'LEGS',
    'GLUTES',
    'ABS',
    'CARDIO',
    'FULL_BODY',
  ]),
  equipment: z.string().optional().nullable(),
  defaultRestSeconds: z.number().int().default(90),
  instructions: z.string().optional().nullable(),
});

const createRoutineSchema = z.object({
  action: z.literal('CREATE_ROUTINE').optional(),
  name: z.string().min(1, 'Nome da ficha é obrigatório'),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  color: z.string().default('#06b6d4'),
  suggestedDays: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  exercises: z.array(routineExerciseSchema).default([]),
});

const updateRoutineSchema = z.object({
  action: z.literal('UPDATE_ROUTINE').optional(),
  id: z.string().optional(),
  name: z.string().min(1).optional(),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  color: z.string().optional(),
  suggestedDays: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  exercises: z.array(routineExerciseSchema).optional(),
});

const updateExerciseSchema = z.object({
  action: z.literal('UPDATE_EXERCISE').optional(),
  id: z.string().optional(),
  name: z.string().min(1).optional(),
  muscleGroup: z.enum([
    'CHEST',
    'BACK',
    'SHOULDERS',
    'BICEPS',
    'TRICEPS',
    'LEGS',
    'GLUTES',
    'ABS',
    'CARDIO',
    'FULL_BODY',
  ]).optional(),
  equipment: z.string().optional().nullable(),
  defaultRestSeconds: z.number().int().optional(),
  instructions: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const cached = getCachedGymData();
    if (cached) {
      return NextResponse.json({ success: true, data: cached, source: 'cache' });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      routines,
      exercises,
      allSetLogs,
      recentSessions,
      monthTransactions,
      recurringHealth,
      settings,
    ] = await Promise.all([
      prisma.workoutRoutine.findMany({
        where: { isActive: true },
        include: {
          exercises: {
            include: { exercise: true },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { code: 'asc' },
      }),
      prisma.exercise.findMany({
        orderBy: [{ muscleGroup: 'asc' }, { name: 'asc' }],
      }),
      prisma.workoutSetLog.findMany({
        where: { completed: true },
        include: {
          session: { select: { id: true, startedAt: true, title: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.workoutSession.findMany({
        include: {
          routine: { select: { id: true, name: true, code: true, color: true } },
          setLogs: {
            include: { exercise: { select: { id: true, name: true, muscleGroup: true } } },
            orderBy: { setNumber: 'asc' },
          },
        },
        orderBy: { startedAt: 'desc' },
        take: 50,
      }),
      prisma.transaction.findMany({
        where: {
          deletedAt: null,
          type: 'EXPENSE',
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        include: { category: true },
      }),
      prisma.recurringTransaction.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          type: 'EXPENSE',
        },
        include: { category: true },
      }),
      prisma.appSetting.findFirst({ where: { id: 'default' } }),
    ]);

    // Mapear última execução, PR e evolução histórica completa por exercício
    const lastSetByExercise: Record<
      string,
      { weightKg: number; reps: number; maxWeightKg: number; best1RM: number; date: string }
    > = {};

    // Agrupamento temporal de sessões por exercício
    const exerciseSessionsMap: Record<
      string,
      Map<
        string,
        {
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
      >
    > = {};

    for (const log of allSetLogs) {
      const w = Number(log.weightKg);
      const r = log.reps;
      const epley1RM = w * (1 + r / 30);
      const sessDate = log.session?.startedAt ? log.session.startedAt.toISOString() : log.createdAt.toISOString();
      const sessId = log.sessionId || 'session-default';
      const sessTitle = log.session?.title || 'Treino Concluído';

      // Atualizar lastSetByExercise
      if (!lastSetByExercise[log.exerciseId]) {
        lastSetByExercise[log.exerciseId] = {
          weightKg: w,
          reps: r,
          maxWeightKg: w,
          best1RM: epley1RM,
          date: sessDate,
        };
      } else {
        lastSetByExercise[log.exerciseId].weightKg = w;
        lastSetByExercise[log.exerciseId].reps = r;
        lastSetByExercise[log.exerciseId].date = sessDate;
        if (w > lastSetByExercise[log.exerciseId].maxWeightKg) {
          lastSetByExercise[log.exerciseId].maxWeightKg = w;
        }
        if (epley1RM > lastSetByExercise[log.exerciseId].best1RM) {
          lastSetByExercise[log.exerciseId].best1RM = epley1RM;
        }
      }

      // Agrupar na evolução do exercício
      if (!exerciseSessionsMap[log.exerciseId]) {
        exerciseSessionsMap[log.exerciseId] = new Map();
      }
      const sessionMap = exerciseSessionsMap[log.exerciseId];
      if (!sessionMap.has(sessId)) {
        sessionMap.set(sessId, {
          sessionId: sessId,
          date: sessDate,
          sessionTitle: sessTitle,
          maxWeightKg: w,
          best1RM: epley1RM,
          totalVolumeKg: w * r,
          setsCount: 1,
          bestReps: r,
          sets: [
            {
              setNumber: log.setNumber,
              weightKg: w,
              reps: r,
              setType: log.setType,
              isPR: log.isPR,
            },
          ],
        });
      } else {
        const item = sessionMap.get(sessId)!;
        item.totalVolumeKg += w * r;
        item.setsCount += 1;
        if (w > item.maxWeightKg) {
          item.maxWeightKg = w;
          item.bestReps = r;
        }
        if (epley1RM > item.best1RM) {
          item.best1RM = epley1RM;
        }
        item.sets.push({
          setNumber: log.setNumber,
          weightKg: w,
          reps: r,
          setType: log.setType,
          isPR: log.isPR,
        });
      }
    }

    // Gerar mapa final de progressão por exercício
    const progressionByExercise: Record<
      string,
      {
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
        sessions: Array<{
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
        }>;
      }
    > = {};

    for (const [exId, sessionMap] of Object.entries(exerciseSessionsMap)) {
      const sortedSessions = Array.from(sessionMap.values()).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      if (sortedSessions.length === 0) continue;

      const first = sortedSessions[0];
      const last = sortedSessions[sortedSessions.length - 1];
      let maxWeightAllTime = 0;
      let best1RMAllTime = 0;
      let totalVolumeAllTime = 0;
      let totalSets = 0;

      for (const s of sortedSessions) {
        if (s.maxWeightKg > maxWeightAllTime) maxWeightAllTime = s.maxWeightKg;
        if (s.best1RM > best1RMAllTime) best1RMAllTime = s.best1RM;
        totalVolumeAllTime += s.totalVolumeKg;
        totalSets += s.setsCount;
      }

      const percentGain =
        first.best1RM > 0
          ? Math.round(((last.best1RM - first.best1RM) / first.best1RM) * 1000) / 10
          : 0;

      progressionByExercise[exId] = {
        exerciseId: exId,
        initialWeightKg: first.maxWeightKg,
        currentWeightKg: last.maxWeightKg,
        initial1RM: Math.round(first.best1RM * 10) / 10,
        current1RM: Math.round(last.best1RM * 10) / 10,
        maxWeightAllTime,
        best1RMAllTime: Math.round(best1RMAllTime * 10) / 10,
        percentGain,
        totalVolumeAllTime,
        totalSessions: sortedSessions.length,
        totalSets,
        sessions: sortedSessions,
      };
    }

    const enrichedRoutines = routines.map((r) => ({
      ...r,
      exercises: r.exercises.map((item) => {
        const prev = lastSetByExercise[item.exerciseId];
        return {
          ...item,
          targetWeightKg: item.targetWeightKg ? Number(item.targetWeightKg) : null,
          previousLog: prev || null,
        };
      }),
    }));

    // Cálculo de Investimento em Saúde & Custo por Treino no mês atual
    const healthKeywords = ['saúde', 'saude', 'academia', 'gym', 'suplemento', 'creatina', 'whey', 'smartfit'];
    let monthlyHealthInvestment = 0;

    for (const tx of monthTransactions) {
      const catName = (tx.category?.name || '').toLowerCase();
      const desc = tx.description.toLowerCase();
      if (healthKeywords.some((k) => catName.includes(k) || desc.includes(k))) {
        monthlyHealthInvestment += Number(tx.amount);
      }
    }

    for (const rec of recurringHealth) {
      const catName = (rec.category?.name || '').toLowerCase();
      const desc = rec.description.toLowerCase();
      if (healthKeywords.some((k) => catName.includes(k) || desc.includes(k))) {
        monthlyHealthInvestment += Number(rec.amount);
      }
    }

    const monthWorkoutsCount = recentSessions.filter(
      (s) => new Date(s.startedAt) >= startOfMonth && new Date(s.startedAt) <= endOfMonth
    ).length;

    const costPerWorkout =
      monthWorkoutsCount > 0 ? monthlyHealthInvestment / monthWorkoutsCount : monthlyHealthInvestment;

    const resultPayload = {
      routines: enrichedRoutines,
      exercises,
      exerciseHistoryMap: lastSetByExercise,
      progressionByExercise,
      recentSessions: recentSessions.map((s) => ({
        ...s,
        totalVolumeKg: Number(s.totalVolumeKg),
        setLogs: s.setLogs.map((l) => ({
          ...l,
          weightKg: Number(l.weightKg),
          rpe: l.rpe ? Number(l.rpe) : null,
        })),
      })),
      healthRoi: {
        monthlyHealthInvestment,
        monthWorkoutsCount,
        weeklyWorkoutGoal: settings?.weeklyWorkoutGoal ?? 4,
        costPerWorkout,
      },
    };

    setCachedGymData(resultPayload);

    return NextResponse.json({
      success: true,
      data: resultPayload,
      source: 'db',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao carregar módulo de academia' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Criação de Exercício
    if (body.action === 'CREATE_EXERCISE' || body.type === 'EXERCISE' || (body.muscleGroup && !body.exercises)) {
      const parsed = createExerciseSchema.parse({
        ...body,
        defaultRestSeconds: Number(body.defaultRestSeconds || 90),
      });
      const ex = await prisma.exercise.create({
        data: {
          name: parsed.name,
          muscleGroup: parsed.muscleGroup,
          equipment: parsed.equipment || null,
          defaultRestSeconds: parsed.defaultRestSeconds,
          instructions: parsed.instructions || null,
        },
      });
      invalidateGymCache();
      return NextResponse.json({ success: true, data: ex }, { status: 201 });
    }

    // 2. Criação de Ficha de Treino (WorkoutRoutine) com exercícios vinculados
    const parsed = createRoutineSchema.parse(body);
    const routine = await prisma.workoutRoutine.create({
      data: {
        name: parsed.name,
        code: parsed.code || null,
        description: parsed.description || null,
        color: parsed.color,
        suggestedDays: parsed.suggestedDays,
        isActive: parsed.isActive ?? true,
        exercises: {
          create: parsed.exercises.map((e, idx) => ({
            exerciseId: e.exerciseId,
            order: e.order !== undefined ? e.order : idx + 1,
            targetSets: Number(e.targetSets || 3),
            targetReps: String(e.targetReps || '8-12'),
            targetWeightKg: e.targetWeightKg !== undefined && e.targetWeightKg !== null ? Number(e.targetWeightKg) : null,
            restSeconds: Number(e.restSeconds || 90),
            notes: e.notes || null,
          })),
        },
      },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    invalidateGymCache();
    return NextResponse.json({ success: true, data: routine }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const id = body.id || searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório para atualização' },
        { status: 400 }
      );
    }

    // 1. Atualização de Exercício Individual
    if (body.action === 'UPDATE_EXERCISE' || body.type === 'EXERCISE') {
      const parsed = updateExerciseSchema.parse(body);
      const data: any = {};
      if (parsed.name !== undefined) data.name = parsed.name;
      if (parsed.muscleGroup !== undefined) data.muscleGroup = parsed.muscleGroup;
      if (parsed.equipment !== undefined) data.equipment = parsed.equipment;
      if (parsed.defaultRestSeconds !== undefined) data.defaultRestSeconds = Number(parsed.defaultRestSeconds);
      if (parsed.instructions !== undefined) data.instructions = parsed.instructions;

      const updatedEx = await prisma.exercise.update({
        where: { id },
        data,
      });

      invalidateGymCache();
      return NextResponse.json({ success: true, data: updatedEx });
    }

    // 2. Atualização de Ficha (WorkoutRoutine) e Exercícios Vinculados
    const parsed = updateRoutineSchema.parse(body);

    const updatedRoutine = await prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (parsed.name !== undefined) updateData.name = parsed.name;
      if (parsed.code !== undefined) updateData.code = parsed.code;
      if (parsed.description !== undefined) updateData.description = parsed.description;
      if (parsed.color !== undefined) updateData.color = parsed.color;
      if (parsed.suggestedDays !== undefined) updateData.suggestedDays = parsed.suggestedDays;
      if (parsed.isActive !== undefined) updateData.isActive = parsed.isActive;

      await tx.workoutRoutine.update({
        where: { id },
        data: updateData,
      });

      // Se a lista de exercícios vinculados foi enviada, sincroniza atomicamente
      if (parsed.exercises !== undefined) {
        // Remove exercícios antigos vinculados à ficha
        await tx.workoutRoutineExercise.deleteMany({
          where: { routineId: id },
        });

        // Insere os novos exercícios com ordem e configurações completas
        for (let idx = 0; idx < parsed.exercises.length; idx++) {
          const e = parsed.exercises[idx];
          await tx.workoutRoutineExercise.create({
            data: {
              routineId: id,
              exerciseId: e.exerciseId,
              order: e.order !== undefined ? e.order : idx + 1,
              targetSets: Number(e.targetSets || 3),
              targetReps: String(e.targetReps || '8-12'),
              targetWeightKg: e.targetWeightKg !== undefined && e.targetWeightKg !== null ? Number(e.targetWeightKg) : null,
              restSeconds: Number(e.restSeconds || 90),
              notes: e.notes || null,
            },
          });
        }
      }

      return tx.workoutRoutine.findUniqueOrThrow({
        where: { id },
        include: {
          exercises: {
            include: { exercise: true },
            orderBy: { order: 'asc' },
          },
        },
      });
    });

    invalidateGymCache();
    return NextResponse.json({ success: true, data: updatedRoutine });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao atualizar ficha/exercício' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id') || searchParams.get('routineId') || searchParams.get('exerciseId');
    let type = searchParams.get('type');

    if (!id) {
      try {
        const body = await req.json();
        id = body.id || body.routineId || body.exerciseId;
        type = body.type || (body.exerciseId ? 'EXERCISE' : 'ROUTINE');
      } catch {
        // Body pode não existir se DELETE for enviado com query params
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do item a excluir é obrigatório' },
        { status: 400 }
      );
    }

    if (type === 'EXERCISE' || searchParams.get('exerciseId')) {
      await prisma.exercise.delete({ where: { id } });
      invalidateGymCache();
      return NextResponse.json({ success: true, message: 'Exercício excluído com sucesso' });
    }

    // Padrão: Exclusão de ficha (WorkoutRoutine)
    await prisma.workoutRoutine.delete({ where: { id } });
    invalidateGymCache();
    return NextResponse.json({ success: true, message: 'Ficha de treino excluída com sucesso' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao excluir item' },
      { status: 500 }
    );
  }
}
