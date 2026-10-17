import React from 'react';
import { Volume2, VolumeX, Download, Play } from 'lucide-react';
import { WorkoutSession } from '../types';
import { WORKOUTS_DATA } from '../data/workouts';

interface HeaderProps {
  activeSession: WorkoutSession | null;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenActiveSession: () => void;
  canInstallPwa: boolean;
  onInstallPwa: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeSession,
  soundEnabled,
  onToggleSound,
  onOpenActiveSession,
  canInstallPwa,
  onInstallPwa
}) => {
  const plan = activeSession ? WORKOUTS_DATA[activeSession.workoutId] : null;

  return (
    <header className="sticky top-0 z-30 bg-dark-bg/95 backdrop-blur-md border-b border-dark-border select-none">
      <div className="max-w-md sm:max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
        
        {/* Logo MuscleTrack */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-mint-600 to-accent-500 flex items-center justify-center shadow-mint-glow-sm text-slate-950 font-black text-lg">
            M
          </div>
          <div>
            <h1 className="font-black text-base tracking-tight flex items-center gap-1.5 text-white">
              Muscle<span className="text-mint-400">Track</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">Treino Híbrido</p>
          </div>
        </div>

        {/* Ações do Topo */}
        <div className="flex items-center gap-2">
          {/* Botão de Instalar PWA */}
          {canInstallPwa && (
            <button
              onClick={onInstallPwa}
              className="h-8 px-2.5 bg-mint-500/15 text-mint-400 border border-mint-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95 shadow-mint-glow-sm"
              title="Instalar App no Celular"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="text-[11px]">Instalar</span>
            </button>
          )}

          {/* Som Ativo/Mudo */}
          <button
            onClick={onToggleSound}
            className="w-8 h-8 rounded-xl bg-dark-card border border-dark-border text-slate-300 hover:text-white flex items-center justify-center transition active:scale-90"
            title={soundEnabled ? 'Silenciar avisos' : 'Ativar avisos sonoros'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-mint-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* Banner de Sessão Ativa quando fora do Treino */}
      {activeSession && (
        <div className="bg-gradient-to-r from-mint-950/80 via-dark-surface to-dark-card border-t border-mint-500/30 px-4 py-2 animate-in fade-in duration-200">
          <div className="max-w-md sm:max-w-5xl mx-auto flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-mint-400 animate-ping shrink-0"></span>
              <span className="text-mint-300 font-medium shrink-0 text-[11px]">Em andamento:</span>
              <span className="font-extrabold text-white truncate text-xs">{plan?.title}</span>
            </div>
            <button
              onClick={onOpenActiveSession}
              className="bg-mint-500 hover:bg-mint-400 text-slate-950 font-black px-3 py-1 rounded-lg text-xs transition flex items-center gap-1 shadow-mint-glow-sm shrink-0 active:scale-95 ml-2"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Ver</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
