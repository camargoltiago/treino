import React, { useEffect } from 'react';
import { X, ShieldAlert, CheckCircle2, Zap, Wind, AlertTriangle, ShieldCheck } from 'lucide-react';
import { EXERCISE_GUIDES } from '../data/guides';
import { WORKOUTS_DATA } from '../data/workouts';
import { ExerciseDefinition } from '../types';

interface ExerciseGuideModalProps {
  exerciseId: string | null;
  onClose: () => void;
}

export const ExerciseGuideModal: React.FC<ExerciseGuideModalProps> = ({ exerciseId, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!exerciseId) return null;

  const guide = EXERCISE_GUIDES[exerciseId];
  if (!guide) return null;

  let exDef: ExerciseDefinition | undefined;
  Object.values(WORKOUTS_DATA).forEach(plan => {
    const found = plan.exercises.find(e => e.id === exerciseId);
    if (found) exDef = found;
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-dark-surface border border-dark-borderLight rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl relative my-auto animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-dark-border flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-mint-500/20 text-mint-400 border border-mint-500/30">
                {exerciseId}
              </span>
              <span className="text-xs text-slate-400 font-medium">{exDef?.notes}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">{guide.title}</h2>
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
        <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar text-sm text-slate-300">
          
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
