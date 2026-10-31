'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

export type PomodoroModeType = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK' | 'STOPWATCH';

interface ActiveTaskInfo {
  id: string;
  title: string;
  projectId?: string | null;
}

interface PomodoroContextValue {
  mode: PomodoroModeType;
  isRunning: boolean;
  secondsLeft: number;
  elapsedSeconds: number;
  activeTask: ActiveTaskInfo | null;
  setMode: (mode: PomodoroModeType) => void;
  setActiveTask: (task: ActiveTaskInfo | null) => void;
  startTimer: (customTask?: ActiveTaskInfo | null, customMode?: PomodoroModeType) => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  completeSessionNow: () => Promise<void>;
  formatTime: (totalSeconds: number) => string;
  lastCompletedAt: number;
}

const DEFAULT_DURATIONS: Record<PomodoroModeType, number> = {
  FOCUS: 25 * 60,
  SHORT_BREAK: 5 * 60,
  LONG_BREAK: 15 * 60,
  STOPWATCH: 0,
};

const PomodoroContext = createContext<PomodoroContextValue | undefined>(undefined);

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<PomodoroModeType>('FOCUS');
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_DURATIONS.FOCUS);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeTask, setActiveTask] = useState<ActiveTaskInfo | null>(null);
  const [lastCompletedAt, setLastCompletedAt] = useState(0);

  // Timestamps de alta precisão com Date.now()
  const targetEndTimestampRef = useRef<number | null>(null);
  const startTimestampRef = useRef<number | null>(null);
  const sessionInitialStartRef = useRef<string | null>(null);
  const accumulatedElapsedRef = useRef<number>(0);

  const playNotificationSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // Ignora caso áudio esteja bloqueado pelo browser
    }
  }, []);

  const saveSessionToDb = useCallback(
    async (
      sessionMode: PomodoroModeType,
      durationMin: number,
      task: ActiveTaskInfo | null,
      startedIso: string | null
    ) => {
      if (durationMin < 1) return;
      try {
        await fetch('/api/pomodoro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: sessionMode,
            durationMinutes: durationMin,
            startedAt: startedIso || new Date(Date.now() - durationMin * 60000).toISOString(),
            endedAt: new Date().toISOString(),
            taskId: task?.id || null,
            projectId: task?.projectId || null,
          }),
        });
        setLastCompletedAt(Date.now());
      } catch (e) {
        console.error('Erro ao salvar sessão Pomodoro:', e);
      }
    },
    []
  );

  const setMode = useCallback((newMode: PomodoroModeType) => {
    setIsRunning(false);
    targetEndTimestampRef.current = null;
    startTimestampRef.current = null;
    accumulatedElapsedRef.current = 0;
    sessionInitialStartRef.current = null;
    setModeState(newMode);
    setSecondsLeft(DEFAULT_DURATIONS[newMode]);
    setElapsedSeconds(0);
  }, []);

  const startTimer = useCallback(
    (customTask?: ActiveTaskInfo | null, customMode?: PomodoroModeType) => {
      if (customTask !== undefined) {
        setActiveTask(customTask);
      }

      let currentMode = mode;
      let currentSecondsLeft = secondsLeft;

      if (customMode && customMode !== mode) {
        currentMode = customMode;
        currentSecondsLeft = DEFAULT_DURATIONS[customMode];
        setModeState(customMode);
        setSecondsLeft(currentSecondsLeft);
        setElapsedSeconds(0);
        accumulatedElapsedRef.current = 0;
      }

      const now = Date.now();
      if (!sessionInitialStartRef.current) {
        sessionInitialStartRef.current = new Date(now).toISOString();
      }

      if (currentMode === 'STOPWATCH') {
        startTimestampRef.current = now;
      } else {
        targetEndTimestampRef.current = now + currentSecondsLeft * 1000;
      }

      setIsRunning(true);
    },
    [mode, secondsLeft]
  );

  const pauseTimer = useCallback(() => {
    if (!isRunning) return;
    const now = Date.now();
    if (mode === 'STOPWATCH' && startTimestampRef.current) {
      const delta = Math.floor((now - startTimestampRef.current) / 1000);
      accumulatedElapsedRef.current += delta;
      setElapsedSeconds(accumulatedElapsedRef.current);
      startTimestampRef.current = null;
    } else if (targetEndTimestampRef.current) {
      const remaining = Math.max(0, Math.round((targetEndTimestampRef.current - now) / 1000));
      setSecondsLeft(remaining);
      targetEndTimestampRef.current = null;
    }
    setIsRunning(false);
  }, [isRunning, mode]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    targetEndTimestampRef.current = null;
    startTimestampRef.current = null;
    accumulatedElapsedRef.current = 0;
    sessionInitialStartRef.current = null;
    setSecondsLeft(DEFAULT_DURATIONS[mode]);
    setElapsedSeconds(0);
  }, [mode]);

  const completeSessionNow = useCallback(async () => {
    setIsRunning(false);
    let minutesFocused = 0;
    if (mode === 'STOPWATCH') {
      const now = Date.now();
      const currentTotal =
        accumulatedElapsedRef.current +
        (startTimestampRef.current ? Math.floor((now - startTimestampRef.current) / 1000) : 0);
      minutesFocused = Math.max(1, Math.round(currentTotal / 60));
    } else {
      const totalPlanned = DEFAULT_DURATIONS[mode];
      const spentSeconds = Math.max(60, totalPlanned - secondsLeft);
      minutesFocused = Math.max(1, Math.round(spentSeconds / 60));
    }

    playNotificationSound();
    await saveSessionToDb(mode, minutesFocused, activeTask, sessionInitialStartRef.current);

    targetEndTimestampRef.current = null;
    startTimestampRef.current = null;
    accumulatedElapsedRef.current = 0;
    sessionInitialStartRef.current = null;
    setSecondsLeft(DEFAULT_DURATIONS[mode]);
    setElapsedSeconds(0);
  }, [mode, secondsLeft, activeTask, playNotificationSound, saveSessionToDb]);

  // Loop baseado em Date.now() para nunca atrasar no background do Mac ou tela bloqueada do iPhone
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (mode === 'STOPWATCH') {
        if (startTimestampRef.current) {
          const delta = Math.floor((now - startTimestampRef.current) / 1000);
          setElapsedSeconds(accumulatedElapsedRef.current + delta);
        }
      } else if (targetEndTimestampRef.current) {
        const remaining = Math.max(0, Math.round((targetEndTimestampRef.current - now) / 1000));
        setSecondsLeft(remaining);
        if (remaining <= 0) {
          setIsRunning(false);
          targetEndTimestampRef.current = null;
          const durationMin = Math.round(DEFAULT_DURATIONS[mode] / 60);
          playNotificationSound();
          saveSessionToDb(mode, durationMin, activeTask, sessionInitialStartRef.current);
          sessionInitialStartRef.current = null;
          setSecondsLeft(DEFAULT_DURATIONS[mode]);
        }
      }
    }, 300);

    return () => clearInterval(interval);
  }, [isRunning, mode, activeTask, playNotificationSound, saveSessionToDb]);

  const formatTime = useCallback((totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  return (
    <PomodoroContext.Provider
      value={{
        mode,
        isRunning,
        secondsLeft,
        elapsedSeconds,
        activeTask,
        setMode,
        setActiveTask,
        startTimer,
        pauseTimer,
        resetTimer,
        completeSessionNow,
        formatTime,
        lastCompletedAt,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) {
    throw new Error('usePomodoro deve ser usado dentro de um PomodoroProvider');
  }
  return ctx;
}
