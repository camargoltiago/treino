import React, { useEffect, useMemo } from 'react';
import { X, ShieldAlert, CheckCircle2, Zap, Wind, AlertTriangle, ShieldCheck } from 'lucide-react';
import { EXERCISE_GUIDES } from '../data/guides';
import { WORKOUTS_DATA } from '../data/workouts';
import { ExerciseDefinition, ExerciseGuide, WorkoutPlan, WorkoutSession } from '../types';
import { ExerciseStickman } from './ExerciseStickman';

interface ExerciseGuideModalProps {
  exerciseId?: string | null;
  exerciseName?: string | null;
  activeSession?: WorkoutSession | null;
  workouts?: Record<string, WorkoutPlan>;
  onClose: () => void;
}

// Busca inteligente do guia técnico oficial pelo nome do exercício
function findExerciseGuide(exerciseName?: string | null, exerciseId?: string | null): ExerciseGuide | null {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const target = exerciseName ? norm(exerciseName) : '';

  if (target) {
    // 1. Busca direta por similaridade de título
    for (const guide of Object.values(EXERCISE_GUIDES)) {
      const gTitle = norm(guide.title);
      if (gTitle === target || gTitle.includes(target) || target.includes(gTitle)) {
        return guide;
      }
    }

    // 2. Busca por padrões de exercício
    if (target.includes('leg press') && (target.includes('45') || target.includes('inclinad'))) {
      return EXERCISE_GUIDES['B2'];
    }
    if (target.includes('leg press')) {
      return EXERCISE_GUIDES['C1'];
    }
    if (target.includes('inclinad') && (target.includes('supino') || target.includes('halter'))) {
      return EXERCISE_GUIDES['A1'];
    }
    if (target.includes('supino') && (target.includes('maquina') || target.includes('articulad'))) {
      return EXERCISE_GUIDES['C3'];
    }
    if (target.includes('supino reto') || target.includes('supino')) {
      return EXERCISE_GUIDES['A3'];
    }
    if (target.includes('puxada') || target.includes('pulldown')) {
      return EXERCISE_GUIDES['A2'];
    }
    if (target.includes('remada') && (target.includes('sentad') || target.includes('cabo') || target.includes('baixa'))) {
      return EXERCISE_GUIDES['A4'];
    }
    if (target.includes('remada')) {
      return EXERCISE_GUIDES['C4'];
    }
    if (target.includes('elevacao lateral') && (target.includes('polia') || target.includes('cabo'))) {
      return EXERCISE_GUIDES['C5'];
    }
    if (target.includes('elevacao lateral') || target.includes('desenvolvimento')) {
      return EXERCISE_GUIDES['A5'];
    }
    if (target.includes('agachamento') || target.includes('squat') || target.includes('hack')) {
      return EXERCISE_GUIDES['B1'];
    }
    if (target.includes('rdl') || target.includes('stiff') || target.includes('levantamento terra') || target.includes('terra')) {
      return EXERCISE_GUIDES['B3'];
    }
    if (target.includes('extensora')) {
      return EXERCISE_GUIDES['B4'];
    }
    if (target.includes('mesa flexora') || (target.includes('flexora') && target.includes('deitad'))) {
      return EXERCISE_GUIDES['B5'];
    }
    if (target.includes('flexora')) {
      return EXERCISE_GUIDES['C2'];
    }
    if (target.includes('panturrilha') && (target.includes('sentad') || target.includes('soleo'))) {
      return EXERCISE_GUIDES['C8'];
    }
    if (target.includes('panturrilha')) {
      return EXERCISE_GUIDES['B6'];
    }
    if (target.includes('martelo')) {
      return EXERCISE_GUIDES['C6'];
    }
    if (target.includes('rosca') || target.includes('biceps')) {
      return EXERCISE_GUIDES['A6'];
    }
    if (target.includes('triceps') && target.includes('corda')) {
      return EXERCISE_GUIDES['C7'];
    }
    if (target.includes('triceps')) {
      return EXERCISE_GUIDES['A7'];
    }
    if (target.includes('abdom') || target.includes('crunch')) {
      return EXERCISE_GUIDES['B7'];
    }
  }

  // 3. Fallback apenas se o ID existir e o nome for compatível ou omitido
  if (exerciseId && EXERCISE_GUIDES[exerciseId]) {
    const candidate = EXERCISE_GUIDES[exerciseId];
    if (!target) return candidate;

    // Se o nome do exercício não tiver nada a ver com o ID cadastrado, não usa ID falso
    const cTitle = norm(candidate.title);
    const words = target.split(/\s+/).filter(w => w.length >= 4);
    if (words.some(w => cTitle.includes(w))) {
      return candidate;
    }
  }

  return null;
}

export const ExerciseGuideModal: React.FC<ExerciseGuideModalProps> = ({
  exerciseId,
  exerciseName,
  activeSession,
  workouts,
  onClose
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const resolved = useMemo(() => {
    if (!exerciseId && !exerciseName) return null;

    let exDef: ExerciseDefinition | undefined;

    // 1. Procurar no treino atualmente em andamento da sessão
    if (activeSession) {
      const activePlan = workouts?.[activeSession.workoutId] || WORKOUTS_DATA[activeSession.workoutId];
      if (activePlan) {
        exDef = activePlan.exercises.find(
          e => (exerciseId && e.id === exerciseId) || (exerciseName && e.name.toLowerCase() === exerciseName.toLowerCase())
        );
      }
    }

    // 2. Procurar em todos os treinos do usuário
    if (!exDef && workouts) {
      for (const plan of Object.values(workouts)) {
        const found = plan.exercises.find(
          e => (exerciseId && e.id === exerciseId) || (exerciseName && e.name.toLowerCase() === exerciseName.toLowerCase())
        );
        if (found) {
          exDef = found;
          break;
        }
      }
    }

    // 3. Procurar nos dados estáticos
    if (!exDef) {
      for (const plan of Object.values(WORKOUTS_DATA)) {
        const found = plan.exercises.find(
          e => (exerciseId && e.id === exerciseId) || (exerciseName && e.name.toLowerCase() === exerciseName.toLowerCase())
        );
        if (found) {
          exDef = found;
          break;
        }
      }
    }

    const finalName = exDef?.name || exerciseName || (exerciseId && EXERCISE_GUIDES[exerciseId]?.title) || 'Exercício';
    const foundGuide = findExerciseGuide(finalName, exerciseId);

    const guide: ExerciseGuide = foundGuide || {
      title: finalName,
      targetMuscles: exDef?.muscles || (exDef?.muscleGroup ? `Foco: ${exDef.muscleGroup}` : 'Musculatura Alvo'),
      setup: 'Ajuste a carga e a postura inicial mantendo a coluna alinhada e as articulações estabilizadas.',
      execution: '1. Execute o movimento de forma controlada e sem trancos.\n2. Conduza a fase excêntrica sentindo o músculo alvo alongar.\n3. Complete a contração sem perder a postura biomecânica.',
      breathing: 'Expire durante o esforço/contração; inspire de forma controlada no retorno.',
      mistakes: 'Usar embalo excessivo; encurtar a amplitude útil; perder a estabilidade articular.',
      safety: 'Ajuste a carga para realizar as repetições com boa técnica (mantenha 1 a 2 repetições em reserva).'
    };

    return { exDef, guide, finalName };
  }, [exerciseId, exerciseName, activeSession, workouts]);

  if (!resolved) return null;
  const { exDef, guide, finalName } = resolved;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-dark-surface border border-dark-borderLight rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl relative my-auto animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-dark-border flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-mint-500/20 text-mint-400 border border-mint-500/30">
                {exDef?.id || exerciseId || 'EX'}
              </span>
              {exDef?.notes && (
                <span className="text-xs text-slate-400 font-medium">{exDef.notes}</span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">{finalName}</h2>
            <p className="text-xs text-cyan-400 font-semibold mt-0.5">{guide.targetMuscles}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-dark-card transition active:scale-95"
            aria-label="Fechar modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 custom-scrollbar text-sm text-slate-300">
          
          {/* Animação Stickman Biomecânica 2D */}
          <ExerciseStickman
            exerciseId={exDef?.id || exerciseId || undefined}
            exerciseName={finalName}
            muscleGroup={exDef?.muscleGroup}
            title={finalName}
          />

          {/* Alerta de Segurança e Dor Aguda */}
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-3.5 text-xs text-amber-200 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Técnica & Segurança:</strong> Interrompa o exercício em caso de dor articular aguda. Ajuste carga e amplitude à sua mobilidade individual. Mantenha 1 a 2 repetições em reserva.
            </p>
          </div>

          {/* Metas Planejadas */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-dark-card rounded-2xl border border-dark-border text-xs text-center">
            <div>
              <span className="text-slate-400 block font-medium">Séries</span>
              <span className="font-extrabold text-white text-sm">{exDef?.sets || 3}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Repetições</span>
              <span className="font-extrabold text-mint-400 text-sm">{exDef?.reps || '8–12'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Descanso</span>
              <span className="font-extrabold text-cyan-400 text-sm">
                {(exDef?.restSeconds || 0) > 0 ? `${exDef?.restSeconds}s` : 'Bi-set'}
              </span>
            </div>
          </div>

          {/* Detalhes */}
          <div className="space-y-3">
            <div className="bg-dark-card p-4 rounded-2xl border border-dark-border">
              <h4 className="text-xs uppercase tracking-wider font-extrabold text-mint-400 flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Posição Inicial & Setup
              </h4>
              <p className="text-xs leading-relaxed text-slate-300">{guide.setup}</p>
            </div>

            <div className="bg-dark-card p-4 rounded-2xl border border-dark-border">
              <h4 className="text-xs uppercase tracking-wider font-extrabold text-mint-400 flex items-center gap-1.5 mb-1.5">
                <Zap className="w-4 h-4" />
                Execução Passo a Passo
              </h4>
              <div className="text-xs leading-relaxed text-slate-300 whitespace-pre-line">{guide.execution}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-dark-card p-3.5 rounded-2xl border border-dark-border">
                <h4 className="text-xs uppercase tracking-wider font-extrabold text-cyan-400 flex items-center gap-1.5 mb-1.5">
                  <Wind className="w-4 h-4" />
                  Respiração
                </h4>
                <p className="text-[11px] leading-relaxed text-slate-300">{guide.breathing}</p>
              </div>

              <div className="bg-dark-card p-3.5 rounded-2xl border border-dark-border">
                <h4 className="text-xs uppercase tracking-wider font-extrabold text-rose-400 flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Erros Comuns
                </h4>
                <p className="text-[11px] leading-relaxed text-slate-300">{guide.mistakes}</p>
              </div>
            </div>

            <div className="bg-dark-card p-3.5 rounded-2xl border border-dark-border">
              <h4 className="text-xs uppercase tracking-wider font-extrabold text-amber-400 flex items-center gap-1.5 mb-1.5">
                <ShieldCheck className="w-4 h-4" />
                Dicas de Segurança e Amplitude
              </h4>
              <p className="text-[11px] leading-relaxed text-slate-300">{guide.safety}</p>
            </div>
          </div>
        </div>

        {/* Rodapé com botão de fechar */}
        <div className="p-4 border-t border-dark-border">
          <button
            onClick={onClose}
            className="w-full h-12 bg-dark-card hover:bg-dark-cardHover text-white font-extrabold rounded-2xl text-sm transition active:scale-95 border border-dark-border"
          >
            Entendi, fechar guia
          </button>
        </div>
      </div>
    </div>
  );
};
