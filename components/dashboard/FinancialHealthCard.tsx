import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ShieldCheck, AlertTriangle, Activity, CheckCircle2 } from 'lucide-react';

interface FinancialHealthProps {
  score: number;
  status: 'CRITICA' | 'ALERTA' | 'BOA' | 'EXCELENTE';
  incomeCommitmentRate: number;
  emergencyFundMonths: number;
  insights: string[];
}

export function FinancialHealthCard({
  score,
  status,
  incomeCommitmentRate,
  emergencyFundMonths,
  insights,
}: FinancialHealthProps) {
  const getBadgeVariant = (st: string) => {
    switch (st) {
      case 'EXCELENTE':
      case 'BOA':
        return 'success';
      case 'ALERTA':
        return 'warning';
      case 'CRITICA':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getScoreColor = (sc: number) => {
    if (sc >= 80) return 'text-emerald-500';
    if (sc >= 60) return 'text-blue-600 dark:text-zinc-200';
    if (sc >= 40) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle>Saúde Financeira</CardTitle>
          </div>
          <Badge variant={getBadgeVariant(status)} className="capitalize">
            {status.toLowerCase()}
          </Badge>
        </div>
        <CardDescription>
          Diagnóstico automatizado baseado na sua renda, dívidas e reservas.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Score Display */}
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-extrabold tracking-tight ${getScoreColor(score)}`}>
            {score}
          </span>
          <span className="text-sm font-medium text-muted-foreground">/ 100 pontos</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${
              score >= 70
                ? 'bg-emerald-500'
                : score >= 50
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>

        {/* Sub-indicadores */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-lg bg-muted/40 border">
            <span className="text-[11px] text-muted-foreground block">Renda Comprometida</span>
            <span className="text-sm font-bold text-foreground">
              {incomeCommitmentRate}%
            </span>
          </div>
          <div className="p-3 rounded-lg bg-muted/40 border">
            <span className="text-[11px] text-muted-foreground block">Reserva de Emergência</span>
            <span className="text-sm font-bold text-foreground">
              {emergencyFundMonths} meses
            </span>
          </div>
        </div>

        {/* Insights list */}
        <div className="space-y-2 pt-1 border-t">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Diagnóstico do Sistema:
          </span>
          <ul className="space-y-1.5">
            {insights.slice(0, 3).map((insight, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-foreground/80">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
