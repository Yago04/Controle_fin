import { describe, it, expect } from 'vitest';

describe('Bank Logos and Person Expenses Support', () => {
  it('extracts person tag from notes correctly', () => {
    const getPersonFromNotes = (notes?: string | null): string | null => {
      if (!notes) return null;
      const match = notes.match(/\[Pessoa:\s*([^\]]+)\]/i) || notes.match(/Pessoa:\s*([^,\n]+)/i);
      return match ? match[1].trim() : null;
    };

    expect(getPersonFromNotes('[Pessoa: João Silva] Almoço de domingo')).toBe('João Silva');
    expect(getPersonFromNotes('Pessoa: Carlos Barbeiro')).toBe('Carlos Barbeiro');
    expect(getPersonFromNotes('[Pessoa: Mãe]')).toBe('Mãe');
    expect(getPersonFromNotes('Compra de mercado sem pessoa')).toBeNull();
    expect(getPersonFromNotes(null)).toBeNull();
  });

  it('formats person tag for payload correctly', () => {
    const isPerson = true;
    const personName = 'Carlos Barbeiro';
    const notes = 'Corte de cabelo e barba';

    const finalNotes = isPerson && personName.trim()
      ? `[Pessoa: ${personName.trim()}] ${notes.trim()}`.trim()
      : notes.trim();

    expect(finalNotes).toBe('[Pessoa: Carlos Barbeiro] Corte de cabelo e barba');
  });

  it('correctly maps bank aliases for API Ninjas query', () => {
    const BANK_ALIASES: Record<string, string> = {
      nubank: 'Nu Holdings',
      'banco inter': 'Banco Inter',
      inter: 'Banco Inter',
      itaú: 'Itau',
      itau: 'Itau',
      bradesco: 'Banco Bradesco',
      santander: 'Santander',
      'banco do brasil': 'Banco do Brasil',
      caixa: 'CaixaBank',
    };

    const getQuery = (input: string) => BANK_ALIASES[input.toLowerCase().trim()] || input;

    expect(getQuery('Nubank')).toBe('Nu Holdings');
    expect(getQuery('Itaú')).toBe('Itau');
    expect(getQuery('Banco Inter')).toBe('Banco Inter');
    expect(getQuery('Bradesco')).toBe('Banco Bradesco');
    expect(getQuery('Santander')).toBe('Santander');
    expect(getQuery('Banco do Brasil')).toBe('Banco do Brasil');
    expect(getQuery('Caixa')).toBe('CaixaBank');
    expect(getQuery('Banco Personalizado')).toBe('Banco Personalizado');
  });
});
