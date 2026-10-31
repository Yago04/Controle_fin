export interface DebtCalculationItem {
  id: string;
  description: string;
  currentBalance: number;
  interestRateMonthly: number; // ex: 2.5 (%)
  installmentAmount: number;
}

export interface PayoffStrategyResult {
  strategyName: 'AVALANCHE' | 'SNOWBALL';
  estimatedMonths: number;
  totalInterestEstimated: number;
  order: Array<{
    id: string;
    description: string;
    priorityOrder: number;
    reason: string;
  }>;
}

export interface FinancialHealthFactors {
  monthlyIncome: number;
  monthlyFixedExpenses: number;
  monthlyDebtInstallments: number;
  hasOverdueBillsOrDebts: boolean;
  emergencyFundAmount: number;
  monthlyExpensesAverage: number;
  totalDebtBalance: number;
}

export interface FinancialHealthResult {
  score: number; // 0 a 100
  status: 'CRITICA' | 'ALERTA' | 'BOA' | 'EXCELENTE';
  incomeCommitmentRate: number; // porcentagem (ex: 45%)
  emergencyFundMonths: number; // ex: 3.5 meses
  insights: string[];
}

export interface CanBuyAnalysis {
  isRecommended: boolean;
  alertLevel: 'SAFE' | 'WARNING' | 'DANGEROUS';
  projectedFreeMoney: number;
  newCommitmentPercentage: number;
  message: string;
  reasons: string[];
}

export class FinancialCalculator {
  /**
   * Calcula o Saldo Total Disponível em contas ativas
   */
  public static calculateCurrentBalance(
    accounts: Array<{ currentBalance: number; isActive: boolean }>
  ): number {
    return accounts
      .filter((acc) => acc.isActive)
      .reduce((acc, curr) => acc + Number(curr.currentBalance), 0);
  }

  /**
   * Calcula o Dinheiro Livre para os próximos 30 dias:
   * Saldo atual + Receitas previstas (30d) - Contas a pagar (30d) - Parcelas de dívidas (30d) - Recorrências (30d) - Reservas
   */
  public static calculateFreeMoney(params: {
    currentBalance: number;
    expectedIncomes30d: number;
    upcomingBills30d: number;
    debtInstallments30d: number;
    recurringExpenses30d: number;
    reservedGoalsAmount: number;
  }): number {
    const totalObligations =
      Number(params.upcomingBills30d) +
      Number(params.debtInstallments30d) +
      Number(params.recurringExpenses30d) +
      Number(params.reservedGoalsAmount);

    const totalAvailable = Number(params.currentBalance) + Number(params.expectedIncomes30d);
    return Math.round((totalAvailable - totalObligations) * 100) / 100;
  }

  /**
   * Calcula o total atual de dívidas ativas
   */
  public static calculateTotalDebt(
    debts: Array<{ currentBalance: number }>
  ): number {
    return debts.reduce((acc, curr) => acc + Number(curr.currentBalance), 0);
  }

  /**
   * Calcula a taxa de comprometimento da renda (%)
   */
  public static calculateIncomeCommitmentRate(
    monthlyIncome: number,
    monthlyFixedAndDebtExpenses: number
  ): number {
    if (monthlyIncome <= 0) return 100;
    const rate = (monthlyFixedAndDebtExpenses / monthlyIncome) * 100;
    return Math.min(100, Math.round(rate * 10) / 10);
  }

  /**
   * Calcula o Indicador de Saúde Financeira (Score 0-100)
   */
  public static calculateFinancialHealth(
    factors: FinancialHealthFactors
  ): FinancialHealthResult {
    let score = 0;
    const insights: string[] = [];

    const income = Number(factors.monthlyIncome);
    const fixedExpenses = Number(factors.monthlyFixedExpenses) + Number(factors.monthlyDebtInstallments);
    const commitmentRate = this.calculateIncomeCommitmentRate(income, fixedExpenses);

    // 1. Comprometimento de Renda (Max: 30 pontos)
    if (commitmentRate <= 30) {
      score += 30;
      insights.push('Comprometimento de renda excelente (abaixo de 30%).');
    } else if (commitmentRate <= 50) {
      score += 20;
      insights.push('Comprometimento de renda moderado (entre 30% e 50%).');
    } else if (commitmentRate <= 70) {
      score += 10;
      insights.push('Alerta: Mais da metade da sua renda está comprometida.');
    } else {
      score += 0;
      insights.push('Crítico: Mais de 70% da renda está comprometida com contas e dívidas.');
    }

    // 2. Inadimplência / Atrasos (Max: 25 pontos)
    if (!factors.hasOverdueBillsOrDebts) {
      score += 25;
      insights.push('Nenhuma conta ou dívida em atraso.');
    } else {
      score += 0;
      insights.push('Atenção: Existem contas ou parcelas atrasadas com juros correndo.');
    }

    // 3. Reserva de Emergência (Max: 25 pontos)
    const monthlyAverage = Number(factors.monthlyExpensesAverage) || 1;
    const emergencyMonths = Math.round((Number(factors.emergencyFundAmount) / monthlyAverage) * 10) / 10;

    if (emergencyMonths >= 6) {
      score += 25;
      insights.push('Reserva de emergência completa (mais de 6 meses de despesas cobertos).');
    } else if (emergencyMonths >= 3) {
      score += 18;
      insights.push('Reserva de emergência parcial (3 a 6 meses de segurança).');
    } else if (emergencyMonths >= 1) {
      score += 10;
      insights.push('Reserva de emergência inicial (ao menos 1 mês de despesas guardado).');
    } else {
      score += 2;
      insights.push('Prioridade: Construir uma reserva de emergência para imprevistos.');
    }

    // 4. Volume de Dívida vs Renda Anual (Max: 20 pontos)
    const annualIncome = income * 12;
    const totalDebt = Number(factors.totalDebtBalance);
    if (totalDebt === 0) {
      score += 20;
      insights.push('Livre de dívidas financeiras!');
    } else if (annualIncome > 0 && totalDebt <= annualIncome * 0.2) {
      score += 15;
      insights.push('Endividamento baixo em relação à sua capacidade anual.');
    } else if (annualIncome > 0 && totalDebt <= annualIncome * 0.5) {
      score += 8;
      insights.push('Endividamento considerável, requer disciplina.');
    } else {
      score += 0;
      insights.push('Nível de dívida elevado frente à renda anual.');
    }

    // Determina o status
    let status: FinancialHealthResult['status'] = 'BOA';
    if (score < 40) status = 'CRITICA';
    else if (score < 60) status = 'ALERTA';
    else if (score < 80) status = 'BOA';
    else status = 'EXCELENTE';

    return {
      score: Math.min(100, Math.max(0, score)),
      status,
      incomeCommitmentRate: commitmentRate,
      emergencyFundMonths: emergencyMonths,
      insights,
    };
  }

  /**
   * Método Avalanche (maior taxa de juros primeiro)
   */
  public static calculateAvalancheStrategy(
    debts: DebtCalculationItem[]
  ): PayoffStrategyResult {
    const sorted = [...debts].sort(
      (a, b) => Number(b.interestRateMonthly) - Number(a.interestRateMonthly)
    );

    let maxMonths = 0;
    let totalInterest = 0;

    const order = sorted.map((d, index) => {
      const balance = Number(d.currentBalance);
      const installment = Number(d.installmentAmount) || (balance / 10 || 1);
      const months = Math.ceil(balance / installment);
      if (months > maxMonths) maxMonths = months;

      // Estimativa simples de juros corridos
      const monthlyRate = Number(d.interestRateMonthly) / 100;
      totalInterest += balance * monthlyRate * (months / 2);

      return {
        id: d.id,
        description: d.description,
        priorityOrder: index + 1,
        reason: `Juros mais agressivos (${d.interestRateMonthly}% a.m.). Quitar primeiro reduz o custo total.`,
      };
    });

    return {
      strategyName: 'AVALANCHE',
      estimatedMonths: maxMonths || 1,
      totalInterestEstimated: Math.round(totalInterest * 100) / 100,
      order,
    };
  }

  /**
   * Método Bola de Neve (menor saldo devedor primeiro)
   */
  public static calculateSnowballStrategy(
    debts: DebtCalculationItem[]
  ): PayoffStrategyResult {
    const sorted = [...debts].sort(
      (a, b) => Number(a.currentBalance) - Number(b.currentBalance)
    );

    let maxMonths = 0;
    let totalInterest = 0;

    const order = sorted.map((d, index) => {
      const balance = Number(d.currentBalance);
      const installment = Number(d.installmentAmount) || (balance / 10 || 1);
      const months = Math.ceil(balance / installment);
      if (months > maxMonths) maxMonths = months;

      const monthlyRate = (Number(d.interestRateMonthly) || 1.5) / 100;
      // Bola de neve tende a pagar ligeiramente mais juros por deixar os caros pro fim
      totalInterest += balance * monthlyRate * (months * 0.6);

      return {
        id: d.id,
        description: d.description,
        priorityOrder: index + 1,
        reason: `Saldo menor (R$ ${balance.toFixed(2)}). Quitar primeiro gera vitória psicológica rápida.`,
      };
    });

    return {
      strategyName: 'SNOWBALL',
      estimatedMonths: maxMonths || 1,
      totalInterestEstimated: Math.round(totalInterest * 100) / 100,
      order,
    };
  }

  /**
   * Simulador "Posso Comprar?"
   */
  public static canAffordPurchase(params: {
    purchaseAmount: number;
    freeMoney: number;
    monthlyIncome: number;
    monthlyFixedExpenses: number;
    installments?: number;
  }): CanBuyAnalysis {
    const purchase = Number(params.purchaseAmount);
    const free = Number(params.freeMoney);
    const income = Number(params.monthlyIncome) || 1;
    const installments = params.installments && params.installments > 1 ? params.installments : 1;
    const monthlyImpact = purchase / installments;

    const projectedFreeMoney = Math.round((free - (installments === 1 ? purchase : monthlyImpact)) * 100) / 100;
    const newFixed = Number(params.monthlyFixedExpenses) + monthlyImpact;
    const newCommitmentPercentage = Math.round(((newFixed / income) * 100) * 10) / 10;

    const reasons: string[] = [];
    let isRecommended = true;
    let alertLevel: CanBuyAnalysis['alertLevel'] = 'SAFE';

    if (projectedFreeMoney < 0) {
      isRecommended = false;
      alertLevel = 'DANGEROUS';
      reasons.push(`Essa compra deixará seu dinheiro livre no negativo em R$ ${Math.abs(projectedFreeMoney).toFixed(2)}.`);
    } else if (projectedFreeMoney < free * 0.2) {
      alertLevel = 'WARNING';
      reasons.push(`Essa compra consumirá mais de 80% da sua margem de segurança no mês.`);
    }

    if (newCommitmentPercentage > 70) {
      if (alertLevel !== 'DANGEROUS') alertLevel = 'WARNING';
      reasons.push(`Seu comprometimento de renda aumentará para ${newCommitmentPercentage}%, ultrapassando o limite seguro.`);
    }

    let message = '✓ COMPRA COMPATÍVEL: Você possui margem financeira saudável para essa aquisição.';
    if (alertLevel === 'WARNING') {
      message = '⚠ ATENÇÃO: A compra é possível, mas reduzirá significativamente sua margem de manobra este mês.';
    } else if (alertLevel === 'DANGEROUS') {
      message = '⛔ RISCO ELEVADO: Essa compra comprometerá pagamentos futuros essenciais ou gerará saldo negativo.';
    }

    return {
      isRecommended,
      alertLevel,
      projectedFreeMoney,
      newCommitmentPercentage,
      message,
      reasons,
    };
  }
}
