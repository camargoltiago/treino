import { WorkoutSession, MuscleGroup, MuscleRecoveryStatus } from '../types';
import { WORKOUTS_DATA } from '../data/workouts';

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Peitoral',
  back: 'Costas',
  shoulders: 'Ombros',
  arms: 'Braços (Bíceps/Tríceps)',
  quads: 'Quadríceps',
  hamstrings: 'Posteriores',
  calves: 'Panturrilhas',
  abs: 'Abdômen'
};

const BASE_RECOVERY_HOURS: Record<MuscleGroup, number> = {
  chest: 48,
  back: 48,
  shoulders: 48,
  arms: 36,
  quads: 60,
  hamstrings: 60,
  calves: 36,
  abs: 24
};

export function calculateMuscleRecovery(history: WorkoutSession[]): {
  muscles: Record<MuscleGroup, MuscleRecoveryStatus>;
  overallPercent: number;
} {
  const now = Date.now();
  const lastTrainedTimestamp: Partial<Record<MuscleGroup, number>> = {};

  // Analisar histórico das sessões concluídas
  history.forEach(session => {
    const sessionTime = new Date(session.endedAt || session.startedAt).getTime();
    const plan = WORKOUTS_DATA[session.workoutId];
    if (!plan) return;

    session.exercises.forEach(exState => {
      // Se teve pelo menos uma série concluída
      const hasCompletedSet = exState.sets.some(s => s.completed);
      if (hasCompletedSet) {
        const def = plan.exercises.find(e => e.id === exState.id);
        if (def && def.muscleGroup) {
          const prev = lastTrainedTimestamp[def.muscleGroup] || 0;
          if (sessionTime > prev) {
            lastTrainedTimestamp[def.muscleGroup] = sessionTime;
          }
        }
      }
    });
  });

  const muscleList: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms', 'quads', 'hamstrings', 'calves', 'abs'];
  const muscles = {} as Record<MuscleGroup, MuscleRecoveryStatus>;
  let sumPercent = 0;

  muscleList.forEach(group => {
    const lastTime = lastTrainedTimestamp[group];
    const maxHours = BASE_RECOVERY_HOURS[group];

    if (!lastTime) {
      // Nunca treinado ainda ou descansado há muito tempo: 100% pronto
      muscles[group] = {
        group,
        label: MUSCLE_LABELS[group],
        percent: 100,
        status: 'ready',
        lastTrainedDays: null,
        suggestedRestHours: 0
      };
      sumPercent += 100;
      return;
    }

    const elapsedHours = (now - lastTime) / (1000 * 60 * 60);
    const elapsedDays = Math.floor(elapsedHours / 24);

    let pct = Math.round((elapsedHours / maxHours) * 100);
    pct = Math.min(100, Math.max(15, pct)); // mínimo 15% logo após treinar

    let status: 'ready' | 'recovering' | 'rest' = 'ready';
    if (pct < 55) {
      status = 'rest';
    } else if (pct < 85) {
      status = 'recovering';
    }

    const remainingRestHours = Math.max(0, Math.round(maxHours - elapsedHours));

    muscles[group] = {
      group,
      label: MUSCLE_LABELS[group],
      percent: pct,
      status,
      lastTrainedDays: elapsedDays,
      suggestedRestHours: remainingRestHours
    };

    sumPercent += pct;
  });

  const overallPercent = Math.round(sumPercent / muscleList.length);

  return {
    muscles,
    overallPercent
  };
}
