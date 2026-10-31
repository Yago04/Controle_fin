import { prisma } from '../lib/prisma';
import { Prisma, Transaction, TransactionType } from '@prisma/client';

export type TransactionWithRelations = Prisma.TransactionGetPayload<{
  include: { account: true; category: true; destinationAccount: true };
}>;

export class TransactionRepository {
  public static async list(
    params?: {
      limit?: number;
      month?: number;
      year?: number;
      type?: TransactionType;
      accountId?: string;
      categoryId?: string;
      search?: string;
    }
  ): Promise<TransactionWithRelations[]> {
    const where: Prisma.TransactionWhereInput = {
      deletedAt: null,
    };

    if (params?.type) where.type = params.type;
    if (params?.accountId) where.accountId = params.accountId;
    if (params?.categoryId) where.categoryId = params.categoryId;

    if (params?.search) {
      where.description = {
        contains: params.search,
        mode: 'insensitive',
      };
    }

    if (params?.month && params?.year) {
      const startDate = new Date(Date.UTC(params.year, params.month - 1, 1));
      const endDate = new Date(Date.UTC(params.year, params.month, 0, 23, 59, 59));
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    return prisma.transaction.findMany({
      where,
      include: {
        account: true,
        category: true,
        destinationAccount: true,
      },
      orderBy: { date: 'desc' },
      take: params?.limit,
    });
  }

  public static async create(
    data: {
      accountId: string;
      destinationAccountId?: string | null;
      categoryId?: string | null;
      description: string;
      amount: number;
      type: TransactionType;
      status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
      date: Date;
      dueDate?: Date | null;
      paymentMethod?: string | null;
      notes?: string | null;
    }
  ): Promise<Transaction> {
    const decimalAmount = new Prisma.Decimal(data.amount);

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          accountId: data.accountId,
          destinationAccountId: data.destinationAccountId,
          categoryId: data.categoryId,
          description: data.description,
          amount: decimalAmount,
          type: data.type,
          status: data.status,
          date: data.date,
          dueDate: data.dueDate,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
        },
        include: {
          account: true,
          category: true,
          destinationAccount: true,
        },
      });

      // Atualiza o saldo atomicamente se a transação estiver concluída
      if (data.status === 'COMPLETED') {
        if (data.type === 'INCOME') {
          await tx.account.update({
            where: { id: data.accountId },
            data: { currentBalance: { increment: decimalAmount } },
          });
        } else if (data.type === 'EXPENSE') {
          await tx.account.update({
            where: { id: data.accountId },
            data: { currentBalance: { decrement: decimalAmount } },
          });
        } else if (data.type === 'TRANSFER' && data.destinationAccountId) {
          // Transferência interna: debita da origem e credita no destino
          await tx.account.update({
            where: { id: data.accountId },
            data: { currentBalance: { decrement: decimalAmount } },
          });
          await tx.account.update({
            where: { id: data.destinationAccountId },
            data: { currentBalance: { increment: decimalAmount } },
          });
        }
      }

      return transaction;
    });
  }
}
