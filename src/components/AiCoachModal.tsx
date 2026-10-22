import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  TrendingUp,
  Dumbbell,
  Flame,
  Droplets,
  Target,
  RefreshCw,
  Mic,
  MicOff,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Key
} from 'lucide-react';
import {
  WorkoutPlan,
  WorkoutSession,
  MealLog,
  NutritionGoals,
  AiNutritionSettings,
  MuscleRecoveryStatus,
  MuscleGroup,
  WeeklyAssessment,
  AiWorkoutGenerationResult
} from '../types';
import { CoachAiService } from '../services/coachAi';
import { SpeechService } from '../services/speech';
import { feedback } from '../services/feedback';

interface AiCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'assessment' | 'workout_creator';
  targetWorkoutId?: string | null;
  history: WorkoutSession[];
  workouts: Record<string, WorkoutPlan>;
  meals: MealLog[];
  waterLogs: Record<string, number>;
  goals: NutritionGoals;
  recovery?: Record<MuscleGroup, MuscleRecoveryStatus>;
  aiSettings: AiNutritionSettings;
  onSaveAiSettings: (settings: AiNutritionSettings) => void;
  onApplyWorkout: (workout: WorkoutPlan, isNew: boolean) => void;
  savedAssessment: WeeklyAssessment | null;
  onSaveAssessment: (assessment: WeeklyAssessment | null) => void;
}

export const AiCoachModal: React.FC<AiCoachModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'assessment',
  targetWorkoutId = null,
  history,
  workouts,
  meals,
  waterLogs,
  goals,
  recovery,
  aiSettings,
  onSaveAiSettings,
  onApplyWorkout,
  savedAssessment,
  onSaveAssessment
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'assessment' | 'workout_creator'>(initialTab);

  // Chave da IA
  const [apiKeyInput, setApiKeyInput] = useState(aiSettings.apiKey || '');
  const [showKeyForm, setShowKeyForm] = useState(!aiSettings.apiKey);

  // Estado da Avaliação Semanal
  const [assessment, setAssessment] = useState<WeeklyAssessment | null>(savedAssessment);
  const [isGeneratingAssessment, setIsGeneratingAssessment] = useState(false);

  // Estado do Criador/Editor de Treino
  const [creatorMode, setCreatorMode] = useState<'new' | 'edit'>(targetWorkoutId ? 'edit' : 'new');
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>(
    targetWorkoutId || Object.keys(workouts)[0] || ''
  );
  const [workoutPrompt, setWorkoutPrompt] = useState('');
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<AiWorkoutGenerationResult | null>(null);

  // Áudio / Reconhecimento de Voz
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = React.useRef<any>(null);
  const speechBaseTextRef = React.useRef<string>('');

  useEffect(() => {
    if (targetWorkoutId) {
      setCreatorMode('edit');
      setSelectedWorkoutId(targetWorkoutId);
      setActiveTab('workout_creator');
    }
  }, [targetWorkoutId]);

  useEffect(() => {
    setAssessment(savedAssessment);
  }, [savedAssessment]);

  // Salvar Chave do Gemini
  const handleSaveApiKey = () => {
    if (!apiKeyInput.trim()) {
      feedback.warning('Informe a chave de API do Gemini.');
      return;
    }
    const updated = {
      ...aiSettings,
      apiKey: apiKeyInput.trim(),
      provider: 'gemini' as const
    };
    onSaveAiSettings(updated);
    setShowKeyForm(false);
    feedback.success('Chave da IA salva com sucesso!');
  };

  // 1. Gerar Avaliação Semanal
  const handleGenerateAssessment = async () => {
    if (!aiSettings.apiKey && !apiKeyInput.trim()) {
      setShowKeyForm(true);
      feedback.warning('Configure sua chave do Gemini antes de continuar.');
      return;
    }

    const key = aiSettings.apiKey || apiKeyInput.trim();
    setIsGeneratingAssessment(true);

    try {
      const result = await CoachAiService.generateWeeklyAssessment({
        history,
        meals,
        waterLogs,
        goals,
        recovery,
        apiKey: key,
        model: aiSettings.model || 'gemini-2.5-flash'
      });

      setAssessment(result);
      onSaveAssessment(result);
      feedback.success('Raio-X da semana gerado pelo Treinador IA!');
    } catch (err: any) {
      console.error('Erro na avaliação do Treinador:', err);
      feedback.error(err.message || 'Falha ao gerar avaliação semanal.');
    } finally {
      setIsGeneratingAssessment(false);
    }
  };

  // 2. Gravação de Voz para Criador de Treino
  const toggleSpeechRecognition = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if (!SpeechService.isSupported()) {
      feedback.warning('Seu navegador não suporta reconhecimento de voz.');
      return;
    }

    // Salva o texto que já estava no input antes de iniciar a fala
    speechBaseTextRef.current = workoutPrompt.trim();

    const rec = SpeechService.createRecognitionInstance({
      onStart: () => {
        setIsListening(true);
        feedback.info('Pode falar... O Treinador IA está ouvindo!');
      },
      onResult: (transcript) => {
        const base = speechBaseTextRef.current;
        setWorkoutPrompt(base ? `${base} ${transcript}` : transcript);
      },
      onError: (err) => {
        feedback.error(err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });

    if (rec) {
      recognitionRef.current = rec;
      rec.start();
    }
  };

  // 3. Gerar ou Ajustar Treino com IA
  const handleGenerateWorkout = async () => {
    if (!aiSettings.apiKey && !apiKeyInput.trim()) {
      setShowKeyForm(true);
      feedback.warning('Configure sua chave do Gemini antes de continuar.');
      return;
    }

    if (!workoutPrompt.trim()) {
      feedback.warning('Digite ou fale o que você deseja para o treino.');
      return;
    }

    const key = aiSettings.apiKey || apiKeyInput.trim();
    setIsGeneratingWorkout(true);

    try {
      const targetW = creatorMode === 'edit' && selectedWorkoutId ? workouts[selectedWorkoutId] : null;

      const result = await CoachAiService.generateOrEditWorkout({
        prompt: workoutPrompt.trim(),
        mode: creatorMode,
        currentWorkout: targetW,
        existingWorkouts: workouts,
        apiKey: key,
        model: aiSettings.model || 'gemini-2.5-flash'
      });

      setGeneratedResult(result);
      feedback.success('Ficha montada pelo Treinador IA!');
    } catch (err: any) {
      console.error('Erro ao gerar treino:', err);
      feedback.error(err.message || 'Falha ao montar treino com IA.');
    } finally {
      setIsGeneratingWorkout(false);
    }
  };

  // 4. Aplicar Treino Gerado ao App
  const handleApplyWorkoutToApp = () => {
    if (!generatedResult) return;

    const g = generatedResult.workout;
    const isEditing = creatorMode === 'edit' && selectedWorkoutId && workouts[selectedWorkoutId];

    let code = 'A';
    let id = `treino_${Date.now()}`;

    if (isEditing) {
      const existing = workouts[selectedWorkoutId];
      code = existing.code;
      id = existing.id;
    } else {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const count = Object.keys(workouts).length;
      code = letters[count % letters.length] || `T${count + 1}`;
      id = `treino_${code.toLowerCase()}_${Date.now()}`;
    }

    const plannedExercises = g.exercises.map((ex, idx) => ({
      id: `${code}${idx + 1}`,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      sets: ex.sets,
      reps: ex.reps,
      restSeconds: ex.restSeconds,
      notes: ex.notes,
      targetLoadKg: ex.targetLoadKg,
      isDumbbell: ex.isDumbbell
    }));

    const totalPlannedSets = plannedExercises.reduce((sum, e) => sum + e.sets, 0);

    const finalPlan: WorkoutPlan = {
      id,
      code,
      title: g.title,
      shortTitle: g.shortTitle || `Treino ${code}`,
      dayLabel: g.dayLabel || (isEditing ? workouts[selectedWorkoutId].dayLabel : 'Personalizado'),
      focus: g.focus,
      estimatedMinutes: g.estimatedMinutes || 50,
      totalPlannedSets,
      exercises: plannedExercises
    };

    onApplyWorkout(finalPlan, !isEditing);
    feedback.success(isEditing ? 'Treino atualizado com sucesso!' : 'Novo treino adicionado aos seus treinos!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-dark-card border border-dark-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Cabeçalho */}
        <div className="p-4 sm:p-5 border-b border-dark-border bg-gradient-to-r from-dark-surface via-dark-card to-dark-surface flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-mint-600 to-mint-400 flex items-center justify-center text-slate-950 font-black shadow-mint-glow-sm">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">Treinador IA</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-mint-500/15 text-mint-400 border border-mint-500/30 uppercase tracking-wider">
                  Pro Coach
                </span>
              </div>
              <p className="text-xs text-slate-400">Raio-X semanal completo & montagem inteligente de fichas</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas Principais */}
        <div className="grid grid-cols-2 p-2 bg-dark-bg/60 border-b border-dark-border text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('assessment')}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition ${
              activeTab === 'assessment'
                ? 'bg-mint-500 text-slate-950 shadow-mint-glow-sm font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Raio-X da Semana</span>
          </button>

          <button
            onClick={() => setActiveTab('workout_creator')}
            className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition ${
              activeTab === 'workout_creator'
                ? 'bg-mint-500 text-slate-950 shadow-mint-glow-sm font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span>Montar / Ajustar Treino</span>
          </button>
        </div>

        {/* Banner de Configuração de Chave Gemini se não houver ou se expandido */}
        {showKeyForm && (
          <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-200 shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-amber-300">
                <Key className="w-4 h-4" />
                Chave da API Google Gemini
              </span>
              {aiSettings.apiKey && (
                <button
                  onClick={() => setShowKeyForm(false)}
                  className="text-slate-400 hover:text-white text-[11px]"
                >
                  Ocultar
                </button>
              )}
            </div>
            <p className="text-[11px] text-amber-300/80">
              O Treinador IA usa o Google Gemini Flash gratuito. Cole sua chave para ativar a análise inteligente.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Cole sua API Key do Google AI Studio (AIza...)"
                className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-mint-500"
              />
              <button
                onClick={handleSaveApiKey}
                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition active:scale-95"
              >
                Salvar
              </button>
            </div>
          </div>
        )}

        {/* Conteúdo com Scroll */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* ======================================================== */}
          {/* TAB 1: RAIO-X DA SEMANA (TREINO + DIETA + ÁGUA)          */}
          {/* ======================================================== */}
          {activeTab === 'assessment' && (
            <div className="space-y-4">
              
              {/* Botão de Disparo / Atualização */}
              <div className="flex items-center justify-between bg-dark-surface p-3.5 rounded-2xl border border-dark-border">
                <div>
                  <span className="text-xs font-bold text-white block">Avaliação Semanal dos Últimos 7 Dias</span>
                  <span className="text-[11px] text-slate-400">
                    {assessment ? `Atualizado em: ${new Date(assessment.createdAt).toLocaleDateString('pt-BR')} às ${new Date(assessment.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Nenhum raio-x gerado ainda'}
                  </span>
                </div>
                <button
                  onClick={handleGenerateAssessment}
                  disabled={isGeneratingAssessment}
                  className="h-9 px-3.5 bg-mint-500 hover:bg-mint-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-mint-glow-sm transition active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAssessment ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingAssessment ? 'Analisando...' : assessment ? 'Atualizar' : 'Gerar Raio-X'}</span>
                </button>
              </div>

              {/* Estado de Carregamento */}
              {isGeneratingAssessment && (
                <div className="bg-dark-surface/50 border border-mint-500/30 rounded-3xl p-8 text-center space-y-3 animate-pulse">
                  <div className="w-12 h-12 rounded-2xl bg-mint-500/20 text-mint-400 flex items-center justify-center mx-auto border border-mint-500/40">
                    <Sparkles className="w-6 h-6 animate-spin" />
                  </div>
                  <h4 className="text-sm font-bold text-white">O Treinador IA está cruzando seus dados...</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Avaliando sessões de treino, cargas totais, média de calorias, consumo proteico e hidratação dos últimos 7 dias.
                  </p>
                </div>
              )}

              {/* Se Não Há Avaliação Gerada Ainda */}
              {!assessment && !isGeneratingAssessment && (
                <div className="bg-dark-surface border border-dark-border rounded-3xl p-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-3xl bg-mint-500/10 text-mint-400 flex items-center justify-center mx-auto border border-mint-500/20">
                    <TrendingUp className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">Veja seu desempenho completo da semana</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      A IA analisa tudo que você fez: se atingiu o volume de treino necessário, se bateu a meta de proteínas para hipertrofia e se manteve a hidratação correta.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateAssessment}
                    className="h-12 px-6 bg-mint-500 hover:bg-mint-400 text-slate-950 font-black rounded-2xl text-xs shadow-mint-glow transition active:scale-95"
                  >
                    ✨ Analisar Minha Semana com IA
                  </button>
                </div>
              )}

              {/* Exibição Completa do Relatório do Treinador */}
              {assessment && !isGeneratingAssessment && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  
                  {/* Card de Nota Geral e Resumo */}
                  <div className="bg-gradient-to-br from-dark-surface via-dark-card to-dark-bg border border-mint-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-mint-400">Parecer do Coach</span>
                        <h3 className="text-lg sm:text-xl font-black text-white">{assessment.headline}</h3>
                        <p className="text-xs text-slate-300 leading-relaxed mt-1">{assessment.summary}</p>
                      </div>

                      <div className="text-center bg-dark-bg/80 border border-mint-500/30 rounded-2xl p-3 shrink-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Nota</span>
                        <span className="text-2xl sm:text-3xl font-black text-mint-400 font-mono">
                          {assessment.overallScore.toFixed(1)}
                        </span>
                        <span className="text-[9px] text-slate-400 block font-semibold">de 10</span>
                      </div>
                    </div>

                    {/* Pílulas de Resumo Numérico Real */}
                    <div className="mt-4 pt-3 border-t border-dark-border/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="bg-dark-surface/60 p-2 rounded-xl border border-dark-border">
                        <span className="text-[10px] text-slate-400 block">Treinos Feitos</span>
                        <span className="font-extrabold text-white">{assessment.stats.totalWorkouts} sessões</span>
                      </div>
                      <div className="bg-dark-surface/60 p-2 rounded-xl border border-dark-border">
                        <span className="text-[10px] text-slate-400 block">Carga Acumulada</span>
                        <span className="font-extrabold text-mint-400 font-mono">{assessment.stats.totalVolumeKg.toLocaleString()} kg</span>
                      </div>
                      <div className="bg-dark-surface/60 p-2 rounded-xl border border-dark-border">
                        <span className="text-[10px] text-slate-400 block">Média Calórica</span>
                        <span className="font-extrabold text-white font-mono">{assessment.stats.averageDailyCalories} kcal</span>
                      </div>
                      <div className="bg-dark-surface/60 p-2 rounded-xl border border-dark-border">
                        <span className="text-[10px] text-slate-400 block">Média Água</span>
                        <span className="font-extrabold text-sky-400 font-mono">{assessment.stats.averageDailyWaterMl} ml</span>
                      </div>
                    </div>
                  </div>

                  {/* 1. Análise de Treino */}
                  <div className="bg-dark-card border border-dark-border rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-mint-500/15 text-mint-400 flex items-center justify-center font-bold">
                          <Dumbbell className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-white">Treino & Sobrecarga</h4>
                          <span className="text-[11px] text-slate-400">{assessment.stats.totalSets} séries totais</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-mint-400 bg-mint-500/10 px-2 py-0.5 rounded-lg border border-mint-500/20 font-mono">
                        Nota {assessment.workoutAnalysis.score.toFixed(1)}
                      </span>
                    </div>

                    {/* Destaques Positivos */}
                    {assessment.workoutAnalysis.highlights.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold text-mint-400 uppercase tracking-wider block">Mandou Bem:</span>
                        {assessment.workoutAnalysis.highlights.map((h, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-mint-400 shrink-0 mt-0.5" />
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* O que melhorar */}
                    {assessment.workoutAnalysis.improvements.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Ponto de Atenção:</span>
                        {assessment.workoutAnalysis.improvements.map((imp, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>{imp}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {assessment.workoutAnalysis.recommendations && (
                      <div className="p-3 bg-dark-surface rounded-xl border border-dark-border text-xs text-slate-300">
                        <strong className="text-mint-400 block mb-0.5">Dica do Treinador:</strong>
                        {assessment.workoutAnalysis.recommendations}
                      </div>
                    )}
                  </div>

                  {/* 2. Análise de Dieta & Nutrição */}
                  <div className="bg-dark-card border border-dark-border rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
                          <Flame className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-white">Alimentação & Macros</h4>
                          <span className="text-[11px] text-slate-400">
                            Média de {assessment.stats.averageDailyProtein}g proteína / dia
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 font-mono">
                        Nota {assessment.nutritionAnalysis.score.toFixed(1)}
                      </span>
                    </div>

                    {/* Destaques Positivos */}
                    {assessment.nutritionAnalysis.highlights.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold text-mint-400 uppercase tracking-wider block">Acertos na Dieta:</span>
                        {assessment.nutritionAnalysis.highlights.map((h, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-mint-400 shrink-0 mt-0.5" />
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* O que melhorar */}
                    {assessment.nutritionAnalysis.improvements.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Ajustes Necessários:</span>
                        {assessment.nutritionAnalysis.improvements.map((imp, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>{imp}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {assessment.nutritionAnalysis.recommendations && (
                      <div className="p-3 bg-dark-surface rounded-xl border border-dark-border text-xs text-slate-300">
                        <strong className="text-amber-400 block mb-0.5">Estratégia Nutricional:</strong>
                        {assessment.nutritionAnalysis.recommendations}
                      </div>
                    )}
                  </div>

                  {/* 3. Análise de Hidratação */}
                  <div className="bg-dark-card border border-dark-border rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center font-bold">
                          <Droplets className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-white">Hidratação</h4>
                          <span className="text-[11px] text-slate-400">
                            Meta batida em {assessment.stats.waterGoalHitDays} de 7 dias
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20 font-mono">
                        Nota {assessment.hydrationAnalysis.score.toFixed(1)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {assessment.hydrationAnalysis.recommendations}
                    </p>
                  </div>

                  {/* 4. Metas para a Próxima Semana */}
                  {assessment.nextWeekActionPlan.length > 0 && (
                    <div className="bg-gradient-to-r from-mint-950/40 via-dark-card to-dark-surface border border-mint-500/40 rounded-2xl p-4 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-mint-400" />
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">
                          Plano de Ação para a Próxima Semana
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {assessment.nextWeekActionPlan.map((action, i) => (
                          <div key={i} className="flex items-start gap-2.5 text-xs text-slate-200">
                            <span className="w-5 h-5 rounded-full bg-mint-500 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="font-medium">{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: MONTAR OU AJUSTAR TREINO COM IA                   */}
          {/* ======================================================== */}
          {activeTab === 'workout_creator' && (
            <div className="space-y-4">
              
              {/* Seletor de Modo: Novo Treino vs Ajustar Existente */}
              <div className="grid grid-cols-2 p-1 bg-dark-surface rounded-2xl border border-dark-border text-xs font-bold">
                <button
                  onClick={() => {
                    setCreatorMode('new');
                    setGeneratedResult(null);
                  }}
                  className={`py-2 rounded-xl transition ${
                    creatorMode === 'new'
                      ? 'bg-mint-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Criar Novo Treino
                </button>
                <button
                  onClick={() => {
                    setCreatorMode('edit');
                    setGeneratedResult(null);
                  }}
                  className={`py-2 rounded-xl transition ${
                    creatorMode === 'edit'
                      ? 'bg-mint-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Ajustar Treino Existente
                </button>
              </div>

              {/* Se for modo de ajuste, selecionar qual treino */}
              {creatorMode === 'edit' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Treino a ser modificado:</label>
                  <select
                    value={selectedWorkoutId}
                    onChange={(e) => setSelectedWorkoutId(e.target.value)}
                    className="w-full bg-dark-surface border border-dark-border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-mint-500"
                  >
                    {Object.keys(workouts).map(id => (
                      <option key={id} value={id}>
                        {workouts[id].code} — {workouts[id].title} ({workouts[id].exercises.length} exercícios)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Caixa de Texto + Voz */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    {creatorMode === 'new'
                      ? 'O que você quer no novo treino?'
                      : 'Quais mudanças deseja fazer neste treino?'}
                  </label>
                  <span className="text-[10px] text-slate-400">Texto ou voz</span>
                </div>

                <div className="relative">
                  <textarea
                    rows={4}
                    value={workoutPrompt}
                    onChange={(e) => setWorkoutPrompt(e.target.value)}
                    placeholder={
                      creatorMode === 'new'
                        ? 'Ex: Quero um treino ABC para hipertrofia com foco em costas e bíceps, duração de 45 minutos...'
                        : 'Ex: Estou com desconforto no ombro com o supino inclinado barra, troca por halter e adiciona mais volume de trapézio...'
                    }
                    className="w-full bg-dark-surface border border-dark-border rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-mint-500 pr-12 leading-relaxed"
                  />

                  {/* Botão de Microfone */}
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`absolute bottom-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center transition ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-dark-card hover:bg-dark-border text-slate-300 hover:text-mint-400 border border-dark-border'
                    }`}
                    title={isListening ? 'Parar gravação' : 'Falar com o microfone'}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sugestões Rápidas (Chips) */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sugestões rápidas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(creatorMode === 'new'
                    ? [
                        'Treino ABC foco Hipertrofia (45 min)',
                        'Upper / Lower com foco em Braços',
                        'Full Body 3x na semana rápido',
                        'Pernas completo com foco em Quadríceps'
                      ]
                    : [
                        'Trocar exercícios que incomodam ombro',
                        'Encurtar para 35 minutos com bi-sets',
                        'Aumentar volume de bíceps e tríceps',
                        'Focar em cargas pesadas com menos repetições'
                      ]
                  ).map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setWorkoutPrompt(chip)}
                      className="text-[11px] px-2.5 py-1 rounded-xl bg-dark-surface hover:bg-dark-border border border-dark-border text-slate-300 hover:text-white transition"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botão de Gerar com IA */}
              <button
                onClick={handleGenerateWorkout}
                disabled={isGeneratingWorkout || !workoutPrompt.trim()}
                className="w-full h-12 bg-mint-500 hover:bg-mint-400 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-mint-glow transition active:scale-95"
              >
                {isGeneratingWorkout ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Montando ficha com IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-current" />
                    <span>{creatorMode === 'new' ? 'Criar Treino com IA' : 'Ajustar Treino com IA'}</span>
                  </>
                )}
              </button>

              {/* Pré-visualização do Treino Gerado */}
              {generatedResult && (
                <div className="bg-dark-surface border border-mint-500/40 rounded-3xl p-5 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-mint-400">
                        {creatorMode === 'new' ? 'Novo Treino Gerado' : 'Treino Atualizado pela IA'}
                      </span>
                      <h3 className="text-base font-extrabold text-white">{generatedResult.workout.title}</h3>
                      <p className="text-xs text-slate-300 mt-0.5">{generatedResult.workout.focus}</p>
                    </div>

                    <div className="text-right text-xs shrink-0">
                      <span className="font-bold text-mint-400 block font-mono">
                        {generatedResult.workout.exercises.length} exercícios
                      </span>
                      <span className="text-[11px] text-slate-400">~{generatedResult.workout.estimatedMinutes} min</span>
                    </div>
                  </div>

                  {generatedResult.message && (
                    <div className="p-3 bg-dark-bg/60 rounded-xl border border-dark-border text-xs text-slate-300">
                      <strong className="text-mint-400 block mb-0.5">Estratégia do Treinador:</strong>
                      {generatedResult.message}
                    </div>
                  )}

                  {/* Lista de Exercícios Propostos */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Exercícios inclusos:
                    </span>
                    {generatedResult.workout.exercises.map((ex, i) => (
                      <div
                        key={i}
                        className="p-3 bg-dark-card rounded-2xl border border-dark-border flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-lg bg-mint-500/15 text-mint-400 font-bold text-[10px] flex items-center justify-center border border-mint-500/30 shrink-0">
                              {i + 1}
                            </span>
                            <span className="font-bold text-white truncate">{ex.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {ex.sets} séries × {ex.reps} reps · {ex.restSeconds}s descanso
                            {ex.notes && ` · ${ex.notes}`}
                          </p>
                        </div>

                        <span className="text-[10px] font-semibold text-slate-400 bg-dark-surface px-2 py-0.5 rounded-lg border border-dark-border shrink-0">
                          {ex.muscleGroup}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Botão de Aplicação */}
                  <div className="pt-2">
                    <button
                      onClick={handleApplyWorkoutToApp}
                      className="w-full h-12 bg-mint-500 hover:bg-mint-400 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-mint-glow transition active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>
                        {creatorMode === 'new'
                          ? 'Salvar e Adicionar aos Meus Treinos'
                          : 'Confirmar e Substituir Treino'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
