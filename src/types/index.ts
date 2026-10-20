export type WorkoutId = string;

export type MuscleGroup = 
  | 'chest' 
  | 'back' 
  | 'shoulders' 
  | 'arms' 
  | 'quads' 
  | 'hamstrings' 
  | 'calves' 
  | 'abs';

export interface ExerciseDefinition {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes: string;
  targetLoadKg?: number;
  isDumbbell?: boolean;
  isBiSetFirst?: boolean;
  isBiSetSecond?: boolean;
  biSetPartnerId?: string;
  hasDropSetOption?: boolean;
  muscles?: string;
  muscleGroup: MuscleGroup;
}

export interface WorkoutPlan {
  id: WorkoutId;
  code: string;
  dayLabel: string;
  title: string;
  shortTitle: string;
  focus: string;
  dayOfWeekSuggested?: number; // 1 = Seg, 3 = Qua, 5 = Sex
  estimatedMinutes?: number;
  totalPlannedSets: number;
  exercises: ExerciseDefinition[];
}

export interface ExerciseGuide {
  title: string;
  targetMuscles: string;
  setup: string;
  execution: string;
  breathing: string;
  mistakes: string;
  safety: string;
}

export interface SetRecord {
  setIndex: number;
  type: 'normal' | 'extra' | 'dropset';
  weightKg: string | number;
  reps: string | number;
  completed: boolean;
  referenceWeight?: string | number;
}

export interface ExerciseSessionState {
  id: string;
  name: string;
  completed: boolean;
  notes: string;
  sets: SetRecord[];
}

export interface WorkoutSession {
  id: string;
  workoutId: WorkoutId;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  status: 'em_andamento' | 'concluido';
  exercises: ExerciseSessionState[];
  completedSetsCount?: number;
  totalVolumeKg?: number;
}

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  targetTimestamp: number | null;
  remainingSeconds: number;
  totalSeconds: number;
  exerciseName: string;
}

export interface MuscleRecoveryStatus {
  group: MuscleGroup;
  label: string;
  percent: number;
  status: 'ready' | 'recovering' | 'rest';
  lastTrainedDays: number | null;
  suggestedRestHours: number;
}

export * from './nutrition';

