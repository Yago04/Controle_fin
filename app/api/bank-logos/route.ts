import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Cache em memória para evitar chamadas repetidas à API externa
const logoCache = new Map<string, string | null>();

// Mapeamento de termos comuns brasileiros para queries mais assertivas na API Ninjas
const BANK_ALIASES: Record<string, string> = {
  nubank: 'Nu Holdings',
  'nu pagamentos': 'Nu Holdings',
  'nu finance': 'Nu Holdings',
  'banco inter': 'Banco Inter',
  inter: 'Banco Inter',
  itaú: 'Itau',
  itau: 'Itau',
  'itaú unibanco': 'Itau',
  bradesco: 'Banco Bradesco',
  'banco bradesco': 'Banco Bradesco',
  santander: 'Santander',
  'banco santander': 'Santander',
  'banco do brasil': 'Banco do Brasil',
  bb: 'Banco do Brasil',
  caixa: 'CaixaBank',
  'caixa econômica': 'CaixaBank',
  'caixa economica federal': 'CaixaBank',
  'btg pactual': 'BTG Pactual',
  btg: 'BTG Pactual',
  xp: 'XP Inc',
  'xp investimentos': 'XP Inc',
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawName = searchParams.get('name')?.trim();

    if (!rawName) {
      return NextResponse.json({ success: false, error: 'Parâmetro name é obrigatório' }, { status: 400 });
    }

    const normalizedKey = rawName.toLowerCase();

    // 1. Verifica cache em memória
    if (logoCache.has(normalizedKey)) {
      return NextResponse.json({
        success: true,
        logoUrl: logoCache.get(normalizedKey),
        source: 'cache',
      });
    }

    // 2. Resolve query name
    let queryName = BANK_ALIASES[normalizedKey] || rawName;

    // Se for carteira ou dinheiro em espécie, não busca
    if (normalizedKey.includes('carteira') || normalizedKey.includes('dinheiro')) {
      logoCache.set(normalizedKey, null);
      return NextResponse.json({ success: true, logoUrl: null });
    }

    const apiKey = process.env.API_NINJAS_KEY || 'HP9hiXMzXgf69J0Fvsog8IoAxuOCWHgS1ZDZKgbQ';

    const url = `https://api.api-ninjas.com/v1/logo?name=${encodeURIComponent(queryName)}`;
    const response = await fetch(url, {
      headers: {
        'X-Api-Key': apiKey,
      },
      next: { revalidate: 86400 }, // 24h cache no Next.js
    });

    if (!response.ok) {
      console.warn(`[Bank Logos] API Ninjas retornou status ${response.status} para ${queryName}`);
      logoCache.set(normalizedKey, null);
      return NextResponse.json({ success: true, logoUrl: null });
    }

    const data = await response.json();

    let logoUrl: string | null = null;

    if (Array.isArray(data) && data.length > 0) {
      // Prioriza imagem thumbnail que é pública e gratuita
      const itemWithThumb = data.find((item: any) => item.image_thumbnail && item.image_thumbnail.startsWith('http'));
      if (itemWithThumb) {
        logoUrl = itemWithThumb.image_thumbnail;
      } else if (data[0].image && data[0].image.startsWith('http')) {
        logoUrl = data[0].image;
      }
    }

    // Armazena no cache
    logoCache.set(normalizedKey, logoUrl);

    return NextResponse.json({
      success: true,
      logoUrl,
      bank: queryName,
      source: 'api-ninjas',
    });
  } catch (error: any) {
    console.error('[Bank Logos Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
