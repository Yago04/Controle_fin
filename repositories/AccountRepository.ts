import { prisma } from '../lib/prisma';
import { Account, Prisma } from '@prisma/client';

export class AccountRepository {
  public static async list(): Promise<Account[]> {
    return prisma.account.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  public static async findById(id: string): Promise<Account | null> {
    if (!id) return null;
    return prisma.account.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  public static async create(data: {
    name: string;
    bankName?: string | null;
    type: Prisma.AccountCreateInput['type'];
    initialBalance: number;
    currentBalance?: number;
    color: string;
    notes?: string | null;
    isActive?: boolean;
  }): Promise<Account> {
    const initBal = new Prisma.Decimal(data.initialBalance ?? 0);
    const currBal =
      data.currentBalance !== undefined ? new Prisma.Decimal(data.currentBalance) : initBal;

    return prisma.account.create({
      data: {
        name: data.name,
        bankName: data.bankName || null,
        type: data.type,
        initialBalance: initBal,
        currentBalance: currBal,
        color: data.color || '#3b82f6',
        notes: data.notes || null,
        isActive: data.isActive ?? true,
      },
    });
  }

  public static async update(
    id: string,
    data: {
      name?: string;
      bankName?: string | null;
      type?: Prisma.AccountCreateInput['type'];
      initialBalance?: number;
      currentBalance?: number;
      color?: string;
      notes?: string | null;
      isActive?: boolean;
    }
  ): Promise<Account> {
    const updateData: Prisma.AccountUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.bankName !== undefined) updateData.bankName = data.bankName;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.initialBalance !== undefined) {
      updateData.initialBalance = new Prisma.Decimal(data.initialBalance);
    }
    if (data.currentBalance !== undefined) {
      updateData.currentBalance = new Prisma.Decimal(data.currentBalance);
    }
    if (data.color !== undefined) updateData.color = data.color;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return prisma.account.update({
      where: { id },
      data: updateData,
    });
  }

  public static async delete(id: string): Promise<Account> {
    return prisma.account.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  public static async updateBalance(
    accountId: string,
    delta: Prisma.Decimal | number
  ): Promise<Account> {
    return prisma.account.update({
      where: { id: accountId },
      data: {
        currentBalance: {
          increment: delta,
        },
      },
    });
  }
}
