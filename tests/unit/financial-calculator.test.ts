import { describe, it, expect } from 'vitest';
import { FinancialCalculator } from '../../domain/calculations/FinancialCalculator';

describe('FinancialCalculator - Regras de Negócio Financeiras', () => {
  it('deve calcular o saldo atual considerando apenas contas ativas', () => {
    const accounts = [
      { currentBalance: 1200.5, isActive: true },
      { currentBalance: 800.0, isActive: true },
      { currentBalance: 500.0, isActive: false }, // Inativa não entra
    ];

    const total = FinancialCalculator.calculateCurrentBalance(accounts);
    expect(total).toBe(2000.5);
  });

  it('deve calcular corretamente o Dinheiro Livre considerando obrigações de 30 dias', () => {
    const freeMoney = FinancialCalculator.calculateFreeMoney({
      currentBalance: 3240.5,
      expectedIncomes30d: 5000.0,
      upcomingBills30d: 1480.0,
      debtInstallments30d: 400.0,
      recurringExpenses30d: 250.0,
      reservedGoalsAmount: 1000.0, // Reserva comprometida
    });

    // 3240.5 + 5000 - (1480 + 400 + 250 + 1000) = 8240.5 - 3130 = 5110.5
    expect(freeMoney).toBe(5110.5);
  });

  it('deve calcular o índice de saúde financeira pontuando criticidade e emergência', () => {
    const healthResult = FinancialCalculator.calculateFinancialHealth({
      monthlyIncome: 6000,
      monthlyFixedExpenses: 2000,
      monthlyDebtInstallments: 500, // Total 2500 de 6000 = ~41.6% DTI
      hasOverdueBillsOrDebts: false,
      emergencyFundAmount: 18000, // 18k / 3k = 6 meses de emergência
      monthlyExpensesAverage: 3000,
      totalDebtBalance: 4000, // Menor que 20% da renda anual (72k)
    });

    expect(healthResult.score).toBeGreaterThanOrEqual(75);
    expect(['BOA', 'EXCELENTE']).toContain(healthResult.status);
    expect(healthResult.emergencyFundMonths).toBe(6);
  });

  it('deve priorizar a dívida com maior taxa de juros na estratégia Avalanche', () => {
    const debts = [
      { id: '1', description: 'Cartão Rotativo', currentBalance: 1500, interestRateMonthly: 12.5, installmentAmount: 300 },
      { id: '2', description: 'Empréstimo Pessoal', currentBalance: 4000, interestRateMonthly: 2.8, installmentAmount: 400 },
      { id: '3', description: 'Cheque Especial', currentBalance: 800, interestRateMonthly: 8.0, installmentAmount: 200 },
    ];

    const strategy = FinancialCalculator.calculateAvalancheStrategy(debts);
    expect(strategy.strategyName).toBe('AVALANCHE');
    expect(strategy.order[0].id).toBe('1'); // 12.5% vem primeiro
    expect(strategy.order[1].id).toBe('3'); // 8.0% vem em segundo
    expect(strategy.order[2].id).toBe('2'); // 2.8% vem por último
  });

  it('deve priorizar o menor saldo devedor na estratégia Bola de Neve', () => {
    const debts = [
      { id: '1', description: 'Cartão Rotativo', currentBalance: 1500, interestRateMonthly: 12.5, installmentAmount: 300 },
      { id: '2', description: 'Empréstimo Pessoal', currentBalance: 4000, interestRateMonthly: 2.8, installmentAmount: 400 },
      { id: '3', description: 'Cheque Especial', currentBalance: 800, interestRateMonthly: 8.0, installmentAmount: 200 },
    ];

    const strategy = FinancialCalculator.calculateSnowballStrategy(debts);
    expect(strategy.strategyName).toBe('SNOWBALL');
    expect(strategy.order[0].id).toBe('3'); // R$ 800 vem primeiro
    expect(strategy.order[1].id).toBe('1'); // R$ 1500 vem em segundo
    expect(strategy.order[2].id).toBe('2'); // R$ 4000 vem por último
  });

  it('deve emitir alerta de risco no simulador "Posso Comprar?" se deixar o saldo negativo', () => {
    const simulation = FinancialCalculator.canAffordPurchase({
      purchaseAmount: 1500,
      freeMoney: 800,
      monthlyIncome: 4000,
      monthlyFixedExpenses: 2500,
    });

    expect(simulation.isRecommended).toBe(false);
    expect(simulation.alertLevel).toBe('DANGEROUS');
    expect(simulation.projectedFreeMoney).toBe(-700);
  });
});
