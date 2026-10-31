import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export interface ParsedCSVItem {
  tempId: string;
  date: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  suggestedCategoryId?: string;
  suggestedCategoryName?: string;
  isDuplicate: boolean;
  duplicateReason?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { csvContent, accountId } = await req.json();

    if (!csvContent || typeof csvContent !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Conteúdo CSV é obrigatório' },
        { status: 400 }
      );
    }

    // Carrega regras e categorias
    const rules = await prisma.rule.findMany({
      include: { category: true },
    });

    const existingTransactions = await prisma.transaction.findMany({
      where: {
        accountId: accountId || undefined,
        deletedAt: null,
      },
      select: {
        date: true,
        amount: true,
        description: true,
      },
    });

    const lines = csvContent
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const parsedItems: ParsedCSVItem[] = [];

    // Ignora header se tiver palavras comuns
    const startIndex = lines[0].toLowerCase().includes('data') || lines[0].toLowerCase().includes('date') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      // Suporta separador por vírgula ou ponto e vírgula
      const parts = line.includes(';') ? line.split(';') : line.split(',');

      if (parts.length >= 3) {
        const rawDate = parts[0].trim();
        const rawDesc = parts[1].trim();
        const rawAmount = parts[2].trim().replace('R$', '').replace(' ', '').replace(',', '.');

        const parsedAmount = parseFloat(rawAmount);
        if (isNaN(parsedAmount)) continue;

        const isIncome = parsedAmount > 0;
        const absAmount = Math.abs(parsedAmount);

        // Parse da data (formato DD/MM/YYYY ou YYYY-MM-DD)
        let itemDate = new Date();
        if (rawDate.includes('/')) {
          const [d, m, y] = rawDate.split('/');
          itemDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        } else if (rawDate.includes('-')) {
          itemDate = new Date(rawDate);
        }

        // Aplicação de regras automáticas
        let suggestedCatId: string | undefined = undefined;
        let suggestedCatName: string | undefined = undefined;

        const upperDesc = rawDesc.toUpperCase();
        for (const rule of rules) {
          if (upperDesc.includes(rule.pattern.toUpperCase())) {
            suggestedCatId = rule.categoryId;
            suggestedCatName = rule.category.name;
            break;
          }
        }

        // Detecção de duplicatas (mesmo valor e intervalo de +/- 2 dias)
        let isDuplicate = false;
        let duplicateReason = '';

        for (const exist of existingTransactions) {
          const dateDiffDays = Math.abs(
            (itemDate.getTime() - new Date(exist.date).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (dateDiffDays <= 2 && Math.abs(Number(exist.amount) - absAmount) < 0.01) {
            isDuplicate = true;
            duplicateReason = `Possível duplicata de "${exist.description}" em ${new Date(
              exist.date
            ).toLocaleDateString('pt-BR')}`;
            break;
          }
        }

        parsedItems.push({
          tempId: `item-${i}-${Date.now()}`,
          date: itemDate.toISOString(),
          description: rawDesc,
          amount: absAmount,
          type: isIncome ? 'INCOME' : 'EXPENSE',
          suggestedCategoryId: suggestedCatId,
          suggestedCategoryName: suggestedCatName,
          isDuplicate,
          duplicateReason: isDuplicate ? duplicateReason : undefined,
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalParsed: parsedItems.length,
      items: parsedItems,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
