import { NextRequest, NextResponse } from 'next/server';
import { AccountRepository } from '@/repositories/AccountRepository';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const account = await prisma.account.findFirst({
      where: {
        id: params.id,
        deletedAt: null,
      },
      include: {
        transactions: {
          where: { deletedAt: null },
          orderBy: { date: 'desc' },
          take: 20,
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Conta não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: account });
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

    const updated = await AccountRepository.update(params.id, {
      name: body.name,
      bankName: body.bankName,
      type: body.type,
      initialBalance: body.initialBalance !== undefined ? Number(body.initialBalance) : undefined,
      currentBalance: body.currentBalance !== undefined ? Number(body.currentBalance) : undefined,
      color: body.color,
      notes: body.notes,
      isActive: body.isActive,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await AccountRepository.delete(params.id);
    return NextResponse.json({ success: true, message: 'Conta excluída com sucesso' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
