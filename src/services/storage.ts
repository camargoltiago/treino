import { WorkoutSession, TimerState, WorkoutPlan } from '../types';
import { WORKOUTS_DATA } from '../data/workouts';

export const STORAGE_KEY = 'meu_treino_hibrido_v2';
export const WORKOUTS_STORAGE_KEY = 'meu_treino_hibrido_workouts_v2';

export interface AppStoredData {
  version: string;
  updatedAt: string;
  activeSession: WorkoutSession | null;
  history: WorkoutSession[];
  workouts: Record<string, WorkoutPlan>;
  timer: Partial<TimerState>;
  soundEnabled: boolean;
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
          soundEnabled: parsed.soundEnabled ?? true
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
      soundEnabled: true
    };
  },

  save(data: {
    activeSession: WorkoutSession | null;
    history: WorkoutSession[];
    workouts: Record<string, WorkoutPlan>;
    timer: TimerState;
    soundEnabled: boolean;
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
        soundEnabled: data.soundEnabled
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      localStorage.setItem(WORKOUTS_STORAGE_KEY, JSON.stringify(data.workouts));
    } catch (err) {
      console.error('Erro ao salvar no localStorage:', err);
    }
  },

  // Exportar backup completo (histórico + treinos)
  exportFullJSON(history: WorkoutSession[], activeSession: WorkoutSession | null, workouts: Record<string, WorkoutPlan>) {
    const payload = {
      app: 'MuscleTrack — Treino Híbrido',
      exportedAt: new Date().toISOString(),
      version: '2.0',
      type: 'full_backup',
      workouts,
      history,
      activeSession
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
  }
};
