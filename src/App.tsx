import React, { useState, useEffect, useRef } from 'react';
import { WorkoutId, WorkoutSession, TimerState, WorkoutPlan } from './types';
import { WORKOUTS_DATA } from './data/workouts';
import { StorageService } from './services/storage';
import { notifyTimerFinished, requestNotificationPermission } from './services/audio';
import { calculateMuscleRecovery } from './services/recovery';

import { Header } from './components/Header';
import { Navbar, TabType } from './components/Navbar';
import { RestTimer } from './components/RestTimer';
import { ExerciseGuideModal } from './components/ExerciseGuideModal';
import { FinishWorkoutModal } from './components/FinishWorkoutModal';

import { TodayView } from './views/TodayView';
import { WorkoutListView } from './views/WorkoutListView';
import { ActiveWorkoutView } from './views/ActiveWorkoutView';
import { MuscleRecoveryView } from './views/MuscleRecoveryView';
import { ProgressView } from './views/ProgressView';
import { HistoryBackupView } from './views/HistoryBackupView';

export const App: React.FC = () => {
  // Estado carregado do localStorage
  const initialData = StorageService.load();

  const [currentTab, setCurrentTab] = useState<TabType>('today');
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(initialData.activeSession);
  const [history, setHistory] = useState<WorkoutSession[]>(initialData.history);
  const [workouts, setWorkouts] = useState<Record<string, WorkoutPlan>>(initialData.workouts || { ...WORKOUTS_DATA });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(initialData.soundEnabled);
  const [theme, setTheme] = useState<'dark' | 'light'>(initialData.theme || 'dark');

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

  useEffect(() => {
    if (timer.isRunning && !timer.isPaused && timer.targetTimestamp) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

      timerIntervalRef.current = window.setInterval(() => {
        const now = Date.now();
        const diff = Math.round((timer.targetTimestamp! - now) / 1000);

        if (diff <= 0) {
          clearInterval(timerIntervalRef.current!);
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
    requestNotificationPermission();
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
    setTimer(prev => ({ ...prev, isRunning: false, remainingSeconds: 0, targetTimestamp: null }));
  };

  // Funções da Sessão de Treino
  const handleStartWorkout = (workoutId: WorkoutId) => {
    const plan = workouts[workoutId] || WORKOUTS_DATA[workoutId];
    if (!plan) return;

    if (activeSession && activeSession.status === 'em_andamento') {
      if (activeSession.workoutId === workoutId) {
        setCurrentTab('workouts');
        return;
      }
      if (!window.confirm('Existe um treino em andamento. Deseja cancelar para iniciar este novo?')) {
        return;
      }
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
        alert('Digite a carga em kg antes de concluir (0 para peso corporal).');
        return;
      }
      if (set.reps === '' || isNaN(Number(set.reps)) || Number(set.reps) < 0) {
        alert('Digite as repetições realizadas antes de concluir.');
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

  const handleToggleExerciseComplete = (exerciseId: string) => {
    if (!activeSession) return;
    const updated = { ...activeSession };
    const ex = updated.exercises.find(e => e.id === exerciseId);
    if (!ex) return;

    if (!ex.completed) {
      const done = ex.sets.filter(s => s.completed).length;
      const plan = workouts[activeSession.workoutId] || WORKOUTS_DATA[activeSession.workoutId];
      const planned = plan?.exercises.find(e => e.id === exerciseId)?.sets || 3;
      if (done < planned) {
        if (!window.confirm(`Você fez ${done} de ${planned} séries. Concluir exercício com a contagem real?`)) {
          return;
        }
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
  };

  const handleCancelWorkout = () => {
    if (window.confirm('Cancelar este treino? Todos os registros desta sessão em andamento serão descartados.')) {
      setActiveSession(null);
      skipTimer();
      setCurrentTab('today');
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
        alert(`Sucesso! ${Object.keys(loadedWorkouts).length} treinos importados.`);
      } else {
        alert('Arquivo JSON de treinos inválido ou vazio.');
      }
    } catch (e) {
      alert('Erro ao processar o arquivo JSON de treinos.');
    }
  };

  const handleResetWorkoutsToDefault = () => {
    setWorkouts({ ...WORKOUTS_DATA });
    alert('Treinos restaurados para os padrões originais (Treino A, B e C).');
  };

  // Análise de Recuperação Muscular
  const recoveryData = calculateMuscleRecovery(history);

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
            onStartWorkout={handleStartWorkout}
            onNavigateTab={(tab) => setCurrentTab(tab)}
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
            onResetWorkoutsToDefault={handleResetWorkoutsToDefault}
            onResetAll={() => {
              StorageService.clearAll();
              setHistory([]);
              setActiveSession(null);
              setWorkouts({ ...WORKOUTS_DATA });
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

    </div>
  );
};
export default App;
