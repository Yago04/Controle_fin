import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const backupData = {
      version: '2.0-life-os',
      exportedAt: new Date().toISOString(),
      // Módulo Financeiro
      appSettings: await prisma.appSetting.findMany(),
      accounts: await prisma.account.findMany(),
      categories: await prisma.category.findMany(),
      transactions: await prisma.transaction.findMany(),
      creditCards: await prisma.creditCard.findMany(),
      creditCardInvoices: await prisma.creditCardInvoice.findMany(),
      creditCardPurchases: await prisma.creditCardPurchase.findMany(),
      debts: await prisma.debt.findMany(),
      debtInstallments: await prisma.debtInstallment.findMany(),
      bills: await prisma.bill.findMany(),
      rents: await prisma.rent.findMany(),
      recurringTransactions: await prisma.recurringTransaction.findMany(),
      budgets: await prisma.budget.findMany(),
      financialGoals: await prisma.financialGoal.findMany(),
      rules: await prisma.rule.findMany(),
      // Módulo Pomodoro & Tarefas
      projects: await prisma.project.findMany(),
      tasks: await prisma.task.findMany(),
      pomodoroSessions: await prisma.pomodoroSession.findMany(),
      // Módulo Notas (Segundo Cérebro)
      noteFolders: await prisma.noteFolder.findMany(),
      notes: await prisma.note.findMany(),
      // Módulo Calendário 360°
      calendarEvents: await prisma.calendarEvent.findMany(),
      // Módulo Academia & Saúde
      exercises: await prisma.exercise.findMany(),
      workoutRoutines: await prisma.workoutRoutine.findMany(),
      workoutRoutineExercises: await prisma.workoutRoutineExercise.findMany(),
      workoutSessions: await prisma.workoutSession.findMany(),
      workoutSetLogs: await prisma.workoutSetLog.findMany(),
      bodyMetrics: await prisma.bodyMetric.findMany(),
      dailyHealthLogs: await prisma.dailyHealthLog.findMany(),
    };

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup-life-os-${
          new Date().toISOString().split('T')[0]
        }.json"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const backup = await req.json();

    if (!backup.accounts || !backup.categories) {
      return NextResponse.json(
        { success: false, error: 'Formato de arquivo de backup inválido' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Limpa dados dos novos módulos primeiro (respeitando FKs)
      await tx.workoutSetLog.deleteMany();
      await tx.workoutSession.deleteMany();
      await tx.workoutRoutineExercise.deleteMany();
      await tx.calendarEvent.deleteMany();
      await tx.pomodoroSession.deleteMany();
      await tx.task.deleteMany();
      await tx.note.deleteMany();
      await tx.noteFolder.deleteMany();
      await tx.project.deleteMany();
      await tx.workoutRoutine.deleteMany();
      await tx.exercise.deleteMany();
      await tx.bodyMetric.deleteMany();
      await tx.dailyHealthLog.deleteMany();

      // Limpa dados financeiros atuais
      await tx.importItem.deleteMany();
      await tx.importBatch.deleteMany();
      await tx.rule.deleteMany();
      await tx.financialGoal.deleteMany();
      await tx.budget.deleteMany();
      await tx.recurringTransaction.deleteMany();
      await tx.bill.deleteMany();
      await tx.rent.deleteMany();
      await tx.debtInstallment.deleteMany();
      await tx.debt.deleteMany();
      await tx.creditCardPurchase.deleteMany();
      await tx.creditCardInvoice.deleteMany();
      await tx.creditCard.deleteMany();
      await tx.transaction.deleteMany();
      await tx.category.deleteMany();
      await tx.account.deleteMany();
      await tx.appSetting.deleteMany();

      // Restaura Módulo Financeiro
      if (backup.appSettings?.length) {
        await tx.appSetting.createMany({ data: backup.appSettings });
      }
      if (backup.accounts?.length) {
        await tx.account.createMany({ data: backup.accounts });
      }
      if (backup.categories?.length) {
        await tx.category.createMany({ data: backup.categories });
      }
      if (backup.creditCards?.length) {
        await tx.creditCard.createMany({ data: backup.creditCards });
      }
      if (backup.debts?.length) {
        await tx.debt.createMany({ data: backup.debts });
      }
      if (backup.rents?.length) {
        await tx.rent.createMany({ data: backup.rents });
      }
      if (backup.transactions?.length) {
        await tx.transaction.createMany({ data: backup.transactions });
      }
      if (backup.creditCardInvoices?.length) {
        await tx.creditCardInvoice.createMany({ data: backup.creditCardInvoices });
      }
      if (backup.creditCardPurchases?.length) {
        await tx.creditCardPurchase.createMany({ data: backup.creditCardPurchases });
      }
      if (backup.debtInstallments?.length) {
        await tx.debtInstallment.createMany({ data: backup.debtInstallments });
      }
      if (backup.bills?.length) {
        await tx.bill.createMany({ data: backup.bills });
      }
      if (backup.recurringTransactions?.length) {
        await tx.recurringTransaction.createMany({ data: backup.recurringTransactions });
      }
      if (backup.budgets?.length) {
        await tx.budget.createMany({ data: backup.budgets });
      }
      if (backup.financialGoals?.length) {
        await tx.financialGoal.createMany({ data: backup.financialGoals });
      }
      if (backup.rules?.length) {
        await tx.rule.createMany({ data: backup.rules });
      }

      // Restaura Novos Módulos do Life OS
      if (backup.projects?.length) {
        await tx.project.createMany({ data: backup.projects });
      }
      if (backup.noteFolders?.length) {
        await tx.noteFolder.createMany({ data: backup.noteFolders });
      }
      if (backup.exercises?.length) {
        await tx.exercise.createMany({ data: backup.exercises });
      }
      if (backup.workoutRoutines?.length) {
        await tx.workoutRoutine.createMany({ data: backup.workoutRoutines });
      }
      if (backup.workoutRoutineExercises?.length) {
        await tx.workoutRoutineExercise.createMany({ data: backup.workoutRoutineExercises });
      }
      if (backup.notes?.length) {
        await tx.note.createMany({ data: backup.notes });
      }
      if (backup.tasks?.length) {
        await tx.task.createMany({ data: backup.tasks });
      }
      if (backup.pomodoroSessions?.length) {
        await tx.pomodoroSession.createMany({ data: backup.pomodoroSessions });
      }
      if (backup.calendarEvents?.length) {
        await tx.calendarEvent.createMany({ data: backup.calendarEvents });
      }
      if (backup.workoutSessions?.length) {
        await tx.workoutSession.createMany({ data: backup.workoutSessions });
      }
      if (backup.workoutSetLogs?.length) {
        await tx.workoutSetLog.createMany({ data: backup.workoutSetLogs });
      }
      if (backup.bodyMetrics?.length) {
        await tx.bodyMetric.createMany({ data: backup.bodyMetrics });
      }
      if (backup.dailyHealthLogs?.length) {
        await tx.dailyHealthLog.createMany({ data: backup.dailyHealthLogs });
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Backup Life OS 360° restaurado com sucesso!',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
