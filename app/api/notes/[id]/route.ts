import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  folderId: z.string().optional().nullable(),
  isPinned: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  projectId: z.string().optional().nullable(),
  transactionId: z.string().optional().nullable(),
  debtId: z.string().optional().nullable(),
  workoutRoutineId: z.string().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const parsed = updateNoteSchema.parse(body);

    const updated = await prisma.note.update({
      where: { id: params.id },
      data: parsed,
      include: {
        folder: true,
        project: { select: { id: true, name: true, color: true } },
        transaction: { select: { id: true, description: true, amount: true, type: true } },
        debt: { select: { id: true, creditor: true, description: true, currentBalance: true } },
        workoutRoutine: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao atualizar nota' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.note.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao excluir nota' },
      { status: 400 }
    );
  }
}
