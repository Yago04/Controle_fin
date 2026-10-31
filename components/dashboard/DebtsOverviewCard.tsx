'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle, Flame, Snowflake, CheckCircle } from 'lucide-react';

interface DebtItem {
  id: string;
  creditor: string;
  description: string;
  originalAmount: number;
  currentBalance: number;
  interestRateMonthly: number;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallmentsCount: number;
  status: string;
}

interface StrategyInfo {
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

export function DebtsOverviewCard({
  debts,
  avalancheStrategy,
  snowballStrategy,
}: {
  debts: DebtItem[];
  avalancheStrategy?: StrategyInfo;
  snowballStrategy?: StrategyInfo;
}) {
  const [activeTab, setActiveTab] = useState<'LIST' | 'AVALANCHE' | 'SNOWBALL'>('LIST');

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <CardTitle>Central de Dívidas & Estratégias</CardTitle>
          </div>
          <CardDescription>
            Controle de parcelamentos e plano inteligente para zerar pendências.
          </CardDescription>
        </div>

        {/* Strategy Switcher */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('LIST')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'LIST'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Dívidas
          </button>
          <button
            onClick={() => setActiveTab('AVALANCHE')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
              activeTab === 'AVALANCHE'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Flame className="h-3 w-3 text-amber-500" />
            Avalanche
          </button>
          <button
            onClick={() => setActiveTab('SNOWBALL')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
              activeTab === 'SNOWBALL'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Snowflake className="h-3 w-3 text-blue-600 dark:text-zinc-300" />
            Bola de Neve
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {activeTab === 'LIST' && (
          <div className="space-y-3">
            {debts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Parabéns! Nenhuma dívida ativa no momento.
              </p>
            ) : (
              debts.map((debt) => {
                const progress = Math.round(
                  (debt.paidInstallmentsCount / debt.totalInstallments) * 100
                );
                return (
                  <div
                    key={debt.id}
                    className="p-3 rounded-lg border bg-card/50 space-y-2 hover:border-border/80 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">
                          {debt.description}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {debt.creditor} • Juros: {debt.interestRateMonthly}% a.m.
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-foreground block">
                          {formatCurrency(debt.currentBalance)}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {debt.paidInstallmentsCount}/{debt.totalInstallments} parcelas de{' '}
                          {formatCurrency(debt.installmentAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>Progresso de Quitação</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-1.5 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'AVALANCHE' && avalancheStrategy && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
              <div className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Flame className="h-4 w-4" />
                Estratégia Avalanche (Foco em Juros Altos)
              </div>
              <p className="text-muted-foreground">
                Prioriza quitar as dívidas mais caras primeiro. Matematicamente, é a opção que mais
                economiza dinheiro ao longo do tempo.
              </p>
              <div className="pt-2 flex gap-4 text-foreground font-medium">
                <span>Tempo Estimado: <strong>{avalancheStrategy.estimatedMonths} meses</strong></span>
                <span>Juros Projetados: <strong>{formatCurrency(avalancheStrategy.totalInterestEstimated)}</strong></span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Ordem Recomendada de Pagamento:
              </span>
              {avalancheStrategy.order.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg border bg-muted/20 flex items-center gap-3 text-xs"
                >
                  <span className="h-6 w-6 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    {item.priorityOrder}º
                  </span>
                  <div>
                    <span className="font-semibold text-foreground block">{item.description}</span>
                    <span className="text-muted-foreground">{item.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'SNOWBALL' && snowballStrategy && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-blue-500/10 border border-blue-500/20 dark:bg-zinc-800/70 dark:border-zinc-700 text-xs space-y-1">
              <div className="font-semibold text-blue-600 dark:text-zinc-200 flex items-center gap-1.5">
                <Snowflake className="h-4 w-4" />
                Estratégia Bola de Neve (Foco em Saldos Menores)
              </div>
              <p className="text-muted-foreground">
                Prioriza eliminar as contas menores primeiro. Gera vitórias psicológicas rápidas e
                diminui o número total de credores no curto prazo.
              </p>
              <div className="pt-2 flex gap-4 text-foreground font-medium">
                <span>Tempo Estimado: <strong>{snowballStrategy.estimatedMonths} meses</strong></span>
                <span>Juros Projetados: <strong>{formatCurrency(snowballStrategy.totalInterestEstimated)}</strong></span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Ordem Recomendada de Pagamento:
              </span>
              {snowballStrategy.order.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg border bg-muted/20 flex items-center gap-3 text-xs"
                >
                  <span className="h-6 w-6 rounded-full bg-blue-600 dark:bg-zinc-700 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    {item.priorityOrder}º
                  </span>
                  <div>
                    <span className="font-semibold text-foreground block">{item.description}</span>
                    <span className="text-muted-foreground">{item.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
