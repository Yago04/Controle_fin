import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createEventSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional().nullable(),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().optional().nullable(),
  allDay: z.boolean().default(false),
  type: z
    .enum(['PERSONAL', 'WORK', 'HEALTH', 'FINANCE', 'WORKOUT', 'STUDY', 'REMINDER'])
    .default('PERSONAL'),
  color: z.string().default('#3b82f6'),
  location: z.string().optional().nullable(),
  isCompleted: z.boolean().default(false),
  noteId: z.string().optional().nullable(),
});

const updateEventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  allDay: z.boolean().optional(),
  type: z
    .enum(['PERSONAL', 'WORK', 'HEALTH', 'FINANCE', 'WORKOUT', 'STUDY', 'REMINDER'])
    .optional(),
  color: z.string().optional(),
  location: z.string().optional().nullable(),
  isCompleted: z.boolean().optional(),
  noteId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const month = Number(searchParams.get('month') || now.getMonth() + 1);
    const year = Number(searchParams.get('year') || now.getFullYear());

    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);
    const daysInMonth = endOfMonth.getDate();

    const [
      bills,
      rents,
      debtInstallments,
      invoices,
      recurringTransactions,
      tasks,
      pomodoroSessions,
      workoutSessions,
      calendarEvents,
    ] = await Promise.all([
      prisma.bill.findMany({
        where: {
          deletedAt: null,
          dueDate: { gte: startOfMonth, lte: endOfMonth },
        },
        include: { category: true },
      }),
      prisma.rent.findMany({
        where: { deletedAt: null },
      }),
      prisma.debtInstallment.findMany({
        where: {
          dueDate: { gte: startOfMonth, lte: endOfMonth },
        },
        include: { debt: true },
      }),
      prisma.creditCardInvoice.findMany({
        where: { month, year },
        include: { creditCard: true },
      }),
      prisma.recurringTransaction.findMany({
        where: { isActive: true, deletedAt: null },
        include: { category: true },
      }),
      prisma.task.findMany({
        where: {
          status: { not: 'ARCHIVED' },
          dueDate: { gte: startOfMonth, lte: endOfMonth },
        },
        include: { project: true },
      }),
      prisma.pomodoroSession.findMany({
        where: {
          startedAt: { gte: startOfMonth, lte: endOfMonth },
          mode: { in: ['FOCUS', 'STOPWATCH'] },
        },
      }),
      prisma.workoutSession.findMany({
        where: {
          startedAt: { gte: startOfMonth, lte: endOfMonth },
        },
        include: { routine: true },
      }),
      prisma.calendarEvent.findMany({
        where: {
          startDate: { gte: startOfMonth, lte: endOfMonth },
        },
        include: { note: { select: { id: true, title: true } } },
        orderBy: { startDate: 'asc' },
      }),
    ]);

    const items: Array<{
      id: string;
      sourceId: string;
      layer: 'FINANCE' | 'TASKS' | 'POMODORO' | 'GYM' | 'EVENTS';
      subType: string;
      title: string;
      subtitle?: string;
      date: string;
      amount?: number;
      status?: string;
      color: string;
      isCompleted: boolean;
      meta?: any;
    }> = [];

    // 1. Bills (Contas a pagar)
    for (const b of bills) {
      items.push({
        id: `bill-${b.id}`,
        sourceId: b.id,
        layer: 'FINANCE',
        subType: 'BILL',
        title: b.description,
        subtitle: b.category?.name || 'Conta a Pagar',
        date: b.dueDate.toISOString(),
        amount: Number(b.amount),
        status: b.status,
        color: b.status === 'PAID' ? '#10b981' : '#ef4444',
        isCompleted: b.status === 'PAID',
      });
    }

    // 2. Rents (Aluguel — caso não exista Bill já vinculada no mês)
    for (const r of rents) {
      const hasLinkedBill = bills.some((b) => b.rentId === r.id);
      if (!hasLinkedBill) {
        const dueDay = Math.min(r.dueDay, daysInMonth);
        const rentDate = new Date(year, month - 1, dueDay, 9, 0, 0);
        items.push({
          id: `rent-${r.id}-${year}-${month}`,
          sourceId: r.id,
          layer: 'FINANCE',
          subType: 'RENT',
          title: `Aluguel: ${r.propertyAddress}`,
          subtitle: r.landlordName || 'Contrato de Locação',
          date: rentDate.toISOString(),
          amount: Number(r.monthlyAmount),
          status: 'PENDING',
          color: '#f97316',
          isCompleted: false,
        });
      }
    }

    // 3. DebtInstallments (Parcelas de dívidas)
    for (const inst of debtInstallments) {
      items.push({
        id: `debt-inst-${inst.id}`,
        sourceId: inst.id,
        layer: 'FINANCE',
        subType: 'DEBT_INSTALLMENT',
        title: `Parcela ${inst.installmentNumber}/${inst.debt.totalInstallments} — ${inst.debt.creditor}`,
        subtitle: inst.debt.description,
        date: inst.dueDate.toISOString(),
        amount: Number(inst.amount),
        status: inst.status,
        color: inst.status === 'COMPLETED' ? '#10b981' : '#dc2626',
        isCompleted: inst.status === 'COMPLETED',
      });
    }

    // 4. CreditCardInvoices (Faturas de cartão)
    for (const inv of invoices) {
      items.push({
        id: `invoice-${inv.id}`,
        sourceId: inv.id,
        layer: 'FINANCE',
        subType: 'INVOICE',
        title: `Fatura ${inv.creditCard.name}`,
        subtitle: `Fechamento dia ${inv.creditCard.closingDay}`,
        date: inv.dueDate.toISOString(),
        amount: Number(inv.totalAmount),
        status: inv.status,
        color: inv.status === 'PAID' ? '#10b981' : '#8b5cf6',
        isCompleted: inv.status === 'PAID',
      });
    }

    // 5. RecurringTransactions (Salário e despesas fixas)
    for (const rec of recurringTransactions) {
      const day = Math.min(rec.dayOfMonth || 5, daysInMonth);
      const recDate = new Date(year, month - 1, day, 10, 0, 0);
      items.push({
        id: `rec-${rec.id}-${year}-${month}`,
        sourceId: rec.id,
        layer: 'FINANCE',
        subType: rec.type === 'INCOME' ? 'RECURRING_INCOME' : 'RECURRING_EXPENSE',
        title: rec.description,
        subtitle: rec.type === 'INCOME' ? 'Receita Recorrente' : 'Despesa Fixa',
        date: recDate.toISOString(),
        amount: Number(rec.amount),
        color: rec.type === 'INCOME' ? '#16a34a' : '#f59e0b',
        isCompleted: false,
      });
    }

    // 6. Tasks (Tarefas com dueDate)
    for (const t of tasks) {
      if (!t.dueDate) continue;
      items.push({
        id: `task-${t.id}`,
        sourceId: t.id,
        layer: 'TASKS',
        subType: 'TASK',
        title: t.title,
        subtitle: t.project?.name || `Prioridade ${t.priority}`,
        date: t.dueDate.toISOString(),
        status: t.status,
        color: t.project?.color || '#eab308',
        isCompleted: t.status === 'DONE',
        meta: {
          estimatedPomodoros: t.estimatedPomodoros,
          completedPomodoros: t.completedPomodoros,
          priority: t.priority,
        },
      });
    }

    // 7. PomodoroSession (Resumo de foco agrupado por dia)
    const pomoByDay: Record<string, { minutes: number; count: number; date: Date }> = {};
    for (const ps of pomodoroSessions) {
      const d = new Date(ps.startedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      if (!pomoByDay[key]) {
        pomoByDay[key] = {
          minutes: 0,
          count: 0,
          date: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 18, 0, 0),
        };
      }
      pomoByDay[key].minutes += ps.durationMinutes;
      pomoByDay[key].count += 1;
    }

    for (const [key, summary] of Object.entries(pomoByDay)) {
      items.push({
        id: `pomo-day-${key}`,
        sourceId: key,
        layer: 'POMODORO',
        subType: 'FOCUS_SUMMARY',
        title: `${summary.minutes} min de Foco (${summary.count} 🍅)`,
        subtitle: 'Resumo de Produtividade',
        date: summary.date.toISOString(),
        color: '#f43f5e',
        isCompleted: true,
      });
    }

    // 8. WorkoutSession (Treinos realizados no dia)
    for (const ws of workoutSessions) {
      items.push({
        id: `workout-${ws.id}`,
        sourceId: ws.id,
        layer: 'GYM',
        subType: 'WORKOUT',
        title: ws.title,
        subtitle: `Volume: ${Number(ws.totalVolumeKg).toLocaleString('pt-BR')} kg${
          ws.durationMinutes ? ` • ${ws.durationMinutes} min` : ''
        }`,
        date: ws.startedAt.toISOString(),
        color: ws.routine?.color || '#06b6d4',
        isCompleted: true,
      });
    }

    // 9. CalendarEvent (Compromissos pessoais criados no calendário)
    for (const ev of calendarEvents) {
      items.push({
        id: `event-${ev.id}`,
        sourceId: ev.id,
        layer: 'EVENTS',
        subType: ev.type,
        title: ev.title,
        subtitle: ev.location || ev.description || ev.type,
        date: ev.startDate.toISOString(),
        color: ev.color,
        isCompleted: ev.isCompleted,
        meta: ev,
      });
    }

    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      success: true,
      data: {
        month,
        year,
        items,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao carregar Calendário 360°' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createEventSchema.parse(body);

    const created = await prisma.calendarEvent.create({
      data: {
        title: parsed.title,
        description: parsed.description || null,
        startDate: new Date(parsed.startDate),
        endDate: parsed.endDate ? new Date(parsed.endDate) : null,
        allDay: parsed.allDay,
        type: parsed.type,
        color: parsed.color,
        location: parsed.location || null,
        isCompleted: parsed.isCompleted,
        noteId: parsed.noteId || null,
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao criar evento' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = updateEventSchema.parse(body);

    const data: any = { ...parsed };
    delete data.id;
    if (parsed.startDate) data.startDate = new Date(parsed.startDate);
    if (parsed.endDate !== undefined) {
      data.endDate = parsed.endDate ? new Date(parsed.endDate) : null;
    }

    const updated = await prisma.calendarEvent.update({
      where: { id: parsed.id },
      data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao atualizar evento' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID é obrigatório' }, { status: 400 });
    }
    await prisma.calendarEvent.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao remover evento' },
      { status: 400 }
    );
  }
}
