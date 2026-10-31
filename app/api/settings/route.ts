import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const settingSchema = z.object({
  monthlyIncome: z.number().nonnegative(),
  emergencyFundGoal: z.number().nonnegative().optional(),
});

export async function GET() {
  try {
    let settings = await prisma.appSetting.findUnique({
      where: { id: 'default' },
    });
    if (!settings) {
      settings = await prisma.appSetting.create({
        data: {
          id: 'default',
          monthlyIncome: 5000.0,
          emergencyFundGoal: 20000.0,
        },
      });
    }
    return NextResponse.json({
      success: true,
      data: {
        ...settings,
        monthlyIncome: Number(settings.monthlyIncome),
        emergencyFundGoal: Number(settings.emergencyFundGoal),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = settingSchema.parse(body);

    const updated = await prisma.appSetting.upsert({
      where: { id: 'default' },
      update: {
        monthlyIncome: validated.monthlyIncome,
        emergencyFundGoal: validated.emergencyFundGoal ?? 0,
      },
      create: {
        id: 'default',
        monthlyIncome: validated.monthlyIncome,
        emergencyFundGoal: validated.emergencyFundGoal ?? 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        monthlyIncome: Number(updated.monthlyIncome),
        emergencyFundGoal: Number(updated.emergencyFundGoal),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
