import React from 'react';
import { Info, Plus, Check, Trash2, ArrowLeft } from 'lucide-react';
import { WorkoutSession, WorkoutPlan } from '../types';
import { WORKOUTS_DATA } from '../data/workouts';

interface ActiveWorkoutViewProps {
  session: WorkoutSession;
  workouts: Record<string, WorkoutPlan>;
  onUpdateSet: (exerciseId: string, setIndex: number, field: 'weightKg' | 'reps', value: string) => void;
  onToggleSet: (exerciseId: string, setIndex: number) => void;
  onAddExtraSet: (exerciseId: string) => void;
  onAddDropSet: (exerciseId: string) => void;
  onDeleteSet: (exerciseId: string, setIndex: number) => void;
  onToggleExerciseComplete: (exerciseId: string) => void;
  onUpdateNotes: (exerciseId: string, notes: string) => void;
  onOpenGuide: (exerciseId: string) => void;
  onFinishWorkout: () => void;
  onCancelWorkout: () => void;
  onBack: () => void;
}

export const ActiveWorkoutView: React.FC<ActiveWorkoutViewProps> = ({
  session,
  workouts,
  onUpdateSet,
  onToggleSet,
  onAddExtraSet,
  onAddDropSet,
  onDeleteSet,
  onToggleExerciseComplete,
  onUpdateNotes,
  onOpenGuide,
  onFinishWorkout,
  onCancelWorkout,
  onBack
}) => {
  const plan = workouts[session.workoutId] || WORKOUTS_DATA[session.workoutId] || {
    id: session.workoutId,
    code: '?',
    title: 'Treino',
    shortTitle: 'Treino',
    dayLabel: 'Personalizado',
    focus: 'Treino',
    estimatedMinutes: 60,
    totalPlannedSets: session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0),
    exercises: []
  };

  // Métricas de progresso
  const totalPlannedSets = plan.totalPlannedSets || session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0) || 1;
  let completedNormalSets = 0;
  let completedExercisesCount = 0;

  session.exercises.forEach(ex => {
    if (ex.completed) completedExercisesCount++;
    ex.sets.forEach(s => {
      if (s.completed && s.type === 'normal') completedNormalSets++;
    });
  });

  const progressPercent = Math.min(100, Math.round((completedNormalSets / totalPlannedSets) * 100));

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Barra de Topo da Sessão */}
      <div className="bg-dark-card border border-dark-border rounded-3xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-dark-surface border border-dark-border active:scale-95 transition"
              title="Voltar ao início"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-mint-500/20 text-mint-400 border border-mint-500/30">
                  Treino {plan.code}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">{plan.dayLabel}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">{plan.shortTitle}</h2>
            </div>
          </div>

          <button
            onClick={onFinishWorkout}
            className="h-10 px-4 bg-mint-500 hover:bg-mint-400 text-slate-950 font-black text-xs rounded-xl shadow-mint-glow transition flex items-center gap-1.5 active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Finalizar</span>
          </button>
        </div>

        {/* Barra de Progresso Visual */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Séries: <strong className="text-mint-400 font-mono">{completedNormalSets}</strong> de <strong>{totalPlannedSets}</strong></span>
            <span>Exercícios: <strong className="text-white font-mono">{completedExercisesCount}</strong> de <strong>{session.exercises.length}</strong></span>
          </div>
          <div className="w-full bg-dark-surface rounded-full h-2 overflow-hidden border border-dark-border">
            <div
              className="bg-gradient-to-r from-mint-500 to-accent-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Lista de Cards dos Exercícios */}
      <div className="space-y-4">
        {session.exercises.map(ex => {
          const exMeta = plan.exercises.find(e => e.id === ex.id);
          const isDumbbell = !!exMeta?.isDumbbell;
          const hasDropSet = !!exMeta?.hasDropSetOption;
          const isBiSet = !!exMeta?.isBiSetFirst || !!exMeta?.isBiSetSecond;
          const isDone = ex.completed;

          return (
            <div
              key={ex.id}
              className={`bg-dark-card border rounded-3xl p-4 sm:p-5 shadow-xl transition-all ${
                isDone
                  ? 'border-mint-500/50 bg-dark-card/95'
                  : 'border-dark-border'
              }`}
            >
              {/* Header do Exercício */}
              <div className="border-b border-dark-border pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-dark-surface text-mint-400 font-black text-xs flex items-center justify-center border border-dark-border font-mono shrink-0">
                      {ex.id}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white truncate">{ex.name}</h3>
                  </div>

                  <button
                    onClick={() => onOpenGuide(ex.id)}
                    className="h-8 px-2.5 bg-dark-surface hover:bg-dark-cardHover text-cyan-400 border border-dark-border rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 active:scale-95"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>Guia</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1.5 flex-wrap">
                  <span>Meta: <strong className="text-mint-400 font-semibold">{exMeta ? `${exMeta.sets}s × ${exMeta.reps} reps` : `${ex.sets.length} séries`}</strong></span>
                  <span>•</span>
                  <span>Descanso: <strong className="text-cyan-400 font-semibold">{exMeta && exMeta.restSeconds > 0 ? `${exMeta.restSeconds}s` : exMeta ? 'Bi-set' : '90s'}</strong></span>
                  {isDone && (
                    <span className="bg-mint-500/15 text-mint-400 border border-mint-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto">
                      Concluído ✅
                    </span>
                  )}
                </div>

                {isDumbbell && (
                  <div className="text-[10px] text-amber-300 font-medium mt-1">
                    Obs.: Carga <strong>por halter</strong> (ex: 20 kg em cada mão).
                  </div>
                )}
                {isBiSet && (
                  <div className="text-[10px] text-cyan-300 font-medium mt-0.5">
                    ⚡ {exMeta?.notes}
                  </div>
                )}
              </div>

              {/* Linhas das Séries (Ergonomia com 1 Mão no Celular) */}
              <div className="mt-3 space-y-2.5">
                {ex.sets.map((s, sIndex) => {
                  const isComplete = s.completed;
                  const isExtra = s.type === 'extra';
                  const isDrop = s.type === 'dropset';

                  let label = `S${s.setIndex}`;
                  if (isExtra) label = 'Extra';
                  if (isDrop) label = 'Drop';

                  const placeholderWeight = s.referenceWeight ? String(s.referenceWeight) : '0';

                  return (
                    <div
                      key={sIndex}
                      className={`flex items-center gap-2 p-2 rounded-2xl transition-all ${
                        isComplete
                          ? 'bg-mint-950/25 border border-mint-500/40'
                          : 'bg-dark-surface border border-dark-border'
                      }`}
                    >
                      {/* Rótulo da Série */}
                      <div className="w-11 shrink-0 text-center">
                        <span className={`text-xs font-black ${isDrop ? 'text-amber-400' : isExtra ? 'text-cyan-400' : 'text-slate-300'}`}>
                          {label}
                        </span>
                      </div>

                      {/* Input Carga (kg) - Grande para polegar */}
                      <div className="relative flex-1">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          inputMode="decimal"
                          value={s.weightKg}
                          placeholder={placeholderWeight}
                          onChange={(e) => onUpdateSet(ex.id, sIndex, 'weightKg', e.target.value)}
                          className={`w-full h-12 bg-dark-bg border rounded-xl px-3 text-base text-center font-bold focus:outline-none focus:border-mint-500 font-mono ${
                            isComplete ? 'border-mint-500/60 font-black text-mint-300' : 'border-dark-borderLight text-white'
                          }`}
                        />
                        <span className="absolute right-2 top-3.5 text-[10px] text-slate-500 pointer-events-none">kg</span>
                      </div>

                      {/* Input Reps - Grande para polegar */}
                      <div className="relative flex-1">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          inputMode="numeric"
                          value={s.reps}
                          placeholder="reps"
                          onChange={(e) => onUpdateSet(ex.id, sIndex, 'reps', e.target.value)}
                          className={`w-full h-12 bg-dark-bg border rounded-xl px-3 text-base text-center font-bold focus:outline-none focus:border-mint-500 font-mono ${
                            isComplete ? 'border-mint-500/60 font-black text-mint-300' : 'border-dark-borderLight text-white'
                          }`}
                        />
                        <span className="absolute right-2 top-3.5 text-[10px] text-slate-500 pointer-events-none">reps</span>
                      </div>

                      {/* Botão Feito com 1 Mão */}
                      <button
                        onClick={() => onToggleSet(ex.id, sIndex)}
                        className={`h-12 px-3.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 shrink-0 min-w-[76px] active:scale-95 ${
                          isComplete
                            ? 'bg-mint-500 text-slate-950 shadow-mint-glow-sm'
                            : 'bg-dark-card hover:bg-dark-cardHover text-slate-300 border border-dark-border'
                        }`}
                      >
                        {isComplete ? (
                          <>
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Feito</span>
                          </>
                        ) : (
                          <span>Feito?</span>
                        )}
                      </button>

                      {/* Excluir série extra ou drop-set */}
                      {(isExtra || isDrop) && (
                        <button
                          onClick={() => onDeleteSet(ex.id, sIndex)}
                          className="p-2 text-slate-500 hover:text-rose-400 rounded-lg active:scale-95"
                          title="Excluir série"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Botões de Ação do Exercício */}
              <div className="mt-3.5 pt-3 border-t border-dark-border/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAddExtraSet(ex.id)}
                    className="h-10 px-3 bg-dark-surface hover:bg-dark-cardHover text-cyan-400 border border-dark-border rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Série</span>
                  </button>
                  {hasDropSet && (
                    <button
                      onClick={() => onAddDropSet(ex.id)}
                      className="h-10 px-3 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-600/40 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95"
                    >
                      <span>+ Drop</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => onToggleExerciseComplete(ex.id)}
                  className={`h-10 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 ${
                    isDone
                      ? 'bg-dark-surface text-slate-300 border border-dark-border'
                      : 'bg-mint-500 hover:bg-mint-400 text-slate-950 font-black shadow-mint-glow-sm'
                  }`}
                >
                  {isDone ? (
                    <span>Reabrir</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Concluir Ex.</span>
                    </>
                  )}
                </button>
              </div>

              {/* Notas do Exercício */}
              <div className="mt-2.5">
                <input
                  type="text"
                  value={ex.notes || ''}
                  placeholder="Anotações deste exercício (ex: banco furo 3)..."
                  onChange={(e) => onUpdateNotes(ex.id, e.target.value)}
                  className="w-full h-9 bg-dark-surface border border-dark-border rounded-xl px-3 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-dark-borderLight"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Botão Largo de Finalizar no Fim da Lista (Alcance Ergonômico com 1 Mão) */}
      <div className="pt-4 pb-4 space-y-2.5">
        <button
          onClick={onFinishWorkout}
          className="w-full h-14 bg-mint-500 hover:bg-mint-400 active:scale-98 text-slate-950 rounded-3xl text-base font-black shadow-mint-glow transition flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5 stroke-[3]" />
          <span>Finalizar Treino com Sucesso</span>
        </button>
        <button
          onClick={onCancelWorkout}
          className="w-full py-2.5 text-center text-xs text-slate-400 hover:text-rose-400 transition"
        >
          Cancelar e descartar esta sessão
        </button>
      </div>

    </div>
  );
};
