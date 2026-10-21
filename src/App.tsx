import React, { useState, useEffect, useRef } from 'react';
import { WorkoutId, WorkoutSession, TimerState, WorkoutPlan, MealLog, NutritionGoals, AiNutritionSettings } from './types';
import { WORKOUTS_DATA } from './data/workouts';
import { StorageService } from './services/storage';
import { notifyTimerFinished, playWarningBeep } from './services/audio';
import { calculateMuscleRecovery } from './services/recovery';

import { Header } from './components/Header';
import { Navbar, TabType } from './components/Navbar';
import { RestTimer } from './components/RestTimer';
import { ExerciseGuideModal } from './components/ExerciseGuideModal';
import { FinishWorkoutModal } from './components/FinishWorkoutModal';
import { FeedbackOverlay } from './components/FeedbackOverlay';
import { feedback } from './services/feedback';

import { TodayView } from './views/TodayView';
import { WorkoutListView } from './views/WorkoutListView';
import { ActiveWorkoutView } from './views/ActiveWorkoutView';
import { MuscleRecoveryView } from './views/MuscleRecoveryView';
import { ProgressView } from './views/ProgressView';
import { HistoryBackupView } from './views/HistoryBackupView';
import { NutritionView } from './views/NutritionView';

export const App: React.FC = () => {
  // Estado carregado do localStorage
  const initialData = StorageService.load();
  const initialNutrition = StorageService.loadNutrition();

  const [currentTab, setCurrentTab] = useState<TabType>('today');
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(initialData.activeSession);
  const [history, setHistory] = useState<WorkoutSession[]>(initialData.history);
  const [workouts, setWorkouts] = useState<Record<string, WorkoutPlan>>(initialData.workouts || { ...WORKOUTS_DATA });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(initialData.soundEnabled);
  const [theme, setTheme] = useState<'dark' | 'light'>(initialData.theme || 'dark');

  // Estados de Nutrição & Calorias
  const [meals, setMeals] = useState<MealLog[]>(initialNutrition.meals);
  const [goals, setGoals] = useState<NutritionGoals>(initialNutrition.goals);
  const [waterLogs, setWaterLogs] = useState<Record<string, number>>(initialNutrition.waterLogs);
  const [aiSettings, setAiSettings] = useState<AiNutritionSettings>(initialNutrition.deepseek);

  // Manipuladores de Nutrição
  const handleSaveMeal = (newMeal: MealLog) => {
    setMeals((prev) => {
      const updated = [newMeal, ...prev];
      StorageService.saveMeals(updated);
      return updated;
    });
  };

  const handleDeleteMeal = (mealId: string) => {
    setMeals((prev) => {
      const updated = prev.filter((m) => m.id !== mealId);
      StorageService.saveMeals(updated);
      return updated;
    });
  };

  const handleUpdateWater = (date: string, amountMl: number) => {
    setWaterLogs((prev) => {
      const updated = { ...prev, [date]: amountMl };
      StorageService.saveWater(updated);
      return updated;
    });
  };

  const handleSaveNutritionSettings = (newSettings: AiNutritionSettings, newGoals: NutritionGoals) => {
    setAiSettings(newSettings);
    setGoals(newGoals);
    StorageService.saveAiSettings(newSettings);
    StorageService.saveGoals(newGoals);
  };

  const handleRestoreNutrition = (nutrition: any) => {
    if (nutrition) {
      if (Array.isArray(nutrition.meals)) {
        setMeals(nutrition.meals);
        StorageService.saveMeals(nutrition.meals);
      }
      if (nutrition.goals) {
        setGoals(nutrition.goals);
        StorageService.saveGoals(nutrition.goals);
      }
      if (nutrition.waterLogs) {
        setWaterLogs(nutrition.waterLogs);
        StorageService.saveWater(nutrition.waterLogs);
      }
    }
  };

  // Aplicar tema no elemento raiz do documento
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Estado do Cronômetro
  const [timer, setTimer] = useState<TimerState>({
    isRunning: initialData.timer?.isRunning || false,
    isPaused: initialData.timer?.isPaused || false,
    targetTimestamp: initialData.timer?.targetTimestamp || null,
    remainingSeconds: initialData.timer?.remainingSeconds || 0,
    totalSeconds: initialData.timer?.totalSeconds || 0,
    exerciseName: initialData.timer?.exerciseName || ''
  });

  // Modais
  const [guideExerciseId, setGuideExerciseId] = useState<string | null>(null);
  const [showFinishModal, setShowFinishModal] = useState<boolean>(false);

  // PWA beforeinstallprompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Salvar no localStorage sempre que o estado mudar
  useEffect(() => {
    StorageService.save({
      activeSession,
      history,
      workouts,
      timer,
      soundEnabled,
      theme
    });
  }, [activeSession, history, workouts, timer, soundEnabled, theme]);

  // Se houver sessão em andamento ao abrir, navega para o treino
  useEffect(() => {
    if (activeSession && activeSession.status === 'em_andamento') {
      setCurrentTab('workouts');
    }
  }, []);

  // Intervalo do Cronômetro de Descanso
  const timerIntervalRef = useRef<number | null>(null);
  const lastAlertedSecondRef = useRef<number | null>(null);

  useEffect(() => {
    if (timer.isRunning && !timer.isPaused && timer.targetTimestamp) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      timerIntervalRef.current = window.setInterval(() => {
        const now = Date.now();
        const diff = Math.round((timer.targetTimestamp! - now) / 1000);

        // Bips de contagem regressiva nos segundos 3, 2 e 1
        if (diff === 3 && lastAlertedSecondRef.current !== 3) {
          lastAlertedSecondRef.current = 3;
          playWarningBeep(soundEnabled);
        } else if (diff === 2 && lastAlertedSecondRef.current !== 2) {
          lastAlertedSecondRef.current = 2;
          playWarningBeep(soundEnabled);
        } else if (diff === 1 && lastAlertedSecondRef.current !== 1) {
          lastAlertedSecondRef.current = 1;
          playWarningBeep(soundEnabled);
        }

        if (diff <= 0) {
          clearInterval(timerIntervalRef.current!);
          lastAlertedSecondRef.current = null;
          setTimer(prev => {
            notifyTimerFinished(prev.exerciseName, soundEnabled);
            return {
              ...prev,
              isRunning: false,
              remainingSeconds: 0,
              targetTimestamp: null
            };
          });
        } else {
          setTimer(prev => ({ ...prev, remainingSeconds: diff }));
        }
      }, 500);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timer.isRunning, timer.isPaused, timer.targetTimestamp, soundEnabled]);

  // Funções do Cronômetro
  const startTimer = (seconds: number, exerciseName: string) => {
    if (seconds <= 0) return;
    lastAlertedSecondRef.current = null;
    const now = Date.now();
    setTimer({
      isRunning: true,
      isPaused: false,
      totalSeconds: seconds,
      remainingSeconds: seconds,
      targetTimestamp: now + seconds * 1000,
      exerciseName
    });
  };

  const adjustTimer = (delta: number) => {
    lastAlertedSecondRef.current = null;
    if (!timer.isRunning) {
      startTimer(Math.max(15, delta), 'Descanso rápido');
      return;
    }
    if (timer.isPaused) {
      setTimer(prev => ({ ...prev, remainingSeconds: Math.max(5, prev.remainingSeconds + delta) }));
    } else {
      const newTarget = (timer.targetTimestamp || Date.now()) + delta * 1000;
      const rem = Math.max(5, Math.round((newTarget - Date.now()) / 1000));
      setTimer(prev => ({ ...prev, targetTimestamp: newTarget, remainingSeconds: rem }));
    }
  };

  const toggleTimerPause = () => {
    if (!timer.isRunning) return;
    if (timer.isPaused) {
      setTimer(prev => ({
        ...prev,
        isPaused: false,
        targetTimestamp: Date.now() + prev.remainingSeconds * 1000
      }));
    } else {
      const rem = Math.max(0, Math.round(((timer.targetTimestamp || Date.now()) - Date.now()) / 1000));
      setTimer(prev => ({ ...prev, isPaused: true, remainingSeconds: rem }));
    }
  };

  const skipTimer = () => {
    lastAlertedSecondRef.current = null;
    setTimer(prev => ({ ...prev, isRunning: false, remainingSeconds: 0, targetTimestamp: null }));
  };

  // Funções da Sessão de Treino
  const handleStartWorkout = async (workoutId: WorkoutId) => {
    const plan = workouts[workoutId] || WORKOUTS_DATA[workoutId];
    if (!plan) return;

    if (activeSession && activeSession.status === 'em_andamento') {
      if (activeSession.workoutId === workoutId) {
        setCurrentTab('workouts');
        return;
      }
      const confirmed = await feedback.confirm({
        title: 'Treino em Andamento',
        message: 'Existe um treino em andamento. Deseja cancelar para iniciar este novo?',
        variant: 'warning',
        confirmText: 'Iniciar Novo'
      });
      if (!confirmed) return;
    }

    // Buscar referências de cargas passadas
    const lastLoadsMap: Record<string, string | number> = {};
    history.forEach(sess => {
      sess.exercises?.forEach(ex => {
        if (!lastLoadsMap[ex.id]) {
          const valid = ex.sets.find(s => s.completed && s.weightKg !== '');
          if (valid) lastLoadsMap[ex.id] = valid.weightKg;
        }
      });
    });

    const newSession: WorkoutSession = {
      id: 'sess_' + Date.now(),
      workoutId,
      startedAt: new Date().toISOString(),
      endedAt: null,
      durationSeconds: 0,
      status: 'em_andamento',
      exercises: plan.exercises.map(ex => {
        const setsArr = [];
        for (let i = 1; i <= ex.sets; i++) {
          setsArr.push({
            setIndex: i,
            type: 'normal' as const,
            weightKg: '',
            reps: '',
            completed: false,
            referenceWeight: lastLoadsMap[ex.id] || ''
          });
        }
        return {
          id: ex.id,
          name: ex.name,
          completed: false,
          notes: '',
          sets: setsArr
        };
      })
    };

    setActiveSession(newSession);
    setCurrentTab('workouts');
  };

  const handleUpdateSet = (exerciseId: string, setIndex: number, field: 'weightKg' | 'reps', value: string) => {
    if (!activeSession) return;
    const updated = { ...activeSession };
    const ex = updated.exercises.find(e => e.id === exerciseId);
    if (!ex || !ex.sets[setIndex]) return;

    if (field === 'weightKg') {
      const val = value.trim().replace(',', '.');
      ex.sets[setIndex].weightKg = val === '' ? '' : Math.max(0, parseFloat(val) || 0);
    } else {
      const val = value.trim();
      ex.sets[setIndex].reps = val === '' ? '' : Math.max(0, parseInt(val, 10) || 0);
    }

    setActiveSession(updated);
  };

  const handleToggleSet = (exerciseId: string, setIndex: number) => {
    if (!activeSession) return;
    const updated = { ...activeSession };
    const ex = updated.exercises.find(e => e.id === exerciseId);
    if (!ex || !ex.sets[setIndex]) return;

    const set = ex.sets[setIndex];
    const plan = workouts[activeSession.workoutId] || WORKOUTS_DATA[activeSession.workoutId];
    const exMeta = plan?.exercises.find(e => e.id === exerciseId);

    if (!set.completed) {
      if (set.weightKg === '' || isNaN(Number(set.weightKg)) || Number(set.weightKg) < 0) {
        feedback.warning('Digite a carga em kg antes de concluir (0 para peso corporal).');
        return;
      }
      if (set.reps === '' || isNaN(Number(set.reps)) || Number(set.reps) < 0) {
        feedback.warning('Digite as repetições realizadas antes de concluir.');
        return;
      }

      set.completed = true;

      // Regra Bi-Set: A6 e C6 não disparam cronômetro
      if (exMeta?.isBiSetFirst) {
        // Nada de timer até concluir o par
      } else {
        const rest = exMeta?.restSeconds !== undefined ? exMeta.restSeconds : 90;
        if (rest > 0) {
          startTimer(rest, ex.name);
        }
      }
    } else {
      set.completed = false;
    }

    setActiveSession(updated);
  };

  const handleAddExtraSet = (exerciseId: string) => {
    if (!activeSession) return;
    const updated = { ...activeSession };
    const ex = updated.exercises.find(e => e.id === exerciseId);
    if (!ex) return;

    const last = ex.sets[ex.sets.length - 1];
    ex.sets.push({
      setIndex: ex.sets.length + 1,
      type: 'extra',
      weightKg: last ? last.weightKg : '',
      reps: '',
      completed: false
    });
    setActiveSession(updated);
  };

  const handleAddDropSet = (exerciseId: string) => {
    if (!activeSession) return;
    const updated = { ...activeSession };
    const ex = updated.exercises.find(e => e.id === exerciseId);
    if (!ex) return;

    const last = ex.sets[ex.sets.length - 1];
    let dropW: string | number = '';
    if (last && last.weightKg !== '') {
      const w = parseFloat(String(last.weightKg));
      if (w > 0) dropW = Math.round(w * 0.7 * 2) / 2;
    }

    ex.sets.push({
      setIndex: ex.sets.length + 1,
      type: 'dropset',
      weightKg: dropW,
      reps: '',
      completed: false
    });
    setActiveSession(updated);
  };

  const handleDeleteSet = (exerciseId: string, setIndex: number) => {
    if (!activeSession) return;
    const updated = { ...activeSession };
    const ex = updated.exercises.find(e => e.id === exerciseId);
    if (!ex) return;

    ex.sets.splice(setIndex, 1);
    setActiveSession(updated);
  };

  const handleToggleExerciseComplete = async (exerciseId: string) => {
    if (!activeSession) return;
    const updated = { ...activeSession };
    const ex = updated.exercises.find(e => e.id === exerciseId);
    if (!ex) return;

    if (!ex.completed) {
      const done = ex.sets.filter(s => s.completed).length;
      const plan = workouts[activeSession.workoutId] || WORKOUTS_DATA[activeSession.workoutId];
      const planned = plan?.exercises.find(e => e.id === exerciseId)?.sets || 3;
      if (done < planned) {
        const confirmed = await feedback.confirm({
          title: 'Séries Pendentes',
          message: `Você fez ${done} de ${planned} séries previstas. Concluir exercício com a contagem real?`,
          variant: 'primary',
          confirmText: 'Concluir'
        });
        if (!confirmed) return;
      }
      ex.completed = true;
    } else {
      ex.completed = false;
    }
    setActiveSession(updated);
  };

  const handleUpdateNotes = (exerciseId: string, notes: string) => {
    if (!activeSession) return;
    const updated = { ...activeSession };
    const ex = updated.exercises.find(e => e.id === exerciseId);
    if (ex) {
      ex.notes = notes;
      setActiveSession(updated);
    }
  };

  const handleConfirmFinishWorkout = () => {
    if (!activeSession) return;
    const now = new Date();
    const startTime = new Date(activeSession.startedAt).getTime();
    const durationSeconds = Math.max(60, Math.round((now.getTime() - startTime) / 1000));

    let completedSetsCount = 0;
    let volumeTotal = 0;

    activeSession.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.completed) {
          completedSetsCount++;
          volumeTotal += (parseFloat(String(s.weightKg)) || 0) * (parseInt(String(s.reps), 10) || 0);
        }
      });
    });

    const finishedSession: WorkoutSession = {
      ...activeSession,
      status: 'concluido',
      endedAt: now.toISOString(),
      durationSeconds,
      completedSetsCount,
      totalVolumeKg: volumeTotal
    };

    setHistory(prev => [finishedSession, ...prev]);
    setActiveSession(null);
    skipTimer();
    setShowFinishModal(false);
    setCurrentTab('history');
    feedback.success('Treino concluído com sucesso!');
  };

  const handleCancelWorkout = async () => {
    const confirmed = await feedback.confirm({
      title: 'Cancelar Treino?',
      message: 'Todos os registros desta sessão em andamento serão descartados.',
      variant: 'danger',
      confirmText: 'Sim, Cancelar'
    });
    if (confirmed) {
      setActiveSession(null);
      skipTimer();
      setCurrentTab('today');
      feedback.info('Treino cancelado.');
    }
  };

  // Funções de Gerenciamento de Treinos
  const handleSaveWorkout = (updatedWorkout: WorkoutPlan) => {
    setWorkouts(prev => ({
      ...prev,
      [updatedWorkout.id]: updatedWorkout
    }));
  };

  const handleDeleteWorkout = (workoutId: string) => {
    setWorkouts(prev => {
      const copy = { ...prev };
      delete copy[workoutId];
      return copy;
    });
  };

  const handleAddWorkout = (newWorkout: WorkoutPlan) => {
    setWorkouts(prev => ({
      ...prev,
      [newWorkout.id]: newWorkout
    }));
  };

  const handleExportWorkouts = () => {
    StorageService.exportWorkoutsJSON(workouts);
  };

  const handleImportWorkouts = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      let loadedWorkouts: Record<string, WorkoutPlan> | null = null;
      if (parsed && parsed.workouts && typeof parsed.workouts === 'object') {
        loadedWorkouts = parsed.workouts;
      } else if (parsed && typeof parsed === 'object' && !parsed.history) {
        loadedWorkouts = parsed;
      }

      if (loadedWorkouts && Object.keys(loadedWorkouts).length > 0) {
        setWorkouts(loadedWorkouts);
        feedback.success(`Sucesso! ${Object.keys(loadedWorkouts).length} treinos importados.`);
      } else {
        feedback.error('Arquivo JSON de treinos inválido ou vazio.');
      }
    } catch (e) {
      feedback.error('Erro ao processar o arquivo JSON de treinos.');
    }
  };

  const handleResetWorkoutsToDefault = () => {
    setWorkouts({ ...WORKOUTS_DATA });
    feedback.success('Treinos restaurados para os padrões originais (Treino A, B e C).');
  };

  // Análise de Recuperação Muscular
  const recoveryData = calculateMuscleRecovery(history);

  // Resumo de Nutrição para exibição no TodayView
  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayDateStr = getTodayDateStr();
  const todayMeals = meals.filter((m) => m.date === todayDateStr);
  const todayCalories = todayMeals.reduce((acc, m) => acc + (m.totalCalories || 0), 0);
  const nutritionSummary = {
    consumed: todayCalories,
    goal: goals.calories,
    remaining: goals.calories - todayCalories
  };

  const todayWater = waterLogs[todayDateStr] || 0;
  const waterSummary = {
    consumed: todayWater,
    goal: goals.waterMl,
    percent: Math.min(100, Math.round((todayWater / goals.waterMl) * 100)) || 0
  };

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Top Header */}
      <Header
        activeSession={activeSession}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(prev => !prev)}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
        onOpenActiveSession={() => setCurrentTab('workouts')}
        canInstallPwa={!!deferredPrompt}
        onInstallPwa={handleInstallPwa}
      />

      {/* Main Container com espaçamento seguro para menus inferiores */}
      <main className="flex-1 max-w-md sm:max-w-xl mx-auto w-full p-4 pb-36">
        {currentTab === 'today' && (
          <TodayView
            activeSession={activeSession}
            history={history}
            workouts={workouts}
            recovery={recoveryData.muscles}
            overallRecoveryPercent={recoveryData.overallPercent}
            nutritionSummary={nutritionSummary}
            waterSummary={waterSummary}
            onAddWaterToday={(delta) => handleUpdateWater(todayDateStr, Math.max(0, todayWater + delta))}
            onStartWorkout={handleStartWorkout}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'nutrition' && (
          <NutritionView
            meals={meals}
            goals={goals}
            waterLogs={waterLogs}
            deepseekSettings={aiSettings}
            onSaveMeal={handleSaveMeal}
            onDeleteMeal={handleDeleteMeal}
            onUpdateWater={handleUpdateWater}
            onSaveSettings={handleSaveNutritionSettings}
          />
        )}

        {currentTab === 'workouts' && (
          activeSession && activeSession.status === 'em_andamento' ? (
            <ActiveWorkoutView
              session={activeSession}
              workouts={workouts}
              onUpdateSet={handleUpdateSet}
              onToggleSet={handleToggleSet}
              onAddExtraSet={handleAddExtraSet}
              onAddDropSet={handleAddDropSet}
              onDeleteSet={handleDeleteSet}
              onToggleExerciseComplete={handleToggleExerciseComplete}
              onUpdateNotes={handleUpdateNotes}
              onOpenGuide={(id) => setGuideExerciseId(id)}
              onFinishWorkout={() => setShowFinishModal(true)}
              onCancelWorkout={handleCancelWorkout}
              onBack={() => setCurrentTab('today')}
            />
          ) : (
            <WorkoutListView
              workouts={workouts}
              activeSession={activeSession}
              history={history}
              onStartWorkout={handleStartWorkout}
              onOpenGuide={(id) => setGuideExerciseId(id)}
              onSaveWorkout={handleSaveWorkout}
              onDeleteWorkout={handleDeleteWorkout}
              onAddWorkout={handleAddWorkout}
            />
          )
        )}

        {currentTab === 'recovery' && (
          <MuscleRecoveryView
            recovery={recoveryData.muscles}
            overallRecoveryPercent={recoveryData.overallPercent}
          />
        )}

        {currentTab === 'progress' && (
          <ProgressView history={history} />
        )}

        {currentTab === 'history' && (
          <HistoryBackupView
            history={history}
            workouts={workouts}
            onDeleteSession={(id) => setHistory(prev => prev.filter(s => s.id !== id))}
            onRestoreBackup={(newHistory, newActive) => {
              setHistory(newHistory);
              setActiveSession(newActive);
            }}
            onRestoreWorkouts={(newWorkouts) => setWorkouts(newWorkouts)}
            onRestoreNutrition={handleRestoreNutrition}
            onResetWorkoutsToDefault={handleResetWorkoutsToDefault}
            onResetAll={() => {
              StorageService.clearAll();
              setHistory([]);
              setActiveSession(null);
              setWorkouts({ ...WORKOUTS_DATA });
              setMeals([]);
              setWaterLogs({});
              skipTimer();
              setCurrentTab('today');
            }}
            activeSession={activeSession}
          />
        )}
      </main>

      {/* Cronômetro Flutuante Acoplado Acima da Barra Inferior */}
      <RestTimer
        timer={timer}
        onAdjust={adjustTimer}
        onTogglePause={toggleTimerPause}
        onSkip={skipTimer}
      />

      {/* Barra de Navegação Inferior Fixa */}
      <Navbar
        currentTab={currentTab}
        onChangeTab={(tab) => setCurrentTab(tab)}
        hasActiveSession={activeSession?.status === 'em_andamento'}
      />

      {/* Modal Técnico do Exercício ("Como Fazer?") */}
      <ExerciseGuideModal
        exerciseId={guideExerciseId}
        onClose={() => setGuideExerciseId(null)}
      />

      {/* Modal de Finalização de Treino */}
      <FinishWorkoutModal
        session={showFinishModal ? activeSession : null}
        onConfirm={handleConfirmFinishWorkout}
        onCancel={() => setShowFinishModal(false)}
      />

      {/* Overlay Global de Toasts e Confirmações Estilizadas */}
      <FeedbackOverlay />

    </div>
  );
};
export default App;
