import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Clock, CheckCircle2, Dumbbell, AlertTriangle } from 'lucide-react';
import { WorkoutSession } from '../types';
import { WORKOUTS_DATA } from '../data/workouts';

interface FinishWorkoutModalProps {
  session: WorkoutSession | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const FinishWorkoutModal: React.FC<FinishWorkoutModalProps> = ({
  session,
  onConfirm,
  onCancel
}) => {
  useEffect(() => {
    if (session) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00E599', '#38BDF8', '#F59E0B']
      });
    }
  }, [session]);

  if (!session) return null;

  const plan = WORKOUTS_DATA[session.workoutId];
  const startTime = new Date(session.startedAt).getTime();
  const now = Date.now();
  const durationSeconds = Math.max(60, Math.round((now - startTime) / 1000));
  const durationMins = Math.round(durationSeconds / 60);

  let totalSetsDone = 0;
  let totalExercisesDone = 0;
  let totalVolumeKg = 0;
  const pendingExercises: string[] = [];

  session.exercises.forEach(ex => {
    let setsDoneInEx = 0;
    ex.sets.forEach(s => {
      if (s.completed) {
        totalSetsDone++;
        setsDoneInEx++;
        const w = parseFloat(String(s.weightKg)) || 0;
        const r = parseInt(String(s.reps), 10) || 0;
        totalVolumeKg += (w * r);
      }
    });

    const exMeta = plan.exercises.find(e => e.id === ex.id);
    const plannedSets = exMeta?.sets || 3;
    if (setsDoneInEx < plannedSets) {
      pendingExercises.push(`${ex.id} - ${ex.name} (${setsDoneInEx}/${plannedSets})`);
    } else {
      totalExercisesDone++;
    }
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-dark-surface border border-dark-borderLight rounded-3xl max-w-sm sm:max-w-md w-full p-6 shadow-2xl space-y-5 my-auto animate-in zoom-in-95 duration-150 text-center">
        
        {/* Ícone Troféu com Brilho Neon */}
        <div className="w-16 h-16 rounded-3xl bg-mint-500/20 text-mint-400 mx-auto flex items-center justify-center border border-mint-500/30 shadow-mint-glow">
          <Trophy className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-xl font-black text-white">Treino Concluído!</h3>
          <p className="text-xs text-slate-400 mt-1">Excelente consistência. Revise suas métricas de hoje:</p>
        </div>

        {/* Métricas em Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="bg-dark-card p-3 rounded-2xl border border-dark-border text-center">
            <span className="text-slate-400 block font-medium flex items-center justify-center gap-1 mb-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Duração
            </span>
            <span className="text-xl font-black text-white font-mono">{durationMins} min</span>
          </div>

          <div className="bg-dark-card p-3 rounded-2xl border border-dark-border text-center">
            <span className="text-slate-400 block font-medium flex items-center justify-center gap-1 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-mint-400" /> Séries
            </span>
            <span className="text-xl font-black text-mint-400">{totalSetsDone} / {plan.totalPlannedSets}</span>
          </div>

          <div className="bg-dark-card p-3 rounded-2xl border border-dark-border text-center">
            <span className="text-slate-400 block font-medium flex items-center justify-center gap-1 mb-1">
              <Dumbbell className="w-3.5 h-3.5 text-cyan-400" /> Exercícios
            </span>
            <span className="text-xl font-black text-white">{totalExercisesDone} / {session.exercises.length}</span>
          </div>

          <div className="bg-dark-card p-3 rounded-2xl border border-dark-border text-center">
            <span className="text-slate-400 block font-medium mb-1">Volume Total</span>
            <span className="text-xl font-black text-cyan-400 font-mono">{totalVolumeKg.toLocaleString('pt-BR')} kg</span>
          </div>
        </div>

        {/* Alerta de séries incompletas se houver */}
        {pendingExercises.length > 0 && (
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-3 text-left text-xs text-amber-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              Exercícios com séries pendentes:
            </div>
            <ul className="list-disc list-inside text-[11px] text-slate-300">
              {pendingExercises.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
            <p className="text-[10px] text-amber-300/80 pt-0.5">O histórico salvará estritamente as séries reais realizadas.</p>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 h-12 rounded-2xl bg-dark-card hover:bg-dark-cardHover text-slate-300 text-xs font-bold transition active:scale-95 border border-dark-border"
          >
            Voltar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-12 rounded-2xl bg-mint-500 hover:bg-mint-400 text-slate-950 text-xs font-black shadow-mint-glow transition active:scale-95"
          >
            Salvar Treino
          </button>
        </div>
      </div>
    </div>
  );
};
