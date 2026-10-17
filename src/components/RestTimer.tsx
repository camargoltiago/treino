import React from 'react';
import { Play, Pause, Check, Clock } from 'lucide-react';
import { TimerState } from '../types';

interface RestTimerProps {
  timer: TimerState;
  onAdjust: (seconds: number) => void;
  onTogglePause: () => void;
  onSkip: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  timer,
  onAdjust,
  onTogglePause,
  onSkip
}) => {
  if (!timer.isRunning) return null;

  const rem = Math.max(0, timer.remainingSeconds);
  const mins = Math.floor(rem / 60);
  const secs = rem % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <aside
      className="fixed bottom-16 left-0 right-0 z-40 bg-dark-surface/98 backdrop-blur-xl border-t border-mint-500/40 shadow-[0_-5px_25px_rgba(0,0,0,0.8)] transition-transform duration-300"
      aria-label="Cronômetro de descanso"
    >
      <div className="max-w-md sm:max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
        {/* Mostrador de Tempo e Exercício */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-mint-500/20 text-mint-400 flex items-center justify-center font-bold shrink-0 border border-mint-500/30">
            <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold text-slate-400 truncate tracking-wider">
              {timer.exerciseName || 'Descanso'}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white font-mono leading-none tracking-tight">
                {formatted}
              </span>
              {timer.isPaused && (
                <span className="text-[11px] text-amber-400 font-bold tracking-wide">
                  (Pausa)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Controles para Usabilidade com 1 Mão */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onAdjust(-15)}
            className="h-11 px-2.5 bg-dark-card hover:bg-dark-cardHover text-slate-200 text-xs rounded-xl font-bold border border-dark-border active:scale-95 transition"
          >
            -15s
          </button>
          <button
            onClick={() => onAdjust(15)}
            className="h-11 px-2.5 bg-dark-card hover:bg-dark-cardHover text-slate-200 text-xs rounded-xl font-bold border border-dark-border active:scale-95 transition"
          >
            +15s
          </button>

          <button
            onClick={onTogglePause}
            className="w-11 h-11 bg-dark-card hover:bg-dark-cardHover text-white rounded-xl border border-dark-border flex items-center justify-center active:scale-95 transition"
            title={timer.isPaused ? 'Retomar' : 'Pausar'}
          >
            {timer.isPaused ? (
              <Play className="w-5 h-5 fill-current text-mint-400" />
            ) : (
              <Pause className="w-5 h-5 fill-current text-slate-300" />
            )}
          </button>

          <button
            onClick={onSkip}
            className="h-11 px-3.5 bg-mint-500 hover:bg-mint-400 text-slate-950 rounded-xl text-xs font-black shadow-mint-glow-sm active:scale-95 transition flex items-center gap-1"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Pronto</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
