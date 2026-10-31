'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Trash2,
  Filter,
  User,
} from 'lucide-react';

interface TransactionItem {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  date: string | Date;
  accountName: string;
  categoryName: string;
  categoryColor: string;
  notes?: string | null;
}

export function RecentTransactionsTable({
  transactions,
  onRefresh,
}: {
  transactions: TransactionItem[];
  onRefresh?: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'PEOPLE'>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getPersonFromNotes = (notes?: string | null): string | null => {
    if (!notes) return null;
    const match = notes.match(/\[Pessoa:\s*([^\]]+)\]/i) || notes.match(/Pessoa:\s*([^,\n]+)/i);
    return match ? match[1].trim() : null;
  };

  const filteredTransactions = transactions.filter((t) => {
    const person = getPersonFromNotes(t.notes);
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person && person.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    if (selectedType === 'PEOPLE') {
      return matchesSearch && Boolean(person);
    }

    const matchesType = selectedType === 'ALL' || t.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (id: string, description: string) => {
    if (!confirm(`Deseja realmente excluir a transação "${description}"?\nO saldo da conta será estornado automaticamente.`)) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || 'Erro ao excluir transação');
      }
    } catch (e: any) {
      alert('Falha na comunicação: ' + e.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-base sm:text-lg">Extrato de Transações</CardTitle>
            <p className="text-xs text-muted-foreground">
              Histórico com busca em tempo real e estorno automático
            </p>
          </div>
        </div>

        {/* Filtros de Tipo */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl text-xs">
          <button
            onClick={() => setSelectedType('ALL')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              selectedType === 'ALL'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setSelectedType('EXPENSE')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              selectedType === 'EXPENSE'
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Gastos
          </button>
          <button
            onClick={() => setSelectedType('INCOME')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              selectedType === 'INCOME'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Receitas
          </button>
          <button
            onClick={() => setSelectedType('PEOPLE')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              selectedType === 'PEOPLE'
                ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Pessoas 👤
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Barra de Busca Rápida */}
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por descrição, categoria ou conta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary"
          />
        </div>

        {filteredTransactions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Nenhuma transação encontrada com os filtros selecionados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground uppercase font-semibold">
                  <th className="pb-3 font-medium">Descrição</th>
                  <th className="pb-3 font-medium">Categoria</th>
                  <th className="pb-3 font-medium hidden sm:table-cell">Conta</th>
                  <th className="pb-3 font-medium">Data</th>
                  <th className="pb-3 font-medium text-right">Valor</th>
                  <th className="pb-3 font-medium text-center w-12">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredTransactions.map((t) => {
                  const isIncome = t.type === 'INCOME';
                  const isTransfer = t.type === 'TRANSFER';
                  const person = getPersonFromNotes(t.notes);
                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-muted/40 transition-colors group"
                    >
                      <td className="py-3 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                              isIncome
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : isTransfer
                                ? 'bg-blue-500/10 text-blue-600 dark:bg-zinc-800 dark:text-zinc-300'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {isIncome ? (
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            ) : isTransfer ? (
                              <ArrowLeftRight className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowDownLeft className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="truncate font-semibold text-xs sm:text-sm">
                                {t.description}
                              </span>
                              {person && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-500/15 text-purple-400 border border-purple-500/30 text-[10px] font-bold shrink-0">
                                  <User className="h-3 w-3" /> {person}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground sm:hidden block">
                              {t.accountName}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                          style={{
                            backgroundColor: `${t.categoryColor}20`,
                            color: t.categoryColor,
                          }}
                        >
                          {t.categoryName}
                        </span>
                      </td>

                      <td className="py-3 text-muted-foreground text-xs hidden sm:table-cell">
                        {t.accountName}
                      </td>

                      <td className="py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {formatDate(t.date)}
                      </td>

                      <td
                        className={`py-3 text-right font-extrabold text-xs sm:text-sm whitespace-nowrap ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isTransfer
                            ? 'text-blue-600 dark:text-zinc-300'
                            : 'text-foreground'
                        }`}
                      >
                        {isIncome ? '+' : '-'} {formatCurrency(t.amount)}
                      </td>

                      {/* Botão de Excluir / Estornar */}
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleDelete(t.id, t.description)}
                          disabled={deletingId === t.id}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Excluir movimentação e estornar saldo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
