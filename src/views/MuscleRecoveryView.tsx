import React from 'react';
import { Activity, ShieldCheck, Clock, Zap } from 'lucide-react';
import { MuscleGroup, MuscleRecoveryStatus } from '../types';
import { MuscleMap } from '../components/MuscleMap';

interface MuscleRecoveryViewProps {
  recovery: Record<MuscleGroup, MuscleRecoveryStatus>;
  overallRecoveryPercent: number;
}

export const MuscleRecoveryView: React.FC<MuscleRecoveryViewProps> = ({
  recovery,
  overallRecoveryPercent
}) => {
  const muscleList: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms', 'quads', 'hamstrings', 'calves', 'abs'];

  // Determinar mensagem de recuperação
  let statusMessage = 'Seu corpo está em excelente recuperação. Pronto para sobrecarga!';
  if (overallRecoveryPercent < 60) {
    statusMessage = 'Músculos em reparação celular profunda. Mantenha boa hidratação e sono.';
  } else if (overallRecoveryPercent < 80) {
    statusMessage = 'Balanço favorável. Grupos descansados podem receber estímulo alto.';
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      <div className="border-b border-dark-border pb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-mint-400">Bio-Feedback</span>
        <h2 className="text-xl sm:text-2xl font-black text-white">Recuperação & Anatomia</h2>
        <p className="text-xs text-slate-400">Análise de fadiga e prontidão baseada nas suas últimas sessões.</p>
      </div>

      {/* GAUGE CIRCULAR DE RECUPERAÇÃO GERAL (Screen 7 Reference) */}
      <div className="bg-gradient-to-b from-dark-surface to-dark-card border border-dark-border rounded-3xl p-6 shadow-xl text-center relative overflow-hidden">
        <div className="flex flex-col items-center justify-center">
          
          {/* Circular SVG Progress */}
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="#162235"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="#00E599"
                strokeWidth="10"
                strokeDasharray="314"
                strokeDashoffset={314 - (314 * overallRecoveryPercent) / 100}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000 ease-out"
                style={{ filter: 'drop-shadow(0 0 8px rgba(0, 229, 153, 0.6))' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-black text-white font-mono tracking-tight">{overallRecoveryPercent}%</span>
              <span className="text-[10px] uppercase font-bold text-mint-400 tracking-wider">Recuperado</span>
            </div>
          </div>

          <h3 className="text-base font-extrabold text-white mt-3">Recuperação Geral</h3>
          <p className="text-xs text-slate-300 max-w-xs mt-1 leading-snug">{statusMessage}</p>
        </div>
      </div>

      {/* MAPA ANATÔMICO INTERATIVO COM SILHUETA VETORIAL (Screen 4 Reference) */}
      <MuscleMap recovery={recovery} />

      {/* DETALHE POR GRUPO MUSCULAR (Screen 7 Muscle List) */}
      <div className="bg-dark-card border border-dark-border rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-mint-400" />
          <h3 className="text-base font-bold text-white">Status Individual por Músculo</h3>
        </div>

        <div className="space-y-3">
          {muscleList.map(group => {
            const data = recovery[group];
            if (!data) return null;

            let badgeClass = 'bg-mint-500/15 text-mint-400 border-mint-500/30';
            let barClass = 'bg-mint-500';
            let textStatus = 'Pronto para treinar';

            if (data.status === 'recovering') {
              badgeClass = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
              barClass = 'bg-amber-500';
              textStatus = 'Em fase de reparo';
            } else if (data.status === 'rest') {
              badgeClass = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
              barClass = 'bg-rose-500';
              textStatus = 'Descanso recomendado';
            }

            return (
              <div key={group} className="bg-dark-surface p-3.5 rounded-2xl border border-dark-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block text-sm">{data.label}</span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {data.lastTrainedDays !== null
                        ? `Treinado há ${data.lastTrainedDays} ${data.lastTrainedDays === 1 ? 'dia' : 'dias'}`
                        : 'Sem treino recente registrado'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-white font-mono">{data.percent}%</span>
                    <span className={`block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-1 ${badgeClass}`}>
                      {textStatus}
                    </span>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="w-full bg-dark-bg rounded-full h-2 overflow-hidden border border-dark-border">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${barClass}`}
                    style={{ width: `${data.percent}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
