import React, { useState } from 'react';
import { X, Plus, Trash2, ArrowUp, ArrowDown, Save, Dumbbell, AlertTriangle } from 'lucide-react';
import { WorkoutPlan, ExerciseDefinition, MuscleGroup } from '../types';

interface WorkoutEditorModalProps {
  workout: WorkoutPlan | null;
  onSave: (updatedWorkout: WorkoutPlan) => void;
  onDeleteWorkout: (id: string) => void;
  onClose: () => void;
}

const MUSCLE_OPTIONS: { value: MuscleGroup; label: string }[] = [
  { value: 'chest', label: 'Peitoral' },
  { value: 'back', label: 'Costas' },
  { value: 'shoulders', label: 'Ombros' },
  { value: 'arms', label: 'Braços (Bíceps/Tríceps)' },
  { value: 'quads', label: 'Quadríceps' },
  { value: 'hamstrings', label: 'Posteriores de Coxa' },
  { value: 'calves', label: 'Panturrilhas' },
  { value: 'abs', label: 'Abdômen / Core' }
];

export const WorkoutEditorModal: React.FC<WorkoutEditorModalProps> = ({
  workout,
  onSave,
  onDeleteWorkout,
  onClose
}) => {
  if (!workout) return null;

  const [code, setCode] = useState(workout.code);
  const [title, setTitle] = useState(workout.title);
  const [shortTitle, setShortTitle] = useState(workout.shortTitle);
  const [dayLabel, setDayLabel] = useState(workout.dayLabel);
  const [focus, setFocus] = useState(workout.focus);
  const [exercises, setExercises] = useState<ExerciseDefinition[]>(
    JSON.parse(JSON.stringify(workout.exercises))
  );

  // Estado para adicionar novo exercício
  const [showAddEx, setShowAddEx] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState<MuscleGroup>('chest');
  const [newExSets, setNewExSets] = useState(3);
  const [newExReps, setNewExReps] = useState('8–12');
  const [newExRest, setNewExRest] = useState(120);
  const [newExNotes, setNewExNotes] = useState('');
  const [newExDumbbell, setNewExDumbbell] = useState(false);

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= exercises.length) return;

    const updated = [...exercises];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setExercises(updated);
  };

  const handleUpdateExercise = (index: number, field: keyof ExerciseDefinition, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleDeleteExercise = (index: number) => {
    if (exercises.length <= 1) {
      alert('O treino deve conter pelo menos 1 exercício.');
      return;
    }
    const updated = exercises.filter((_, i) => i !== index);
    setExercises(updated);
  };

  const handleAddNewExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim()) {
      alert('Preencha o nome do exercício.');
      return;
    }

    const nextId = `${code}${exercises.length + 1}`;
    const newEx: ExerciseDefinition = {
      id: nextId,
      name: newExName.trim(),
      sets: Math.max(1, newExSets),
      reps: newExReps.trim() || '8–12',
      restSeconds: Math.max(0, newExRest),
      notes: newExNotes.trim(),
      isDumbbell: newExDumbbell,
      muscles: MUSCLE_OPTIONS.find(m => m.value === newExMuscle)?.label || '',
      muscleGroup: newExMuscle
    };

    setExercises([...exercises, newEx]);
    setNewExName('');
    setNewExNotes('');
    setShowAddEx(false);
  };

  const handleSaveAll = () => {
    if (!title.trim()) {
      alert('Digite o título do treino.');
      return;
    }
    if (exercises.length === 0) {
      alert('Adicione pelo menos 1 exercício ao treino.');
      return;
    }

    const totalSets = exercises.reduce((acc, curr) => acc + curr.sets, 0);

    const updatedWorkout: WorkoutPlan = {
      ...workout,
      code: code.trim().toUpperCase() || 'A',
      title: title.trim(),
      shortTitle: shortTitle.trim() || title.trim(),
      dayLabel: dayLabel.trim(),
      focus: focus.trim(),
      totalPlannedSets: totalSets,
      exercises
    };

    onSave(updatedWorkout);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-dark-surface border border-dark-borderLight rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl relative my-auto animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 border-b border-dark-border flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-mint-400">Personalizar Treino</span>
            <h3 className="text-base font-extrabold text-white">Editar {workout.shortTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-dark-card transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário com Scroll */}
        <div className="p-4 overflow-y-auto space-y-4 custom-scrollbar text-xs">
          
          {/* Dados Gerais do Treino */}
          <div className="bg-dark-card p-3.5 rounded-2xl border border-dark-border space-y-2.5">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Identificação do Treino</h4>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Letra/Código</label>
                <input
                  type="text"
                  value={code}
                  maxLength={4}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-10 bg-dark-surface border border-dark-border rounded-xl px-2.5 text-center font-bold text-mint-400 uppercase font-mono focus:outline-none focus:border-mint-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Nome Curto</label>
                <input
                  type="text"
                  value={shortTitle}
                  onChange={(e) => setShortTitle(e.target.value)}
                  placeholder="ex: Upper Body"
                  className="w-full h-10 bg-dark-surface border border-dark-border rounded-xl px-3 font-bold text-white focus:outline-none focus:border-mint-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">Título Completo</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex: Treino A — Upper Body (Hipertrofia)"
                className="w-full h-10 bg-dark-surface border border-dark-border rounded-xl px-3 font-bold text-white focus:outline-none focus:border-mint-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Dia Sugerido</label>
                <input
                  type="text"
                  value={dayLabel}
                  onChange={(e) => setDayLabel(e.target.value)}
                  placeholder="ex: Segunda-feira"
                  className="w-full h-10 bg-dark-surface border border-dark-border rounded-xl px-3 text-slate-200 focus:outline-none focus:border-mint-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Foco Muscular</label>
                <input
                  type="text"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="ex: Peito e Tríceps"
                  className="w-full h-10 bg-dark-surface border border-dark-border rounded-xl px-3 text-slate-200 focus:outline-none focus:border-mint-500"
                />
              </div>
            </div>
          </div>

          {/* Lista de Exercícios do Treino */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">
                Exercícios ({exercises.length})
              </h4>
              <button
                type="button"
                onClick={() => setShowAddEx(true)}
                className="h-8 px-2.5 bg-mint-500/15 hover:bg-mint-500/25 text-mint-400 border border-mint-500/30 rounded-xl text-[11px] font-bold flex items-center gap-1 transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Exercício</span>
              </button>
            </div>

            {/* Modal/Formulário inline para adicionar exercício */}
            {showAddEx && (
              <form onSubmit={handleAddNewExercise} className="bg-dark-surface border border-mint-500/50 rounded-2xl p-3.5 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-xs">Novo Exercício</span>
                  <button type="button" onClick={() => setShowAddEx(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Nome do Exercício *</label>
                  <input
                    type="text"
                    required
                    value={newExName}
                    onChange={(e) => setNewExName(e.target.value)}
                    placeholder="ex: Supino Inclinado com Halteres"
                    className="w-full h-10 bg-dark-card border border-dark-border rounded-xl px-3 text-white font-bold focus:outline-none focus:border-mint-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">Grupo Muscular Principal</label>
                    <select
                      value={newExMuscle}
                      onChange={(e) => setNewExMuscle(e.target.value as MuscleGroup)}
                      className="w-full h-10 bg-dark-card border border-dark-border rounded-xl px-2 text-white font-semibold focus:outline-none focus:border-mint-500"
                    >
                      {MUSCLE_OPTIONS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">Séries Previstas</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={newExSets}
                      onChange={(e) => setNewExSets(parseInt(e.target.value, 10) || 3)}
                      className="w-full h-10 bg-dark-card border border-dark-border rounded-xl px-3 text-center text-white font-bold focus:outline-none focus:border-mint-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">Faixa de Reps</label>
                    <input
                      type="text"
                      value={newExReps}
                      onChange={(e) => setNewExReps(e.target.value)}
                      placeholder="8–12"
                      className="w-full h-10 bg-dark-card border border-dark-border rounded-xl px-3 text-white focus:outline-none focus:border-mint-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">Descanso (segundos)</label>
                    <input
                      type="number"
                      step={15}
                      min={0}
                      value={newExRest}
                      onChange={(e) => setNewExRest(parseInt(e.target.value, 10) || 60)}
                      className="w-full h-10 bg-dark-card border border-dark-border rounded-xl px-3 text-center text-white focus:outline-none focus:border-mint-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-1">Observações / Dicas de Execução</label>
                  <input
                    type="text"
                    value={newExNotes}
                    onChange={(e) => setNewExNotes(e.target.value)}
                    placeholder="ex: Foco em peito superior; descida controlada"
                    className="w-full h-10 bg-dark-card border border-dark-border rounded-xl px-3 text-white focus:outline-none focus:border-mint-500"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={newExDumbbell}
                    onChange={(e) => setNewExDumbbell(e.target.checked)}
                    className="w-4 h-4 rounded text-mint-500 bg-dark-card border-dark-border"
                  />
                  <span className="text-slate-300 font-semibold">Exercício com Halteres (Carga em kg é por halter)</span>
                </label>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddEx(false)}
                    className="flex-1 h-9 rounded-xl bg-dark-card text-slate-300 font-bold hover:bg-dark-cardHover transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-9 rounded-xl bg-mint-500 text-slate-950 font-black shadow-mint-glow-sm hover:bg-mint-400 transition"
                  >
                    Confirmar Exercício
                  </button>
                </div>
              </form>
            )}

            {/* Lista dos exercícios existentes */}
            <div className="space-y-2">
              {exercises.map((ex, index) => (
                <div
                  key={index}
                  className="bg-dark-card border border-dark-border rounded-2xl p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded bg-dark-surface text-mint-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={ex.name}
                        onChange={(e) => handleUpdateExercise(index, 'name', e.target.value)}
                        className="font-bold text-white bg-transparent border-b border-transparent hover:border-dark-borderLight focus:border-mint-500 focus:outline-none px-1 text-xs truncate w-full"
                      />
                    </div>

                    {/* Botões Mover Cima/Baixo e Excluir */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveExercise(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded bg-dark-surface text-slate-400 hover:text-white disabled:opacity-30"
                        title="Subir ordem"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveExercise(index, 'down')}
                        disabled={index === exercises.length - 1}
                        className="p-1 rounded bg-dark-surface text-slate-400 hover:text-white disabled:opacity-30"
                        title="Descer ordem"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExercise(index)}
                        className="p-1 rounded bg-dark-surface text-rose-400 hover:text-rose-300 ml-1"
                        title="Excluir exercício"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Parâmetros do Exercício */}
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Séries:</span>
                      <input
                        type="number"
                        min={1}
                        value={ex.sets}
                        onChange={(e) => handleUpdateExercise(index, 'sets', parseInt(e.target.value, 10) || 1)}
                        className="w-full bg-dark-surface border border-dark-border rounded-lg px-2 py-1 text-center font-bold text-mint-400"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Reps:</span>
                      <input
                        type="text"
                        value={ex.reps}
                        onChange={(e) => handleUpdateExercise(index, 'reps', e.target.value)}
                        className="w-full bg-dark-surface border border-dark-border rounded-lg px-2 py-1 text-center font-bold text-white"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Descanso:</span>
                      <input
                        type="number"
                        step={15}
                        min={0}
                        value={ex.restSeconds}
                        onChange={(e) => handleUpdateExercise(index, 'restSeconds', parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-dark-surface border border-dark-border rounded-lg px-2 py-1 text-center text-cyan-400 font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="p-4 border-t border-dark-border flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Tem certeza que deseja apagar o ${workout.title}?`)) {
                onDeleteWorkout(workout.id);
                onClose();
              }
            }}
            className="h-11 px-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-2xl text-xs font-semibold transition active:scale-95 flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir Treino</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="h-11 px-6 bg-mint-500 hover:bg-mint-400 text-slate-950 font-black rounded-2xl text-xs sm:text-sm shadow-mint-glow transition flex items-center gap-2 active:scale-95"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>
    </div>
  );
};
