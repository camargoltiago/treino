import { WorkoutPlan, WorkoutId } from '../types';

export const WORKOUTS_DATA: Record<WorkoutId, WorkoutPlan> = {
  'treino_a': {
    id: 'treino_a',
    code: 'A',
    dayLabel: 'Segunda-feira',
    title: 'Treino A — Upper Body (Hipertrofia)',
    shortTitle: 'Upper Body',
    focus: 'Peitoral, Costas, Ombros, Bíceps e Tríceps',
    dayOfWeekSuggested: 1, // 1 = Segunda
    totalPlannedSets: 21,
    exercises: [
      { id: 'A1', name: 'Supino inclinado com halteres', sets: 3, reps: '8–12', restSeconds: 120, notes: 'Peito superior; descida controlada', isDumbbell: true, muscles: 'Peitoral superior, deltoide anterior, tríceps', muscleGroup: 'chest' },
      { id: 'A2', name: 'Puxada frontal na máquina', sets: 3, reps: '8–12', restSeconds: 120, notes: 'Costas; evitar balanço do tronco', muscles: 'Latíssimo do dorso, bíceps, romboides', muscleGroup: 'back' },
      { id: 'A3', name: 'Supino reto com barra', sets: 3, reps: '8–10', restSeconds: 120, notes: 'Peito; amplitude segura', muscles: 'Peitoral médio/inferior, tríceps, ombros', muscleGroup: 'chest' },
      { id: 'A4', name: 'Remada sentada no cabo', sets: 3, reps: '10–12', restSeconds: 120, notes: 'Costas; não impulsionar com lombar', muscles: 'Trapézio médio, romboides, latíssimo', muscleGroup: 'back' },
      { id: 'A5', name: 'Elevação lateral com halteres', sets: 3, reps: '12–15', restSeconds: 75, notes: 'Ombros; controlar descida', isDumbbell: true, muscles: 'Deltoide lateral', muscleGroup: 'shoulders' },
      { id: 'A6', name: 'Rosca direta com barra', sets: 3, reps: '10–12', restSeconds: 0, notes: 'Bi-set com A7 (sem descanso imediato)', isBiSetFirst: true, biSetPartnerId: 'A7', muscles: 'Bíceps braquial, braquial', muscleGroup: 'arms' },
      { id: 'A7', name: 'Tríceps pulley com barra V', sets: 3, reps: '10–15', restSeconds: 75, notes: 'Bi-set com A6 (descansar 60–90 s após o par)', isBiSetSecond: true, biSetPartnerId: 'A6', muscles: 'Tríceps braquial', muscleGroup: 'arms' }
    ]
  },
  'treino_b': {
    id: 'treino_b',
    code: 'B',
    dayLabel: 'Quarta-feira',
    title: 'Treino B — Lower Body (Hipertrofia)',
    shortTitle: 'Lower Body',
    focus: 'Quadríceps, Isquiotibiais, Glúteos, Panturrilhas e Core',
    dayOfWeekSuggested: 3, // 3 = Quarta
    totalPlannedSets: 22,
    exercises: [
      { id: 'B1', name: 'Agachamento completo com barra', sets: 3, reps: '6–10', restSeconds: 150, notes: 'Técnica e amplitude segura', muscles: 'Quadríceps, glúteo máximo, adutores', muscleGroup: 'quads' },
      { id: 'B2', name: 'Leg press 45 graus', sets: 3, reps: '10–12', restSeconds: 150, notes: 'Controlar descida; não tirar quadril do banco', muscles: 'Quadríceps, glúteos', muscleGroup: 'quads' },
      { id: 'B3', name: 'Levantamento terra romeno com barra', sets: 3, reps: '8–12', restSeconds: 150, notes: 'Quadril para trás; coluna neutra', muscles: 'Isquiotibiais, glúteos, eretores', muscleGroup: 'hamstrings' },
      { id: 'B4', name: 'Cadeira extensora', sets: 3, reps: '12–15', restSeconds: 75, notes: 'Drop-set opcional na última série (-25% a -30% carga)', hasDropSetOption: true, muscles: 'Quadríceps isolado', muscleGroup: 'quads' },
      { id: 'B5', name: 'Mesa flexora deitada', sets: 3, reps: '10–15', restSeconds: 75, notes: 'Controlar retorno', muscles: 'Isquiotibiais (bíceps femoral)', muscleGroup: 'hamstrings' },
      { id: 'B6', name: 'Panturrilha em pé na máquina', sets: 4, reps: '12–20', restSeconds: 75, notes: 'Amplitude controlada', muscles: 'Gastrocnêmio, sóleo', muscleGroup: 'calves' },
      { id: 'B7', name: 'Abdominal na polia', sets: 3, reps: '12–15', restSeconds: 75, notes: 'Flexionar tronco, sem puxar com braços', muscles: 'Reto abdominal, oblíquos', muscleGroup: 'abs' }
    ]
  },
  'treino_c': {
    id: 'treino_c',
    code: 'C',
    dayLabel: 'Sexta-feira',
    title: 'Treino C — Full Body (Pump)',
    shortTitle: 'Full Body (Pump)',
    focus: 'Pump muscular completo, estresse metabólico e densidade',
    dayOfWeekSuggested: 5, // 5 = Sexta
    totalPlannedSets: 22,
    exercises: [
      { id: 'C1', name: 'Leg press horizontal', sets: 3, reps: '10–15', restSeconds: 105, notes: 'Quadríceps e glúteos', muscles: 'Quadríceps, glúteos', muscleGroup: 'quads' },
      { id: 'C2', name: 'Cadeira flexora sentada', sets: 3, reps: '12–15', restSeconds: 75, notes: 'Posteriores em posição alongada', muscles: 'Isquiotibiais', muscleGroup: 'hamstrings' },
      { id: 'C3', name: 'Supino reto na máquina', sets: 3, reps: '10–12', restSeconds: 105, notes: 'Peito; tensão mecânica guiada', muscles: 'Peitoral maior, tríceps', muscleGroup: 'chest' },
      { id: 'C4', name: 'Remada articulada na máquina', sets: 3, reps: '10–12', restSeconds: 105, notes: 'Costas; puxar pelos cotovelos', muscles: 'Latíssimo do dorso, romboides', muscleGroup: 'back' },
      { id: 'C5', name: 'Elevação lateral na polia', sets: 3, reps: '12–20', restSeconds: 75, notes: 'Deltoides laterais; tensão constante', muscles: 'Deltoide lateral', muscleGroup: 'shoulders' },
      { id: 'C6', name: 'Rosca martelo com corda', sets: 2, reps: '12–15', restSeconds: 0, notes: 'Bi-set com C7 (sem descanso imediato)', isBiSetFirst: true, biSetPartnerId: 'C7', muscles: 'Braquial, braquiorradial, bíceps', muscleGroup: 'arms' },
      { id: 'C7', name: 'Tríceps corda na polia', sets: 2, reps: '12–15', restSeconds: 75, notes: 'Bi-set com C6 (descansar 60–90 s após o par)', isBiSetSecond: true, biSetPartnerId: 'C6', muscles: 'Tríceps braquial', muscleGroup: 'arms' },
      { id: 'C8', name: 'Panturrilha sentada', sets: 3, reps: '12–20', restSeconds: 75, notes: 'Foco no sóleo; pausa na base e topo', muscles: 'Sóleo da panturrilha', muscleGroup: 'calves' }
    ]
  }
};
