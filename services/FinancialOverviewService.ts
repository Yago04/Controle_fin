import { prisma } from '../lib/prisma';
import { AccountRepository } from '../repositories/AccountRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { DebtRepository } from '../repositories/DebtRepository';
import { FinancialCalculator } from '../domain/calculations/FinancialCalculator';

export class FinancialOverviewService {
  public static async getDashboardOverview() {
    const settings = await prisma.appSetting.findUnique({
      where: { id: 'default' },
    });

    const accounts = await AccountRepository.list();
    const debts = await DebtRepository.list();

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const monthlyTransactions = await TransactionRepository.list({
      month: currentMonth,
      year: currentYear,
    });

    // 1. Saldo Disponível Atual em Contas
    const currentBalance = FinancialCalculator.calculateCurrentBalance(
      accounts.map((a) => ({
        currentBalance: Number(a.currentBalance),
        isActive: a.isActive,
      }))
    );

    // 2. Receitas e Despesas do mês
    const monthlyIncome = monthlyTransactions
      .filter((t) => t.type === 'INCOME' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const monthlyExpense = monthlyTransactions
      .filter((t) => t.type === 'EXPENSE' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const pendingExpenses = monthlyTransactions
      .filter((t) => t.type === 'EXPENSE' && t.status === 'PENDING')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const pendingIncomes = monthlyTransactions
      .filter((t) => t.type === 'INCOME' && t.status === 'PENDING')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Contas a pagar pendentes do mês
    const pendingBills = await prisma.bill.findMany({
      where: {
        status: 'PENDING',
        deletedAt: null,
      },
    });
    const totalPendingBills = pendingBills.reduce((sum, b) => sum + Number(b.amount), 0);

    // Saldo Previsto no final do mês = Saldo Atual + Receitas Pendentes - Despesas Pendentes - Contas Pendentes
    const projectedEndMonthBalance = currentBalance + pendingIncomes - (pendingExpenses + totalPendingBills);

    // 3. Dívidas Totais e Parcelas Mensais
    const totalDebt = FinancialCalculator.calculateTotalDebt(
      debts.map((d) => ({ currentBalance: Number(d.currentBalance) }))
    );

    const monthlyDebtInstallments = debts
      .filter((d) => d.status === 'ACTIVE' || d.status === 'OVERDUE')
      .reduce((sum, d) => sum + Number(d.installmentAmount), 0);

    const hasOverdue = debts.some(
      (d) =>
        d.status === 'OVERDUE' ||
        d.installments.some((i) => i.status === 'PENDING' && new Date(i.dueDate) < now)
    );

    // 4. Dinheiro Livre (Próximos 30 dias)
    const freeMoney = FinancialCalculator.calculateFreeMoney({
      currentBalance,
      expectedIncomes30d: pendingIncomes,
      upcomingBills30d: totalPendingBills + pendingExpenses,
      debtInstallments30d: monthlyDebtInstallments,
      recurringExpenses30d: 0,
      reservedGoalsAmount: 0,
    });

    const userIncome = Number(settings?.monthlyIncome) || monthlyIncome || 5000;

    // 5. Indicador de Saúde Financeira
    const healthResult = FinancialCalculator.calculateFinancialHealth({
      monthlyIncome: userIncome,
      monthlyFixedExpenses: monthlyExpense + totalPendingBills,
      monthlyDebtInstallments,
      hasOverdueBillsOrDebts: hasOverdue,
      emergencyFundAmount: currentBalance * 0.5,
      monthlyExpensesAverage: monthlyExpense || 2500,
      totalDebtBalance: totalDebt,
    });

    // 6. Estratégias de Quitação de Dívidas
    const debtCalcItems = debts
      .filter((d) => d.status === 'ACTIVE' || d.status === 'OVERDUE')
      .map((d) => ({
        id: d.id,
        description: d.description,
        currentBalance: Number(d.currentBalance),
        interestRateMonthly: Number(d.interestRateMonthly),
        installmentAmount: Number(d.installmentAmount),
      }));

    const avalancheStrategy = FinancialCalculator.calculateAvalancheStrategy(debtCalcItems);
    const snowballStrategy = FinancialCalculator.calculateSnowballStrategy(debtCalcItems);

    return {
      currentBalance,
      monthlyIncome,
      monthlyExpense,
      projectedEndMonthBalance,
      freeMoney,
      totalDebt,
      monthlyDebtInstallments,
      totalPendingBills,
      financialHealth: healthResult,
      avalancheStrategy,
      snowballStrategy,
      accounts: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        bankName: a.bankName,
        type: a.type,
        currentBalance: Number(a.currentBalance),
        color: a.color,
      })),
      recentTransactions: monthlyTransactions.slice(0, 15).map((t) => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        type: t.type,
        status: t.status,
        date: t.date,
        accountName: t.account.name,
        categoryName: t.category?.name || 'Geral',
        categoryColor: t.category?.color || '#64748b',
        notes: t.notes,
      })),
      debts: debts.map((d) => ({
        id: d.id,
        creditor: d.creditor,
        description: d.description,
        originalAmount: Number(d.originalAmount),
        currentBalance: Number(d.currentBalance),
        interestRateMonthly: Number(d.interestRateMonthly),
        installmentAmount: Number(d.installmentAmount),
        totalInstallments: d.totalInstallments,
        paidInstallmentsCount: d.paidInstallmentsCount,
        status: d.status,
      })),
      bills: pendingBills.map((b) => ({
        id: b.id,
        description: b.description,
        amount: Number(b.amount),
        dueDate: b.dueDate,
        status: b.status,
      })),
    };
  }
}
