import React, { useState } from 'react';
import { TrendingUp, Dumbbell, Award, Calendar } from 'lucide-react';
import { WorkoutSession } from '../types';
import { WORKOUTS_DATA } from '../data/workouts';

interface ProgressViewProps {
  history: WorkoutSession[];
}

export const ProgressView: React.FC<ProgressViewProps> = ({ history }) => {
  const allExercises: { id: string; name: string; workout: string }[] = [];
  Object.values(WORKOUTS_DATA).forEach(w => {
    w.exercises.forEach(ex => {
      allExercises.push({ id: ex.id, name: ex.name, workout: w.shortTitle });
    });
  });

  const [selectedExId, setSelectedExId] = useState<string>(allExercises[0]?.id || 'A1');
  const [metricMode, setMetricMode] = useState<'weight' | 'volume'>('weight');

  // Coletar registros do exercício selecionado
  const dataPoints: { date: string; maxWeight: number; totalVolume: number; sets: { weight: number; reps: number }[] }[] = [];

  // Percorrer da sessão mais antiga para a mais recente para o gráfico
  const chronologicalHistory = [...history].reverse();

  chronologicalHistory.forEach(sess => {
    const ex = sess.exercises?.find(e => e.id === selectedExId);
    if (ex && ex.sets) {
      const validSets = ex.sets.filter(s => s.completed && s.weightKg !== '');
      if (validSets.length > 0) {
        let maxW = 0;
        let vol = 0;
        const setDetails: { weight: number; reps: number }[] = [];

        validSets.forEach(s => {
          const w = parseFloat(String(s.weightKg)) || 0;
          const r = parseInt(String(s.reps), 10) || 0;
          if (w > maxW) maxW = w;
          vol += (w * r);
          setDetails.push({ weight: w, reps: r });
        });

        dataPoints.push({
          date: sess.endedAt || sess.startedAt,
          maxWeight: maxW,
          totalVolume: vol,
          sets: setDetails
        });
      }
    }
  });

  const selectedExDef = allExercises.find(e => e.id === selectedExId);

  // Métricas
  const maxOverallWeight = dataPoints.length > 0 ? Math.max(...dataPoints.map(d => d.maxWeight)) : 0;
  const initialWeight = dataPoints.length > 0 ? dataPoints[0].maxWeight : 0;
  const weightDeltaPercent = initialWeight > 0 ? Math.round(((maxOverallWeight - initialWeight) / initialWeight) * 100) : 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      <div className="border-b border-dark-border pb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-mint-400">Sobrecarga Progressiva</span>
        <h2 className="text-xl sm:text-2xl font-black text-white">Evolução & Performance</h2>
        <p className="text-xs text-slate-400">Acompanhe a progressão de cargas e volume ao longo do tempo.</p>
      </div>

      {/* Seletor de Exercício */}
      <div className="bg-dark-card border border-dark-border rounded-3xl p-4 shadow-xl space-y-3">
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Selecione o Exercício:
        </label>
        <select
          value={selectedExId}
          onChange={(e) => setSelectedExId(e.target.value)}
          className="w-full h-12 bg-dark-surface border border-dark-borderLight rounded-2xl px-3 text-sm font-bold text-white focus:outline-none focus:border-mint-500"
        >
          {allExercises.map(e => (
            <option key={e.id} value={e.id}>
              {e.id} — {e.name} ({e.workout})
            </option>
          ))}
        </select>

        {/* Toggle Carga Máxima vs Volume */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => setMetricMode('weight')}
            className={`h-10 rounded-xl text-xs font-bold transition-all ${
              metricMode === 'weight'
                ? 'bg-mint-500 text-slate-950 shadow-mint-glow-sm'
                : 'bg-dark-surface text-slate-400 hover:text-white border border-dark-border'
            }`}
          >
            Carga Máxima (kg)
          </button>
          <button
            onClick={() => setMetricMode('volume')}
            className={`h-10 rounded-xl text-xs font-bold transition-all ${
              metricMode === 'volume'
                ? 'bg-mint-500 text-slate-950 shadow-mint-glow-sm'
                : 'bg-dark-surface text-slate-400 hover:text-white border border-dark-border'
            }`}
          >
            Volume (kg × reps)
          </button>
        </div>
      </div>

      {/* CARD DO GRÁFICO (Screen 9 Reference) */}
      <div className="bg-dark-card border border-dark-border rounded-3xl p-5 shadow-xl space-y-4">
        
        {/* Métricas de Topo */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
              {metricMode === 'weight' ? 'Maior Carga Registrada' : 'Maior Volume'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono">
                {metricMode === 'weight' ? `${maxOverallWeight} kg` : `${Math.max(0, ...dataPoints.map(d => d.totalVolume)).toLocaleString('pt-BR')} kg`}
              </span>
              {weightDeltaPercent > 0 && metricMode === 'weight' && (
                <span className="text-xs font-black text-mint-400 bg-mint-500/15 px-2 py-0.5 rounded-full border border-mint-500/30">
                  +{weightDeltaPercent}%
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 font-bold block">Sessões</span>
            <span className="text-xl font-black text-cyan-400 font-mono">{dataPoints.length}</span>
          </div>
        </div>

        {/* Gráfico Vetorial em SVG com Gradiente Neon */}
        {dataPoints.length >= 2 ? (
          <div className="relative pt-4 pb-2">
            <svg viewBox="0 0 400 160" className="w-full h-44 overflow-visible">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00E599" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#00E599" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="30" x2="400" y2="30" stroke="#1F2C42" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="400" y2="80" stroke="#1F2C42" strokeDasharray="3 3" />
              <line x1="0" y1="130" x2="400" y2="130" stroke="#1F2C42" strokeDasharray="3 3" />

              {/* Calcular Coordenadas */}
              {(() => {
                const values = dataPoints.map(d => metricMode === 'weight' ? d.maxWeight : d.totalVolume);
                const min = Math.min(...values) * 0.85;
                const max = Math.max(...values) * 1.15 || 1;
                const range = max - min || 1;

                const points = values.map((val, idx) => {
                  const x = (idx / (values.length - 1)) * 380 + 10;
                  const y = 140 - ((val - min) / range) * 110;
                  return { x, y, val };
                });

                const pathD = points.reduce((acc, curr, idx) => {
                  return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
                }, '');

                const areaD = `${pathD} L ${points[points.length - 1].x} 150 L ${points[0].x} 150 Z`;

                return (
                  <g>
                    {/* Área Preenchida com Gradiente */}
                    <path d={areaD} fill="url(#chartGradient)" />

                    {/* Linha Neon */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#00E599"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ filter: 'drop-shadow(0 0 6px rgba(0, 229, 153, 0.7))' }}
                    />

                    {/* Pontos */}
                    {points.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="5" fill="#080B11" stroke="#00E599" strokeWidth="3" />
                      </g>
                    ))}
                  </g>
                );
              })()}
            </svg>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400 bg-dark-surface rounded-2xl border border-dark-border">
            {dataPoints.length === 1 ? (
              <p>1 treino registrado ({dataPoints[0].maxWeight} kg). Complete mais uma sessão deste exercício para visualizar a curva de evolução!</p>
            ) : (
              <p>Nenhuma série registrada para {selectedExDef?.name} ainda.</p>
            )}
          </div>
        )}

      </div>

      {/* Histórico Recente do Exercício */}
      {dataPoints.length > 0 && (
        <div className="bg-dark-card border border-dark-border rounded-3xl p-5 shadow-xl space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Histórico de Cargas & Reps:
          </h4>

          <div className="space-y-2">
            {[...dataPoints].reverse().map((entry, idx) => (
              <div key={idx} className="bg-dark-surface p-3.5 rounded-2xl border border-dark-border text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                  <span className="text-mint-400 font-extrabold font-mono">
                    Máx: {entry.maxWeight} kg
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {entry.sets.map((s, sIdx) => (
                    <span key={sIdx} className="px-2 py-0.5 bg-dark-bg rounded-lg border border-dark-border text-[11px] text-slate-300">
                      S{sIdx + 1}: <strong className="text-white">{s.weight}k</strong>×<strong className="text-mint-400">{s.reps}r</strong>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
