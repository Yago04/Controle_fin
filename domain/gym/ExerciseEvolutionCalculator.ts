/**
 * Calcula o 1RM estimado através da fórmula de Epley:
 * 1RM = Peso * (1 + Reps / 30)
 */
export function calculateEpley1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return Math.round(weightKg * 10) / 10;
  const raw = weightKg * (1 + reps / 30);
  return Math.round(raw * 10) / 10;
}

export interface SetLogHistoricalItem {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  setType: string;
  weightKg: number;
  reps: number;
  rpe: number | null;
  isPR: boolean;
  completed: boolean;
  createdAt: Date | string;
  session: {
    id: string;
    title: string;
    startedAt: Date | string;
  };
}

export interface TimelineSessionPoint {
  sessionId: string;
  sessionTitle: string;
  date: string; // ISO string
  formattedDate: string; // "DD/MM/YYYY"
  setsCount: number;
  maxWeightKg: number;
  estimated1RM: number; // Epley: max 1RM da sessão
  sessionVolumeKg: number; // Soma de (weight * reps)
  avgRpe: number | null;
  weightProgressionPercentage: number; // % evolução em relação à 1ª sessão histórica
  oneRmProgressionPercentage: number; // % evolução de 1RM em relação à 1ª sessão histórica
  sets: Array<{
    setNumber: number;
    setType: string;
    weightKg: number;
    reps: number;
    rpe: number | null;
    isPR: boolean;
    estimated1RM: number;
  }>;
}

export interface ExerciseEvolutionSummary {
  initialMaxWeightKg: number;
  currentMaxWeightKg: number;
  allTimeMaxWeightKg: number;
  initialEstimated1RM: number;
  currentEstimated1RM: number;
  allTimeBest1RM: number;
  totalSessions: number;
  totalSets: number;
  allTimeTotalVolumeKg: number;
  weightEvolutionPercentage: number;
  oneRmEvolutionPercentage: number;
  firstSessionDate: string | null;
  latestSessionDate: string | null;
}

export interface ExerciseEvolutionResult {
  exercise: {
    id: string;
    name: string;
    muscleGroup: string;
    equipment: string | null;
    defaultRestSeconds: number;
  };
  summary: ExerciseEvolutionSummary;
  timeline: TimelineSessionPoint[];
}

export class ExerciseEvolutionCalculator {
  /**
   * Calcula a linha do tempo completa e as métricas de progressão de carga de um exercício
   */
  public static calculate(
    exercise: {
      id: string;
      name: string;
      muscleGroup: string;
      equipment: string | null;
      defaultRestSeconds: number;
    },
    setLogs: SetLogHistoricalItem[]
  ): ExerciseEvolutionResult {
    // Agrupa logs por sessão (mantendo ordem cronológica asc por startedAt)
    const sessionMap = new Map<string, {
      sessionId: string;
      sessionTitle: string;
      startedAt: Date;
      sets: SetLogHistoricalItem[];
    }>();

    for (const log of setLogs) {
      if (!log.completed) continue;

      const sid = log.sessionId || log.session.id;
      const sTitle = log.session?.title || 'Sessão de Treino';
      const sDate = new Date(log.session?.startedAt || log.createdAt);

      if (!sessionMap.has(sid)) {
        sessionMap.set(sid, {
          sessionId: sid,
          sessionTitle: sTitle,
          startedAt: sDate,
          sets: [],
        });
      }

      sessionMap.get(sid)!.sets.push(log);
    }

    // Ordena as sessões cronologicamente (mais antiga para mais recente)
    const sortedSessions = Array.from(sessionMap.values()).sort(
      (a, b) => a.startedAt.getTime() - b.startedAt.getTime()
    );

    const timeline: TimelineSessionPoint[] = [];

    let baselineMaxWeight = 0;
    let baseline1RM = 0;
    let allTimeMaxWeight = 0;
    let allTimeBest1RM = 0;
    let allTimeTotalVolume = 0;
    let totalCompletedSets = 0;

    for (let i = 0; i < sortedSessions.length; i++) {
      const s = sortedSessions[i];
      // Ordena sets pelo número da série
      s.sets.sort((a, b) => a.setNumber - b.setNumber);

      let sessionMaxWeight = 0;
      let sessionBest1RM = 0;
      let sessionVolume = 0;
      let rpeSum = 0;
      let rpeCount = 0;

      const preparedSets = s.sets.map((set) => {
        const w = Number(set.weightKg);
        const r = set.reps;
        const epley1RM = calculateEpley1RM(w, r);
        const vol = w * r;

        if (w > sessionMaxWeight) sessionMaxWeight = w;
        if (epley1RM > sessionBest1RM) sessionBest1RM = epley1RM;
        sessionVolume += vol;
        totalCompletedSets++;

        if (set.rpe !== null && set.rpe !== undefined) {
          rpeSum += Number(set.rpe);
          rpeCount++;
        }

        return {
          setNumber: set.setNumber,
          setType: set.setType,
          weightKg: w,
          reps: r,
          rpe: set.rpe ? Number(set.rpe) : null,
          isPR: Boolean(set.isPR),
          estimated1RM: epley1RM,
        };
      });

      if (sessionMaxWeight > allTimeMaxWeight) allTimeMaxWeight = sessionMaxWeight;
      if (sessionBest1RM > allTimeBest1RM) allTimeBest1RM = sessionBest1RM;
      allTimeTotalVolume += sessionVolume;

      // Define linha de base (1ª sessão histórica)
      if (i === 0) {
        baselineMaxWeight = sessionMaxWeight;
        baseline1RM = sessionBest1RM;
      }

      // Percentual de evolução em relação à primeira sessão
      const weightProgPct =
        baselineMaxWeight > 0
          ? Math.round(((sessionMaxWeight - baselineMaxWeight) / baselineMaxWeight) * 1000) / 10
          : 0;

      const oneRmProgPct =
        baseline1RM > 0
          ? Math.round(((sessionBest1RM - baseline1RM) / baseline1RM) * 1000) / 10
          : 0;

      const d = s.startedAt;
      const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(
        d.getMonth() + 1
      ).padStart(2, '0')}/${d.getFullYear()}`;

      timeline.push({
        sessionId: s.sessionId,
        sessionTitle: s.sessionTitle,
        date: s.startedAt.toISOString(),
        formattedDate,
        setsCount: preparedSets.length,
        maxWeightKg: sessionMaxWeight,
        estimated1RM: Math.round(sessionBest1RM * 10) / 10,
        sessionVolumeKg: Math.round(sessionVolume * 10) / 10,
        avgRpe: rpeCount > 0 ? Math.round((rpeSum / rpeCount) * 10) / 10 : null,
        weightProgressionPercentage: weightProgPct,
        oneRmProgressionPercentage: oneRmProgPct,
        sets: preparedSets,
      });
    }

    const initialPoint = timeline.length > 0 ? timeline[0] : null;
    const latestPoint = timeline.length > 0 ? timeline[timeline.length - 1] : null;

    const initialMaxWeightKg = initialPoint ? initialPoint.maxWeightKg : 0;
    const currentMaxWeightKg = latestPoint ? latestPoint.maxWeightKg : 0;
    const initialEstimated1RM = initialPoint ? initialPoint.estimated1RM : 0;
    const currentEstimated1RM = latestPoint ? latestPoint.estimated1RM : 0;

    const overallWeightEvolutionPct =
      initialMaxWeightKg > 0
        ? Math.round(((currentMaxWeightKg - initialMaxWeightKg) / initialMaxWeightKg) * 1000) / 10
        : 0;

    const overall1RMEvolutionPct =
      initialEstimated1RM > 0
        ? Math.round(((currentEstimated1RM - initialEstimated1RM) / initialEstimated1RM) * 1000) / 10
        : 0;

    const summary: ExerciseEvolutionSummary = {
      initialMaxWeightKg,
      currentMaxWeightKg,
      allTimeMaxWeightKg: allTimeMaxWeight,
      initialEstimated1RM,
      currentEstimated1RM,
      allTimeBest1RM: Math.round(allTimeBest1RM * 10) / 10,
      totalSessions: timeline.length,
      totalSets: totalCompletedSets,
      allTimeTotalVolumeKg: Math.round(allTimeTotalVolume * 10) / 10,
      weightEvolutionPercentage: overallWeightEvolutionPct,
      oneRmEvolutionPercentage: overall1RMEvolutionPct,
      firstSessionDate: initialPoint ? initialPoint.date : null,
      latestSessionDate: latestPoint ? latestPoint.date : null,
    };

    return {
      exercise,
      summary,
      timeline,
    };
  }
}
