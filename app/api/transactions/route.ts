import { NextRequest, NextResponse } from 'next/server';
import { TransactionRepository } from '@/repositories/TransactionRepository';
import { transactionSchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') ? Number(searchParams.get('month')) : undefined;
    const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 50;
    const search = searchParams.get('search') || undefined;
    const accountId = searchParams.get('accountId') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;

    const transactions = await TransactionRepository.list({
      month,
      year,
      limit,
      search,
      accountId,
      categoryId,
    });

    return NextResponse.json({ success: true, data: transactions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = transactionSchema.parse(body);

    const transaction = await TransactionRepository.create({
      ...validated,
      date: new Date(validated.date),
      dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
    });

    return NextResponse.json({ success: true, data: transaction }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
