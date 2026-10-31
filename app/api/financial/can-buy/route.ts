import { NextRequest, NextResponse } from 'next/server';
import { FinancialOverviewService } from '@/services/FinancialOverviewService';
import { FinancialCalculator } from '@/domain/calculations/FinancialCalculator';
import { canBuySchema } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = canBuySchema.parse(body);

    const overview = await FinancialOverviewService.getDashboardOverview();

    const result = FinancialCalculator.canAffordPurchase({
      purchaseAmount: validated.purchaseAmount,
      installments: validated.installments,
      freeMoney: overview.freeMoney,
      monthlyIncome: overview.monthlyIncome || 5000,
      monthlyFixedExpenses: overview.monthlyExpense + overview.monthlyDebtInstallments,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
