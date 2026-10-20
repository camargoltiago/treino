import React, { useState, useRef } from 'react';
import { Clock, Download, Upload, Trash2, Calendar, ChevronRight, Dumbbell, RotateCcw, FileText } from 'lucide-react';
import { WorkoutSession, WorkoutPlan } from '../types';
import { WORKOUTS_DATA } from '../data/workouts';
import { StorageService, STORAGE_KEY } from '../services/storage';
import { feedback } from '../services/feedback';

interface HistoryBackupViewProps {
  history: WorkoutSession[];
  workouts: Record<string, WorkoutPlan>;
  onDeleteSession: (id: string) => void;
  onRestoreBackup: (newHistory: WorkoutSession[], activeSession: WorkoutSession | null) => void;
  onRestoreWorkouts: (newWorkouts: Record<string, WorkoutPlan>) => void;
  onResetWorkoutsToDefault: () => void;
  onResetAll: () => void;
  activeSession: WorkoutSession | null;
  onRestoreNutrition?: (nutrition: any) => void;
}

export const HistoryBackupView: React.FC<HistoryBackupViewProps> = ({
  history,
  workouts,
  onDeleteSession,
  onRestoreBackup,
  onRestoreWorkouts,
  onResetWorkoutsToDefault,
  onResetAll,
  activeSession,
  onRestoreNutrition
}) => {
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const workoutFileInputRef = useRef<HTMLInputElement>(null);
  const fullBackupFileInputRef = useRef<HTMLInputElement>(null);

  // Upload exclusivo de JSON de treinos
  const handleWorkoutFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        
        let loadedWorkouts: Record<string, WorkoutPlan> | null = null;
        if (parsed && parsed.workouts && typeof parsed.workouts === 'object') {
          loadedWorkouts = parsed.workouts;
        } else if (parsed && typeof parsed === 'object' && !parsed.history) {
          // Arquivo contém diretamente o dicionário de treinos
          loadedWorkouts = parsed;
        }

        if (loadedWorkouts && Object.keys(loadedWorkouts).length > 0) {
          const count = Object.keys(loadedWorkouts).length;
          const confirmed = await feedback.confirm({
            title: 'Subir Treinos',
            message: `Subir ${count} treinos do arquivo JSON? A lista atual de treinos será substituída.`,
            variant: 'warning',
            confirmText: 'Subir Treinos'
          });
          if (confirmed) {
            onRestoreWorkouts(loadedWorkouts);
            feedback.success(`${count} treinos foram carregados com sucesso!`);
          }
        } else {
          feedback.error('Arquivo JSON de treinos inválido. Verifique o formato exportado.');
        }
      } catch (err) {
        feedback.error('Erro ao processar o arquivo JSON de treinos.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Upload de backup completo (sessões + histórico)
  const handleFullBackupUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && Array.isArray(json.history)) {
          const confirmed = await feedback.confirm({
            title: 'Restaurar Backup Completo',
            message: `Restaurar backup com ${json.history.length} sessões? Os dados locais atuais serão substituídos.`,
            variant: 'warning',
            confirmText: 'Restaurar'
          });
          if (confirmed) {
            onRestoreBackup(json.history, json.activeSession || null);
            if (json.workouts && typeof json.workouts === 'object') {
              onRestoreWorkouts(json.workouts);
            }
            if (json.nutrition) {
              if (onRestoreNutrition) {
                onRestoreNutrition(json.nutrition);
              }
            }
            feedback.success('Backup restaurado com sucesso!');
          }
        } else {
          feedback.error('Arquivo JSON de backup completo inválido.');
        }
      } catch (err) {
        feedback.error('Erro ao processar o arquivo JSON de backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const jsonStr = localStorage.getItem(STORAGE_KEY) || '{}';
  const sizeKb = (new Blob([jsonStr]).size / 1024).toFixed(1);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Inputs Ocultos de Arquivos */}
      <input
        ref={workoutFileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleWorkoutFileUpload}
      />
      <input
        ref={fullBackupFileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFullBackupUpload}
      />

      <div className="border-b border-dark-border pb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-mint-400">Dados & Arquivos</span>
        <h2 className="text-xl sm:text-2xl font-black text-white">Treinos & Histórico</h2>
        <p className="text-xs text-slate-400">Baixe ou suba arquivos JSON de seus treinos e mantenha cópias de segurança.</p>
      </div>

      {/* SEÇÃO 1: ESTRUTURA DOS TREINOS (JSON) */}
      <div className="bg-dark-card border border-dark-border rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4 text-mint-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-mint-400">Rotina de Treinos</span>
            </div>
            <h3 className="text-base font-extrabold text-white mt-0.5">Estrutura dos Treinos (.json)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Baixe o arquivo JSON com seus treinos atuais, edite se quiser no computador, ou suba uma nova lista de treinos.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-1 bg-dark-surface border border-dark-border rounded-lg text-slate-300">
            {Object.keys(workouts).length} treinos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => StorageService.exportWorkoutsJSON(workouts)}
            className="h-12 bg-mint-500 hover:bg-mint-400 text-slate-950 font-black rounded-2xl text-xs sm:text-sm shadow-mint-glow transition flex items-center justify-center gap-2 active:scale-95"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Baixar Treinos (.json)</span>
          </button>

          <button
            onClick={() => workoutFileInputRef.current?.click()}
            className="h-12 bg-dark-surface hover:bg-dark-cardHover text-white font-bold rounded-2xl text-xs sm:text-sm border border-dark-borderLight transition flex items-center justify-center gap-2 active:scale-95"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Subir Novo Treino (.json)</span>
          </button>
        </div>

        <div className="pt-2 border-t border-dark-border/80 flex items-center justify-between text-xs text-slate-400">
          <span>Precisa dos treinos originais de volta?</span>
          <button
            onClick={async () => {
              const confirmed = await feedback.confirm({
                title: 'Restaurar Originais?',
                message: 'Restaurar os treinos A, B e C para os padrões de fábrica? Suas edições de treinos serão substituídas.',
                variant: 'warning',
                confirmText: 'Restaurar'
              });
              if (confirmed) {
                onResetWorkoutsToDefault();
                feedback.success('Treinos padrão restaurados.');
              }
            }}
            className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Originais</span>
          </button>
        </div>
      </div>

      {/* SEÇÃO 2: SESSÕES CONCLUÍDAS DO HISTÓRICO */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-mint-400" />
            Sessões Concluídas ({history.length})
          </h3>
        </div>

        {history.length === 0 ? (
          <div className="bg-dark-card border border-dark-border rounded-3xl p-8 text-center text-xs text-slate-400 space-y-2">
            <p className="font-semibold text-slate-300">Nenhum treino concluído no histórico ainda.</p>
            <p>Seus registros aparecerão aqui assim que você finalizar sua primeira sessão.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {history.map(sess => {
              const plan = workouts[sess.workoutId] || WORKOUTS_DATA[sess.workoutId] || { title: 'Treino Personalizado', code: '?' };
              const dateObj = new Date(sess.endedAt || sess.startedAt);
              const dateFormatted = dateObj.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
              const timeFormatted = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              const durMin = Math.round((sess.durationSeconds || 0) / 60);

              return (
                <div
                  key={sess.id}
                  onClick={() => setSelectedSession(sess)}
                  className="bg-dark-card hover:bg-dark-cardHover border border-dark-border rounded-2xl p-4 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-98"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-dark-surface text-mint-400 font-black text-xs flex items-center justify-center border border-dark-border shrink-0">
                        {plan.code}
                      </span>
                      <span className="text-xs text-slate-400 font-medium capitalize truncate">
                        {dateFormatted} às {timeFormatted}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-white mt-0.5 truncate">{plan.title}</h4>

                    <div className="flex items-center gap-2 text-[11px] text-slate-300 pt-1 flex-wrap">
                      <span>{durMin} min</span>
                      <span>•</span>
                      <span className="text-mint-400 font-bold">{sess.completedSetsCount || 0} séries</span>
                      <span>•</span>
                      <span className="text-cyan-400 font-bold">{(sess.totalVolumeKg || 0).toLocaleString('pt-BR')} kg</span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* SEÇÃO 3: BACKUP COMPLETO DO APP */}
      <div className="bg-dark-card border border-dark-border rounded-3xl p-5 shadow-xl space-y-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-mint-400">Backup Completo</span>
          <h3 className="text-base font-extrabold text-white">Histórico + Treinos (.json)</h3>
          <p className="text-xs text-slate-400 mt-0.5">Gera um arquivo com todo o histórico de execuções, cargas e rotinas cadastradas.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => StorageService.exportFullJSON(history, activeSession, workouts)}
            className="h-12 bg-dark-surface hover:bg-dark-cardHover text-white font-bold rounded-2xl text-xs sm:text-sm border border-dark-borderLight transition flex items-center justify-center gap-2 active:scale-95"
          >
            <Download className="w-4 h-4 text-mint-400" />
            <span>Baixar Backup Completo</span>
          </button>

          <button
            onClick={() => fullBackupFileInputRef.current?.click()}
            className="h-12 bg-dark-surface hover:bg-dark-cardHover text-white font-bold rounded-2xl text-xs sm:text-sm border border-dark-borderLight transition flex items-center justify-center gap-2 active:scale-95"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Restaurar Backup Completo</span>
          </button>
        </div>

        {/* Informações de Armazenamento e Limpeza Geral */}
        <div className="pt-2 border-t border-dark-border/80 flex items-center justify-between text-xs text-slate-400">
          <span>Espaço local utilizado: <strong className="text-white font-mono">{sizeKb} KB</strong></span>
          <button
            onClick={async () => {
              const confirmed = await feedback.confirm({
                title: 'Limpar Todos os Dados?',
                message: 'Tem certeza absoluta que deseja resetar e apagar permanentemente todo o histórico e treinos salvos?',
                variant: 'danger',
                confirmText: 'Sim, Limpar Tudo'
              });
              if (confirmed) {
                onResetAll();
                feedback.info('Todos os dados foram resetados.');
              }
            }}
            className="text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Tudo</span>
          </button>
        </div>
      </div>

      {/* MODAL DE DETALHES DA SESSÃO SELECIONADA */}
      {selectedSession && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-dark-surface border border-dark-borderLight rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl relative my-auto animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="p-4 border-b border-dark-border flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  {new Date(selectedSession.endedAt || selectedSession.startedAt).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
                <h3 className="text-base font-extrabold text-white mt-0.5">
                  {workouts[selectedSession.workoutId]?.title || WORKOUTS_DATA[selectedSession.workoutId]?.title || 'Treino'}
                </h3>
                <p className="text-xs text-mint-400 font-medium mt-0.5">
                  {Math.round((selectedSession.durationSeconds || 0)/60)} min · {selectedSession.completedSetsCount || 0} séries · {(selectedSession.totalVolumeKg || 0).toLocaleString('pt-BR')} kg volume
                </p>
              </div>

              <button
                onClick={() => setSelectedSession(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-dark-card transition"
              >
                ✕
              </button>
            </div>

            {/* Conteúdo com Exercícios e Séries */}
            <div className="p-4 overflow-y-auto space-y-3 custom-scrollbar text-sm">
              {selectedSession.exercises.map(ex => {
                const completedSets = ex.sets.filter(s => s.completed);

                return (
                  <div key={ex.id} className="bg-dark-card border border-dark-border rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-xs sm:text-sm">{ex.id} - {ex.name}</h4>
                      <span className="text-[11px] text-slate-400">{completedSets.length} séries feitas</span>
                    </div>

                    {completedSets.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                        {completedSets.map((s, idx) => {
                          const typeLabel = s.type === 'dropset' ? ' (Drop)' : s.type === 'extra' ? ' (Extra)' : '';
                          return (
                            <div key={idx} className="bg-dark-surface p-2 rounded-xl border border-dark-border text-xs">
                              <span className="text-slate-400 block text-[10px]">S{s.setIndex}{typeLabel}:</span>
                              <span className="font-bold text-mint-400">{s.weightKg} kg</span> × <span className="font-bold text-white">{s.reps} reps</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">Nenhuma série concluída neste exercício.</p>
                    )}

                    {ex.notes && (
                      <p className="text-xs text-slate-400 italic bg-dark-surface p-2 rounded-xl border border-dark-border">
                        Nota: {ex.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Rodapé do Modal */}
            <div className="p-3.5 border-t border-dark-border flex items-center justify-between gap-2">
              <button
                onClick={async () => {
                  const confirmed = await feedback.confirm({
                    title: 'Excluir Sessão?',
                    message: 'Excluir esta sessão do histórico permanentemente?',
                    variant: 'danger',
                    confirmText: 'Excluir'
                  });
                  if (confirmed) {
                    onDeleteSession(selectedSession.id);
                    setSelectedSession(null);
                    feedback.info('Sessão excluída do histórico.');
                  }
                }}
                className="h-11 px-3.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/50 rounded-xl text-xs font-semibold transition active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>
              <button
                onClick={() => setSelectedSession(null)}
                className="h-11 px-6 bg-dark-card hover:bg-dark-cardHover text-white rounded-xl text-xs font-bold transition active:scale-95 border border-dark-border"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
