import { NextRequest, NextResponse } from 'next/server';
import { DebtRepository } from '@/repositories/DebtRepository';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const debt = await DebtRepository.findById(params.id);
    if (!debt || debt.deletedAt) {
      return NextResponse.json(
        { success: false, error: 'Dívida não encontrada' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: debt });
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

    const originalAmount =
      body.totalAmount !== undefined
        ? Number(body.totalAmount)
        : body.originalAmount !== undefined
        ? Number(body.originalAmount)
        : undefined;

    const currentBalance =
      body.remainingAmount !== undefined
        ? Number(body.remainingAmount)
        : body.currentBalance !== undefined
        ? Number(body.currentBalance)
        : undefined;

    const totalInstallments =
      body.installmentsCount !== undefined
        ? Number(body.installmentsCount)
        : body.totalInstallments !== undefined
        ? Number(body.totalInstallments)
        : undefined;

    const creditor = body.bankName !== undefined ? body.bankName : body.creditor;

    const updated = await DebtRepository.update(params.id, {
      creditor,
      description: body.description,
      originalAmount,
      currentBalance,
      interestRateMonthly:
        body.interestRateMonthly !== undefined ? Number(body.interestRateMonthly) : undefined,
      type: body.type,
      status: body.status,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : undefined,
      totalInstallments,
      paidInstallmentsCount:
        body.paidInstallmentsCount !== undefined ? Number(body.paidInstallmentsCount) : undefined,
      installmentAmount:
        body.installmentAmount !== undefined ? Number(body.installmentAmount) : undefined,
      notes: body.notes,
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
    await DebtRepository.delete(params.id);
    return NextResponse.json({ success: true, message: 'Dívida excluída com sucesso' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
