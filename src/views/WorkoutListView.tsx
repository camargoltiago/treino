import React, { useState, useRef } from 'react';
import { Play, ChevronDown, ChevronUp, Info, Edit3, Plus, Download, Upload, RotateCcw } from 'lucide-react';
import { WorkoutId, WorkoutSession, WorkoutPlan } from '../types';
import { WorkoutEditorModal } from '../components/WorkoutEditorModal';

interface WorkoutListViewProps {
  workouts: Record<string, WorkoutPlan>;
  activeSession: WorkoutSession | null;
  history: WorkoutSession[];
  onStartWorkout: (id: WorkoutId) => void;
  onOpenGuide: (exerciseId: string) => void;
  onSaveWorkout: (workout: WorkoutPlan) => void;
  onDeleteWorkout: (id: string) => void;
  onAddWorkout: (workout: WorkoutPlan) => void;
  onExportWorkouts: () => void;
  onImportWorkouts: (jsonString: string) => void;
  onResetWorkoutsToDefault: () => void;
}

export const WorkoutListView: React.FC<WorkoutListViewProps> = ({
  workouts,
  activeSession,
  history,
  onStartWorkout,
  onOpenGuide,
  onSaveWorkout,
  onDeleteWorkout,
  onAddWorkout,
  onExportWorkouts,
  onImportWorkouts,
  onResetWorkoutsToDefault
}) => {
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutPlan | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleExpand = (id: string) => {
    setExpandedWorkout(expandedWorkout === id ? null : id);
  };

  const handleCreateNewWorkout = () => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const count = Object.keys(workouts).length;
    const nextLetter = letters[count % letters.length] || `T${count + 1}`;
    const newId = `treino_${nextLetter.toLowerCase()}_${Date.now()}`;

    const newPlan: WorkoutPlan = {
      id: newId,
      code: nextLetter,
      title: `Treino ${nextLetter} — Novo Treino`,
      shortTitle: `Treino ${nextLetter}`,
      dayLabel: 'Personalizado',
      focus: 'Treino personalizado de hipertrofia',
      estimatedMinutes: 50,
      totalPlannedSets: 3,
      exercises: [
        {
          id: `${nextLetter}1`,
          name: 'Exercício Inicial',
          muscleGroup: 'chest',
          sets: 3,
          reps: '8–12',
          restSeconds: 90,
          targetLoadKg: 10,
          isDumbbell: false,
          notes: 'Aquecimento gradual antes de colocar a carga de trabalho.'
        }
      ]
    };

    setEditingWorkout(newPlan);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        onImportWorkouts(text);
      } catch (err) {
        alert('Erro ao carregar arquivo de treinos.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Input Oculto de Arquivo */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header & Ações Rápidas */}
      <div className="border-b border-dark-border pb-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-mint-400">Rotina de Hipertrofia</span>
          <span className="text-xs text-slate-400 font-mono">{Object.keys(workouts).length} treinos cadastrados</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">Meus Treinos</h2>
        <p className="text-xs text-slate-400">Personalize exercícios, cargas, repetições ou adicione novas rotinas.</p>

        {/* Barra de Ações para Treinos: Criar, Baixar JSON, Subir JSON */}
        <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={handleCreateNewWorkout}
            className="h-10 bg-mint-500 hover:bg-mint-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-mint-glow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Novo Treino</span>
          </button>

          <button
            onClick={onExportWorkouts}
            className="h-10 bg-dark-card hover:bg-dark-cardHover border border-dark-borderLight text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
            title="Baixar arquivo JSON com todos os treinos para backup ou edição"
          >
            <Download className="w-3.5 h-3.5 text-mint-400" />
            <span>Baixar (.json)</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-10 bg-dark-card hover:bg-dark-cardHover border border-dark-borderLight text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
            title="Importar novo arquivo JSON com treinos"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Subir (.json)</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Deseja restaurar os treinos A, B e C para a versão padrão de fábrica?')) {
                onResetWorkoutsToDefault();
              }
            }}
            className="h-10 bg-dark-surface hover:bg-dark-card border border-dark-border text-slate-400 hover:text-amber-400 font-medium rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
            title="Restaurar treinos padrão de fábrica"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar</span>
          </button>
        </div>
      </div>

      {/* Lista de Treinos */}
      <div className="space-y-4">
        {Object.keys(workouts).length === 0 ? (
          <div className="bg-dark-card border border-dark-border rounded-3xl p-8 text-center text-xs text-slate-400 space-y-3">
            <p className="text-sm font-bold text-white">Nenhum treino disponível</p>
            <p>Você pode criar um novo treino do zero ou restaurar os treinos padrão de fábrica.</p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={handleCreateNewWorkout}
                className="px-4 py-2 bg-mint-500 text-slate-950 font-bold rounded-xl text-xs"
              >
                + Criar Treino
              </button>
              <button
                onClick={onResetWorkoutsToDefault}
                className="px-4 py-2 bg-dark-surface text-slate-300 font-bold rounded-xl text-xs border border-dark-border"
              >
                Restaurar Padrão
              </button>
            </div>
          </div>
        ) : (
          Object.keys(workouts).map(id => {
            const w = workouts[id];
            const isCurrentActive = activeSession && activeSession.workoutId === id && activeSession.status === 'em_andamento';
            const isExpanded = expandedWorkout === id;

            // Última sessão feita deste treino
            const lastSession = history.filter(s => s.workoutId === id)[0];

            return (
              <div
                key={id}
                className={`bg-dark-card border rounded-3xl p-5 shadow-xl transition-all ${
                  isCurrentActive
                    ? 'border-mint-500 ring-1 ring-mint-500 shadow-mint-glow-sm'
                    : 'border-dark-border hover:border-dark-borderLight'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-dark-surface text-mint-400 font-black text-sm flex items-center justify-center border border-dark-border">
                        {w.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">{w.dayLabel}</span>
                      {isCurrentActive && (
                        <span className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                          Em Andamento
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white">{w.title}</h3>
                    <p className="text-xs text-slate-400">{w.focus}</p>
                  </div>

                  {/* Botão de Edição Rápida no Card */}
                  <button
                    onClick={() => setEditingWorkout(w)}
                    className="p-2.5 rounded-xl bg-dark-surface hover:bg-dark-cardHover border border-dark-border text-slate-300 hover:text-mint-400 transition flex items-center gap-1.5 text-xs font-bold active:scale-95"
                    title="Editar exercícios e configurações deste treino"
                  >
                    <Edit3 className="w-4 h-4 text-mint-400" />
                    <span className="hidden sm:inline">Editar</span>
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-dark-border/80 grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Exercícios:</span>
                    <span className="font-bold text-white">{w.exercises.length}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Séries previstas:</span>
                    <span className="font-bold text-mint-400">{w.totalPlannedSets}</span>
                  </div>
                  <div className="col-span-2 text-[11px] text-slate-400 pt-0.5">
                    {lastSession ? (
                      <span>
                        Último: {new Date(lastSession.endedAt || lastSession.startedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · {Math.round((lastSession.durationSeconds || 0)/60)} min ({lastSession.completedSetsCount || 0} séries)
                      </span>
                    ) : (
                      <span>Nenhum registro ainda</span>
                    )}
                  </div>
                </div>

                {/* Botão de Expansão para Ver Exercícios */}
                <button
                  onClick={() => toggleExpand(id)}
                  className="mt-3 w-full py-2 flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-white transition font-semibold"
                >
                  <span>{isExpanded ? 'Ocultar lista de exercícios' : 'Ver os exercícios deste treino'}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Lista Expansível de Exercícios */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-dark-border/80 space-y-2 animate-in fade-in duration-150">
                    {w.exercises.map(ex => (
                      <div
                        key={ex.id}
                        className="bg-dark-surface p-3 rounded-2xl border border-dark-border flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-mint-400">{ex.id}</span>
                            <span className="font-bold text-white">{ex.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {ex.sets} séries × {ex.reps} reps · {ex.restSeconds > 0 ? `${ex.restSeconds}s descanso` : 'Bi-set'}
                            {ex.targetLoadKg !== undefined && ` · Meta: ${ex.targetLoadKg}kg`}
                          </p>
                        </div>
                        <button
                          onClick={() => onOpenGuide(ex.id)}
                          className="p-1.5 text-cyan-400 hover:text-white rounded-lg bg-dark-card border border-dark-border shrink-0 ml-2"
                          title="Como fazer?"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Botões de Ação do Card: Editar & Iniciar */}
                <div className="mt-4 pt-2 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setEditingWorkout(w)}
                    className="col-span-1 h-12 rounded-2xl bg-dark-surface hover:bg-dark-cardHover text-slate-300 hover:text-white font-bold text-xs sm:text-sm border border-dark-borderLight active:scale-98 transition flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-mint-400" />
                    <span>Editar</span>
                  </button>

                  <div className="col-span-2">
                    {isCurrentActive ? (
                      <button
                        onClick={() => onStartWorkout(id)}
                        className="w-full h-12 rounded-2xl bg-mint-500 hover:bg-mint-400 text-slate-950 font-black text-sm shadow-mint-glow active:scale-98 transition flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Continuar</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onStartWorkout(id)}
                        className="w-full h-12 rounded-2xl bg-mint-500 hover:bg-mint-400 text-slate-950 font-black text-sm shadow-mint-glow-sm active:scale-98 transition flex items-center justify-center gap-2"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Iniciar {w.shortTitle}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Edição de Treino Completo */}
      {editingWorkout && (
        <WorkoutEditorModal
          workout={editingWorkout}
          onSave={(updated) => {
            onSaveWorkout(updated);
            setEditingWorkout(null);
          }}
          onDeleteWorkout={(id) => {
            onDeleteWorkout(id);
            setEditingWorkout(null);
          }}
          onClose={() => setEditingWorkout(null)}
        />
      )}

    </div>
  );
};
