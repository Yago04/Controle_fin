import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { invalidateGymCache } from '@/lib/gymCache';

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

const updateRoutineSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  color: z.string().optional(),
  suggestedDays: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  exercises: z.array(routineExerciseSchema).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Tenta buscar ficha de treino
    const routine = await prisma.workoutRoutine.findUnique({
      where: { id: params.id },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (routine) {
      return NextResponse.json({ success: true, type: 'ROUTINE', data: routine });
    }

    // 2. Se não for ficha, busca exercício individual
    const exercise = await prisma.exercise.findUnique({
      where: { id: params.id },
      include: {
        setLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (exercise) {
      return NextResponse.json({ success: true, type: 'EXERCISE', data: exercise });
    }

    return NextResponse.json(
      { success: false, error: 'Ficha ou exercício não encontrado' },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    // Verifica se o ID pertence a uma ficha ou a um exercício
    const routineExists = await prisma.workoutRoutine.findUnique({
      where: { id: params.id },
    });

    if (routineExists) {
      const parsed = updateRoutineSchema.parse(body);

      const updated = await prisma.$transaction(async (tx) => {
        const updateData: any = {};
        if (parsed.name !== undefined) updateData.name = parsed.name;
        if (parsed.code !== undefined) updateData.code = parsed.code;
        if (parsed.description !== undefined) updateData.description = parsed.description;
        if (parsed.color !== undefined) updateData.color = parsed.color;
        if (parsed.suggestedDays !== undefined) updateData.suggestedDays = parsed.suggestedDays;
        if (parsed.isActive !== undefined) updateData.isActive = parsed.isActive;

        await tx.workoutRoutine.update({
          where: { id: params.id },
          data: updateData,
        });

        if (parsed.exercises !== undefined) {
          await tx.workoutRoutineExercise.deleteMany({
            where: { routineId: params.id },
          });

          for (let idx = 0; idx < parsed.exercises.length; idx++) {
            const e = parsed.exercises[idx];
            await tx.workoutRoutineExercise.create({
              data: {
                routineId: params.id,
                exerciseId: e.exerciseId,
                order: e.order !== undefined ? e.order : idx + 1,
                targetSets: Number(e.targetSets || 3),
                targetReps: String(e.targetReps || '8-12'),
                targetWeightKg:
                  e.targetWeightKg !== undefined && e.targetWeightKg !== null
                    ? Number(e.targetWeightKg)
                    : null,
                restSeconds: Number(e.restSeconds || 90),
                notes: e.notes || null,
              },
            });
          }
        }

        return tx.workoutRoutine.findUniqueOrThrow({
          where: { id: params.id },
          include: {
            exercises: {
              include: { exercise: true },
              orderBy: { order: 'asc' },
            },
          },
        });
      });

      invalidateGymCache();
      return NextResponse.json({ success: true, data: updated });
    }

    // Se não for ficha, verifica se é exercício
    const exerciseExists = await prisma.exercise.findUnique({
      where: { id: params.id },
    });

    if (exerciseExists) {
      const data: any = {};
      if (body.name !== undefined) data.name = body.name;
      if (body.muscleGroup !== undefined) data.muscleGroup = body.muscleGroup;
      if (body.equipment !== undefined) data.equipment = body.equipment;
      if (body.defaultRestSeconds !== undefined)
        data.defaultRestSeconds = Number(body.defaultRestSeconds);
      if (body.instructions !== undefined) data.instructions = body.instructions;

      const updatedEx = await prisma.exercise.update({
        where: { id: params.id },
        data,
      });

      invalidateGymCache();
      return NextResponse.json({ success: true, data: updatedEx });
    }

    return NextResponse.json(
      { success: false, error: 'Recurso não encontrado' },
      { status: 404 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const routine = await prisma.workoutRoutine.findUnique({
      where: { id: params.id },
    });

    if (routine) {
      await prisma.workoutRoutine.delete({ where: { id: params.id } });
      invalidateGymCache();
      return NextResponse.json({
        success: true,
        message: 'Ficha de treino excluída com sucesso',
      });
    }

    const exercise = await prisma.exercise.findUnique({
      where: { id: params.id },
    });

    if (exercise) {
      await prisma.exercise.delete({ where: { id: params.id } });
      invalidateGymCache();
      return NextResponse.json({
        success: true,
        message: 'Exercício excluído com sucesso',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Item não encontrado para exclusão' },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
