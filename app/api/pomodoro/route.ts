import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const sessionSchema = z.object({
  mode: z.enum(['FOCUS', 'SHORT_BREAK', 'LONG_BREAK', 'STOPWATCH']).default('FOCUS'),
  durationMinutes: z.number().int().min(1),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  taskId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  noteId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

    const [sessions, settings, projects] = await Promise.all([
      prisma.pomodoroSession.findMany({
        where: {
          mode: { in: ['FOCUS', 'STOPWATCH'] },
        },
        include: {
          task: { select: { id: true, title: true } },
          project: { select: { id: true, name: true, color: true } },
        },
        orderBy: { startedAt: 'desc' },
        take: 250,
      }),
      prisma.appSetting.findFirst({ where: { id: 'default' } }),
      prisma.project.findMany({ where: { isArchived: false } }),
    ]);

    let todayMinutes = 0;
    let weekMinutes = 0;
    let monthMinutes = 0;
    let todaySessionsCount = 0;

    const projectMap: Record<string, { name: string; color: string; minutes: number }> = {};
    for (const p of projects) {
      projectMap[p.id] = { name: p.name, color: p.color, minutes: 0 };
    }
    projectMap['unassigned'] = { name: 'Geral / Sem Projeto', color: '#64748b', minutes: 0 };

    const activeDaysSet = new Set<string>();

    for (const s of sessions) {
      const sDate = new Date(s.startedAt);
      const dateKey = sDate.toISOString().split('T')[0];
      activeDaysSet.add(dateKey);

      if (sDate >= startOfToday) {
        todayMinutes += s.durationMinutes;
        todaySessionsCount += 1;
      }
      if (sDate >= startOfWeek) {
        weekMinutes += s.durationMinutes;
      }
      if (sDate >= startOfMonth) {
        monthMinutes += s.durationMinutes;
        const pKey = s.projectId && projectMap[s.projectId] ? s.projectId : 'unassigned';
        projectMap[pKey].minutes += s.durationMinutes;
      }
    }

    // Cálculo de Streak de dias seguidos
    let streakDays = 0;
    const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayKey = cursor.toISOString().split('T')[0];

    if (!activeDaysSet.has(todayKey)) {
      cursor.setDate(cursor.getDate() - 1);
    }

    while (true) {
      const k = cursor.toISOString().split('T')[0];
      if (activeDaysSet.has(k)) {
        streakDays += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    const projectDistribution = Object.entries(projectMap)
      .map(([id, val]) => ({ id, ...val }))
      .filter((item) => item.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes);

    return NextResponse.json({
      success: true,
      data: {
        todayMinutes,
        todaySessionsCount,
        weekMinutes,
        monthMinutes,
        streakDays,
        dailyGoalMinutes: settings?.dailyFocusGoalMinutes ?? 100,
        settings: {
          focusMinutes: settings?.pomodoroFocusMinutes ?? 25,
          shortBreak: settings?.pomodoroShortBreak ?? 5,
          longBreak: settings?.pomodoroLongBreak ?? 15,
        },
        projectDistribution,
        recentSessions: sessions.slice(0, 15),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar estatísticas Pomodoro' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = sessionSchema.parse({
      ...body,
      durationMinutes: Number(body.durationMinutes || 25),
    });

    const endedAt = parsed.endedAt ? new Date(parsed.endedAt) : new Date();
    const startedAt = parsed.startedAt
      ? new Date(parsed.startedAt)
      : new Date(endedAt.getTime() - parsed.durationMinutes * 60 * 1000);

    let resolvedProjectId = parsed.projectId || null;

    if (parsed.taskId && !resolvedProjectId) {
      const existingTask = await prisma.task.findUnique({
        where: { id: parsed.taskId },
        select: { projectId: true },
      });
      if (existingTask?.projectId) {
        resolvedProjectId = existingTask.projectId;
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.pomodoroSession.create({
        data: {
          mode: parsed.mode,
          durationMinutes: parsed.durationMinutes,
          startedAt,
          endedAt,
          taskId: parsed.taskId || null,
          projectId: resolvedProjectId,
          noteId: parsed.noteId || null,
          notes: parsed.notes || null,
        },
      });

      if (parsed.taskId && (parsed.mode === 'FOCUS' || parsed.mode === 'STOPWATCH')) {
        await tx.task.update({
          where: { id: parsed.taskId },
          data: {
            completedPomodoros: { increment: 1 },
          },
        });
      }

      return session;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao registrar sessão Pomodoro' },
      { status: 500 }
    );
  }
}
