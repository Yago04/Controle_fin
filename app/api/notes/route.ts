import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const createNoteSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  content: z.string().default(''),
  tags: z.array(z.string()).default([]),
  folderId: z.string().optional().nullable(),
  isPinned: z.boolean().default(false),
  isFavorite: z.boolean().default(false),
  isDailyNote: z.boolean().default(false),
  projectId: z.string().optional().nullable(),
  transactionId: z.string().optional().nullable(),
  debtId: z.string().optional().nullable(),
  workoutRoutineId: z.string().optional().nullable(),
});

const createFolderSchema = z.object({
  action: z.literal('CREATE_FOLDER'),
  name: z.string().min(1, 'Nome da pasta é obrigatório'),
  icon: z.string().optional().nullable(),
  color: z.string().default('#3b82f6'),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const folderId = searchParams.get('folderId');
    const tag = searchParams.get('tag');
    const isPinned = searchParams.get('isPinned');
    const isFavorite = searchParams.get('isFavorite');

    const where: any = {
      deletedAt: null,
    };

    if (q.trim()) {
      where.OR = [
        { title: { contains: q.trim(), mode: 'insensitive' } },
        { content: { contains: q.trim(), mode: 'insensitive' } },
      ];
    }

    if (folderId && folderId !== 'ALL') {
      where.folderId = folderId;
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (isPinned === 'true') {
      where.isPinned = true;
    }

    if (isFavorite === 'true') {
      where.isFavorite = true;
    }

    const [notes, folders, transactions, debts, routines, projects] = await Promise.all([
      prisma.note.findMany({
        where,
        include: {
          folder: true,
          project: { select: { id: true, name: true, color: true } },
          transaction: { select: { id: true, description: true, amount: true, type: true } },
          debt: { select: { id: true, creditor: true, description: true, currentBalance: true } },
          workoutRoutine: { select: { id: true, name: true, code: true } },
        },
        orderBy: [
          { isPinned: 'desc' },
          { updatedAt: 'desc' },
        ],
      }),
      prisma.noteFolder.findMany({
        orderBy: { name: 'asc' },
      }),
      prisma.transaction.findMany({
        where: { deletedAt: null },
        select: { id: true, description: true, amount: true, type: true, date: true },
        orderBy: { date: 'desc' },
        take: 25,
      }),
      prisma.debt.findMany({
        where: { deletedAt: null },
        select: { id: true, creditor: true, description: true, currentBalance: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.workoutRoutine.findMany({
        where: { isActive: true },
        select: { id: true, name: true, code: true },
        orderBy: { code: 'asc' },
      }),
      prisma.project.findMany({
        where: { isArchived: false },
        select: { id: true, name: true, color: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        notes,
        folders,
        linkables: {
          transactions: transactions.map((t) => ({
            ...t,
            amount: Number(t.amount),
          })),
          debts: debts.map((d) => ({
            ...d,
            currentBalance: Number(d.currentBalance),
          })),
          routines,
          projects,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar notas' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Criar pasta
    if (body.action === 'CREATE_FOLDER') {
      const parsed = createFolderSchema.parse(body);
      const folder = await prisma.noteFolder.create({
        data: {
          name: parsed.name,
          icon: parsed.icon || 'Folder',
          color: parsed.color,
        },
      });
      return NextResponse.json({ success: true, data: folder }, { status: 201 });
    }

    // 2. Abrir ou criar Daily Note de Hoje (pré-preenchida com resumo de gastos, tarefas e treino do dia)
    if (body.action === 'OPEN_DAILY_NOTE') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const dateStr = now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      const existingDaily = await prisma.note.findFirst({
        where: {
          isDailyNote: true,
          deletedAt: null,
          dailyDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          folder: true,
          project: true,
          transaction: true,
          debt: true,
          workoutRoutine: true,
        },
      });

      if (existingDaily) {
        return NextResponse.json({ success: true, data: existingDaily });
      }

      // Buscar dados reais do dia para pré-preencher a Daily Note
      const [todayTxs, todayTasks, todayWorkouts, diarioFolder] = await Promise.all([
        prisma.transaction.findMany({
          where: {
            deletedAt: null,
            date: { gte: startOfDay, lte: endOfDay },
          },
        }),
        prisma.task.findMany({
          where: {
            status: { not: 'ARCHIVED' },
          },
          take: 10,
          orderBy: { priority: 'desc' },
        }),
        prisma.workoutSession.findMany({
          where: {
            startedAt: { gte: startOfDay, lte: endOfDay },
          },
        }),
        prisma.noteFolder.findFirst({
          where: { id: 'folder-diario' },
        }),
      ]);

      const txLines =
        todayTxs.length > 0
          ? todayTxs
              .map(
                (t) =>
                  `- ${t.type === 'INCOME' ? '🟢' : '🔴'} **${t.description}**: ${formatCurrency(
                    Number(t.amount)
                  )}`
              )
              .join('\n')
          : '- Nenhuma movimentação registrada até o momento.';

      const taskLines =
        todayTasks.length > 0
          ? todayTasks
              .map((tk) => `- [${tk.status === 'DONE' ? 'x' : ' '}] ${tk.title} (${tk.estimatedPomodoros} 🍅)`)
              .join('\n')
          : '- [ ] Definir 3 prioridades principais do dia';

      const workoutLines =
        todayWorkouts.length > 0
          ? todayWorkouts
              .map(
                (w) =>
                  `- 🏋️ **${w.title}** — Volume total: ${Number(w.totalVolumeKg).toLocaleString('pt-BR')} kg`
              )
              .join('\n')
          : '- [ ] Realizar treino do dia & bater meta de água (3000ml)';

      const templateContent = `# 📅 Diário de Bordo — ${dateStr}

## 🎯 Prioridades & Tarefas de Hoje
${taskLines}

## 💰 Resumo Financeiro do Dia
${txLines}

## 🏋️ Treino, Saúde & Energia
${workoutLines}
- [ ] Tomar Creatina (5g)
- [ ] Bater meta de hidratação

## 🧠 Notas Rápidas & Reflexões
- `;

      const createdDaily = await prisma.note.create({
        data: {
          title: `Nota Diária — ${now.toLocaleDateString('pt-BR')}`,
          content: templateContent,
          tags: ['diario', 'meu-dia'],
          folderId: diarioFolder?.id || null,
          isDailyNote: true,
          dailyDate: startOfDay,
          isPinned: false,
        },
        include: {
          folder: true,
          project: true,
          transaction: true,
          debt: true,
          workoutRoutine: true,
        },
      });

      return NextResponse.json({ success: true, data: createdDaily }, { status: 201 });
    }

    // 3. Criar nota normal
    const parsed = createNoteSchema.parse(body);
    const note = await prisma.note.create({
      data: {
        title: parsed.title,
        content: parsed.content,
        tags: parsed.tags,
        folderId: parsed.folderId || null,
        isPinned: parsed.isPinned,
        isFavorite: parsed.isFavorite,
        isDailyNote: parsed.isDailyNote,
        projectId: parsed.projectId || null,
        transactionId: parsed.transactionId || null,
        debtId: parsed.debtId || null,
        workoutRoutineId: parsed.workoutRoutineId || null,
      },
      include: {
        folder: true,
        project: { select: { id: true, name: true, color: true } },
        transaction: { select: { id: true, description: true, amount: true, type: true } },
        debt: { select: { id: true, creditor: true, description: true, currentBalance: true } },
        workoutRoutine: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json({ success: true, data: note }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao criar nota' },
      { status: 500 }
    );
  }
}
