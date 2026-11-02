'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { MobileMenuDrawer } from '@/components/layout/MobileMenuDrawer';
import { CommandPaletteModal } from '@/components/layout/CommandPaletteModal';
import { BalanceCards } from '@/components/dashboard/BalanceCards';
import { FinancialHealthCard } from '@/components/dashboard/FinancialHealthCard';
import { AccountsList } from '@/components/dashboard/AccountsList';
import { DebtsOverviewCard } from '@/components/dashboard/DebtsOverviewCard';
import { BankAccountsManager } from '@/components/dashboard/BankAccountsManager';
import { DebtsManager } from '@/components/dashboard/DebtsManager';
import { CanBuySimulator } from '@/components/dashboard/CanBuySimulator';
import { RecentTransactionsTable } from '@/components/dashboard/RecentTransactionsTable';
import { ImportModal } from '@/components/dashboard/ImportModal';
import { BackupModal } from '@/components/dashboard/BackupModal';
import { NewTransactionModal } from '@/components/dashboard/NewTransactionModal';
import { MyDayCommandCenter } from '@/components/dashboard/MyDayCommandCenter';
import { LifeOSDashboard } from '@/components/dashboard/LifeOSDashboard';
import { PomodoroProvider } from '@/components/pomodoro/PomodoroContext';
import { PomodoroModuleView } from '@/components/pomodoro/PomodoroModuleView';
import { FloatingPomodoroPlayer } from '@/components/pomodoro/FloatingPomodoroPlayer';
import { NotesModuleView } from '@/components/notes/NotesModuleView';
import { CalendarModuleView } from '@/components/calendar/CalendarModuleView';
import { GymModuleView } from '@/components/gym/GymModuleView';
import { GoalsModuleView } from '@/components/goals/GoalsModuleView';
import { SplashScreen } from '@/components/layout/SplashScreen';
import { Button } from '@/components/ui/Button';
import { RefreshCw, Upload, DownloadCloud, PlusCircle, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isNewTxOpen, setIsNewTxOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const overRes = await fetch('/api/dashboard/overview');
      if (!overRes.ok) {
        throw new Error(`Erro ${overRes.status}: Falha ao buscar dados financeiros.`);
      }
      const overJson = await overRes.json();
      if (!overJson.success || !overJson.data) {
        throw new Error(overJson.error || 'Dados inválidos retornados pela API.');
      }
      setData(overJson.data);
    } catch (err: any) {
      console.error('Erro ao carregar dados do painel:', err);
      setError(err.message || 'Erro de conexão com o banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Atalhos globais de teclado no Mac (⌘K para Command Palette, ⌘1-⌘6 para alternar módulos, ⌘N para nova transação)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // Cmd + K / Ctrl + K (funciona mesmo em inputs para abrir palette)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Se estiver digitando em campo de texto, não intercepta outros atalhos
      if (isInput) return;

      if (e.metaKey || e.ctrlKey) {
        if (e.key === '1') {
          e.preventDefault();
          setActiveSection('dashboard');
        } else if (e.key === '2') {
          e.preventDefault();
          setActiveSection('finances');
        } else if (e.key === '3') {
          e.preventDefault();
          setActiveSection('pomodoro');
        } else if (e.key === '4') {
          e.preventDefault();
          setActiveSection('notes');
        } else if (e.key === '5') {
          e.preventDefault();
          setActiveSection('calendar');
        } else if (e.key === '6') {
          e.preventDefault();
          setActiveSection('gym');
        } else if (e.key === '7') {
          e.preventDefault();
          setActiveSection('goals');
        } else if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          setIsNewTxOpen(true);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  if (error || !data) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground p-6 text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold">Não foi possível carregar os dados</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          {error || 'Verifique se o banco de dados PostgreSQL está rodando.'}
        </p>
        <Button onClick={fetchDashboardData} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <PomodoroProvider>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar Pessoal (Oculta no mobile, visível em md+) */}
        <Sidebar
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          onOpenImport={() => setIsImportOpen(true)}
          onOpenBackup={() => setIsBackupOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        {/* Conteúdo Principal */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            freeMoney={data.freeMoney}
            activeSection={activeSection}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-8 pb-28 md:pb-8 space-y-6 sm:space-y-8 overflow-y-auto max-w-7xl mx-auto w-full">
            {/* ABA 1: DASHBOARD GERAL (LIFE OS 360°) */}
            {(activeSection === 'dashboard' || activeSection === 'my-day') && (
              <LifeOSDashboard
                onNavigate={setActiveSection}
                onOpenNewTask={() => setIsCommandPaletteOpen(true)}
              />
            )}

            {/* ABA 2: FINANÇAS (100% PRESERVADO) */}
            {activeSection === 'finances' && (
              <div className="space-y-6 sm:space-y-8">
                {/* Top Actions Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                      💰 Painel Financeiro Completo
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Visão consolidada de liquidez, dinheiro livre e plano para quitar dívidas.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      onClick={() => setIsNewTxOpen(true)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 shadow-sm text-xs sm:text-sm"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Novo Gasto / PIX
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsImportOpen(true)}
                      className="hidden sm:inline-flex gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Importar CSV
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsBackupOpen(true)}
                      className="hidden sm:inline-flex gap-1.5"
                    >
                      <DownloadCloud className="h-3.5 w-3.5" />
                      Backup
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchDashboardData}
                      className="gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Atualizar
                    </Button>
                  </div>
                </div>

                {/* 1. Métricas de Topo */}
                <BalanceCards
                  currentBalance={data.currentBalance}
                  freeMoney={data.freeMoney}
                  monthlyIncome={data.monthlyIncome}
                  monthlyExpense={data.monthlyExpense}
                  projectedEndMonthBalance={data.projectedEndMonthBalance}
                  totalDebt={data.totalDebt}
                />

                {/* 2. Grid Intermediário: Saúde Financeira + Simulador Posso Comprar? */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="simulator">
                  <FinancialHealthCard
                    score={data.financialHealth.score}
                    status={data.financialHealth.status}
                    incomeCommitmentRate={data.financialHealth.incomeCommitmentRate}
                    emergencyFundMonths={data.financialHealth.emergencyFundMonths}
                    insights={data.financialHealth.insights}
                  />

                  <CanBuySimulator
                    freeMoney={data.freeMoney}
                    monthlyIncome={data.monthlyIncome}
                  />
                </div>

                {/* 3. Gestão e Vinculação de Contas Bancárias */}
                <div id="accounts">
                  <BankAccountsManager
                    onRefresh={fetchDashboardData}
                    onOpenImport={() => setIsImportOpen(true)}
                  />
                </div>

                {/* 4. Gestão de Dívidas & Passivos Reestruturada */}
                <div id="debts">
                  <DebtsManager onRefresh={fetchDashboardData} />
                </div>

                {/* 4. Tabela de Transações Recentes */}
                <div id="transactions">
                  <RecentTransactionsTable
                    transactions={data.recentTransactions}
                    onRefresh={fetchDashboardData}
                  />
                </div>
              </div>
            )}

            {/* ABA 3: FOCO & POMODORO */}
            {activeSection === 'pomodoro' && <PomodoroModuleView />}

            {/* ABA 4: NOTAS & SEGUNDO CÉREBRO */}
            {activeSection === 'notes' && <NotesModuleView />}

            {/* ABA 5: CALENDÁRIO UNIFICADO 360° */}
            {activeSection === 'calendar' && <CalendarModuleView />}

            {/* ABA 6: ACADEMIA & SAÚDE */}
            {activeSection === 'gym' && <GymModuleView />}

            {/* ABA 7: METAS & PRAZOS (CURTO, MÉDIO, LONGO) */}
            {activeSection === 'goals' && <GoalsModuleView />}
          </main>
        </div>

        {/* Mini-Player Pomodoro Flutuante Persistente */}
        <FloatingPomodoroPlayer
          currentSection={activeSection}
          onNavigateToPomodoro={() => setActiveSection('pomodoro')}
        />

        {/* Barra de Navegação Inferior Nativa para Mobile (com safe-area-inset-bottom) */}
        <BottomNav
          activeTab={activeSection}
          onSelectTab={setActiveSection}
          onNewTransaction={() => setIsCommandPaletteOpen(true)}
          onOpenMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Menu Rápido Drawer para Telas Pequenas */}
        <MobileMenuDrawer
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          activeSection={activeSection}
          onOpenImport={() => setIsImportOpen(true)}
          onOpenBackup={() => setIsBackupOpen(true)}
          onSelectSection={setActiveSection}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onScrollToSimulator={() => {
            setActiveSection('finances');
            setTimeout(() => {
              document.getElementById('simulator')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
        />

        {/* Command Palette Global (Cmd + K no Mac / Botão Rápido no iPhone) */}
        <CommandPaletteModal
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNavigate={setActiveSection}
          onOpenNewTransaction={() => setIsNewTxOpen(true)}
          onRefreshGlobal={fetchDashboardData}
        />

        {/* Modal de Nova Transação (Gasto / PIX / Transferência) */}
        <NewTransactionModal
          isOpen={isNewTxOpen}
          onClose={() => setIsNewTxOpen(false)}
          accounts={data.accounts}
          onSuccess={fetchDashboardData}
        />

        {/* Modais de Importação e Backup */}
        <ImportModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          accounts={data.accounts}
          onSuccess={fetchDashboardData}
        />

        <BackupModal
          isOpen={isBackupOpen}
          onClose={() => setIsBackupOpen(false)}
          onRestored={fetchDashboardData}
        />

        {/* Animação de Entrada Cinematográfica Apple Style */}
        <SplashScreen />
      </div>
    </PomodoroProvider>
  );
}
