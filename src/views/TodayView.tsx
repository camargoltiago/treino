import React from 'react';
import { Play, ArrowRight, Activity, Flame, Calendar, Dumbbell } from 'lucide-react';
import { WorkoutSession, WorkoutId, MuscleRecoveryStatus, MuscleGroup, WorkoutPlan } from '../types';
import { WORKOUTS_DATA } from '../data/workouts';
import { TabType } from '../components/Navbar';

interface TodayViewProps {
  activeSession: WorkoutSession | null;
  history: WorkoutSession[];
  workouts: Record<string, WorkoutPlan>;
  recovery: Record<MuscleGroup, MuscleRecoveryStatus>;
  overallRecoveryPercent: number;
  nutritionSummary?: {
    consumed: number;
    goal: number;
    remaining: number;
  };
  onStartWorkout: (id: WorkoutId) => void;
  onNavigateTab: (tab: TabType) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  activeSession,
  history,
  workouts,
  recovery,
  overallRecoveryPercent,
  nutritionSummary,
  onStartWorkout,
  onNavigateTab
}) => {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay(); // 1 = Seg, 3 = Qua, 5 = Sex

  let greeting = 'Bom dia 👋';
  if (hour >= 12 && hour < 18) greeting = 'Boa tarde 👋';
  if (hour >= 18 || hour < 5) greeting = 'Boa noite 👋';

  // Obter chaves de treinos disponíveis
  const workoutKeys = Object.keys(workouts);
  const fallbackKey = workoutKeys[0] || 'treino_a';

  // Determinar sugestão de treino
  let suggestedId: WorkoutId = workoutKeys.includes('treino_a') ? 'treino_a' : fallbackKey;
  let suggestedReason = 'Treino focado em desenvolvimento e hipertrofia.';

  if (dayOfWeek === 1 && workoutKeys.includes('treino_a')) {
    suggestedId = 'treino_a';
    suggestedReason = 'Segunda-feira: membros superiores prontos para volume.';
  } else if (dayOfWeek === 3 && workoutKeys.includes('treino_b')) {
    suggestedId = 'treino_b';
    suggestedReason = 'Quarta-feira: membros inferiores prontos para intensidade.';
  } else if (dayOfWeek === 5 && workoutKeys.includes('treino_c')) {
    suggestedId = 'treino_c';
    suggestedReason = 'Sexta-feira: estímulo metabólico e pump total de corpo inteiro.';
  } else {
    // Dias intercalados: sugerir o próximo treino com base no último realizado
    const lastSession = history[0];
    if (lastSession) {
      if (lastSession.workoutId === 'treino_a' && workoutKeys.includes('treino_b')) {
        suggestedId = 'treino_b';
        suggestedReason = 'Próximo do ciclo: Treino B (Lower Body).';
      } else if (lastSession.workoutId === 'treino_b' && workoutKeys.includes('treino_c')) {
        suggestedId = 'treino_c';
        suggestedReason = 'Próximo do ciclo: Treino C (Full Body Pump).';
      } else if (workoutKeys.includes('treino_a')) {
        suggestedId = 'treino_a';
        suggestedReason = 'Novo ciclo: Treino A (Upper Body).';
      } else {
        // Se houver treinos customizados, pega o próximo da lista circular
        const lastIdx = workoutKeys.indexOf(lastSession.workoutId);
        const nextIdx = (lastIdx + 1) % workoutKeys.length;
        suggestedId = workoutKeys[nextIdx] || fallbackKey;
        suggestedReason = 'Próximo treino na sua sequência personalizada.';
      }
    } else {
      suggestedId = fallbackKey;
      suggestedReason = 'Inicie sua jornada com este treino.';
    }
  }

  const suggestedPlan = workouts[suggestedId] || WORKOUTS_DATA[suggestedId] || Object.values(workouts)[0];
  const isCurrentActive = activeSession && activeSession.status === 'em_andamento';

  // Grupos musculares para a lista de "Seu Corpo Hoje"
  const muscleGroupsList: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms', 'quads', 'hamstrings', 'calves', 'abs'];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Saudação do Dia */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white">{greeting}</h2>
          <p className="text-xs text-slate-400 font-medium">Seu corpo está pronto para evoluir.</p>
        </div>
        <div className="flex items-center gap-1.5 bg-dark-card border border-dark-border px-3 py-1.5 rounded-2xl">
          <Flame className="w-4 h-4 text-mint-400" />
          <span className="text-xs font-bold text-white font-mono">{history.length} treinos</span>
        </div>
      </div>

      {/* CARD PRINCIPAL: Recomendação de Treino de Hoje (Screen 3 Reference) */}
      {suggestedPlan && (
        <div className="bg-gradient-to-br from-dark-surface via-dark-card to-dark-bg border border-mint-500/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-mint-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-bold uppercase tracking-wider text-mint-400 text-[10px]">Recomendação de Hoje</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {now.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
            {suggestedPlan.title}
          </h3>
          <p className="text-xs text-slate-300 mt-1 line-clamp-1">{suggestedReason}</p>

          <div className="mt-4 pt-3 border-t border-dark-border/80 flex items-center justify-between text-xs text-slate-400">
            <span>{suggestedPlan.exercises.length} exercícios</span>
            <span>•</span>
            <span className="text-mint-400 font-bold">{suggestedPlan.totalPlannedSets} séries previstas</span>
            <span>•</span>
            <span>~{suggestedPlan.estimatedMinutes || 60} min</span>
          </div>

          {/* Botão de Ação CTA Neon */}
          <div className="mt-5">
            {isCurrentActive ? (
              <button
                onClick={() => onStartWorkout(activeSession.workoutId)}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-mint-500 to-mint-400 text-slate-950 font-black text-sm sm:text-base shadow-mint-glow hover:brightness-105 active:scale-98 transition flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Continuar Treino em Andamento →</span>
              </button>
            ) : (
              <button
                onClick={() => onStartWorkout(suggestedPlan.id)}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-mint-500 to-mint-400 text-slate-950 font-black text-sm sm:text-base shadow-mint-glow hover:brightness-105 active:scale-98 transition flex items-center justify-center gap-2"
              >
                <span>Iniciar Treino →</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SEÇÃO: Nutrição & Calorias de Hoje */}
      {nutritionSummary && (
        <div className="bg-dark-card border border-dark-border rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-mint-400">Nutrição Diária</span>
              <h3 className="text-base font-extrabold text-white">Controle Calórico</h3>
            </div>
            <button
              onClick={() => onNavigateTab('nutrition')}
              className="text-xs text-mint-400 hover:text-mint-300 font-bold flex items-center gap-1 transition"
            >
              <span>Abrir Dieta</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div
            onClick={() => onNavigateTab('nutrition')}
            className="cursor-pointer bg-dark-surface p-4 rounded-2xl border border-dark-border hover:border-mint-500/40 transition-all flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-mint-500/15 text-mint-400 flex items-center justify-center font-bold border border-mint-500/30 group-hover:scale-105 transition-transform">
                <Flame className="w-5 h-5 text-mint-400" />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-black text-white">{nutritionSummary.consumed}</span>
                  <span className="text-xs text-slate-400 font-medium">/ {nutritionSummary.goal} kcal</span>
                </div>
                <span className="text-[11px] text-slate-400 block">
                  {nutritionSummary.remaining >= 0
                    ? `Restam ${nutritionSummary.remaining} kcal hoje`
                    : `Excedeu ${Math.abs(nutritionSummary.remaining)} kcal`}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-mint-400 bg-mint-500/10 px-2.5 py-1 rounded-xl border border-mint-500/20 group-hover:bg-mint-500 group-hover:text-dark-bg transition-all">
                + Registrar
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO: Seu Corpo Hoje (Your Body Today - Screen 3 Reference) */}
      <div className="bg-dark-card border border-dark-border rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-mint-400">Prontidão Biológica</span>
            <h3 className="text-base font-extrabold text-white">Seu Corpo Hoje</h3>
          </div>
          <button
            onClick={() => onNavigateTab('recovery')}
            className="text-xs text-mint-400 hover:text-mint-300 font-bold flex items-center gap-1 transition"
          >
            <span>Ver Mapa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Overall recovery gauge summary */}
        <div className="bg-dark-surface p-3.5 rounded-2xl border border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-mint-500/15 text-mint-400 flex items-center justify-center font-bold border border-mint-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Recuperação Geral</span>
              <span className="text-[11px] text-slate-400">
                {overallRecoveryPercent >= 80 ? 'Ótimo estado para treinar pesado' : 'Músculos em fase de supercompensação'}
              </span>
            </div>
          </div>
          <span className="text-xl font-black text-mint-400 font-mono">{overallRecoveryPercent}%</span>
        </div>

        {/* Lista de barras musculares */}
        <div className="space-y-3 pt-1">
          {muscleGroupsList.map(group => {
            const data = recovery[group];
            if (!data) return null;

            let badgeColor = 'bg-mint-500/15 text-mint-400 border-mint-500/30';
            let barColor = 'bg-mint-500';
            let labelStatus = 'Pronto';

            if (data.status === 'recovering') {
              badgeColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
              barColor = 'bg-amber-500';
              labelStatus = 'Recuperando';
            } else if (data.status === 'rest') {
              badgeColor = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
              barColor = 'bg-rose-500';
              labelStatus = 'Fadigado';
            }

            return (
              <div key={group} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">{data.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                      {labelStatus}
                    </span>
                    <span className="font-bold text-white font-mono w-9 text-right">{data.percent}%</span>
                  </div>
                </div>
                <div className="w-full bg-dark-surface rounded-full h-2 overflow-hidden border border-dark-border">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${data.percent}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Atalho para todos os treinos cadastrados */}
      <div className="flex items-center justify-between p-4 bg-dark-card border border-dark-border rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Ver todos os Treinos</h4>
            <p className="text-[10px] text-slate-400">{workoutKeys.length} rotinas configuradas</p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('workouts')}
          className="text-xs font-bold text-mint-400 hover:text-white px-3 py-1.5 rounded-xl bg-dark-surface border border-dark-border transition"
        >
          Acessar
        </button>
      </div>

    </div>
  );
};
