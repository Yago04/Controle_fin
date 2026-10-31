import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transactionId = params.id;

    await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUniqueOrThrow({
        where: { id: transactionId },
      });

      if (transaction.deletedAt) {
        return;
      }

      // 1. Estorna o saldo da conta atomicamente
      if (transaction.status === 'COMPLETED') {
        const amount = transaction.amount;

        if (transaction.type === 'EXPENSE') {
          // Despesa excluída: devolve o dinheiro para a conta
          await tx.account.update({
            where: { id: transaction.accountId },
            data: { currentBalance: { increment: amount } },
          });
        } else if (transaction.type === 'INCOME') {
          // Receita excluída: remove o dinheiro da conta
          await tx.account.update({
            where: { id: transaction.accountId },
            data: { currentBalance: { decrement: amount } },
          });
        } else if (transaction.type === 'TRANSFER' && transaction.destinationAccountId) {
          // Transferência excluída: devolve para origem e retira do destino
          await tx.account.update({
            where: { id: transaction.accountId },
            data: { currentBalance: { increment: amount } },
          });
          await tx.account.update({
            where: { id: transaction.destinationAccountId },
            data: { currentBalance: { decrement: amount } },
          });
        }
      }

      // 2. Marca a transação como deletada
      await tx.transaction.update({
        where: { id: transactionId },
        data: { deletedAt: new Date() },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Transação excluída e saldo estornado com sucesso!',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
