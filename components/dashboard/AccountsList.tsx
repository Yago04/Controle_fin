import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import { Wallet, Landmark, Smartphone, Banknote } from 'lucide-react';

interface AccountItem {
  id: string;
  name: string;
  bankName?: string | null;
  type: string;
  currentBalance: number;
  color: string;
}

export function AccountsList({ accounts }: { accounts: AccountItem[] }) {
  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'CHECKING':
        return Landmark;
      case 'DIGITAL':
        return Smartphone;
      case 'WALLET':
        return Banknote;
      default:
        return Wallet;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark className="h-5 w-5 text-primary" />
          <CardTitle>Minhas Contas</CardTitle>
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {accounts.length} contas
        </span>
      </CardHeader>

      <CardContent className="space-y-3">
        {accounts.map((acc) => {
          const Icon = getAccountIcon(acc.type);
          return (
            <div
              key={acc.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: acc.color }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground leading-tight">
                    {acc.name}
                  </h4>
                  <span className="text-[11px] text-muted-foreground">
                    {acc.bankName || 'Carteira'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm font-bold text-foreground block">
                  {formatCurrency(acc.currentBalance)}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Ativa
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
