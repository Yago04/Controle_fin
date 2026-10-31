'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  X,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Sparkles,
  Zap,
  CreditCard,
  Banknote,
  FileText,
  User,
} from 'lucide-react';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Array<{ id: string; name: string }>;
  onSuccess: () => void;
}

export function NewTransactionModal({
  isOpen,
  onClose,
  accounts,
  onSuccess,
}: NewTransactionModalProps) {
  const [type, setType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>('EXPENSE');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [notes, setNotes] = useState('');
  const [isPerson, setIsPerson] = useState(false);
  const [personName, setPersonName] = useState('');
  const [categories, setCategories] = useState<Array<{ id: string; name: string; type: string; color: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [autoDetected, setAutoDetected] = useState<string | null>(null);

  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/categories')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setCategories(data.data);
            const defaultCat = data.data.find(
              (c: any) => c.type === (type === 'TRANSFER' ? 'TRANSFER' : type)
            );
            if (defaultCat) setCategoryId(defaultCat.id);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, type]);

  // Inteligência de Detecção Rápida ao Digitar
  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    const lower = text.toLowerCase();

    // Auto-detecta categorias comuns
    if (lower.includes('ifood') || lower.includes('mercado') || lower.includes('almoço') || lower.includes('lanche') || lower.includes('pizza') || lower.includes('restaurante')) {
      const cat = categories.find((c) => c.name.toLowerCase().includes('alimentação'));
      if (cat) {
        setCategoryId(cat.id);
        setAutoDetected(cat.name);
        if (type !== 'EXPENSE') setType('EXPENSE');
      }
    } else if (lower.includes('uber') || lower.includes('posto') || lower.includes('gasolina') || lower.includes('combustivel') || lower.includes('onibus') || lower.includes('estacionamento')) {
      const cat = categories.find((c) => c.name.toLowerCase().includes('transporte'));
      if (cat) {
        setCategoryId(cat.id);
        setAutoDetected(cat.name);
        if (type !== 'EXPENSE') setType('EXPENSE');
      }
    } else if (lower.includes('netflix') || lower.includes('spotify') || lower.includes('amazon') || lower.includes('assinatura') || lower.includes('youtube')) {
      const cat = categories.find((c) => c.name.toLowerCase().includes('assinaturas') || c.name.toLowerCase().includes('lazer'));
      if (cat) {
        setCategoryId(cat.id);
        setAutoDetected(cat.name);
        if (type !== 'EXPENSE') setType('EXPENSE');
      }
    } else if (lower.includes('salario') || lower.includes('salário') || lower.includes('freela') || lower.includes('renda')) {
      const cat = categories.find((c) => c.name.toLowerCase().includes('salário'));
      if (cat) {
        setCategoryId(cat.id);
        setAutoDetected(cat.name);
        setType('INCOME');
      }
    } else {
      setAutoDetected(null);
    }
  };

  // Botões rápidos de soma de valor
  const addQuickAmount = (val: number) => {
    const current = parseFloat(amount.replace(',', '.')) || 0;
    const nextVal = (current + val).toFixed(2);
    setAmount(nextVal);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (!description.trim() || isNaN(numAmount) || numAmount <= 0) {
      alert('Por favor, informe uma descrição e um valor positivo.');
      return;
    }

    if (!accountId) {
      alert('Selecione uma conta bancária.');
      return;
    }

    if (type === 'TRANSFER' && !destinationAccountId) {
      alert('Para transferência, selecione a conta de destino.');
      return;
    }

    try {
      setSubmitting(true);
      const finalNotes = isPerson && personName.trim()
        ? `[Pessoa: ${personName.trim()}] ${notes.trim()}`.trim()
        : notes.trim();

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          destinationAccountId: type === 'TRANSFER' ? destinationAccountId : null,
          categoryId: categoryId || null,
          description: description.trim(),
          amount: numAmount,
          type,
          status: 'COMPLETED',
          date: new Date(date).toISOString(),
          paymentMethod,
          notes: finalNotes || null,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        setDescription('');
        setAmount('');
        setNotes('');
        setIsPerson(false);
        setPersonName('');
        setAutoDetected(null);
        onSuccess();
        onClose();
      } else {
        alert(resData.error || 'Erro ao registrar transação');
      }
    } catch (err: any) {
      alert('Falha na comunicação: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (type === 'INCOME') return c.type === 'INCOME';
    if (type === 'EXPENSE') return c.type === 'EXPENSE';
    return true;
  });

  const paymentMethods = [
    { id: 'PIX', label: 'PIX', icon: Zap },
    { id: 'Cartão de Débito', label: 'Débito', icon: CreditCard },
    { id: 'Cartão de Crédito', label: 'Crédito', icon: CreditCard },
    { id: 'Dinheiro', label: 'Dinheiro', icon: Banknote },
    { id: 'Boleto', label: 'Boleto', icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <Card className="w-full max-w-lg bg-card border-border shadow-2xl rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b px-5 pt-4">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2 font-bold">
            <PlusCircle className="h-5 w-5 text-emerald-500" />
            Lançar Movimentação
          </CardTitle>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <CardContent className="p-5 space-y-4">
            {/* 1. Tipo de Movimentação */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/80 rounded-xl">
              <button
                type="button"
                onClick={() => setType('EXPENSE')}
                className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-all ${
                  type === 'EXPENSE'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ArrowDownLeft className="h-4 w-4" />
                Despesa
              </button>

              <button
                type="button"
                onClick={() => setType('INCOME')}
                className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-all ${
                  type === 'INCOME'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ArrowUpRight className="h-4 w-4" />
                Receita
              </button>

              <button
                type="button"
                onClick={() => setType('TRANSFER')}
                className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-all ${
                  type === 'TRANSFER'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ArrowLeftRight className="h-4 w-4" />
                Transferir
              </button>
            </div>

            {/* 2. Campo de Valor com Destaque Gigante */}
            <div className="text-center py-2 px-3 bg-muted/30 border border-border/60 rounded-2xl">
              <span className="text-xs text-muted-foreground font-semibold">Valor da Movimentação</span>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="text-xl sm:text-2xl font-bold text-muted-foreground">R$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-48 text-center text-3xl sm:text-4xl font-extrabold tracking-tight bg-transparent text-foreground outline-none placeholder:text-muted-foreground/30 focus:border-b-2 focus:border-primary pb-1"
                  autoFocus
                />
              </div>

              {/* Botões Rápidos de Acréscimo (+10, +20, +50, +100) */}
              <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
                {[10, 20, 50, 100, 200].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => addQuickAmount(val)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-card hover:bg-muted border border-border/80 text-foreground active:scale-95 transition-all"
                  >
                    +{val}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAmount('')}
                  className="px-2 py-1 text-[11px] font-medium rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                >
                  Limpar
                </button>
              </div>
            </div>

            {/* 3. Descrição com Auto-Detecção */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-foreground">
                  Descrição:
                </label>
                {autoDetected && (
                  <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Sugerido: {autoDetected}
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                placeholder={
                  type === 'EXPENSE'
                    ? 'Ex: iFood, Padaria, Uber, Mercado'
                    : type === 'INCOME'
                    ? 'Ex: Salário, PIX recebido, Venda'
                    : 'Ex: Transferência Nubank p/ Inter'
                }
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary shadow-sm"
              />
            </div>

            {/* 4. Seleção de Contas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  {type === 'TRANSFER' ? 'Conta de Origem:' : 'Conta:'}
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border bg-background text-foreground text-sm"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              {type === 'TRANSFER' ? (
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Conta de Destino:
                  </label>
                  <select
                    value={destinationAccountId}
                    onChange={(e) => setDestinationAccountId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border bg-background text-foreground text-sm"
                  >
                    <option value="">Selecione...</option>
                    {accounts
                      .filter((acc) => acc.id !== accountId)
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Data:
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border bg-background text-foreground text-sm"
                  />
                </div>
              )}
            </div>

            {/* 5. Seletor Visual de Categorias (Pílulas Rápidas) */}
            {type !== 'TRANSFER' && (
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Categoria:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 border rounded-xl bg-muted/20">
                  {filteredCategories.map((c) => {
                    const isSelected = categoryId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategoryId(c.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-primary text-primary-foreground shadow-sm scale-105 font-bold'
                            : 'bg-card text-muted-foreground hover:text-foreground border border-border/60'
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 6. Formas de Pagamento Rápidas */}
            <div>
              <label className="text-xs font-semibold text-foreground mb-1.5 block">
                Forma de Pagamento:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {paymentMethods.map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all ${
                        isSelected
                          ? 'bg-primary/10 border-2 border-primary text-primary font-bold'
                          : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4 mb-0.5" />
                      <span className="text-[10px] truncate w-full">{pm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 7. Opção de Destinatário / Pessoa Física */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border/70 space-y-2">
              <div className="flex items-center justify-between">
                <label
                  onClick={() => setIsPerson(!isPerson)}
                  className="text-xs font-semibold text-foreground flex items-center gap-1.5 cursor-pointer select-none"
                >
                  <User className="h-4 w-4 text-purple-500" />
                  {type === 'INCOME' ? 'Recebido de Pessoa Física' : 'Pagamento para Pessoa Física / Contato'}
                </label>
                <button
                  type="button"
                  onClick={() => setIsPerson(!isPerson)}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                    isPerson
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  {isPerson ? 'Ativo ✓' : '+ Adicionar Pessoa'}
                </button>
              </div>

              {isPerson && (
                <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                  <input
                    type="text"
                    placeholder="Nome da pessoa (ex: Carlos Barbeiro, Mãe, João Silva)"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary outline-none"
                    autoFocus
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['Mãe', 'Pai', 'Amigo', 'Personal Trainer', 'Barbeiro', 'Prestador'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setPersonName(tag)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-card border border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground font-medium"
                      >
                        +{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Botão de Envio Grande */}
            <Button
              type="submit"
              disabled={submitting}
              className={`w-full h-12 text-sm font-bold shadow-lg mt-2 ${
                type === 'EXPENSE'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
                  : type === 'INCOME'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20'
              }`}
            >
              {submitting
                ? 'Gravando movimentação...'
                : type === 'EXPENSE'
                ? 'Confirmar Despesa'
                : type === 'INCOME'
                ? 'Confirmar Receita'
                : 'Confirmar Transferência'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
