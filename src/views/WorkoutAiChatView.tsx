import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Send,
  Mic,
  MicOff,
  RefreshCw,
  Key,
  CheckCircle2,
  RotateCcw,
  Dumbbell,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
  Bot,
  User,
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import {
  WorkoutPlan,
  AiNutritionSettings,
  AiWorkoutPlanItem,
  WorkoutCoachChatMessage
} from '../types';
import { CoachAiService } from '../services/coachAi';
import { SpeechService } from '../services/speech';
import { StorageService } from '../services/storage';
import { feedback } from '../services/feedback';

interface WorkoutAiChatViewProps {
  onBack: () => void;
  workouts: Record<string, WorkoutPlan>;
  initialTargetWorkoutId?: string | null;
  aiSettings: AiNutritionSettings;
  onSaveAiSettings: (settings: AiNutritionSettings) => void;
  onApplyWorkouts: (workouts: WorkoutPlan[], mode: 'replace_all' | 'append' | 'update') => void;
  onOpenGuide?: (exerciseId: string, exerciseName?: string) => void;
}

export function convertAiPlansToWorkoutPlans(
  aiWorkouts: AiWorkoutPlanItem[],
  existingWorkouts: Record<string, WorkoutPlan>
): WorkoutPlan[] {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  return aiWorkouts.map((w, idx) => {
    let code = w.code || letters[idx % letters.length] || `T${idx + 1}`;
    let id = w.id;

    if (id && existingWorkouts[id]) {
      code = existingWorkouts[id].code;
    } else if (!id) {
      id = `treino_${code.toLowerCase()}_${Date.now()}_${idx}`;
    }

    const plannedExercises = w.exercises.map((ex, exIdx) => ({
      id: `${code}${exIdx + 1}`,
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

    return {
      id,
      code,
      title: w.title,
      shortTitle: w.shortTitle || `Treino ${code}`,
      dayLabel: w.dayLabel || 'Personalizado',
      focus: w.focus,
      estimatedMinutes: w.estimatedMinutes || 50,
      totalPlannedSets,
      exercises: plannedExercises
    };
  });
}

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Peito',
  back: 'Costas',
  shoulders: 'Ombros',
  arms: 'Braços',
  quads: 'Quadríceps',
  hamstrings: 'Posteriores',
  calves: 'Panturrilhas',
  abs: 'Abdômen'
};

export const WorkoutAiChatView: React.FC<WorkoutAiChatViewProps> = ({
  onBack,
  workouts,
  initialTargetWorkoutId,
  aiSettings,
  onSaveAiSettings,
  onApplyWorkouts,
  onOpenGuide
}) => {
  // Configuração da chave de API
  const [apiKeyInput, setApiKeyInput] = useState(aiSettings.apiKey || '');
  const [modelInput, setModelInput] = useState(aiSettings.model || 'gemini-3.8-flash');
  const [showKeyForm, setShowKeyForm] = useState(!aiSettings.apiKey);

  // Histórico de mensagens da conversa
  const [messages, setMessages] = useState<WorkoutCoachChatMessage[]>(() => {
    const saved = StorageService.loadWorkoutChatHistory();
    if (saved && saved.length > 0) return saved;

    const targetW = initialTargetWorkoutId ? workouts[initialTargetWorkoutId] : null;
    const initialText = targetW
      ? `Olá! Estou pronto para ajustar o **Treino ${targetW.code} (${targetW.title})**. Como você gostaria de alterá-lo? (Ex: *"Trocar o supino com barra por halteres"*, *"Focar mais em força com menos repetições"*, *"Reduzir o tempo para 40 minutos"*...)`
      : `Olá! Sou seu Treinador IA de hipertrofia. Me diga o que você deseja para a sua rotina! Por exemplo: *"Quero uma rotina ABC focada em hipertrofia de 45 min"*, *"Divisão Push Pull Legs para 4 dias"*, ou *"Adapte meus treinos para focar mais em ombros e costas"*.\n\nPodemos ir conversando e ajustando cada detalhe até ficar do seu gosto!`;

    return [
      {
        id: `msg_init_${Date.now()}`,
        role: 'assistant',
        content: initialText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  // Estado atual dos treinos sendo moldados na conversa
  const [currentDraftWorkouts, setCurrentDraftWorkouts] = useState<AiWorkoutPlanItem[] | null>(() => {
    // Busca do último resultado no histórico, se houver
    const saved = StorageService.loadWorkoutChatHistory();
    if (saved && saved.length > 0) {
      for (let i = saved.length - 1; i >= 0; i--) {
        if (saved[i].workouts && saved[i].workouts!.length > 0) {
          return saved[i].workouts!;
        }
      }
    }
    return null;
  });

  // Controle de abas do card de pré-visualização (caso haja mais de um treino, ex: A, B, C)
  const [selectedPreviewTab, setSelectedPreviewTab] = useState<number>(0);
  const [appliedMessageId, setAppliedMessageId] = useState<string | null>(null);

  // Campo de texto e envio
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Áudio / Reconhecimento de Voz
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const speechBaseTextRef = useRef<string>('');

  // Scroll automático para a última mensagem
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Persistir mensagens no localStorage
  useEffect(() => {
    if (messages.length > 0) {
      StorageService.saveWorkoutChatHistory(messages);
    }
  }, [messages]);

  // Salvar Chave do Gemini
  const handleSaveApiKey = () => {
    if (!apiKeyInput.trim()) {
      feedback.warning('Informe a chave de API do Gemini.');
      return;
    }
    const updated: AiNutritionSettings = {
      ...aiSettings,
      apiKey: apiKeyInput.trim(),
      model: modelInput.trim() || 'gemini-3.8-flash',
      provider: 'gemini'
    };
    onSaveAiSettings(updated);
    setShowKeyForm(false);
    feedback.success('Configurações da IA salvas com sucesso!');
  };

  // Reconhecimento de Voz
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

    speechBaseTextRef.current = inputText.trim();

    const rec = SpeechService.createRecognitionInstance({
      onStart: () => {
        setIsListening(true);
        feedback.info('Treinador IA ouvindo... Pode falar!');
      },
      onResult: (transcript) => {
        const base = speechBaseTextRef.current;
        setInputText(base ? `${base} ${transcript}` : transcript);
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

  // Enviar Mensagem para o Chat
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    if (!aiSettings.apiKey && !apiKeyInput.trim()) {
      setShowKeyForm(true);
      feedback.warning('Configure sua chave do Gemini antes de conversar com o Treinador IA.');
      return;
    }

    const key = aiSettings.apiKey || apiKeyInput.trim();

    const userMsg: WorkoutCoachChatMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setIsSending(true);

    try {
      const targetW = initialTargetWorkoutId ? workouts[initialTargetWorkoutId] : null;

      const chatHistoryForAi = newHistory.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await CoachAiService.chatWorkoutCoach({
        userMessage: text,
        chatHistory: chatHistoryForAi,
        currentWorkouts: currentDraftWorkouts,
        targetWorkout: targetW,
        existingWorkouts: workouts,
        apiKey: key,
        model: aiSettings.model || 'gemini-3.8-flash'
      });

      const assistantMsg: WorkoutCoachChatMessage = {
        id: `msg_a_${Date.now()}`,
        role: 'assistant',
        content: res.replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        workouts: res.workouts,
        isFullRoutine: res.isFullRoutine
      };

      setMessages(prev => [...prev, assistantMsg]);
      if (res.workouts && res.workouts.length > 0) {
        setCurrentDraftWorkouts(res.workouts);
        setSelectedPreviewTab(0);
      }
    } catch (err: any) {
      console.error('Erro no chat do Treinador:', err);
      feedback.error(err.message || 'Falha ao conversar com o Treinador IA.');
      
      const errMsg: WorkoutCoachChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: `Desculpe, tive um problema ao processar seu pedido: *${err.message || 'Erro de conexão ou resposta'}*. Por favor, tente novamente ou verifique sua chave de API.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsSending(false);
    }
  };

  // Limpar conversa e iniciar novo chat
  const handleResetChat = () => {
    if (window.confirm('Deseja reiniciar a conversa com o Treinador IA?')) {
      StorageService.clearWorkoutChatHistory();
      setCurrentDraftWorkouts(null);
      setAppliedMessageId(null);
      setMessages([
        {
          id: `msg_init_${Date.now()}`,
          role: 'assistant',
          content: 'Chat reiniciado! Como você gostaria de estruturar sua nova rotina de treino?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      feedback.info('Conversa reiniciada.');
    }
  };

  // Aplicar treinos selecionados à rotina do app
  const handleApplyWorkoutPlans = (
    msgId: string,
    aiWorkouts: AiWorkoutPlanItem[],
    mode: 'replace_all' | 'append' | 'update'
  ) => {
    const plans = convertAiPlansToWorkoutPlans(aiWorkouts, workouts);
    if (plans.length === 0) return;

    onApplyWorkouts(plans, mode);
    setAppliedMessageId(msgId);
  };

  // Sugestões Rápidas para o Usuário
  const suggestionChips = [
    'Rotina ABC Hipertrofia (45 min)',
    'Divisão Push / Pull / Legs',
    'Upper / Lower (4 dias)',
    'Trocar barra por halteres',
    'Encurtar para 35 minutos',
    'Focar mais em braços e ombro',
    'Diminuir descanso para 60s'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-dark-bg text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] animate-in fade-in duration-200">
      
      {/* ======================================================== */}
      {/* 1. TOP HEADER DA TELA DE CHAT                             */}
      {/* ======================================================== */}
      <header className="h-16 px-4 bg-dark-card/95 backdrop-blur-xl border-b border-dark-border flex items-center justify-between shrink-0 shadow-lg select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-dark-surface hover:bg-dark-border border border-dark-border text-slate-300 hover:text-white flex items-center justify-center transition active:scale-95"
            title="Voltar para Meus Treinos"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-mint-400 flex items-center justify-center text-slate-950 font-black shadow-mint-glow-sm">
                <Sparkles className="w-5 h-5 fill-current" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-mint-400 border-2 border-dark-card rounded-full"></span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-white leading-tight">Treinador IA</h1>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Chat de Treinos
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-mint-400 animate-pulse"></span>
                Converse e monte sua rotina em tempo real
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowKeyForm(prev => !prev)}
            className={`p-2.5 rounded-xl border transition ${
              showKeyForm || !aiSettings.apiKey
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-dark-surface border-dark-border text-slate-400 hover:text-white hover:bg-dark-border'
            }`}
            title="Configurar Chave da API do Gemini"
          >
            <Key className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetChat}
            className="p-2.5 rounded-xl bg-dark-surface hover:bg-dark-border border border-dark-border text-slate-400 hover:text-rose-400 transition"
            title="Reiniciar Conversa"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. FORMULÁRIO DE CHAVE API (EXPANSÍVEL)                  */}
      {/* ======================================================== */}
      {showKeyForm && (
        <div className="p-4 bg-amber-500/10 border-b border-amber-500/25 shrink-0 animate-in slide-in-from-top-2">
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Key className="w-4 h-4" />
                Configurar Chave Gemini
              </span>
              <button
                onClick={() => setShowKeyForm(false)}
                className="text-[11px] text-amber-400 hover:underline"
              >
                Fechar
              </button>
            </div>

            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              Para o Treinador IA responder, informe sua chave gratuita do Google Gemini (Google AI Studio).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="sm:col-span-2 bg-dark-bg border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <select
                value={modelInput}
                onChange={(e) => setModelInput(e.target.value)}
                className="bg-dark-bg border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="gemini-3.8-flash">gemini-3.8-flash (Rápido)</option>
                <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro (Avançado)</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition active:scale-95"
              >
                Salvar Chave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. FLUXO PRINCIPAL DE MENSAGENS (STREAM DO CHAT)        */}
      {/* ======================================================== */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin">
        <div className="max-w-3xl mx-auto space-y-5">
          
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const hasWorkouts = msg.workouts && msg.workouts.length > 0;
            const previewWorkout = hasWorkouts
              ? msg.workouts![selectedPreviewTab] || msg.workouts![0]
              : null;
            const isApplied = appliedMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* Avatar do Treinador */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-mint-400 text-slate-950 flex items-center justify-center shrink-0 font-black shadow-sm mt-1">
                    <Sparkles className="w-4 h-4 fill-current" />
                  </div>
                )}

                {/* Conteúdo da Mensagem */}
                <div className={`max-w-[88%] sm:max-w-[80%] space-y-2`}>
                  
                  {/* Balão de Texto */}
                  <div
                    className={`p-3.5 sm:p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-mint-500 text-slate-950 font-medium rounded-tr-sm shadow-mint-glow-sm'
                        : 'bg-dark-surface border border-dark-border text-slate-200 rounded-tl-sm shadow-md'
                    }`}
                  >
                    <div className="whitespace-pre-line break-words">
                      {msg.content}
                    </div>

                    <div
                      className={`text-[10px] mt-1.5 flex justify-end ${
                        isUser ? 'text-slate-900/70 font-semibold' : 'text-slate-500'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {/* =================================================== */}
                  {/* CARD DE FICHA/TREINO INTERATIVO DENTRO DA RESPOSTA */}
                  {/* =================================================== */}
                  {hasWorkouts && previewWorkout && (
                    <div className="bg-dark-card border border-cyan-500/40 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl animate-in fade-in duration-300">
                      
                      {/* Cabeçalho do Card */}
                      <div className="flex items-start justify-between gap-3 border-b border-dark-border/80 pb-3">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            {msg.workouts!.length > 1
                              ? `Rotina Gerada (${msg.workouts!.length} treinos)`
                              : 'Treino Gerado'}
                          </span>
                          <h3 className="text-sm sm:text-base font-black text-white mt-0.5">
                            {previewWorkout.title}
                          </h3>
                          <p className="text-xs text-slate-300 mt-0.5">{previewWorkout.focus}</p>
                        </div>

                        <div className="text-right text-[11px] text-slate-400 shrink-0">
                          <span className="font-bold text-white block text-xs">
                            {previewWorkout.exercises.length} exercícios
                          </span>
                          <span>~{previewWorkout.estimatedMinutes} min</span>
                        </div>
                      </div>

                      {/* Seletor de Treinos (Treino A, B, C...) se for mais de 1 */}
                      {msg.workouts!.length > 1 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Dias da rotina:
                          </span>
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                            {msg.workouts!.map((w, idx) => (
                              <button
                                key={idx}
                                onClick={() => setSelectedPreviewTab(idx)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                                  selectedPreviewTab === idx
                                    ? 'bg-cyan-500 text-slate-950 font-black shadow-cyan-glow-sm'
                                    : 'bg-dark-surface border border-dark-border text-slate-300 hover:text-white'
                                }`}
                              >
                                <span>Treino {w.code}</span>
                                <span className="text-[10px] opacity-80">({w.exercises.length} ex)</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lista de Exercícios do Treino Ativo */}
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                        {previewWorkout.exercises.map((ex, exIdx) => (
                          <div
                            key={exIdx}
                            className="p-2.5 bg-dark-surface rounded-2xl border border-dark-border flex items-center justify-between text-xs hover:border-slate-600 transition"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="text-cyan-400 font-bold text-[11px] font-mono">
                                  {previewWorkout.code}{exIdx + 1}
                                </span>
                                <span className="font-bold text-white truncate">{ex.name}</span>
                                {ex.isDumbbell && (
                                  <span className="text-[10px] text-slate-400" title="Com halteres">
                                    🏋️‍♂️
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                <strong className="text-slate-200">{ex.sets}</strong> séries ×{' '}
                                <strong className="text-slate-200">{ex.reps}</strong> reps ·{' '}
                                {ex.restSeconds}s descanso
                                {ex.notes && ` · ${ex.notes}`}
                              </p>
                            </div>

                            <span className="text-[10px] font-semibold text-slate-300 bg-dark-card px-2 py-1 rounded-lg border border-dark-border shrink-0">
                              {MUSCLE_LABELS[ex.muscleGroup] || ex.muscleGroup}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* AÇÕES DE SALVAR / APLICAR DIRETO DA CONVERSA */}
                      <div className="pt-2 border-t border-dark-border space-y-2">
                        {isApplied ? (
                          <div className="p-3 bg-mint-500/15 border border-mint-500/30 rounded-2xl flex items-center justify-center gap-2 text-mint-400 text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                            <span>✓ Treino aplicado com sucesso à sua rotina!</span>
                          </div>
                        ) : (
                          <>
                            {msg.workouts!.length > 1 ? (
                              <div className="space-y-2">
                                <button
                                  onClick={() => handleApplyWorkoutPlans(msg.id, msg.workouts!, 'replace_all')}
                                  className="w-full h-11 bg-mint-500 hover:bg-mint-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-mint-glow transition active:scale-95"
                                >
                                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                  <span>Substituir Minha Rotina Atual por Esta ({msg.workouts!.length} treinos)</span>
                                </button>

                                <button
                                  onClick={() => handleApplyWorkoutPlans(msg.id, msg.workouts!, 'append')}
                                  className="w-full py-2 bg-dark-surface hover:bg-dark-border border border-dark-border text-slate-300 hover:text-white font-bold rounded-xl text-xs transition active:scale-95"
                                >
                                  Ou apenas adicionar estes {msg.workouts!.length} treinos aos já existentes
                                </button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button
                                  onClick={() => handleApplyWorkoutPlans(msg.id, msg.workouts!, 'update')}
                                  className="h-11 bg-mint-500 hover:bg-mint-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-mint-glow transition active:scale-95"
                                >
                                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                  <span>Salvar / Atualizar Este Treino</span>
                                </button>

                                <button
                                  onClick={() => handleApplyWorkoutPlans(msg.id, msg.workouts!, 'append')}
                                  className="h-11 bg-dark-surface hover:bg-dark-border border border-dark-border text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                                >
                                  <span>Adicionar como Novo Treino</span>
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                    </div>
                  )}

                </div>

                {/* Avatar do Usuário */}
                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 font-bold mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Indicador de Digitação da IA */}
          {isSending && (
            <div className="flex gap-3 justify-start animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-mint-400 text-slate-950 flex items-center justify-center shrink-0 font-black shadow-sm mt-1">
                <Sparkles className="w-4 h-4 fill-current" />
              </div>
              <div className="bg-dark-surface border border-dark-border rounded-3xl rounded-tl-sm p-4 text-xs text-slate-400 flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>O Treinador IA está analisando sua mensagem e ajustando a periodização...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. CHIPS DE SUGESTÃO RÁPIDA                              */}
      {/* ======================================================== */}
      <div className="px-4 py-2 bg-dark-card/60 border-t border-dark-border/60 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Ideias:
          </span>
          {suggestionChips.map((chip, idx) => (
            <button
              key={idx}
              disabled={isSending}
              onClick={() => handleSendMessage(chip)}
              className="text-[11px] px-3 py-1.5 rounded-xl bg-dark-surface hover:bg-dark-border border border-dark-border text-slate-300 hover:text-white transition shrink-0 active:scale-95 disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. BARRA INFERIOR DE ENTRADA (TEXTO + ÁUDIO + ENVIAR)   */}
      {/* ======================================================== */}
      <footer className="p-3 sm:p-4 bg-dark-card border-t border-dark-border shrink-0 select-none pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          
          {/* Botão de Áudio / Microfone */}
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            disabled={isSending}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition shrink-0 active:scale-95 ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                : 'bg-dark-surface hover:bg-dark-border text-slate-300 hover:text-mint-400 border border-dark-border'
            }`}
            title={isListening ? 'Parar gravação' : 'Falar com o Treinador por voz'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Campo de Texto */}
          <div className="flex-1 relative">
            <textarea
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                isListening
                  ? 'Ouvindo... pode falar seu pedido!'
                  : 'Fale ou digite o que quer ajustar no treino...'
              }
              disabled={isSending}
              className="w-full bg-dark-surface border border-dark-border rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none max-h-32 min-h-[44px]"
            />
          </div>

          {/* Botão Enviar */}
          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={isSending || !inputText.trim()}
            className="w-11 h-11 rounded-2xl bg-mint-500 hover:bg-mint-400 disabled:opacity-40 disabled:hover:bg-mint-500 text-slate-950 font-black flex items-center justify-center transition shrink-0 shadow-mint-glow-sm active:scale-95"
            title="Enviar mensagem"
          >
            {isSending ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5 stroke-[2.5]" />
            )}
          </button>

        </div>
      </footer>

    </div>
  );
};
