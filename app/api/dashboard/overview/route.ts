import { NextResponse } from 'next/server';
import { FinancialOverviewService } from '@/services/FinancialOverviewService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const overview = await FinancialOverviewService.getDashboardOverview();
    return NextResponse.json({ success: true, data: overview });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
