import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ExerciseEvolutionCalculator } from '@/domain/gym/ExerciseEvolutionCalculator';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const exerciseId = params?.id;

    if (!exerciseId || typeof exerciseId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'ID do exercício é obrigatório' },
        { status: 400 }
      );
    }

    // 1. Busca os dados do exercício
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: {
        id: true,
        name: true,
        muscleGroup: true,
        equipment: true,
        defaultRestSeconds: true,
      },
    });

    if (!exercise) {
      return NextResponse.json(
        { success: false, error: 'Exercício não encontrado no banco de dados' },
        { status: 404 }
      );
    }

    // 2. Busca todos os sets completados deste exercício vinculados a sessões
    const setLogs = await prisma.workoutSetLog.findMany({
      where: {
        exerciseId,
        completed: true,
      },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            startedAt: true,
          },
        },
      },
      orderBy: [
        { session: { startedAt: 'asc' } },
        { setNumber: 'asc' },
      ],
    });

    // 3. Executa o cálculo de linha do tempo e progressão de carga (Epley 1RM, volume, % evolução)
    const evolutionResult = ExerciseEvolutionCalculator.calculate(
      {
        id: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        equipment: exercise.equipment,
        defaultRestSeconds: exercise.defaultRestSeconds,
      },
      setLogs.map((l) => ({
        id: l.id,
        sessionId: l.sessionId,
        exerciseId: l.exerciseId,
        setNumber: l.setNumber,
        setType: l.setType,
        weightKg: Number(l.weightKg),
        reps: l.reps,
        rpe: l.rpe ? Number(l.rpe) : null,
        isPR: l.isPR,
        completed: l.completed,
        createdAt: l.createdAt,
        session: {
          id: l.session.id,
          title: l.session.title,
          startedAt: l.session.startedAt,
        },
      }))
    );

    return NextResponse.json({
      success: true,
      data: evolutionResult,
    });
  } catch (error: any) {
    console.error('Erro na rota exercise-evolution:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao calcular evolução do exercício' },
      { status: 500 }
    );
  }
}
