import React, { useState } from 'react';
import { MuscleGroup, MuscleRecoveryStatus } from '../types';

interface MuscleMapProps {
  recovery: Record<MuscleGroup, MuscleRecoveryStatus>;
  onSelectMuscle?: (group: MuscleGroup) => void;
}

export const MuscleMap: React.FC<MuscleMapProps> = ({ recovery, onSelectMuscle }) => {
  const [view, setView] = useState<'front' | 'back'>('front');
  const [activeGroup, setActiveGroup] = useState<MuscleGroup | null>(null);

  const getColor = (group: MuscleGroup) => {
    const status = recovery[group]?.status || 'ready';
    if (status === 'ready') return '#00E599'; // Mint neon
    if (status === 'recovering') return '#F59E0B'; // Amber
    return '#F43F5E'; // Red/Rose
  };

  const handleMuscleClick = (group: MuscleGroup) => {
    setActiveGroup(group);
    if (onSelectMuscle) onSelectMuscle(group);
  };

  const selectedInfo = activeGroup ? recovery[activeGroup] : null;

  return (
    <div className="bg-dark-card border border-dark-border rounded-3xl p-5 relative overflow-hidden shadow-xl">
      {/* Header com Toggle Frontal / Costas */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-mint-400">Mapa Anatômico</span>
          <h3 className="text-base font-extrabold text-white">Prontidão Muscular</h3>
        </div>

        {/* Toggle Pills */}
        <div className="flex bg-dark-surface p-1 rounded-xl border border-dark-border">
          <button
            onClick={() => setView('front')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              view === 'front'
                ? 'bg-mint-500 text-slate-950 shadow-mint-glow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Frente
          </button>
          <button
            onClick={() => setView('back')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              view === 'back'
                ? 'bg-mint-500 text-slate-950 shadow-mint-glow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Costas
          </button>
        </div>
      </div>

      {/* Ilustração Anatômica Vetorial em SVG */}
      <div className="relative flex justify-center items-center py-2 min-h-[320px]">
        <svg
          viewBox="0 0 200 320"
          className="w-48 sm:w-56 h-auto drop-shadow-[0_0_15px_rgba(0,0,0,0.6)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Silhueta Base do Corpo Humano */}
          <g fill="var(--color-silhouette)" stroke="var(--color-silhouette-stroke)" strokeWidth="1.5">
            {/* Cabeça */}
            <circle cx="100" cy="30" r="15" fill="var(--color-head)" />
            <path d="M93 45 L107 45 L109 52 L91 52 Z" />
            
            {/* Base Tronco / Membros (silhueta de fundo) */}
            <path d="M70 65 L60 120 L50 160 L58 165 L70 125 L75 90 Z" />
            <path d="M130 65 L140 120 L150 160 L142 165 L130 125 L125 90 Z" />
            <path d="M82 170 L78 240 L70 290 L85 290 L95 240 L97 170 Z" />
            <path d="M118 170 L122 240 L130 290 L115 290 L105 240 L103 170 Z" />
          </g>

          {view === 'front' ? (
            /* ================= VISTA FRONTAL ================= */
            <g>
              {/* Ombros (Deltoides Anteriores) */}
              <path
                d="M74 58 C66 60, 58 72, 63 88 C70 82, 75 75, 78 65 Z"
                fill={getColor('shoulders')}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleMuscleClick('shoulders')}
              />
              <path
                d="M126 58 C134 60, 142 72, 137 88 C130 82, 125 75, 122 65 Z"
                fill={getColor('shoulders')}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleMuscleClick('shoulders')}
              />

              {/* Peitoral Maior */}
              <path
                d="M79 66 C85 64, 98 67, 98 90 C88 94, 76 90, 75 78 Z"
                fill={getColor('chest')}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleMuscleClick('chest')}
              />
              <path
                d="M121 66 C115 64, 102 67, 102 90 C112 94, 124 90, 125 78 Z"
                fill={getColor('chest')}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleMuscleClick('chest')}
              />

              {/* Braços (Bíceps) */}
              <path
                d="M62 90 C56 100, 56 118, 64 126 C68 118, 70 102, 69 92 Z"
                fill={getColor('arms')}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleMuscleClick('arms')}
              />
              <path
                d="M138 90 C144 100, 144 118, 136 126 C132 118, 130 102, 131 92 Z"
                fill={getColor('arms')}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleMuscleClick('arms')}
              />

              {/* Abdômen */}
              <path
                d="M87 96 L113 96 L111 145 L89 145 Z"
                rx="4"
                fill={getColor('abs')}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleMuscleClick('abs')}
              />

              {/* Quadríceps (Coxas) */}
              <path
                d="M76 160 C72 180, 72 205, 78 225 C88 228, 97 220, 96 165 Z"
                fill={getColor('quads')}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleMuscleClick('quads')}
              />
              <path
                d="M124 160 C128 180, 128 205, 122 225 C112 228, 103 220, 104 165 Z"
                fill={getColor('quads')}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleMuscleClick('quads')}
              />

              {/* Panturrilhas Frontais */}
              <path
                d="M74 240 C70 255, 72 275, 77 285 C83 285, 87 270, 87 242 Z"
                fill={getColor('calves')}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleMuscleClick('calves')}
              />
              <path
                d="M126 240 C130 255, 128 275, 123 285 C117 285, 113 270, 113 242 Z"
                fill={getColor('calves')}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleMuscleClick('calves')}
              />
            </g>
          ) : (
            /* ================= VISTA POSTERIOR (COSTAS) ================= */
            <g>
              {/* Trapézio & Costas Superiores */}
              <path
                d="M85 52 L115 52 L128 78 L100 102 L72 78 Z"
                fill={getColor('back')}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleMuscleClick('back')}
              />

              {/* Grande Dorsal (Lats) */}
              <path
                d="M72 82 C72 105, 80 125, 86 135 L100 115 L114 135 C120 125, 128 105, 128 82 Z"
                fill={getColor('back')}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleMuscleClick('back')}
              />

              {/* Braços (Tríceps) */}
              <path
                d="M60 88 C54 100, 54 120, 62 130 C66 122, 68 102, 67 90 Z"
                fill={getColor('arms')}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleMuscleClick('arms')}
              />
              <path
                d="M140 88 C146 100, 146 120, 138 130 C134 122, 132 102, 133 90 Z"
                fill={getColor('arms')}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleMuscleClick('arms')}
              />

              {/* Glúteos */}
              <path
                d="M78 145 C78 165, 96 172, 99 152 C99 145, 85 142, 78 145 Z"
                fill={getColor('hamstrings')}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleMuscleClick('hamstrings')}
              />
              <path
                d="M122 145 C122 165, 104 172, 101 152 C101 145, 115 142, 122 145 Z"
                fill={getColor('hamstrings')}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleMuscleClick('hamstrings')}
              />

              {/* Posteriores de Coxa (Isquiotibiais) */}
              <path
                d="M77 172 C74 195, 75 218, 82 228 C90 228, 96 215, 96 172 Z"
                fill={getColor('hamstrings')}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleMuscleClick('hamstrings')}
              />
              <path
                d="M123 172 C126 195, 125 218, 118 228 C110 228, 104 215, 104 172 Z"
                fill={getColor('hamstrings')}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleMuscleClick('hamstrings')}
              />

              {/* Panturrilhas Posteriores (Gastrocnêmio & Sóleo) */}
              <path
                d="M74 238 C68 255, 70 275, 78 285 C85 285, 89 270, 88 238 Z"
                fill={getColor('calves')}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleMuscleClick('calves')}
              />
              <path
                d="M126 238 C132 255, 130 275, 122 285 C115 285, 111 270, 112 238 Z"
                fill={getColor('calves')}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => handleMuscleClick('calves')}
              />
            </g>
          )}
        </svg>

        {/* Legenda Flutuante */}
        <div className="absolute bottom-1 right-2 flex flex-col gap-1 text-[10px] bg-dark-surface/90 backdrop-blur p-2 rounded-xl border border-dark-border">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-mint-500 shadow-mint-glow-sm"></span>
            <span className="text-slate-300 font-medium">Pronto (85–100%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-300 font-medium">Recuperando</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-300 font-medium">Fadiga recente</span>
          </div>
        </div>
      </div>

      {/* Cartão de Detalhe do Músculo Selecionado */}
      {selectedInfo ? (
        <div className="mt-3 bg-dark-surface border border-dark-borderLight rounded-2xl p-3 flex items-center justify-between animate-in fade-in zoom-in-95 duration-150">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Músculo Selecionado:</span>
            <span className="text-sm font-bold text-white">{selectedInfo.label}</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-black text-mint-400 font-mono">{selectedInfo.percent}%</span>
            <span className="text-[10px] block text-slate-400 capitalize">
              {selectedInfo.status === 'ready' ? 'Pronto para treinar' : selectedInfo.status === 'recovering' ? 'Em recuperação' : 'Descanso necessário'}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center text-[11px] text-slate-400 mt-2">
          Toque em qualquer grupo muscular no boneco para ver status e porcentagem.
        </div>
      )}
    </div>
  );
};
