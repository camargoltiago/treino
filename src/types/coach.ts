export interface WeeklyAssessmentStats {
  periodDays: number;
  totalWorkouts: number;
  totalSets: number;
  totalVolumeKg: number;
  totalDurationMinutes: number;
  trainedMuscles: string[];
  averageDailyCalories: number;
  averageDailyProtein: number;
  averageDailyCarbs: number;
  averageDailyFat: number;
  calorieGoalDiff: number; // Ex: -150 (déficit) ou +200 (superávit) vs meta
  proteinGoalDiff: number;
  averageDailyWaterMl: number;
  waterGoalHitDays: number;
  daysLoggedNutrition: number;
}

export interface WeeklyAssessment {
  id: string;
  createdAt: string; // ISO
  overallScore: number; // 0 a 10
  headline: string;
  summary: string;
  stats: WeeklyAssessmentStats;
  workoutAnalysis: {
    score: number;
    highlights: string[];
    improvements: string[];
    recommendations: string;
  };
  nutritionAnalysis: {
    score: number;
    highlights: string[];
    improvements: string[];
    recommendations: string;
  };
  hydrationAnalysis: {
    score: number;
    averageMl: number;
    status: 'excelente' | 'adequada' | 'insuficiente';
    recommendations: string;
  };
  nextWeekActionPlan: string[]; // 3 a 4 metas práticas
}

export interface AiWorkoutPlanItem {
  id?: string;
  code: string;
  title: string;
  shortTitle: string;
  focus: string;
  dayLabel: string;
  estimatedMinutes: number;
  exercises: {
    name: string;
    muscleGroup: 'chest' | 'back' | 'shoulders' | 'arms' | 'quads' | 'hamstrings' | 'calves' | 'abs';
    sets: number;
    reps: string;
    restSeconds: number;
    notes: string;
    targetLoadKg?: number;
    isDumbbell?: boolean;
  }[];
}

export interface AiWorkoutGenerationResult {
  message: string;
  isFullRoutine: boolean;
  workouts: AiWorkoutPlanItem[];
}
