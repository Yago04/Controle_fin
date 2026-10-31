import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'ARCHIVED']).default('TODO'),
  dueDate: z.string().optional().nullable(),
  scheduledStart: z.string().optional().nullable(),
  estimatedPomodoros: z.number().int().min(1).default(1),
  completedPomodoros: z.number().int().min(0).default(0),
  projectId: z.string().optional().nullable(),
  noteId: z.string().optional().nullable(),
});

const createProjectSchema = z.object({
  type: z.literal('PROJECT'),
  name: z.string().min(1, 'Nome do projeto é obrigatório'),
  color: z.string().default('#f59e0b'),
  icon: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const projectId = searchParams.get('projectId');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    } else {
      where.status = { not: 'ARCHIVED' };
    }
    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }
    if (projectId && projectId !== 'ALL') {
      where.projectId = projectId;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    const [tasks, projects, allActiveTasks] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          project: true,
          note: { select: { id: true, title: true } },
        },
        orderBy: [
          { status: 'asc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.project.findMany({
        where: { isArchived: false },
        orderBy: { name: 'asc' },
      }),
      prisma.task.findMany({
        where: { status: { not: 'ARCHIVED' } },
        select: { status: true, priority: true, dueDate: true },
      }),
    ]);

    // Calcular contadores em tempo real
    const counts = {
      total: allActiveTasks.length,
      todo: allActiveTasks.filter((t) => t.status === 'TODO').length,
      inProgress: allActiveTasks.filter((t) => t.status === 'IN_PROGRESS').length,
      done: allActiveTasks.filter((t) => t.status === 'DONE').length,
      urgent: allActiveTasks.filter((t) => t.priority === 'URGENT' && t.status !== 'DONE').length,
      high: allActiveTasks.filter((t) => t.priority === 'HIGH' && t.status !== 'DONE').length,
      overdue: allActiveTasks.filter((t) => t.dueDate && new Date(t.dueDate) < todayStart && t.status !== 'DONE').length,
    };

    return NextResponse.json({
      success: true,
      data: { tasks, projects, counts },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar tarefas' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.type === 'PROJECT') {
      const parsed = createProjectSchema.parse(body);
      const project = await prisma.project.create({
        data: {
          name: parsed.name,
          color: parsed.color,
          icon: parsed.icon || 'Folder',
        },
      });
      return NextResponse.json({ success: true, data: project }, { status: 201 });
    }

    const parsed = createTaskSchema.parse({
      ...body,
      estimatedPomodoros: body.estimatedPomodoros ? Number(body.estimatedPomodoros) : 1,
      completedPomodoros: body.completedPomodoros ? Number(body.completedPomodoros) : 0,
    });

    const isDone = parsed.status === 'DONE';

    const task = await prisma.task.create({
      data: {
        title: parsed.title,
        description: parsed.description || null,
        priority: parsed.priority,
        status: parsed.status,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
        scheduledStart: parsed.scheduledStart ? new Date(parsed.scheduledStart) : null,
        estimatedPomodoros: parsed.estimatedPomodoros,
        completedPomodoros: parsed.completedPomodoros,
        projectId: parsed.projectId || null,
        noteId: parsed.noteId || null,
        completedAt: isDone ? new Date() : null,
      },
      include: {
        project: true,
        note: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao criar tarefa' },
      { status: 500 }
    );
  }
}
