import { WorkoutSession, TimerState, WorkoutPlan, MealLog, NutritionGoals, AiNutritionSettings, DeepSeekSettings, WeeklyAssessment } from '../types';
import { WORKOUTS_DATA } from '../data/workouts';

export const STORAGE_KEY = 'meu_treino_hibrido_v2';
export const WORKOUTS_STORAGE_KEY = 'meu_treino_hibrido_workouts_v2';
export const NUTRITION_STORAGE_KEY = 'meu_treino_hibrido_nutrition_v2';
export const NUTRITION_GOALS_KEY = 'meu_treino_nutrition_goals_v2';
export const AI_SETTINGS_KEY = 'meu_treino_ai_nutrition_settings_v3';
export const DEEPSEEK_SETTINGS_KEY = 'meu_treino_deepseek_settings';
export const WATER_STORAGE_KEY = 'meu_treino_water_v2';
export const COACH_ASSESSMENT_KEY = 'meu_treino_coach_assessment_v1';

export const DEFAULT_NUTRITION_GOALS: NutritionGoals = {
  calories: 2200,
  protein: 160,
  carbs: 220,
  fat: 65,
  waterMl: 2500
};

export const DEFAULT_AI_SETTINGS: AiNutritionSettings = {
  apiKey: '',
  model: 'gemini-3.8-flash',
  provider: 'gemini'
};

export const DEFAULT_DEEPSEEK_SETTINGS = DEFAULT_AI_SETTINGS;


export interface AppStoredData {
  version: string;
  updatedAt: string;
  activeSession: WorkoutSession | null;
  history: WorkoutSession[];
  workouts: Record<string, WorkoutPlan>;
  timer: Partial<TimerState>;
  soundEnabled: boolean;
  theme?: 'dark' | 'light';
}

export const StorageService = {
  load(): AppStoredData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      let workouts = { ...WORKOUTS_DATA };

      // Verificar treinos customizados salvos
      const customWorkoutsRaw = localStorage.getItem(WORKOUTS_STORAGE_KEY);
      if (customWorkoutsRaw) {
        try {
          const parsedWorkouts = JSON.parse(customWorkoutsRaw);
          if (parsedWorkouts && typeof parsedWorkouts === 'object' && Object.keys(parsedWorkouts).length > 0) {
            workouts = parsedWorkouts;
          }
        } catch (e) {
          console.warn('Erro ao carregar treinos customizados:', e);
        }
      }

      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          version: '2.0',
          updatedAt: parsed.updatedAt || new Date().toISOString(),
          activeSession: parsed.activeSession || null,
          history: Array.isArray(parsed.history) ? parsed.history : [],
          workouts: parsed.workouts && Object.keys(parsed.workouts).length > 0 ? parsed.workouts : workouts,
          timer: parsed.timer || {},
          soundEnabled: parsed.soundEnabled ?? true,
          theme: parsed.theme || 'dark'
        };
      }

      // Migração suave de v1 (se houver histórico anterior)
      const v1Raw = localStorage.getItem('meu_treino_hibrido_v1');
      if (v1Raw) {
        const v1 = JSON.parse(v1Raw);
        return {
          version: '2.0',
          updatedAt: new Date().toISOString(),
          activeSession: v1.activeSession || null,
          history: Array.isArray(v1.history) ? v1.history : [],
          workouts,
          timer: v1.timer || {},
          soundEnabled: true
        };
      }
    } catch (err) {
      console.error('Erro ao ler do localStorage:', err);
    }

    return {
      version: '2.0',
      updatedAt: new Date().toISOString(),
      activeSession: null,
      history: [],
      workouts: { ...WORKOUTS_DATA },
      timer: {},
      soundEnabled: true,
      theme: 'dark'
    };
  },

  save(data: {
    activeSession: WorkoutSession | null;
    history: WorkoutSession[];
    workouts: Record<string, WorkoutPlan>;
    timer: TimerState;
    soundEnabled: boolean;
    theme?: 'dark' | 'light';
  }) {
    try {
      const payload: AppStoredData = {
        version: '2.0',
        updatedAt: new Date().toISOString(),
        activeSession: data.activeSession,
        history: data.history,
        workouts: data.workouts,
        timer: {
          isRunning: data.timer.isRunning,
          isPaused: data.timer.isPaused,
          targetTimestamp: data.timer.targetTimestamp,
          totalSeconds: data.timer.totalSeconds,
          remainingSeconds: data.timer.remainingSeconds,
          exerciseName: data.timer.exerciseName
        },
        soundEnabled: data.soundEnabled,
        theme: data.theme || 'dark'
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      localStorage.setItem(WORKOUTS_STORAGE_KEY, JSON.stringify(data.workouts));
    } catch (err) {
      console.error('Erro ao salvar no localStorage:', err);
    }
  },

  // Carregar dados de Nutrição (refeições, metas, água, settings de IA)
  loadNutrition(): {
    meals: MealLog[];
    goals: NutritionGoals;
    waterLogs: Record<string, number>;
    deepseek: DeepSeekSettings;
  } {
    let meals: MealLog[] = [];
    let goals: NutritionGoals = { ...DEFAULT_NUTRITION_GOALS };
    let waterLogs: Record<string, number> = {};
    let deepseek: DeepSeekSettings = { ...DEFAULT_DEEPSEEK_SETTINGS };

    try {
      const rawMeals = localStorage.getItem(NUTRITION_STORAGE_KEY);
      if (rawMeals) {
        const parsed = JSON.parse(rawMeals);
        if (Array.isArray(parsed)) meals = parsed;
      }

      const rawGoals = localStorage.getItem(NUTRITION_GOALS_KEY);
      if (rawGoals) {
        const parsed = JSON.parse(rawGoals);
        if (parsed && typeof parsed === 'object') {
          goals = { ...DEFAULT_NUTRITION_GOALS, ...parsed };
        }
      }

      const rawWater = localStorage.getItem(WATER_STORAGE_KEY);
      if (rawWater) {
        const parsed = JSON.parse(rawWater);
        if (parsed && typeof parsed === 'object') waterLogs = parsed;
      }

      const rawAi = localStorage.getItem(AI_SETTINGS_KEY) || localStorage.getItem(DEEPSEEK_SETTINGS_KEY);
      if (rawAi) {
        const parsed = JSON.parse(rawAi);
        if (parsed && typeof parsed === 'object') {
          deepseek = { ...DEFAULT_AI_SETTINGS, ...parsed };
          if (!deepseek.model || deepseek.model === 'gemini-2.5-flash') {
            deepseek.model = 'gemini-3.8-flash';
          }
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados de nutrição:', err);
    }

    return { meals, goals, waterLogs, deepseek };
  },

  saveMeals(meals: MealLog[]) {
    try {
      localStorage.setItem(NUTRITION_STORAGE_KEY, JSON.stringify(meals));
    } catch (err) {
      console.error('Erro ao salvar refeições:', err);
    }
  },

  saveGoals(goals: NutritionGoals) {
    try {
      localStorage.setItem(NUTRITION_GOALS_KEY, JSON.stringify(goals));
    } catch (err) {
      console.error('Erro ao salvar metas de nutrição:', err);
    }
  },

  saveWater(waterLogs: Record<string, number>) {
    try {
      localStorage.setItem(WATER_STORAGE_KEY, JSON.stringify(waterLogs));
    } catch (err) {
      console.error('Erro ao salvar registro de água:', err);
    }
  },

  saveAiSettings(settings: AiNutritionSettings) {
    try {
      localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {
      console.error('Erro ao salvar configurações de IA:', err);
    }
  },

  loadCoachAssessment(): WeeklyAssessment | null {
    try {
      const raw = localStorage.getItem(COACH_ASSESSMENT_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Erro ao ler avaliação do Treinador IA:', err);
    }
    return null;
  },

  saveCoachAssessment(assessment: WeeklyAssessment | null) {
    try {
      if (assessment) {
        localStorage.setItem(COACH_ASSESSMENT_KEY, JSON.stringify(assessment));
      } else {
        localStorage.removeItem(COACH_ASSESSMENT_KEY);
      }
    } catch (err) {
      console.error('Erro ao salvar avaliação do Treinador IA:', err);
    }
  },

  saveDeepSeekSettings(settings: AiNutritionSettings) {
    this.saveAiSettings(settings);
  },

  // Exportar backup completo (histórico + treinos + nutrição)
  exportFullJSON(
    history: WorkoutSession[],
    activeSession: WorkoutSession | null,
    workouts: Record<string, WorkoutPlan>,
    nutrition?: { meals: MealLog[]; goals: NutritionGoals; waterLogs: Record<string, number> }
  ) {
    const payload = {
      app: 'MuscleTrack — Treino Híbrido',
      exportedAt: new Date().toISOString(),
      version: '2.0',
      type: 'full_backup',
      workouts,
      history,
      activeSession,
      nutrition: nutrition || this.loadNutrition()
    };

    this.downloadJSON(payload, `muscletrack_backup_completo_${new Date().toISOString().split('T')[0]}.json`);
  },

  // Exportar SOMENTE a estrutura de treinos (para o usuário editar ou compartilhar)
  exportWorkoutsJSON(workouts: Record<string, WorkoutPlan>) {
    const payload = {
      app: 'MuscleTrack — Treino Híbrido',
      exportedAt: new Date().toISOString(),
      version: '2.0',
      type: 'workouts_only',
      workouts
    };

    this.downloadJSON(payload, `meus_treinos_${new Date().toISOString().split('T')[0]}.json`);
  },

  downloadJSON(data: any, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  clearAll() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(WORKOUTS_STORAGE_KEY);
    localStorage.removeItem('meu_treino_hibrido_v1');
    localStorage.removeItem(NUTRITION_STORAGE_KEY);
    localStorage.removeItem(WATER_STORAGE_KEY);
  }
};
