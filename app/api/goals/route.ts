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

const createGoalSchema = z.object({
  title: z.string().min(1, 'Título da meta é obrigatório'),
  description: z.string().optional().nullable(),
  targetAmount: z.number().min(0).default(0),
  currentAmount: z.number().min(0).default(0),
  targetDate: z.string().optional().nullable(),
  horizon: z.enum(['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM', 'AUTO']).default('AUTO'),
  category: z.enum(['FINANCIAL', 'CAREER', 'HEALTH', 'PERSONAL', 'OTHER']).default('FINANCIAL'),
  color: z.string().default('#10b981'),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const horizonParam = searchParams.get('horizon');
    const categoryParam = searchParams.get('category');
    const includeCompleted = searchParams.get('includeCompleted') !== 'false';

    const where: any = {
      deletedAt: null,
    };

    if (horizonParam && ['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM'].includes(horizonParam)) {
      where.horizon = horizonParam;
    }

    if (categoryParam && ['FINANCIAL', 'CAREER', 'HEALTH', 'PERSONAL', 'OTHER'].includes(categoryParam)) {
      where.category = categoryParam;
    }

    if (!includeCompleted) {
      where.isCompleted = false;
    }

    const goals = await prisma.financialGoal.findMany({
      where,
      orderBy: [
        { isCompleted: 'asc' },
        { targetDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    const parsedGoals = goals.map((g) => {
      const target = Number(g.targetAmount);
      const current = Number(g.currentAmount);
      const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : (g.isCompleted ? 100 : 0);
      
      let daysRemaining: number | null = null;
      if (g.targetDate) {
        const diffMs = new Date(g.targetDate).getTime() - new Date().getTime();
        daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      }

      return {
        ...g,
        targetAmount: target,
        currentAmount: current,
        percentage,
        daysRemaining,
      };
    });

    // Grouping by horizon
    const shortTerm = parsedGoals.filter((g) => g.horizon === 'SHORT_TERM');
    const mediumTerm = parsedGoals.filter((g) => g.horizon === 'MEDIUM_TERM');
    const longTerm = parsedGoals.filter((g) => g.horizon === 'LONG_TERM');

    const totalTarget = parsedGoals.reduce((acc, g) => acc + g.targetAmount, 0);
    const totalCurrent = parsedGoals.reduce((acc, g) => acc + g.currentAmount, 0);
    const totalCompleted = parsedGoals.filter((g) => g.isCompleted).length;

    const summary = {
      totalGoals: parsedGoals.length,
      totalCompleted,
      activeGoals: parsedGoals.length - totalCompleted,
      totalTargetAmount: totalTarget,
      totalCurrentAmount: totalCurrent,
      overallProgress: totalTarget > 0 ? Math.min(100, Math.round((totalCurrent / totalTarget) * 100)) : 0,
      shortTermCount: shortTerm.length,
      mediumTermCount: mediumTerm.length,
      longTermCount: longTerm.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        summary,
        goals: parsedGoals,
        grouped: {
          shortTerm,
          mediumTerm,
          longTerm,
        },
      },
    });
  } catch (error: any) {
    console.error('Erro ao listar metas:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno ao listar metas' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createGoalSchema.parse(body);

    const horizon =
      validated.horizon === 'AUTO'
        ? calculateHorizonFromDate(validated.targetDate)
        : validated.horizon;

    const targetDateObj = validated.targetDate ? new Date(validated.targetDate) : null;
    const isCompleted = validated.targetAmount > 0 && validated.currentAmount >= validated.targetAmount;

    const newGoal = await prisma.financialGoal.create({
      data: {
        title: validated.title,
        description: validated.description || null,
        targetAmount: new Decimal(validated.targetAmount),
        currentAmount: new Decimal(validated.currentAmount),
        targetDate: targetDateObj,
        horizon,
        category: validated.category,
        color: validated.color || '#10b981',
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...newGoal,
        targetAmount: Number(newGoal.targetAmount),
        currentAmount: Number(newGoal.currentAmount),
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0]?.message || 'Dados inválidos' },
        { status: 400 }
      );
    }
    console.error('Erro ao criar meta:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao criar meta' },
      { status: 500 }
    );
  }
}
