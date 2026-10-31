import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'ARCHIVED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional().nullable(),
  scheduledStart: z.string().optional().nullable(),
  estimatedPomodoros: z.number().int().min(1).optional(),
  completedPomodoros: z.number().int().min(0).optional(),
  projectId: z.string().optional().nullable(),
  noteId: z.string().optional().nullable(),
  toggleStatus: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        project: true,
        note: { select: { id: true, title: true } },
        sessions: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Tarefa não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar tarefa' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const parsed = updateTaskSchema.parse(body);

    const existing = await prisma.task.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Tarefa não encontrada' },
        { status: 404 }
      );
    }

    const data: any = {};
    if (parsed.title !== undefined) data.title = parsed.title;
    if (parsed.description !== undefined) data.description = parsed.description;
    if (parsed.priority !== undefined) data.priority = parsed.priority;
    if (parsed.estimatedPomodoros !== undefined) data.estimatedPomodoros = parsed.estimatedPomodoros;
    if (parsed.completedPomodoros !== undefined) data.completedPomodoros = parsed.completedPomodoros;
    if (parsed.projectId !== undefined) data.projectId = parsed.projectId;
    if (parsed.noteId !== undefined) data.noteId = parsed.noteId;

    if (parsed.dueDate !== undefined) {
      data.dueDate = parsed.dueDate ? new Date(parsed.dueDate) : null;
    }
    if (parsed.scheduledStart !== undefined) {
      data.scheduledStart = parsed.scheduledStart ? new Date(parsed.scheduledStart) : null;
    }

    // Suporte a alternância rápida de status (TODO <-> DONE)
    if (parsed.toggleStatus || body.action === 'TOGGLE_STATUS') {
      const nextStatus = existing.status === 'DONE' ? 'TODO' : 'DONE';
      data.status = nextStatus;
      data.completedAt = nextStatus === 'DONE' ? new Date() : null;
    } else if (parsed.status !== undefined) {
      data.status = parsed.status;
      if (parsed.status === 'DONE') {
        data.completedAt = new Date();
      } else {
        data.completedAt = null;
      }
    }

    const updated = await prisma.task.update({
      where: { id: params.id },
      data,
      include: {
        project: true,
        note: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao atualizar tarefa' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.task.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: 'Tarefa excluída com sucesso' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao excluir tarefa' },
      { status: 400 }
    );
  }
}
