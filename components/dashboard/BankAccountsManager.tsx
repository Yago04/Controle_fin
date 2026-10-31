'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BankLogo } from '@/components/ui/BankLogo';
import { formatCurrency } from '@/lib/utils';
import {
  Landmark,
  PlusCircle,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  Upload,
  Check,
  X,
  Smartphone,
  Wallet,
  Building2,
  Sparkles,
} from 'lucide-react';

interface AccountItem {
  id: string;
  name: string;
  bankName?: string | null;
  type: string;
  currentBalance: number;
  initialBalance: number;
  color: string;
  isActive: boolean;
}

const BANK_PRESETS = [
  { name: 'Nubank', bankName: 'Nu Pagamentos', color: '#820AD1', type: 'DIGITAL' },
  { name: 'Banco Inter', bankName: 'Banco Inter', color: '#FF7A00', type: 'DIGITAL' },
  { name: 'Itaú', bankName: 'Itaú Unibanco', color: '#003399', type: 'CHECKING' },
  { name: 'Bradesco', bankName: 'Banco Bradesco', color: '#CC092F', type: 'CHECKING' },
  { name: 'Santander', bankName: 'Banco Santander', color: '#EC0000', type: 'CHECKING' },
  { name: 'Caixa', bankName: 'Caixa Econômica', color: '#005CA9', type: 'SAVINGS' },
  { name: 'Banco do Brasil', bankName: 'Banco do Brasil', color: '#F8D117', type: 'CHECKING' },
  { name: 'C6 Bank', bankName: 'C6 Bank', color: '#18181B', type: 'DIGITAL' },
  { name: 'Carteira Física', bankName: 'Dinheiro em Mãos', color: '#059669', type: 'WALLET' },
];

export function BankAccountsManager({
  onRefresh,
  onOpenImport,
}: {
  onRefresh?: () => void;
  onOpenImport?: () => void;
}) {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideBalances, setHideBalances] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [selectedPreset, setSelectedPreset] = useState(BANK_PRESETS[0]);
  const [accountName, setAccountName] = useState('Nubank Conta Principal');
  const [accountType, setAccountType] = useState('DIGITAL');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState('#820AD1');

  // Modal de Ajuste de Saldo
  const [adjustingAccount, setAdjustingAccount] = useState<AccountItem | null>(null);
  const [newBalanceValue, setNewBalanceValue] = useState('');

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/accounts');
      const json = await res.json();
      if (json.success) {
        setAccounts(json.data || []);
      }
    } catch (e) {
      console.error('Erro ao buscar contas bancárias:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSelectPreset = (preset: (typeof BANK_PRESETS)[0]) => {
    setSelectedPreset(preset);
    setAccountName(`${preset.name} Conta`);
    setAccountType(preset.type);
    setColor(preset.color);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) return;

    try {
      setSubmitting(true);
      const initialBal = balance ? Number(balance.replace(',', '.')) : 0;

      const payload = {
        name: accountName.trim(),
        bankName: selectedPreset.bankName,
        type: accountType,
        initialBalance: initialBal,
        currentBalance: initialBal,
        color,
        isActive: true,
      };

      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        setBalance('');
        fetchAccounts();
        if (onRefresh) onRefresh();
      } else {
        alert(json.error || 'Erro ao criar conta');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão ao criar conta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingAccount || newBalanceValue === '') return;

    try {
      const res = await fetch(`/api/accounts/${adjustingAccount.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentBalance: Number(newBalanceValue.replace(',', '.')),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAdjustingAccount(null);
        setNewBalanceValue('');
        fetchAccounts();
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAccount = async (acc: AccountItem) => {
    if (!confirm(`Deseja remover a conta "${acc.name}"?`)) return;
    try {
      const res = await fetch(`/api/accounts/${acc.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchAccounts();
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.currentBalance), 0);

  return (
    <div className="space-y-4">
      {/* Banner de Contas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Minhas Contas Bancárias</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Vincule suas contas bancárias reais (Nubank, Inter, Itaú, etc.) para centralizar seus saldos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão de Privacidade */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHideBalances((prev) => !prev)}
            className="text-xs gap-1.5"
            title={hideBalances ? 'Mostrar saldos' : 'Ocultar saldos'}
          >
            {hideBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <span className="hidden sm:inline">{hideBalances ? 'Mostrar' : 'Ocultar'}</span>
          </Button>

          <Button
            onClick={() => setIsModalOpen(true)}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 shadow-sm text-xs sm:text-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Vincular Conta
          </Button>
        </div>
      </div>

      {/* Saldo Total Consolidado */}
      <Card className="border-border/80 bg-gradient-to-r from-card via-card to-primary/5">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Saldo Consolidado em Todas as Contas
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">
              {hideBalances ? '••••••••' : formatCurrency(totalBalance)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {accounts.length} {accounts.length === 1 ? 'conta ativa' : 'contas ativas'} vinculadas
            </p>
          </div>

          {onOpenImport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenImport}
              className="gap-2 border-primary/30 text-primary hover:bg-primary/10 self-start sm:self-center font-semibold text-xs"
            >
              <Upload className="h-4 w-4" /> Importar Extrato (CSV/OFX)
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Grid de Contas */}
      {accounts.length === 0 ? (
        <Card className="border-dashed border-border/80">
          <CardContent className="p-8 text-center space-y-3">
            <Building2 className="h-10 w-10 text-muted-foreground/60 mx-auto" />
            <h4 className="text-base font-bold text-foreground">
              Nenhuma conta bancária vinculada ainda.
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Adicione suas contas bancárias para poder conciliar transações e visualizar seu patrimônio real.
            </p>
            <Button onClick={() => setIsModalOpen(true)} size="sm" className="gap-1.5 mt-2">
              <PlusCircle className="h-4 w-4" /> Vincular Minha Primeira Conta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const balanceNum = Number(acc.currentBalance);
            return (
              <Card
                key={acc.id}
                className="overflow-hidden hover:border-primary/50 transition-all bg-card shadow-sm group"
              >
                {/* Linha superior colorida com a cor do banco */}
                <div className="h-1.5 w-full" style={{ backgroundColor: acc.color }} />

                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <BankLogo
                        bankName={acc.bankName}
                        accountName={acc.name}
                        color={acc.color}
                        size="md"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-foreground leading-tight">{acc.name}</h4>
                        <p className="text-xs text-muted-foreground font-medium">
                          {acc.bankName || 'Banco'} • {acc.type}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteAccount(acc)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all cursor-pointer"
                      title="Excluir conta"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Saldo da Conta */}
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                      Saldo Disponível
                    </span>
                    <span className="text-xl sm:text-2xl font-extrabold text-foreground block mt-0.5">
                      {hideBalances ? '••••••••' : formatCurrency(balanceNum)}
                    </span>
                  </div>

                  {/* Ações da Conta */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
                    <button
                      onClick={() => {
                        setAdjustingAccount(acc);
                        setNewBalanceValue(acc.currentBalance.toString());
                      }}
                      className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" /> Ajustar Saldo
                    </button>

                    {onOpenImport && (
                      <button
                        onClick={onOpenImport}
                        className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="h-3.5 w-3.5" /> Extrato
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Vincular Conta */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Vincular Conta Bancária</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              {/* Seletor de Banco */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Escolha o Banco / Instituição *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {BANK_PRESETS.map((b) => {
                    const isSelected = selectedPreset.name === b.name;
                    return (
                      <button
                        type="button"
                        key={b.name}
                        onClick={() => handleSelectPreset(b)}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary/30 bg-primary/10 shadow-sm'
                            : 'border-border/70 hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <BankLogo
                          bankName={b.bankName}
                          accountName={b.name}
                          color={b.color}
                          size="sm"
                        />
                        <span className="truncate w-full text-center text-[11px]">{b.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nome Personalizado */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Nome da Conta *</label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Ex: Nubank Conta Principal, Inter Investimentos"
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              {/* Tipo de Conta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Tipo de Conta</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground outline-none cursor-pointer"
                  >
                    <option value="DIGITAL">Conta Digital / Fintech</option>
                    <option value="CHECKING">Conta Corrente</option>
                    <option value="SAVINGS">Poupança</option>
                    <option value="INVESTMENT">Investimento / Corretora</option>
                    <option value="WALLET">Carteira / Dinheiro Físico</option>
                    <option value="OTHER">Outros</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Saldo Atual / Inicial (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    placeholder="0,00"
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting} className="font-bold">
                  {submitting ? 'Vinculando...' : 'Vincular Conta'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Ajuste de Saldo */}
      {adjustingAccount && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setAdjustingAccount(null)}
        >
          <div
            className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground">
                Ajustar Saldo: {adjustingAccount.name}
              </h3>
              <button
                onClick={() => setAdjustingAccount(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustBalance} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Novo Saldo Real (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  value={newBalanceValue}
                  onChange={(e) => setNewBalanceValue(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-base font-bold text-foreground focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAdjustingAccount(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="font-bold">
                  Atualizar Saldo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}