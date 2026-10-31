import { NextRequest, NextResponse } from 'next/server';
import { DebtRepository } from '@/repositories/DebtRepository';
import { debtSchema } from '@/lib/validations';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const debts = await DebtRepository.list();

    // Métricas consolidadas de dívidas para o painel
    let totalDebt = 0;
    let totalOriginal = 0;
    let totalMonthlyInstallments = 0;
    let activeCount = 0;
    let overdueCount = 0;
    let paidCount = 0;

    for (const d of debts) {
      const balance = Number(d.currentBalance);
      const original = Number(d.originalAmount);
      const installment = Number(d.installmentAmount);

      totalDebt += balance;
      totalOriginal += original;

      if (d.status === 'PAID') {
        paidCount++;
      } else {
        activeCount++;
        totalMonthlyInstallments += installment;
        if (d.status === 'OVERDUE') {
          overdueCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: debts,
      summary: {
        totalDebt,
        totalOriginal,
        totalMonthlyInstallments,
        activeCount,
        overdueCount,
        paidCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = debtSchema.parse(body);

    const creditor = validated.bankName || validated.creditor || 'Credor Não Informado';
    const totalInstallments = validated.installmentsCount || validated.totalInstallments || 1;
    const originalAmount = validated.totalAmount || validated.originalAmount || 0;
    const currentBalance =
      validated.remainingAmount !== undefined
        ? validated.remainingAmount
        : validated.currentBalance !== undefined
        ? validated.currentBalance
        : originalAmount;

    const installmentAmount =
      validated.installmentAmount ||
      (totalInstallments > 0 ? originalAmount / totalInstallments : originalAmount);

    const debt = await DebtRepository.create({
      creditor,
      description: validated.description,
      originalAmount,
      currentBalance,
      interestRateMonthly: validated.interestRateMonthly,
      type: validated.type,
      status: validated.status,
      startDate: validated.startDate ? new Date(validated.startDate) : new Date(),
      dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
      totalInstallments,
      paidInstallmentsCount: validated.paidInstallmentsCount || 0,
      installmentAmount,
      notes: validated.notes || null,
    });

    return NextResponse.json({ success: true, data: debt }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'ID da dívida é obrigatório para atualização' },
        { status: 400 }
      );
    }

    const originalAmount =
      body.totalAmount !== undefined ? Number(body.totalAmount) : body.originalAmount !== undefined ? Number(body.originalAmount) : undefined;
    const currentBalance =
      body.remainingAmount !== undefined ? Number(body.remainingAmount) : body.currentBalance !== undefined ? Number(body.currentBalance) : undefined;
    const totalInstallments =
      body.installmentsCount !== undefined ? Number(body.installmentsCount) : body.totalInstallments !== undefined ? Number(body.totalInstallments) : undefined;
    const creditor = body.bankName !== undefined ? body.bankName : body.creditor;

    const updated = await DebtRepository.update(body.id, {
      creditor,
      description: body.description,
      originalAmount,
      currentBalance,
      interestRateMonthly: body.interestRateMonthly !== undefined ? Number(body.interestRateMonthly) : undefined,
      type: body.type,
      status: body.status,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : undefined,
      totalInstallments,
      paidInstallmentsCount: body.paidInstallmentsCount !== undefined ? Number(body.paidInstallmentsCount) : undefined,
      installmentAmount: body.installmentAmount !== undefined ? Number(body.installmentAmount) : undefined,
      notes: body.notes,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
