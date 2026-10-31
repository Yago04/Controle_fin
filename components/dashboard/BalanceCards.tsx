import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import {
  Wallet,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CalendarCheck,
  AlertOctagon,
} from 'lucide-react';

interface BalanceCardsProps {
  currentBalance: number;
  freeMoney: number;
  monthlyIncome: number;
  monthlyExpense: number;
  projectedEndMonthBalance: number;
  totalDebt: number;
}

export function BalanceCards({
  currentBalance,
  freeMoney,
  monthlyIncome,
  monthlyExpense,
  projectedEndMonthBalance,
  totalDebt,
}: BalanceCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* 1. Saldo Disponível */}
      <Card className="hover:border-primary/50 transition-colors">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Saldo Disponível</span>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:bg-zinc-800 dark:text-zinc-200 flex items-center justify-center">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-bold tracking-tight text-foreground">
            {formatCurrency(currentBalance)}
          </div>
          <p className="text-[11px] text-muted-foreground">Total em contas ativas</p>
        </CardContent>
      </Card>

      {/* 2. Dinheiro Livre (Hero Destaque) */}
      <Card className="border-emerald-500/30 bg-gradient-to-br from-card to-emerald-500/5 shadow-sm">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider">Dinheiro Livre</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
            {formatCurrency(freeMoney)}
          </div>
          <p className="text-[11px] text-muted-foreground">Após quitar contas de 30 dias</p>
        </CardContent>
      </Card>

      {/* 3. Receitas do Mês */}
      <Card>
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Receitas (Mês)</span>
            <div className="h-8 w-8 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-bold tracking-tight text-foreground">
            {formatCurrency(monthlyIncome)}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Entradas confirmadas</p>
        </CardContent>
      </Card>

      {/* 4. Despesas do Mês */}
      <Card>
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Despesas (Mês)</span>
            <div className="h-8 w-8 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-bold tracking-tight text-foreground">
            {formatCurrency(monthlyExpense)}
          </div>
          <p className="text-[11px] text-muted-foreground">Gastos liquidados</p>
        </CardContent>
      </Card>

      {/* 5. Saldo Previsto */}
      <Card>
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Previsão Fim Mês</span>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-bold tracking-tight text-foreground">
            {formatCurrency(projectedEndMonthBalance)}
          </div>
          <p className="text-[11px] text-muted-foreground">Saldo após contas pendentes</p>
        </CardContent>
      </Card>

      {/* 6. Total em Dívidas */}
      <Card className={totalDebt > 0 ? 'border-amber-500/30' : ''}>
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Dívidas Totais</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertOctagon className="h-4 w-4" />
            </div>
          </div>
          <div className="text-xl font-bold tracking-tight text-foreground">
            {formatCurrency(totalDebt)}
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Saldo devedor restante</p>
        </CardContent>
      </Card>
    </div>
  );
}
