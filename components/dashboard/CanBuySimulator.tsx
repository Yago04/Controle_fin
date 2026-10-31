'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { Calculator, CheckCircle2, AlertTriangle, XCircle, Sparkles } from 'lucide-react';

export function CanBuySimulator({
  freeMoney,
  monthlyIncome,
}: {
  freeMoney: number;
  monthlyIncome: number;
}) {
  const [amount, setAmount] = useState<string>('');
  const [installments, setInstallments] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    const purchaseAmount = parseFloat(amount);
    if (isNaN(purchaseAmount) || purchaseAmount <= 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/financial/can-buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseAmount, installments }),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <CardTitle>Simulador: &quot;Posso Comprar?&quot;</CardTitle>
        </div>
        <CardDescription>
          Descubra se uma nova compra cabe no seu bolso sem comprometer suas contas.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSimulate} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Valor da Compra (R$)"
                type="number"
                step="0.01"
                placeholder="Ex: 850,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium leading-none text-foreground block mb-1.5">
                Parcelas
              </label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={installments}
                onChange={(e) => setInstallments(Number(e.target.value))}
              >
                <option value={1}>À vista (1x)</option>
                <option value={2}>2x</option>
                <option value={3}>3x</option>
                <option value={6}>6x</option>
                <option value={10}>10x</option>
                <option value={12}>12x</option>
              </select>
            </div>
          </div>

          <Button type="submit" isLoading={loading} className="w-full gap-2">
            <Sparkles className="h-4 w-4" />
            Analisar Viabilidade Financeira
          </Button>
        </form>

        {/* Resultado da Simulação */}
        {result && (
          <div
            className={`p-4 rounded-xl border space-y-3 transition-all ${
              result.alertLevel === 'SAFE'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : result.alertLevel === 'WARNING'
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-rose-500/10 border-rose-500/30'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {result.alertLevel === 'SAFE' && (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
              )}
              {result.alertLevel === 'WARNING' && (
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              )}
              {result.alertLevel === 'DANGEROUS' && (
                <XCircle className="h-5 w-5 text-rose-500 mt-0.5 shrink-0" />
              )}
              <div>
                <h4 className="text-sm font-bold text-foreground">{result.message}</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                  <span>
                    Dinheiro livre após compra:{' '}
                    <strong className="text-foreground">
                      {formatCurrency(result.projectedFreeMoney)}
                    </strong>
                  </span>
                  <span>
                    Comprometimento da renda:{' '}
                    <strong className="text-foreground">
                      {result.newCommitmentPercentage}%
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {result.reasons && result.reasons.length > 0 && (
              <ul className="text-xs text-foreground/80 space-y-1 pt-1 border-t border-border/40">
                {result.reasons.map((r: string, i: number) => (
                  <li key={i}>• {r}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
