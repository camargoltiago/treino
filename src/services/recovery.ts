import { WorkoutSession, MuscleGroup, MuscleRecoveryStatus, WorkoutPlan } from '../types';
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

function resolveMuscleGroup(
  exState: { id: string; name?: string },
  sessionWorkoutId: string,
  workouts?: Record<string, WorkoutPlan>
): MuscleGroup | null {
  const currentPlan = (workouts && workouts[sessionWorkoutId]) || WORKOUTS_DATA[sessionWorkoutId];
  const exerciseNameClean = (exState.name || '').trim().toLowerCase();

  // 1. Procurar por ID E Nome no treino atual
  if (currentPlan) {
    const exactMatch = currentPlan.exercises.find(
      e => e.id === exState.id && e.name.trim().toLowerCase() === exerciseNameClean
    );
    if (exactMatch?.muscleGroup) return exactMatch.muscleGroup;

    // 2. Procurar por Nome no treino atual (caso os IDs tenham sido alterados ou reordenados)
    if (exerciseNameClean) {
      const nameMatch = currentPlan.exercises.find(
        e => e.name.trim().toLowerCase() === exerciseNameClean
      );
      if (nameMatch?.muscleGroup) return nameMatch.muscleGroup;
    }
  }

  // 3. Procurar por Nome em todos os treinos disponíveis (personalizados e padrão)
  if (exerciseNameClean) {
    const allPlans = [
      ...(workouts ? Object.values(workouts) : []),
      ...Object.values(WORKOUTS_DATA)
    ];
    for (const p of allPlans) {
      const match = p.exercises.find(
        e => e.name.trim().toLowerCase() === exerciseNameClean
      );
      if (match?.muscleGroup) return match.muscleGroup;
    }
  }

  // 4. Procurar por ID no treino atual se o nome coincidir ou estiver em branco
  if (currentPlan) {
    const idMatch = currentPlan.exercises.find(e => e.id === exState.id);
    if (idMatch?.muscleGroup && (!exerciseNameClean || idMatch.name.trim().toLowerCase() === exerciseNameClean)) {
      return idMatch.muscleGroup;
    }
  }

  // 5. Fallback semântico por palavras-chave em português
  if (exerciseNameClean) {
    const n = exerciseNameClean
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (
      n.includes('supino') ||
      n.includes('peitoral') ||
      n.includes('peito') ||
      n.includes('crucifixo') ||
      n.includes('crossover') ||
      n.includes('cross over') ||
      n.includes('voador') ||
      n.includes('flexao de braco')
    ) {
      return 'chest';
    }
    if (
      n.includes('remada') ||
      n.includes('puxada') ||
      n.includes('costas') ||
      n.includes('dorsal') ||
      n.includes('latissimo') ||
      n.includes('barra fixa') ||
      n.includes('pulldown') ||
      n.includes('serrote')
    ) {
      return 'back';
    }
    if (
      n.includes('desenvolvimento') ||
      n.includes('elevacao lateral') ||
      n.includes('elevacao frontal') ||
      n.includes('deltoide') ||
      n.includes('ombro') ||
      n.includes('arnold') ||
      n.includes('militar')
    ) {
      return 'shoulders';
    }
    if (
      n.includes('biceps') ||
      n.includes('triceps') ||
      n.includes('rosca') ||
      n.includes('pulley') ||
      n.includes('corda') ||
      n.includes('frances') ||
      n.includes('testa') ||
      n.includes('martelo') ||
      n.includes('antibraco') ||
      n.includes('braco')
    ) {
      return 'arms';
    }
    if (
      n.includes('agachamento') ||
      n.includes('leg press') ||
      n.includes('extensora') ||
      n.includes('quadriceps') ||
      n.includes('passada') ||
      n.includes('afundo') ||
      n.includes('hack') ||
      n.includes('sissy')
    ) {
      return 'quads';
    }
    if (
      n.includes('flexora') ||
      n.includes('stiff') ||
      n.includes('romeno') ||
      n.includes('isquiotibial') ||
      n.includes('isquiotibiais') ||
      n.includes('posterior') ||
      n.includes('terra') ||
      n.includes('gluteo') ||
      n.includes('elevacao pelvica')
    ) {
      return 'hamstrings';
    }
    if (
      n.includes('panturrilha') ||
      n.includes('gemeos') ||
      n.includes('soleo') ||
      n.includes('tibial')
    ) {
      return 'calves';
    }
    if (
      n.includes('abdominal') ||
      n.includes('prancha') ||
      n.includes('infra') ||
      n.includes('supra') ||
      n.includes('obliquo') ||
      n.includes('core')
    ) {
      return 'abs';
    }
  }

  // 6. Último recurso por ID se nada mais encontrou
  if (currentPlan) {
    const fallbackId = currentPlan.exercises.find(e => e.id === exState.id);
    if (fallbackId?.muscleGroup) return fallbackId.muscleGroup;
  }

  return null;
}

export function calculateMuscleRecovery(
  history: WorkoutSession[],
  workouts?: Record<string, WorkoutPlan>
): {
  muscles: Record<MuscleGroup, MuscleRecoveryStatus>;
  overallPercent: number;
} {
  const now = Date.now();
  const lastTrainedTimestamp: Partial<Record<MuscleGroup, number>> = {};

  // Analisar histórico das sessões concluídas
  history.forEach(session => {
    const sessionTime = new Date(session.endedAt || session.startedAt).getTime();

    session.exercises.forEach(exState => {
      // Se teve pelo menos uma série concluída
      const hasCompletedSet = exState.sets.some(s => s.completed);
      if (hasCompletedSet) {
        const muscleGroup = resolveMuscleGroup(exState, session.workoutId, workouts);
        if (muscleGroup) {
          const prev = lastTrainedTimestamp[muscleGroup] || 0;
          if (sessionTime > prev) {
            lastTrainedTimestamp[muscleGroup] = sessionTime;
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
