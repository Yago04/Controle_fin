import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Decimal } from '@prisma/client/runtime/library';

export const dynamic = 'force-dynamic';

function calculateHorizonFromDate(targetDateStr?: string | null): 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM' {
  if (!targetDateStr) return 'SHORT_TERM';
  const targetDate = new Date(targetDateStr);
  const now = new Date();
  const diffDays = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 365) {
    return 'SHORT_TERM';
  } else if (diffDays <= 365 * 5) {
    return 'MEDIUM_TERM';
  } else {
    return 'LONG_TERM';
  }
}

const updateGoalSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  targetAmount: z.number().min(0).optional(),
  currentAmount: z.number().min(0).optional(),
  addAmount: z.number().optional(), // Increment aporte
  targetDate: z.string().optional().nullable(),
  horizon: z.enum(['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM', 'AUTO']).optional(),
  category: z.enum(['FINANCIAL', 'CAREER', 'HEALTH', 'PERSONAL', 'OTHER']).optional(),
  color: z.string().optional(),
  isCompleted: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const validated = updateGoalSchema.parse(body);

    const existing = await prisma.financialGoal.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Meta não encontrada' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.color !== undefined) updateData.color = validated.color;
    if (validated.category !== undefined) updateData.category = validated.category;

    if (validated.targetDate !== undefined) {
      updateData.targetDate = validated.targetDate ? new Date(validated.targetDate) : null;
    }

    // Horizon calculation or manual set
    if (validated.horizon !== undefined) {
      if (validated.horizon === 'AUTO') {
        const dateToUse = validated.targetDate !== undefined ? validated.targetDate : existing.targetDate?.toISOString();
        updateData.horizon = calculateHorizonFromDate(dateToUse);
      } else {
        updateData.horizon = validated.horizon;
      }
    } else if (validated.targetDate !== undefined && existing.horizon) {
      // If date changed and no explicit horizon override, recalculate
      updateData.horizon = calculateHorizonFromDate(validated.targetDate);
    }

    // Target amount
    let newTarget = Number(existing.targetAmount);
    if (validated.targetAmount !== undefined) {
      newTarget = validated.targetAmount;
      updateData.targetAmount = new Decimal(newTarget);
    }

    // Current amount or incremental deposit
    let newCurrent = Number(existing.currentAmount);
    if (validated.addAmount !== undefined) {
      newCurrent = Math.max(0, newCurrent + validated.addAmount);
      updateData.currentAmount = new Decimal(newCurrent);
    } else if (validated.currentAmount !== undefined) {
      newCurrent = validated.currentAmount;
      updateData.currentAmount = new Decimal(newCurrent);
    }

    // Completion status
    if (validated.isCompleted !== undefined) {
      updateData.isCompleted = validated.isCompleted;
      updateData.completedAt = validated.isCompleted ? new Date() : null;
    } else if (newTarget > 0 && newCurrent >= newTarget && !existing.isCompleted) {
      // Auto complete when current reaches target
      updateData.isCompleted = true;
      updateData.completedAt = new Date();
    }

    const updated = await prisma.financialGoal.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        targetAmount: Number(updated.targetAmount),
        currentAmount: Number(updated.currentAmount),
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || 'Dados inválidos' },
        { status: 400 }
      );
    }
    console.error('Erro ao atualizar meta:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao atualizar meta' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Hard delete or soft delete
    await prisma.financialGoal.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Meta removida com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao excluir meta:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao excluir meta' },
      { status: 500 }
    );
  }
}
