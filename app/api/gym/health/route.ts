import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { getCachedHealthData, setCachedHealthData, invalidateHealthCache } from '@/lib/gymCache';

export const dynamic = 'force-dynamic';

function getTodayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateKey = searchParams.get('dateKey') || getTodayDateKey();

    // Cache rápido se for a data de hoje (evita 4 queries remotas a cada refresh)
    const isToday = dateKey === getTodayDateKey();
    if (isToday) {
      const cached = getCachedHealthData();
      if (cached) {
        return NextResponse.json({ success: true, data: cached, source: 'cache' });
      }
    }

    const [todayLog, recentLogs, bodyMetrics, settings] = await Promise.all([
      prisma.dailyHealthLog.upsert({
        where: { dateKey },
        update: {},
        create: { dateKey, waterMl: 0, creatineChecked: false, wheyChecked: false },
      }),
      prisma.dailyHealthLog.findMany({
        orderBy: { dateKey: 'desc' },
        take: 14,
      }),
      prisma.bodyMetric.findMany({
        orderBy: { date: 'desc' },
        take: 20,
      }),
      prisma.appSetting.findFirst({ where: { id: 'default' } }),
    ]);

    const payload = {
      todayLog: {
        ...todayLog,
        sleepHours: todayLog.sleepHours ? Number(todayLog.sleepHours) : null,
      },
      dailyWaterGoalMl: settings?.dailyWaterGoalMl ?? 3000,
      recentLogs: recentLogs.map((l) => ({
        ...l,
        sleepHours: l.sleepHours ? Number(l.sleepHours) : null,
      })),
      bodyMetrics: bodyMetrics.map((m) => ({
        ...m,
        weightKg: Number(m.weightKg),
        bodyFatPct: m.bodyFatPct ? Number(m.bodyFatPct) : null,
        chestCm: m.chestCm ? Number(m.chestCm) : null,
        waistCm: m.waistCm ? Number(m.waistCm) : null,
        armCm: m.armCm ? Number(m.armCm) : null,
        thighCm: m.thighCm ? Number(m.thighCm) : null,
      })),
    };

    if (isToday) {
      setCachedHealthData(payload);
    }

    return NextResponse.json({
      success: true,
      data: payload,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar hábitos de saúde' },
      { status: 500 }
    );
  }
}

const healthActionSchema = z.object({
  type: z.enum(['DAILY_LOG', 'BODY_METRIC']),
  dateKey: z.string().optional(),
  addWaterMl: z.number().int().optional(),
  waterMl: z.number().int().optional(),
  creatineChecked: z.boolean().optional(),
  wheyChecked: z.boolean().optional(),
  sleepHours: z.number().optional().nullable(),
  sleepQuality: z.number().int().min(1).max(5).optional().nullable(),
  cardioMinutes: z.number().int().optional(),
  // BodyMetric fields
  weightKg: z.number().optional(),
  bodyFatPct: z.number().optional().nullable(),
  chestCm: z.number().optional().nullable(),
  waistCm: z.number().optional().nullable(),
  armCm: z.number().optional().nullable(),
  thighCm: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = healthActionSchema.parse(body);

    if (parsed.type === 'BODY_METRIC') {
      if (!parsed.weightKg || parsed.weightKg <= 0) {
        return NextResponse.json(
          { success: false, error: 'Informe um peso corporal válido (kg)' },
          { status: 400 }
        );
      }

      const metric = await prisma.bodyMetric.create({
        data: {
          weightKg: parsed.weightKg,
          bodyFatPct: parsed.bodyFatPct ?? null,
          chestCm: parsed.chestCm ?? null,
          waistCm: parsed.waistCm ?? null,
          armCm: parsed.armCm ?? null,
          thighCm: parsed.thighCm ?? null,
          notes: parsed.notes || null,
        },
      });

      invalidateHealthCache();

      return NextResponse.json(
        {
          success: true,
          data: {
            ...metric,
            weightKg: Number(metric.weightKg),
            bodyFatPct: metric.bodyFatPct ? Number(metric.bodyFatPct) : null,
            chestCm: metric.chestCm ? Number(metric.chestCm) : null,
            waistCm: metric.waistCm ? Number(metric.waistCm) : null,
            armCm: metric.armCm ? Number(metric.armCm) : null,
            thighCm: metric.thighCm ? Number(metric.thighCm) : null,
          },
        },
        { status: 201 }
      );
    }

    // DAILY_LOG
    const dateKey = parsed.dateKey || getTodayDateKey();
    const current = await prisma.dailyHealthLog.upsert({
      where: { dateKey },
      update: {},
      create: { dateKey, waterMl: 0, creatineChecked: false, wheyChecked: false },
    });

    const newWaterMl =
      parsed.waterMl !== undefined
        ? Math.max(0, parsed.waterMl)
        : parsed.addWaterMl !== undefined
        ? Math.max(0, current.waterMl + parsed.addWaterMl)
        : current.waterMl;

    const updated = await prisma.dailyHealthLog.update({
      where: { dateKey },
      data: {
        waterMl: newWaterMl,
        creatineChecked:
          parsed.creatineChecked !== undefined ? parsed.creatineChecked : current.creatineChecked,
        wheyChecked: parsed.wheyChecked !== undefined ? parsed.wheyChecked : current.wheyChecked,
        sleepHours: parsed.sleepHours !== undefined ? parsed.sleepHours : current.sleepHours,
        sleepQuality:
          parsed.sleepQuality !== undefined ? parsed.sleepQuality : current.sleepQuality,
        cardioMinutes:
          parsed.cardioMinutes !== undefined ? parsed.cardioMinutes : current.cardioMinutes,
        notes: parsed.notes !== undefined ? parsed.notes : current.notes,
      },
    });

    invalidateHealthCache();

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        sleepHours: updated.sleepHours ? Number(updated.sleepHours) : null,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao salvar registro de saúde' },
      { status: 500 }
    );
  }
}
