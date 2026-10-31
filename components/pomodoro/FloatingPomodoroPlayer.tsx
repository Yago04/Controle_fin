'use client';

import React from 'react';
import { usePomodoro } from './PomodoroContext';
import { Play, Pause, CheckCircle2, Timer, RotateCcw } from 'lucide-react';

interface FloatingPomodoroPlayerProps {
  currentSection: string;
  onNavigateToPomodoro: () => void;
}

export function FloatingPomodoroPlayer({
  currentSection,
  onNavigateToPomodoro,
}: FloatingPomodoroPlayerProps) {
  const {
    mode,
    isRunning,
    secondsLeft,
    elapsedSeconds,
    activeTask,
    startTimer,
    pauseTimer,
    resetTimer,
    completeSessionNow,
    formatTime,
  } = usePomodoro();

  // Exibe a pílula flutuante quando o timer está ativo ou pausado no meio de uma sessão fora da aba de Pomodoro
  const isDefaultState =
    !isRunning &&
    ((mode === 'FOCUS' && secondsLeft === 25 * 60) ||
      (mode === 'SHORT_BREAK' && secondsLeft === 5 * 60) ||
      (mode === 'LONG_BREAK' && secondsLeft === 15 * 60) ||
      (mode === 'STOPWATCH' && elapsedSeconds === 0));

  if (currentSection === 'pomodoro' || isDefaultState) {
    return null;
  }

  const displayTime = mode === 'STOPWATCH' ? formatTime(elapsedSeconds) : formatTime(secondsLeft);

  return (
    <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-6 right-3 sm:right-6 md:right-6 z-40 flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-card/95 backdrop-blur-2xl border border-primary/40 shadow-2xl shadow-primary/20 animate-in fade-in slide-in-from-bottom-4 transition-all">
      <button
        onClick={onNavigateToPomodoro}
        className="flex items-center gap-2 text-left group cursor-pointer touch-manipulation active:scale-95"
        title="Ir para Foco & Pomodoro"
      >
        <div className="h-7 w-7 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
          <Timer className={`h-3.5 w-3.5 ${isRunning ? 'animate-spin' : ''}`} />
        </div>
        <div className="max-w-[130px] sm:max-w-[180px]">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-xs sm:text-sm text-foreground">{displayTime}</span>
            <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-rose-500/15 text-rose-500 font-bold">
              {mode === 'FOCUS' ? 'Foco' : mode === 'STOPWATCH' ? 'Livre' : 'Pausa'}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground truncate">
            {activeTask ? activeTask.title : 'Foco ativo'}
          </p>
        </div>
      </button>

      <div className="flex items-center gap-0.5 border-l border-border/80 pl-1.5">
        {isRunning ? (
          <button
            onClick={pauseTimer}
            className="p-1 rounded-full hover:bg-muted text-amber-500 transition-colors cursor-pointer active:scale-90"
            title="Pausar"
            aria-label="Pausar Pomodoro"
          >
            <Pause className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            onClick={() => startTimer()}
            className="p-1 rounded-full hover:bg-muted text-emerald-500 transition-colors cursor-pointer active:scale-90"
            title="Retomar"
            aria-label="Retomar Pomodoro"
          >
            <Play className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          onClick={completeSessionNow}
          className="p-1 rounded-full hover:bg-muted text-primary transition-colors cursor-pointer active:scale-90"
          title="Concluir e Registrar Sessão"
          aria-label="Concluir Sessão"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={resetTimer}
          className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-destructive transition-colors cursor-pointer active:scale-90"
          title="Cancelar Timer"
          aria-label="Cancelar Timer"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
