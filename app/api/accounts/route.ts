import { NextRequest, NextResponse } from 'next/server';
import { AccountRepository } from '@/repositories/AccountRepository';
import { accountSchema } from '@/lib/validations';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const accounts = await AccountRepository.list();

    const totalBalance = accounts.reduce(
      (sum, acc) => sum + Number(acc.currentBalance),
      0
    );

    return NextResponse.json({
      success: true,
      data: accounts,
      totalBalance,
      totalAccounts: accounts.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = accountSchema.parse(body);

    const account = await AccountRepository.create({
      name: validated.name,
      bankName: validated.bankName || null,
      type: validated.type,
      initialBalance: validated.initialBalance,
      currentBalance: validated.currentBalance !== undefined ? validated.currentBalance : validated.initialBalance,
      color: validated.color || '#3b82f6',
      notes: validated.notes || null,
      isActive: validated.isActive,
    });

    return NextResponse.json({ success: true, data: account }, { status: 201 });
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
        { success: false, error: 'ID da conta é obrigatório' },
        { status: 400 }
      );
    }

    const updated = await AccountRepository.update(body.id, {
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
