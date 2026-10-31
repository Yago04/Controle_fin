import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { accountId, items } = await req.json();

    if (!accountId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Conta e itens são obrigatórios' },
        { status: 400 }
      );
    }

    const createdTransactions = await prisma.$transaction(async (tx) => {
      let totalIncome = new Prisma.Decimal(0);
      let totalExpense = new Prisma.Decimal(0);

      const batch = await tx.importBatch.create({
        data: {
          filename: 'extrato-importado.csv',
          fileType: 'CSV',
          totalRows: items.length,
        },
      });

      const transactions = [];

      for (const item of items) {
        const itemAmount = new Prisma.Decimal(item.amount);

        const t = await tx.transaction.create({
          data: {
            accountId,
            categoryId: item.categoryId || null,
            description: item.description,
            amount: itemAmount,
            type: item.type,
            status: 'COMPLETED',
            date: new Date(item.date),
            paymentMethod: 'Importado CSV',
          },
        });

        await tx.importItem.create({
          data: {
            batchId: batch.id,
            date: new Date(item.date),
            description: item.description,
            amount: itemAmount,
            suggestedCategoryId: item.categoryId || null,
            isDuplicate: !!item.isDuplicate,
            importedTransactionId: t.id,
          },
        });

        if (item.type === 'INCOME') {
          totalIncome = totalIncome.plus(itemAmount);
        } else if (item.type === 'EXPENSE') {
          totalExpense = totalExpense.plus(itemAmount);
        }

        transactions.push(t);
      }

      // Atualiza o saldo da conta com a somatória líquida
      const netDelta = totalIncome.minus(totalExpense);
      await tx.account.update({
        where: { id: accountId },
        data: {
          currentBalance: { increment: netDelta },
        },
      });

      return transactions;
    });

    return NextResponse.json({
      success: true,
      message: `${createdTransactions.length} transações importadas com sucesso!`,
      count: createdTransactions.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
