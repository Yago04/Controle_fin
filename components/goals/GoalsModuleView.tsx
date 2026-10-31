'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Target,
  Plus,
  CheckCircle2,
  Calendar,
  Clock,
  TrendingUp,
  Sparkles,
  Trophy,
  Trash2,
  Edit2,
  PlusCircle,
  AlertCircle,
  DollarSign,
  Briefcase,
  Heart,
  Compass,
  Layers,
  ChevronRight,
  X,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

export interface GoalItem {
  id: string;
  title: string;
  description?: string | null;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string | null;
  horizon: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
  category: 'FINANCIAL' | 'CAREER' | 'HEALTH' | 'PERSONAL' | 'OTHER';
  color: string;
  isCompleted: boolean;
  completedAt?: string | null;
  createdAt: string;
  percentage: number;
  daysRemaining?: number | null;
}

interface GoalsSummary {
  totalGoals: number;
  totalCompleted: number;
  activeGoals: number;
  totalTargetAmount: number;
  totalCurrentAmount: number;
  overallProgress: number;
  shortTermCount: number;
  mediumTermCount: number;
  longTermCount: number;
}

export function GoalsModuleView() {
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [summary, setSummary] = useState<GoalsSummary | null>(null);
  const [selectedHorizon, setSelectedHorizon] = useState<string>('ALL'); // ALL, SHORT_TERM, MEDIUM_TERM, LONG_TERM, COMPLETED
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modais
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalItem | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTargetAmount, setFormTargetAmount] = useState<string>('');
  const [formCurrentAmount, setFormCurrentAmount] = useState<string>('');
  const [formTargetDate, setFormTargetDate] = useState<string>('');
  const [formHorizon, setFormHorizon] = useState<'AUTO' | 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM'>('AUTO');
  const [formCategory, setFormCategory] = useState<'FINANCIAL' | 'CAREER' | 'HEALTH' | 'PERSONAL' | 'OTHER'>('FINANCIAL');
  const [formColor, setFormColor] = useState('#10b981');
  const [formDepositAmount, setFormDepositAmount] = useState<string>('100');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/goals');
      const json = await res.json();
      if (json.success && json.data) {
        setGoals(json.data.goals || []);
        setSummary(json.data.summary || null);
      }
    } catch (err) {
      console.error('Erro ao carregar metas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const openNewGoalModal = () => {
    setFormTitle('');
    setFormDescription('');
    setFormTargetAmount('');
    setFormCurrentAmount('');
    setFormTargetDate('');
    setFormHorizon('AUTO');
    setFormCategory('FINANCIAL');
    setFormColor('#10b981');
    setIsNewGoalModalOpen(true);
  };

  const openEditModal = (goal: GoalItem) => {
    setSelectedGoal(goal);
    setFormTitle(goal.title);
    setFormDescription(goal.description || '');
    setFormTargetAmount(goal.targetAmount.toString());
    setFormCurrentAmount(goal.currentAmount.toString());
    setFormTargetDate(goal.targetDate ? goal.targetDate.split('T')[0] : '');
    setFormHorizon(goal.horizon);
    setFormCategory(goal.category);
    setFormColor(goal.color || '#10b981');
    setIsEditModalOpen(true);
  };

  const openDepositModal = (goal: GoalItem) => {
    setSelectedGoal(goal);
    setFormDepositAmount('100');
    setIsDepositModalOpen(true);
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          targetAmount: parseFloat(formTargetAmount) || 0,
          currentAmount: parseFloat(formCurrentAmount) || 0,
          targetDate: formTargetDate ? new Date(formTargetDate).toISOString() : null,
          horizon: formHorizon,
          category: formCategory,
          color: formColor,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsNewGoalModalOpen(false);
        fetchGoals();
      } else {
        alert(json.error || 'Erro ao criar meta');
      }
    } catch (err) {
      console.error('Erro ao salvar meta:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !formTitle.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/goals/${selectedGoal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          targetAmount: parseFloat(formTargetAmount) || 0,
          currentAmount: parseFloat(formCurrentAmount) || 0,
          targetDate: formTargetDate ? new Date(formTargetDate).toISOString() : null,
          horizon: formHorizon,
          category: formCategory,
          color: formColor,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsEditModalOpen(false);
        fetchGoals();
      } else {
        alert(json.error || 'Erro ao atualizar meta');
      }
    } catch (err) {
      console.error('Erro ao atualizar meta:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeposit = async (amount: number) => {
    if (!selectedGoal || amount <= 0) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/goals/${selectedGoal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addAmount: amount,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsDepositModalOpen(false);
        fetchGoals();
      } else {
        alert(json.error || 'Erro ao registrar aporte');
      }
    } catch (err) {
      console.error('Erro ao fazer aporte:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async (goal: GoalItem) => {
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isCompleted: !goal.isCompleted,
        }),
      });
      if (res.ok) {
        fetchGoals();
      }
    } catch (err) {
      console.error('Erro ao alternar conclusão da meta:', err);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Deseja realmente excluir esta meta?')) return;

    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchGoals();
      }
    } catch (err) {
      console.error('Erro ao excluir meta:', err);
    }
  };

  // Filtragem
  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      if (selectedHorizon === 'COMPLETED') {
        if (!g.isCompleted) return false;
      } else if (selectedHorizon !== 'ALL') {
        if (g.isCompleted) return false;
        if (g.horizon !== selectedHorizon) return false;
      } else {
        // 'ALL' mostra ativas primeiro ou todas
      }

      if (selectedCategory !== 'ALL' && g.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [goals, selectedHorizon, selectedCategory]);

  const getCategoryInfo = (cat: string) => {
    switch (cat) {
      case 'FINANCIAL':
        return { label: 'Financeira', icon: DollarSign, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
      case 'CAREER':
        return { label: 'Carreira', icon: Briefcase, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
      case 'HEALTH':
        return { label: 'Saúde & Físico', icon: Heart, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
      case 'PERSONAL':
        return { label: 'Pessoal & Bens', icon: Compass, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
      default:
        return { label: 'Outro', icon: Layers, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' };
    }
  };

  const getHorizonBadge = (horizon: string) => {
    switch (horizon) {
      case 'SHORT_TERM':
        return {
          label: 'Curto Prazo (< 1 ano)',
          shortLabel: 'Curto Prazo',
          badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          gradientClass: 'from-emerald-500 to-teal-400',
        };
      case 'MEDIUM_TERM':
        return {
          label: 'Médio Prazo (1 a 5 anos)',
          shortLabel: 'Médio Prazo',
          badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
          gradientClass: 'from-amber-500 to-orange-400',
        };
      case 'LONG_TERM':
        return {
          label: 'Longo Prazo (+5 anos)',
          shortLabel: 'Longo Prazo',
          badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
          gradientClass: 'from-purple-500 to-indigo-500',
        };
      default:
        return {
          label: 'Curto Prazo',
          shortLabel: 'Curto Prazo',
          badgeClass: 'bg-muted text-muted-foreground border-border',
          gradientClass: 'from-primary to-primary/80',
        };
    }
  };

  const getRemainingTimeText = (days?: number | null) => {
    if (days === undefined || days === null) return 'Sem prazo fixo';
    if (days < 0) return `Venceu há ${Math.abs(days)} dias`;
    if (days === 0) return 'Vence hoje!';
    if (days <= 30) return `${days} dias restantes`;
    if (days <= 365) {
      const months = Math.round(days / 30);
      return `${months} ${months === 1 ? 'mês' : 'meses'} restantes`;
    }
    const years = (days / 365).toFixed(1);
    return `${years} anos restantes`;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* 1. Header do Módulo de Metas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Target className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              🎯 Gestão de Metas & Prazos
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Planejamento estratégico segmentado em <b>Curto</b> (&le;1 ano), <b>Médio</b> (1-5 anos) e <b>Longo Prazo</b> (&gt;5 anos).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={fetchGoals}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            title="Atualizar Metas"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Atualizar
          </Button>

          <Button
            onClick={openNewGoalModal}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 shadow-sm text-xs sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            Nova Meta
          </Button>
        </div>
      </div>

      {/* 2. Top Summary Cards: Visão Geral e Distribuição por Prazos */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Progresso Geral */}
          <Card className="border-border/70 bg-card/60 backdrop-blur-xl shadow-xs">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Progresso Total
                </span>
                <span className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-foreground">
                  {summary.overallProgress}%
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {summary.totalCompleted}/{summary.totalGoals} concluídas
                </span>
              </div>
              <div className="w-full bg-muted/60 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${summary.overallProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 truncate">
                Acumulado: <b>{formatCurrency(summary.totalCurrentAmount)}</b> de {formatCurrency(summary.totalTargetAmount)}
              </p>
            </CardContent>
          </Card>

          {/* Card 2: Curto Prazo */}
          <Card
            onClick={() => setSelectedHorizon('SHORT_TERM')}
            className={cn(
              'border-border/70 bg-card/60 backdrop-blur-xl shadow-xs cursor-pointer hover:border-emerald-500/50 transition-all',
              selectedHorizon === 'SHORT_TERM' && 'ring-2 ring-emerald-500 border-emerald-500'
            )}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Curto Prazo
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                  &le; 1 ano
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-foreground">
                  {summary.shortTermCount}
                </span>
                <span className="text-xs text-muted-foreground">metas ativas</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                Emergência, viagens próximas, pequenos bens e conquistas imediatas.
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Médio Prazo */}
          <Card
            onClick={() => setSelectedHorizon('MEDIUM_TERM')}
            className={cn(
              'border-border/70 bg-card/60 backdrop-blur-xl shadow-xs cursor-pointer hover:border-amber-500/50 transition-all',
              selectedHorizon === 'MEDIUM_TERM' && 'ring-2 ring-amber-500 border-amber-500'
            )}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Médio Prazo
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                  1 a 5 anos
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-foreground">
                  {summary.mediumTermCount}
                </span>
                <span className="text-xs text-muted-foreground">metas ativas</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                Troca de carro, pós-graduação, transição de carreira ou reforma.
              </p>
            </CardContent>
          </Card>

          {/* Card 4: Longo Prazo */}
          <Card
            onClick={() => setSelectedHorizon('LONG_TERM')}
            className={cn(
              'border-border/70 bg-card/60 backdrop-blur-xl shadow-xs cursor-pointer hover:border-purple-500/50 transition-all',
              selectedHorizon === 'LONG_TERM' && 'ring-2 ring-purple-500 border-purple-500'
            )}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                  Longo Prazo
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500">
                  +5 anos
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-foreground">
                  {summary.longTermCount}
                </span>
                <span className="text-xs text-muted-foreground">metas ativas</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                Casa própria, aposentadoria, liberdade financeira e patrimônio vitalício.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. Filtros & Controles Segmentados */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-muted/30 p-2 rounded-2xl border border-border/70">
        {/* Filtro de Prazos */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedHorizon('ALL')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
              selectedHorizon === 'ALL'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            Todas ({goals.filter((g) => !g.isCompleted).length})
          </button>

          <button
            onClick={() => setSelectedHorizon('SHORT_TERM')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer',
              selectedHorizon === 'SHORT_TERM'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Curto Prazo ({goals.filter((g) => g.horizon === 'SHORT_TERM' && !g.isCompleted).length})
          </button>

          <button
            onClick={() => setSelectedHorizon('MEDIUM_TERM')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer',
              selectedHorizon === 'MEDIUM_TERM'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Médio Prazo ({goals.filter((g) => g.horizon === 'MEDIUM_TERM' && !g.isCompleted).length})
          </button>

          <button
            onClick={() => setSelectedHorizon('LONG_TERM')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer',
              selectedHorizon === 'LONG_TERM'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            Longo Prazo ({goals.filter((g) => g.horizon === 'LONG_TERM' && !g.isCompleted).length})
          </button>

          <button
            onClick={() => setSelectedHorizon('COMPLETED')}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer',
              selectedHorizon === 'COMPLETED'
                ? 'bg-card text-foreground border border-border shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            Concluídas ({goals.filter((g) => g.isCompleted).length})
          </button>
        </div>

        {/* Filtro por Categoria */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:inline">
            Categoria:
          </span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl bg-card border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
          >
            <option value="ALL">Todas as Categorias</option>
            <option value="FINANCIAL">💰 Financeira</option>
            <option value="CAREER">💼 Carreira & Negócios</option>
            <option value="HEALTH">❤️ Saúde & Físico</option>
            <option value="PERSONAL">🧭 Pessoal & Bens</option>
            <option value="OTHER">📦 Outras</option>
          </select>
        </div>
      </div>

      {/* 4. Lista / Grid de Metas */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Carregando suas metas...</p>
        </div>
      ) : filteredGoals.length === 0 ? (
        <Card className="border-dashed border-2 border-border/80 bg-card/40 p-12 text-center">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <Target className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">Nenhuma meta encontrada</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-5">
            {selectedHorizon === 'COMPLETED'
              ? 'Você ainda não concluiu nenhuma meta nesta seção. Conquiste sua primeira!'
              : 'Defina suas metas financeiras e de vida com prazos claros para o sistema categorizar automaticamente.'}
          </p>
          <Button onClick={openNewGoalModal} className="gap-2 text-xs">
            <Plus className="h-4 w-4" />
            Cadastrar Nova Meta
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGoals.map((goal) => {
            const cat = getCategoryInfo(goal.category);
            const CatIcon = cat.icon;
            const hor = getHorizonBadge(goal.horizon);
            const remaining = goal.targetAmount > goal.currentAmount ? goal.targetAmount - goal.currentAmount : 0;

            return (
              <Card
                key={goal.id}
                className={cn(
                  'border border-border/70 bg-card/75 backdrop-blur-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden',
                  goal.isCompleted && 'opacity-90 border-emerald-500/40 bg-emerald-500/5'
                )}
              >
                {/* Accent Top Border Bar com a cor da Meta ou do Prazo */}
                <div
                  className={cn('h-1.5 w-full bg-gradient-to-r', hor.gradientClass)}
                  style={goal.color ? { backgroundColor: goal.color } : undefined}
                />

                <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  {/* Top Bar: Categoria + Prazo + Actions */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Badge de Prazo */}
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                            hor.badgeClass
                          )}
                        >
                          {hor.shortLabel}
                        </span>

                        {/* Badge de Categoria */}
                        <span
                          className={cn(
                            'text-[10px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1',
                            cat.color
                          )}
                        >
                          <CatIcon className="h-3 w-3" />
                          {cat.label}
                        </span>
                      </div>

                      {/* Botões rápidos: Editar / Excluir */}
                      <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(goal)}
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Editar Meta"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Excluir Meta"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Título & Descrição */}
                    <h3 className={cn(
                      'text-base font-bold text-foreground tracking-tight leading-snug',
                      goal.isCompleted && 'line-through text-muted-foreground'
                    )}>
                      {goal.title}
                    </h3>
                    {goal.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {goal.description}
                      </p>
                    )}
                  </div>

                  {/* Informações de Valores e Progresso */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-baseline justify-between text-xs">
                      <div>
                        <span className="text-[11px] text-muted-foreground block">Acumulado</span>
                        <span className="text-lg font-extrabold text-foreground">
                          {formatCurrency(goal.currentAmount)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-muted-foreground block">Meta Alvo</span>
                        <span className="text-sm font-semibold text-muted-foreground">
                          {goal.targetAmount > 0 ? formatCurrency(goal.targetAmount) : 'Marco'}
                        </span>
                      </div>
                    </div>

                    {/* Barra de Progresso com porcentagem */}
                    {goal.targetAmount > 0 && (
                      <div>
                        <div className="w-full bg-muted/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-border/50">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-700 bg-gradient-to-r',
                              goal.isCompleted
                                ? 'from-emerald-500 to-teal-400'
                                : hor.gradientClass
                            )}
                            style={{ width: `${goal.percentage}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1 font-medium">
                          <span>{goal.percentage}% atingido</span>
                          {!goal.isCompleted && remaining > 0 && (
                            <span>Faltam {formatCurrency(remaining)}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Prazo & Tempo Restante */}
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/50 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-primary" />
                        {goal.targetDate ? formatDate(goal.targetDate) : 'Sem data final'}
                      </span>

                      <span className="flex items-center gap-1 font-semibold">
                        <Clock className="h-3 w-3" />
                        {getRemainingTimeText(goal.daysRemaining)}
                      </span>
                    </div>
                  </div>

                  {/* Ações Inferiores: Fazer Aporte e Concluir */}
                  <div className="pt-2 flex items-center gap-2 border-t border-border/60">
                    <Button
                      onClick={() => openDepositModal(goal)}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs gap-1.5 h-8 font-semibold hover:border-primary hover:text-primary"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      Fazer Aporte
                    </Button>

                    <Button
                      onClick={() => handleToggleComplete(goal)}
                      variant={goal.isCompleted ? 'secondary' : 'primary'}
                      size="sm"
                      className={cn(
                        'text-xs gap-1.5 h-8 font-semibold',
                        goal.isCompleted
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      )}
                    >
                      {goal.isCompleted ? (
                        <>
                          <Trophy className="h-3.5 w-3.5 text-amber-500" />
                          Concluída!
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Concluir
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 5. MODAL: NOVA META */}
      {isNewGoalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Nova Meta</h3>
                  <p className="text-xs text-muted-foreground">
                    Classificação automática em curto, médio ou longo prazo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewGoalModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Título da Meta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reserva de Emergência 6 Meses, Comprar Carro, Viagem..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-muted/40 border border-border/80 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e: any) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-muted/40 border border-border/80 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  >
                    <option value="FINANCIAL">💰 Financeira (Reserva/Investimento)</option>
                    <option value="CAREER">💼 Carreira & Negócios</option>
                    <option value="HEALTH">❤️ Saúde & Físico</option>
                    <option value="PERSONAL">🧭 Pessoal & Bens</option>
                    <option value="OTHER">📦 Outro</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Prazo / Classificação
                  </label>
                  <select
                    value={formHorizon}
                    onChange={(e: any) => setFormHorizon(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-muted/40 border border-border/80 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  >
                    <option value="AUTO">🤖 Automático (Pela Data Alvo)</option>
                    <option value="SHORT_TERM">🟢 Curto Prazo (&le; 1 ano)</option>
                    <option value="MEDIUM_TERM">🟡 Médio Prazo (1 a 5 anos)</option>
                    <option value="LONG_TERM">🟣 Longo Prazo (+5 anos)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Valor Alvo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formTargetAmount}
                    onChange={(e) => setFormTargetAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-muted/40 border border-border/80 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Valor Já Guardado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formCurrentAmount}
                    onChange={(e) => setFormCurrentAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-muted/40 border border-border/80 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Data Limite / Alvo
                  </label>
                  <input
                    type="date"
                    value={formTargetDate}
                    onChange={(e) => setFormTargetDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-muted/40 border border-border/80 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Descrição / Motivação (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Por que essa meta é importante? Detalhes do plano..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-muted/40 border border-border/80 focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/70">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewGoalModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formTitle.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  {isSubmitting ? 'Salvando...' : 'Criar Meta'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: EDITAR META */}
      {isEditModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Edit2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Editar Meta</h3>
                  <p className="text-xs text-muted-foreground">{selectedGoal.title}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateGoal} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Título da Meta *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-muted/40 border border-border/80 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e: any) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-muted/40 border border-border/80 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  >
                    <option value="FINANCIAL">💰 Financeira</option>
                    <option value="CAREER">💼 Carreira & Negócios</option>
                    <option value="HEALTH">❤️ Saúde & Físico</option>
                    <option value="PERSONAL">🧭 Pessoal & Bens</option>
                    <option value="OTHER">📦 Outro</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Prazo / Classificação
                  </label>
                  <select
                    value={formHorizon}
                    onChange={(e: any) => setFormHorizon(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-muted/40 border border-border/80 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  >
                    <option value="AUTO">🤖 Automático (Pela Data Alvo)</option>
                    <option value="SHORT_TERM">🟢 Curto Prazo (&le; 1 ano)</option>
                    <option value="MEDIUM_TERM">🟡 Médio Prazo (1 a 5 anos)</option>
                    <option value="LONG_TERM">🟣 Longo Prazo (+5 anos)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Valor Alvo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formTargetAmount}
                    onChange={(e) => setFormTargetAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-muted/40 border border-border/80 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Valor Atual (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formCurrentAmount}
                    onChange={(e) => setFormCurrentAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-muted/40 border border-border/80 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Data Limite
                  </label>
                  <input
                    type="date"
                    value={formTargetDate}
                    onChange={(e) => setFormTargetDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-muted/40 border border-border/80 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Descrição (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-muted/40 border border-border/80 focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/70">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formTitle.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: FAZER APORTE RÁPIDO */}
      {isDepositModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <PlusCircle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Fazer Aporte</h3>
                  <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                    {selectedGoal.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Atual:</span>
                  <span className="font-bold text-foreground">{formatCurrency(selectedGoal.currentAmount)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Meta:</span>
                  <span className="font-bold text-foreground">{formatCurrency(selectedGoal.targetAmount)}</span>
                </div>
              </div>

              {/* Botões Rápidos de Aporte */}
              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 250, 500, 1000, 2000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleDeposit(val)}
                    disabled={isSubmitting}
                    className="py-2 px-1 text-xs font-bold rounded-xl border border-border/70 bg-card hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all active:scale-95 cursor-pointer text-foreground"
                  >
                    +{formatCurrency(val)}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Ou digite um valor personalizado (R$):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="Ex: 350.00"
                    value={formDepositAmount}
                    onChange={(e) => setFormDepositAmount(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm rounded-xl bg-muted/40 border border-border/80 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                  <Button
                    onClick={() => handleDeposit(parseFloat(formDepositAmount) || 0)}
                    disabled={isSubmitting || !parseFloat(formDepositAmount)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    Aportar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
