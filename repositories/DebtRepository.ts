import { prisma } from '../lib/prisma';
import { Debt, DebtInstallment, DebtStatus, Prisma } from '@prisma/client';

export class DebtRepository {
  public static async list(): Promise<(Debt & { installments: DebtInstallment[] })[]> {
    return prisma.debt.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        installments: {
          orderBy: { installmentNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async findById(id: string): Promise<(Debt & { installments: DebtInstallment[] }) | null> {
    return prisma.debt.findUnique({
      where: { id },
      include: {
        installments: {
          orderBy: { installmentNumber: 'asc' },
        },
      },
    });
  }

  public static async create(data: {
    creditor: string;
    description: string;
    originalAmount: number;
    currentBalance: number;
    interestRateMonthly: number;
    type: Prisma.DebtCreateInput['type'];
    status?: DebtStatus;
    startDate: Date;
    dueDate?: Date | null;
    totalInstallments: number;
    paidInstallmentsCount?: number;
    installmentAmount: number;
    notes?: string | null;
  }): Promise<Debt> {
    const originalDecimal = new Prisma.Decimal(data.originalAmount);
    const balanceDecimal = new Prisma.Decimal(data.currentBalance);
    const interestDecimal = new Prisma.Decimal(data.interestRateMonthly);
    const installmentDecimal = new Prisma.Decimal(data.installmentAmount);
    const paidCount = Math.max(0, data.paidInstallmentsCount || 0);
    const debtStatus = data.status || (balanceDecimal.equals(0) ? 'PAID' : 'ACTIVE');

    return prisma.$transaction(async (tx) => {
      const debt = await tx.debt.create({
        data: {
          creditor: data.creditor,
          description: data.description,
          originalAmount: originalDecimal,
          currentBalance: balanceDecimal,
          interestRateMonthly: interestDecimal,
          type: data.type,
          status: debtStatus,
          startDate: data.startDate,
          dueDate: data.dueDate,
          totalInstallments: data.totalInstallments,
          paidInstallmentsCount: paidCount,
          installmentAmount: installmentDecimal,
          notes: data.notes,
        },
      });

      // Gera parcelas automaticamente
      const installmentPromises = [];
      const baseDueDate = data.dueDate || new Date();

      for (let i = 1; i <= data.totalInstallments; i++) {
        const dueDate = new Date(baseDueDate);
        dueDate.setMonth(dueDate.getMonth() + (i - 1));
        const isPaid = i <= paidCount;

        installmentPromises.push(
          tx.debtInstallment.create({
            data: {
              debtId: debt.id,
              installmentNumber: i,
              amount: installmentDecimal,
              dueDate,
              status: isPaid ? 'COMPLETED' : 'PENDING',
              paidAt: isPaid ? new Date() : null,
            },
          })
        );
      }

      await Promise.all(installmentPromises);
      return debt;
    });
  }

  public static async update(
    id: string,
    data: {
      creditor?: string;
      description?: string;
      originalAmount?: number;
      currentBalance?: number;
      interestRateMonthly?: number;
      type?: Prisma.DebtCreateInput['type'];
      status?: DebtStatus;
      startDate?: Date;
      dueDate?: Date | null;
      totalInstallments?: number;
      paidInstallmentsCount?: number;
      installmentAmount?: number;
      notes?: string | null;
    }
  ): Promise<Debt> {
    const updateData: Prisma.DebtUpdateInput = {};

    if (data.creditor !== undefined) updateData.creditor = data.creditor;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.originalAmount !== undefined) {
      updateData.originalAmount = new Prisma.Decimal(data.originalAmount);
    }
    if (data.currentBalance !== undefined) {
      updateData.currentBalance = new Prisma.Decimal(data.currentBalance);
    }
    if (data.interestRateMonthly !== undefined) {
      updateData.interestRateMonthly = new Prisma.Decimal(data.interestRateMonthly);
    }
    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
    if (data.totalInstallments !== undefined) updateData.totalInstallments = data.totalInstallments;
    if (data.paidInstallmentsCount !== undefined) {
      updateData.paidInstallmentsCount = data.paidInstallmentsCount;
    }
    if (data.installmentAmount !== undefined) {
      updateData.installmentAmount = new Prisma.Decimal(data.installmentAmount);
    }
    if (data.notes !== undefined) updateData.notes = data.notes;

    // Se o status for alterado para PAID e saldo não foi especificado, zera saldo
    if (data.status === 'PAID' && data.currentBalance === undefined) {
      updateData.currentBalance = new Prisma.Decimal(0);
    }

    return prisma.debt.update({
      where: { id },
      data: updateData,
    });
  }

  public static async delete(id: string): Promise<Debt> {
    return prisma.debt.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  public static async payInstallment(params: {
    debtId: string;
    installmentId: string;
    accountId: string;
  }): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const debt = await tx.debt.findUniqueOrThrow({
        where: { id: params.debtId },
      });

      const installment = await tx.debtInstallment.findFirstOrThrow({
        where: { id: params.installmentId, debtId: debt.id },
      });

      if (installment.status === 'COMPLETED') return;

      // 1. Marca parcela como paga
      await tx.debtInstallment.update({
        where: { id: installment.id },
        data: {
          status: 'COMPLETED',
          paidAt: new Date(),
        },
      });

      // 2. Abate saldo da dívida
      const newBalance = Prisma.Decimal.max(
        new Prisma.Decimal(0),
        debt.currentBalance.minus(installment.amount)
      );

      const isPaidOff = newBalance.equals(new Prisma.Decimal(0));

      await tx.debt.update({
        where: { id: debt.id },
        data: {
          currentBalance: newBalance,
          paidInstallmentsCount: { increment: 1 },
          status: isPaidOff ? 'PAID' : debt.status,
        },
      });

      // 3. Cria transação de despesa e debita da conta bancária atomicamente
      await tx.transaction.create({
        data: {
          accountId: params.accountId,
          description: `Pagamento Parcela ${installment.installmentNumber}/${debt.totalInstallments} - ${debt.description}`,
          amount: installment.amount,
          type: 'EXPENSE',
          status: 'COMPLETED',
          date: new Date(),
          paymentMethod: 'Débito em Conta',
        },
      });

      await tx.account.update({
        where: { id: params.accountId },
        data: {
          currentBalance: { decrement: installment.amount },
        },
      });
    });
  }
}
