'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BankLogo } from '@/components/ui/BankLogo';
import { formatCurrency } from '@/lib/utils';
import {
  CreditCard,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Landmark,
  Percent,
  Calendar,
  Trash2,
  Check,
  X,
  FileText,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  TrendingDown,
} from 'lucide-react';

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
  status: 'ACTIVE' | 'NEGOTIATED' | 'OVERDUE' | 'PAID';
  dueDate?: string | null;
  notes?: string | null;
  type: string;
}

const BANK_PRESETS = [
  { name: 'Nubank', color: '#820AD1' },
  { name: 'Banco Inter', color: '#FF7A00' },
  { name: 'Itaú', color: '#003399' },
  { name: 'Bradesco', color: '#CC092F' },
  { name: 'Santander', color: '#EC0000' },
  { name: 'Caixa Econômica', color: '#005CA9' },
  { name: 'Banco do Brasil', color: '#F8D117' },
  { name: 'C6 Bank', color: '#18181B' },
  { name: 'Outro / Credor', color: '#64748B' },
];

export function DebtsManager({ onRefresh }: { onRefresh?: () => void }) {
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'NEGOTIATED' | 'OVERDUE' | 'PAID'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Campos do formulário
  const [description, setDescription] = useState('');
  const [bankName, setBankName] = useState('Nubank');
  const [debtType, setDebtType] = useState('LOAN');
  const [status, setStatus] = useState<'ACTIVE' | 'NEGOTIATED' | 'OVERDUE' | 'PAID'>('ACTIVE');
  const [totalAmount, setTotalAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('');
  const [paidInstallments, setPaidInstallments] = useState('0');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const fetchDebts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/debts');
      const json = await res.json();
      if (json.success) {
        setDebts(json.data || []);
      }
    } catch (e) {
      console.error('Erro ao buscar dívidas:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !totalAmount) return;

    try {
      setSubmitting(true);
      const original = Number(totalAmount.replace(',', '.'));
      const remaining = remainingAmount ? Number(remainingAmount.replace(',', '.')) : original;
      const totalInst = totalInstallments ? parseInt(totalInstallments) : 1;
      const paidInst = paidInstallments ? parseInt(paidInstallments) : 0;
      const instAmount = installmentAmount
        ? Number(installmentAmount.replace(',', '.'))
        : totalInst > 0
        ? original / totalInst
        : original;

      const payload = {
        description: description.trim(),
        bankName,
        creditor: bankName,
        type: debtType,
        status,
        originalAmount: original,
        currentBalance: remaining,
        interestRateMonthly: interestRate ? Number(interestRate.replace(',', '.')) : 0,
        totalInstallments: totalInst,
        paidInstallmentsCount: paidInst,
        installmentAmount: instAmount,
        dueDate: dueDate || null,
        notes: notes.trim() || null,
      };

      const res = await fetch('/api/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        resetForm();
        fetchDebts();
        if (onRefresh) onRefresh();
      } else {
        alert(json.error || 'Erro ao cadastrar dívida');
      }
    } catch (err: any) {
      console.error(err);
      alert('Erro de conexão ao salvar dívida');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayInstallment = async (debt: DebtItem) => {
    if (debt.currentBalance <= 0 || debt.status === 'PAID') return;

    const nextPaid = debt.paidInstallmentsCount + 1;
    const nextBalance = Math.max(0, debt.currentBalance - debt.installmentAmount);
    const nextStatus = nextBalance === 0 ? 'PAID' : debt.status;

    try {
      const res = await fetch(`/api/debts/${debt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paidInstallmentsCount: nextPaid,
          currentBalance: nextBalance,
          status: nextStatus,
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchDebts();
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAsPaid = async (debt: DebtItem) => {
    try {
      const res = await fetch(`/api/debts/${debt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAID',
          currentBalance: 0,
          paidInstallmentsCount: debt.totalInstallments,
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchDebts();
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDebt = async (id: string, name: string) => {
    if (!confirm(`Deseja excluir a dívida "${name}"?`)) return;
    try {
      const res = await fetch(`/api/debts/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchDebts();
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setDescription('');
    setBankName('Nubank');
    setDebtType('LOAN');
    setStatus('ACTIVE');
    setTotalAmount('');
    setRemainingAmount('');
    setInterestRate('');
    setTotalInstallments('');
    setPaidInstallments('0');
    setInstallmentAmount('');
    setDueDate('');
    setNotes('');
  };

  // Métricas
  const totalDebt = debts
    .filter((d) => d.status !== 'PAID')
    .reduce((sum, d) => sum + Number(d.currentBalance), 0);

  const totalMonthly = debts
    .filter((d) => d.status !== 'PAID')
    .reduce((sum, d) => sum + Number(d.installmentAmount), 0);

  const activeCount = debts.filter((d) => d.status === 'ACTIVE').length;
  const negotiatedCount = debts.filter((d) => d.status === 'NEGOTIATED').length;
  const overdueCount = debts.filter((d) => d.status === 'OVERDUE').length;
  const paidCount = debts.filter((d) => d.status === 'PAID').length;

  const filteredDebts = debts.filter((d) => {
    if (statusFilter === 'ALL') return true;
    return d.status === statusFilter;
  });

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'ACTIVE':
        return (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Em Dia
          </span>
        );
      case 'NEGOTIATED':
        return (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> Negociada / Acordo
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1 animate-pulse">
            <AlertCircle className="h-3 w-3" /> Atrasada
          </span>
        );
      case 'PAID':
        return (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border flex items-center gap-1">
            <Check className="h-3 w-3 text-emerald-500" /> Quitada
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner de Dívidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Gestão de Dívidas & Financiamentos</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Acompanhe o saldo devedor real, parcelas pagas, banco credor e status de renegociação.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 shadow-sm text-xs sm:text-sm self-start sm:self-center"
        >
          <PlusCircle className="h-4 w-4" />
          Adicionar Dívida
        </Button>
      </div>

      {/* 3 Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-rose-500/20 bg-rose-500/5">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4" /> Saldo Devedor Consolidado
            </span>
            <p className="text-2xl font-extrabold text-foreground">{formatCurrency(totalDebt)}</p>
            <p className="text-[11px] text-muted-foreground">
              {activeCount + negotiatedCount + overdueCount} pendências ativas
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> Impacto Mensal em Parcelas
            </span>
            <p className="text-2xl font-extrabold text-foreground">{formatCurrency(totalMonthly)}</p>
            <p className="text-[11px] text-muted-foreground">Compromisso recorrente todo mês</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Dívidas Quitadas
            </span>
            <p className="text-2xl font-extrabold text-foreground">{paidCount}</p>
            <p className="text-[11px] text-muted-foreground">Contratos 100% liquidados 🎉</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros de Status */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/60 text-muted-foreground hover:text-foreground'
          }`}
        >
          Todas ({debts.length})
        </button>
        <button
          onClick={() => setStatusFilter('ACTIVE')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'ACTIVE'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-muted/60 text-muted-foreground hover:text-foreground'
          }`}
        >
          Em Dia ({activeCount})
        </button>
        <button
          onClick={() => setStatusFilter('NEGOTIATED')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'NEGOTIATED'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-muted/60 text-muted-foreground hover:text-foreground'
          }`}
        >
          Negociadas ({negotiatedCount})
        </button>
        <button
          onClick={() => setStatusFilter('OVERDUE')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'OVERDUE'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-muted/60 text-muted-foreground hover:text-foreground'
          }`}
        >
          Atrasadas ({overdueCount})
        </button>
        <button
          onClick={() => setStatusFilter('PAID')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            statusFilter === 'PAID'
              ? 'bg-muted text-foreground border border-border shadow-sm'
              : 'bg-muted/60 text-muted-foreground hover:text-foreground'
          }`}
        >
          Quitadas ({paidCount})
        </button>
      </div>

      {/* Lista de Dívidas */}
      {filteredDebts.length === 0 ? (
        <Card className="border-dashed border-border/80">
          <CardContent className="p-8 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-emerald-500/70 mx-auto" />
            <h4 className="text-base font-bold text-foreground">
              {statusFilter === 'ALL'
                ? 'Nenhuma dívida cadastrada no momento.'
                : 'Nenhuma dívida encontrada com este status.'}
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Cadastre empréstimos, cartões parcelados ou financiamentos para acompanhar o plano de
              liquidação.
            </p>
            <Button onClick={() => setIsModalOpen(true)} size="sm" className="gap-1.5 mt-2">
              <PlusCircle className="h-4 w-4" /> Adicionar Minha Primeira Dívida
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDebts.map((debt) => {
            const isPaid = debt.status === 'PAID';
            const pctPaid =
              debt.totalInstallments > 0
                ? Math.min(
                    100,
                    Math.round((debt.paidInstallmentsCount / debt.totalInstallments) * 100)
                  )
                : 0;

            const bankInfo = BANK_PRESETS.find(
              (b) => b.name.toLowerCase() === (debt.creditor || '').toLowerCase()
            ) || { name: debt.creditor, color: '#64748B' };

            return (
              <Card
                key={debt.id}
                className={`transition-all hover:border-primary/50 ${
                  isPaid ? 'opacity-70 bg-card/60' : 'bg-card'
                }`}
              >
                <CardContent className="p-5 space-y-4">
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <BankLogo
                        bankName={debt.creditor}
                        accountName={debt.description}
                        color={bankInfo.color}
                        size="md"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-foreground leading-tight">
                          {debt.description}
                        </h4>
                        <p className="text-xs text-muted-foreground font-medium">
                          {debt.creditor} • {debt.type}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(debt.status)}
                      <button
                        onClick={() => handleDeleteDebt(debt.id, debt.description)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                        title="Excluir dívida"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Valores & Saldo Devedor */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-xl bg-muted/30 border border-border/60 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                        Saldo Devedor
                      </span>
                      <span className="text-sm font-extrabold text-rose-500">
                        {formatCurrency(debt.currentBalance)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                        Valor da Parcela
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {formatCurrency(debt.installmentAmount)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                        Taxa de Juros
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {debt.interestRateMonthly}% a.m.
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso de Parcelas */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">
                        Parcelas: {debt.paidInstallmentsCount} de {debt.totalInstallments}
                      </span>
                      <span className="font-extrabold text-foreground">{pctPaid}% pago</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${pctPaid}%` }}
                      />
                    </div>
                  </div>

                  {/* Observações / Notas */}
                  {debt.notes && (
                    <div className="p-2.5 rounded-lg bg-muted/20 border border-border/40 text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{debt.notes}</span>
                    </div>
                  )}

                  {/* Ações de Pagamento */}
                  {!isPaid && (
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => handlePayInstallment(debt)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5" /> Pagar 1 Parcela (
                        {formatCurrency(debt.installmentAmount)})
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsPaid(debt)}
                        className="text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-semibold"
                      >
                        Quitar Tudo
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Adicionar Dívida */}
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
                <CreditCard className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Cadastrar Nova Dívida / Acordo</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDebt} className="space-y-4">
              {/* Descrição */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Nome da Dívida *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Empréstimo Automóvel, Cartão Nubank Parcelado"
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              {/* Banco / Credor */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Banco / Instituição *</label>
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                  {BANK_PRESETS.map((b) => (
                    <button
                      type="button"
                      key={b.name}
                      onClick={() => setBankName(b.name)}
                      className={`p-2 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                        bankName === b.name
                          ? 'border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary'
                          : 'border-border/70 hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <BankLogo bankName={b.name} color={b.color} size="sm" />
                      <span className="truncate text-[11px] font-bold">{b.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo e Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Tipo de Dívida</label>
                  <select
                    value={debtType}
                    onChange={(e) => setDebtType(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground outline-none cursor-pointer"
                  >
                    <option value="LOAN">Empréstimo</option>
                    <option value="CREDIT_CARD">Cartão de Crédito</option>
                    <option value="FINANCING">Financiamento</option>
                    <option value="PERSONAL">Pessoal / Familiar</option>
                    <option value="SETTLEMENT">Acordo / Renegociação</option>
                    <option value="OVERDUE_BILL">Conta Atrasada</option>
                    <option value="OTHER">Outros</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Status Atual *</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground outline-none cursor-pointer"
                  >
                    <option value="ACTIVE">🟢 Em Dia</option>
                    <option value="NEGOTIATED">🟡 Negociada / Acordo</option>
                    <option value="OVERDUE">🔴 Atrasada</option>
                    <option value="PAID">⚪ Quitada</option>
                  </select>
                </div>
              </div>

              {/* Valores */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Valor Total Original *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="R$ 0,00"
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Saldo Devedor Atual</label>
                  <input
                    type="number"
                    step="0.01"
                    value={remainingAmount}
                    onChange={(e) => setRemainingAmount(e.target.value)}
                    placeholder="Deixe vazio se for igual ao total"
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Taxa Juros (% a.m.)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    placeholder="Ex: 2.5"
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              {/* Parcelas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Total de Parcelas</label>
                  <input
                    type="number"
                    min="1"
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value)}
                    placeholder="Ex: 24"
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Parcelas Já Pagas</label>
                  <input
                    type="number"
                    min="0"
                    value={paidInstallments}
                    onChange={(e) => setPaidInstallments(e.target.value)}
                    placeholder="Ex: 6"
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Valor da Parcela (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={installmentAmount}
                    onChange={(e) => setInstallmentAmount(e.target.value)}
                    placeholder="Calculado automático"
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              {/* Observações / Informações */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Informações / Observações (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Contrato nº 849204, renegociado com 30% de desconto se quitar até o final do ano."
                  className="w-full p-3 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              {/* Botões do Rodapé */}
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
                  {submitting ? 'Salvando...' : 'Salvar Dívida'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}