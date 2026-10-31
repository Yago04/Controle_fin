import { describe, it, expect } from 'vitest';

function calculateHorizonFromDate(targetDateStr?: string | null, referenceDate = new Date()): 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM' {
  if (!targetDateStr) return 'SHORT_TERM';
  const targetDate = new Date(targetDateStr);
  const diffDays = Math.ceil((targetDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 365) {
    return 'SHORT_TERM';
  } else if (diffDays <= 365 * 5) {
    return 'MEDIUM_TERM';
  } else {
    return 'LONG_TERM';
  }
}

describe('Goals Module - Horizon & Calculations', () => {
  const baseNow = new Date('2026-01-01T12:00:00Z');

  it('classifies goals <= 1 year as SHORT_TERM (Curto Prazo)', () => {
    // 6 months later
    const sixMonths = '2026-07-01T12:00:00Z';
    expect(calculateHorizonFromDate(sixMonths, baseNow)).toBe('SHORT_TERM');

    // Exactly 365 days later
    const oneYear = '2027-01-01T12:00:00Z';
    expect(calculateHorizonFromDate(oneYear, baseNow)).toBe('SHORT_TERM');
  });

  it('classifies goals between 1 and 5 years as MEDIUM_TERM (Médio Prazo)', () => {
    // 2 years later
    const twoYears = '2028-01-01T12:00:00Z';
    expect(calculateHorizonFromDate(twoYears, baseNow)).toBe('MEDIUM_TERM');

    // 4 years later
    const fourYears = '2030-01-01T12:00:00Z';
    expect(calculateHorizonFromDate(fourYears, baseNow)).toBe('MEDIUM_TERM');
  });

  it('classifies goals > 5 years as LONG_TERM (Longo Prazo)', () => {
    // 6 years later
    const sixYears = '2032-01-01T12:00:00Z';
    expect(calculateHorizonFromDate(sixYears, baseNow)).toBe('LONG_TERM');

    // 10 years later (Retirement / Financial Independence)
    const tenYears = '2036-01-01T12:00:00Z';
    expect(calculateHorizonFromDate(tenYears, baseNow)).toBe('LONG_TERM');
  });

  it('calculates progress percentage correctly and clamps at 100', () => {
    const calcPercentage = (current: number, target: number) => {
      if (target <= 0) return 0;
      return Math.min(100, Math.round((current / target) * 100));
    };

    expect(calcPercentage(2500, 10000)).toBe(25);
    expect(calcPercentage(5000, 10000)).toBe(50);
    expect(calcPercentage(10000, 10000)).toBe(100);
    expect(calcPercentage(15000, 10000)).toBe(100); // Does not exceed 100%
  });

  it('defaults to SHORT_TERM when no date is provided', () => {
    expect(calculateHorizonFromDate(null, baseNow)).toBe('SHORT_TERM');
    expect(calculateHorizonFromDate(undefined, baseNow)).toBe('SHORT_TERM');
  });
});
