import { NextRequest, NextResponse } from 'next/server';
import { DebtRepository } from '@/repositories/DebtRepository';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const paySchema = z.object({
  installmentId: z.string().uuid(),
  accountId: z.string().uuid(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = paySchema.parse(body);

    await DebtRepository.payInstallment({
      debtId: params.id,
      installmentId: validated.installmentId,
      accountId: validated.accountId,
    });

    return NextResponse.json({ success: true, message: 'Parcela paga com sucesso!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
