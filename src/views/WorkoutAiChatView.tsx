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
  User,
  Plus,
  MessageSquare,
  Trash2,
  CalendarRange,
  BookOpen,
  Activity
} from 'lucide-react';
import {
  WorkoutPlan,
  WorkoutSession,
  MealLog,
  NutritionGoals,
  MuscleGroup,
  MuscleRecoveryStatus,
  AiNutritionSettings,
  AiWorkoutPlanItem,
  WorkoutCoachChatMessage,
  WorkoutChatConversation
} from '../types';
import { CoachAiService, buildWeeklyDietAndWorkoutContext } from '../services/coachAi';
import { SpeechService } from '../services/speech';
import { StorageService } from '../services/storage';
import { feedback } from '../services/feedback';

interface WorkoutAiChatViewProps {
  onBack: () => void;
  workouts: Record<string, WorkoutPlan>;
  history?: WorkoutSession[];
  meals?: MealLog[];
  waterLogs?: Record<string, number>;
  goals?: NutritionGoals;
  recovery?: Record<MuscleGroup, MuscleRecoveryStatus>;
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

const MUSCLE_BADGE_COLORS: Record<string, string> = {
  chest: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  back: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  shoulders: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  arms: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  quads: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  hamstrings: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  calves: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  abs: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
};

function renderInlineFormatting(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-bold text-inherit">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="italic opacity-90">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function renderFormattedMessage(content: string): React.ReactNode {
  const lines = content.split('\n');
  return (
    <div className="space-y-1.5 break-words">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={i} className="h-1" />;
        }
        if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
          return (
            <div key={i} className="flex items-start gap-2 pl-1">
              <span className="text-cyan-400 font-bold mt-0.5">•</span>
              <span className="flex-1">{renderInlineFormatting(trimmed.slice(2))}</span>
            </div>
          );
        }
        return <p key={i}>{renderInlineFormatting(line)}</p>;
      })}
    </div>
  );
}

function createInitialConversation(
  targetWorkout?: WorkoutPlan | null
): WorkoutChatConversation {
  const now = new Date().toISOString();
  const initialText = targetWorkout
    ? `Olá! Estou pronto para ajustar o **Treino ${targetWorkout.code} (${targetWorkout.title})**. Como você gostaria de alterá-lo? (Ex: *"Trocar o supino com barra por halteres"*, *"Focar mais em força com menos repetições"*, *"Reduzir o tempo para 40 minutos"*...)`
    : `Olá! Sou seu **Treinador IA** de hipertrofia.\n\nPosso montar sua rotina do zero, ajustar treinos existentes ou **analisar sua última semana de dieta e treino** em uma conversa dedicada.\n\nO que vamos fazer hoje?`;

  return {
    id: `conv_${Date.now()}`,
    title: targetWorkout ? `Ajuste: Treino ${targetWorkout.code}` : 'Nova Conversa',
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: `msg_init_${Date.now()}`,
        role: 'assistant',
        content: initialText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ],
    draftWorkouts: null
  };
}

export const WorkoutAiChatView: React.FC<WorkoutAiChatViewProps> = ({
  onBack,
  workouts,
  history = [],
  meals = [],
  waterLogs = {},
  goals,
  recovery,
  initialTargetWorkoutId,
  aiSettings,
  onSaveAiSettings,
  onApplyWorkouts,
  onOpenGuide
}) => {
  // Configuração da chave de API
  const [apiKeyInput, setApiKeyInput] = useState(aiSettings.apiKey || '');
  const [modelInput, setModelInput] = useState(aiSettings.model || 'gemini-4-hydrogen');
  const [showKeyForm, setShowKeyForm] = useState(!aiSettings.apiKey);

  // Gerenciamento de múltiplas conversas
  const [conversations, setConversations] = useState<WorkoutChatConversation[]>(() => {
    const saved = StorageService.loadWorkoutChatConversations();
    if (saved.length > 0) return saved;
    const targetW = initialTargetWorkoutId ? workouts[initialTargetWorkoutId] : null;
    return [createInitialConversation(targetW)];
  });

  const [activeConversationId, setActiveConversationId] = useState<string>(() => {
    const saved = StorageService.loadWorkoutChatConversations();
    if (saved.length > 0) return saved[0].id;
    return '';
  });

  // Garantir que activeConversationId sempre aponte para uma conversa válida
  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0];

  useEffect(() => {
    if (activeConversation && activeConversation.id !== activeConversationId) {
      setActiveConversationId(activeConversation.id);
    }
  }, [activeConversation, activeConversationId]);

  // Persistir conversas no localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      StorageService.saveWorkoutChatConversations(conversations);
    }
  }, [conversations]);

  const messages = activeConversation?.messages || [];
  const currentDraftWorkouts = activeConversation?.draftWorkouts || null;

  // UI: drawer de conversas, tabs por mensagem e expandir/recolher
  const [showConversationsList, setShowConversationsList] = useState(false);
  const [previewTabs, setPreviewTabs] = useState<Record<string, number>>({});
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});
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
  }, [messages.length, isSending, activeConversation?.id]);

  // Salvar Chave do Gemini
  const handleSaveApiKey = () => {
    if (!apiKeyInput.trim()) {
      feedback.warning('Informe a chave de API do Gemini.');
      return;
    }
    const updated: AiNutritionSettings = {
      ...aiSettings,
      apiKey: apiKeyInput.trim(),
      model: modelInput.trim() || 'gemini-4-hydrogen',
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

  // Enviar Mensagem para uma conversa específica
  const sendMessageInConversation = async (
    targetConv: WorkoutChatConversation,
    text: string,
    isWeeklyContextMsg = false
  ) => {
    const key = aiSettings.apiKey || apiKeyInput.trim();
    if (!key) {
      setShowKeyForm(true);
      feedback.warning('Configure sua chave do Gemini antes de conversar com o Treinador IA.');
      return;
    }

    const userMsg: WorkoutCoachChatMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isWeeklyContext: isWeeklyContextMsg
    };

    const updatedMessages = [...targetConv.messages, userMsg];
    const autoTitle =
      targetConv.title === 'Nova Conversa' && !isWeeklyContextMsg
        ? text.slice(0, 34) + (text.length > 34 ? '...' : '')
        : targetConv.title;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetConv.id
          ? { ...c, title: autoTitle, messages: updatedMessages, updatedAt: new Date().toISOString() }
          : c
      )
    );

    if (!isWeeklyContextMsg) {
      setInputText('');
    }
    setIsSending(true);

    try {
      const targetW = initialTargetWorkoutId ? workouts[initialTargetWorkoutId] : null;
      const chatHistoryForAi = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await CoachAiService.chatWorkoutCoach({
        userMessage: text,
        chatHistory: chatHistoryForAi,
        currentWorkouts: targetConv.draftWorkouts || null,
        targetWorkout: targetW,
        existingWorkouts: workouts,
        history,
        meals,
        waterLogs,
        goals,
        recovery,
        weeklyContextSnapshot: targetConv.weeklyContextSnapshot,
        apiKey: key,
        model: aiSettings.model || 'gemini-4-hydrogen'
      });

      const assistantMsg: WorkoutCoachChatMessage = {
        id: `msg_a_${Date.now()}`,
        role: 'assistant',
        content: res.replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        workouts: res.workouts.length > 0 ? res.workouts : undefined,
        isFullRoutine: res.isFullRoutine
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConv.id
            ? {
                ...c,
                messages: [...updatedMessages, assistantMsg],
                draftWorkouts: res.workouts.length > 0 ? res.workouts : c.draftWorkouts,
                updatedAt: new Date().toISOString()
              }
            : c
        )
      );
    } catch (err: any) {
      console.error('Erro no chat do Treinador:', err);
      feedback.error(err.message || 'Falha ao conversar com o Treinador IA.');

      const errMsg: WorkoutCoachChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: `Desculpe, tive um problema ao processar seu pedido: *${err.message || 'Erro de conexão ou resposta'}*. Por favor, tente novamente ou verifique sua chave de API.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConv.id
            ? { ...c, messages: [...updatedMessages, errMsg], updatedAt: new Date().toISOString() }
            : c
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !activeConversation || isSending) return;
    await sendMessageInConversation(activeConversation, text, false);
  };

  // Criar nova conversa limpa
  const handleNewConversation = () => {
    const newConv = createInitialConversation(null);
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setShowConversationsList(false);
    setAppliedMessageId(null);
    feedback.info('Nova conversa iniciada!');
  };

  // Criar nova conversa já enviando a última semana de dieta e treino para a IA
  const handleStartWeeklyContextChat = async () => {
    if (isSending) return;

    const key = aiSettings.apiKey || apiKeyInput.trim();
    if (!key) {
      setShowKeyForm(true);
      feedback.warning('Configure sua chave do Gemini antes de enviar sua semana para a IA.');
      return;
    }

    const defaultGoals: NutritionGoals = goals || {
      calories: 2200,
      protein: 160,
      carbs: 220,
      fat: 65,
      waterMl: 2500
    };

    const { promptContext, userSummaryText } = buildWeeklyDietAndWorkoutContext({
      history,
      meals,
      waterLogs,
      goals: defaultGoals,
      recovery,
      daysCount: 7
    });

    const dateLabel = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const now = new Date().toISOString();

    const weeklyConv: WorkoutChatConversation = {
      id: `conv_week_${Date.now()}`,
      title: `Semana • Dieta & Treino (${dateLabel})`,
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          id: `msg_init_week_${Date.now()}`,
          role: 'assistant',
          content: `Iniciei uma **nova conversa dedicada** com os dados da sua última semana de dieta e treino para você continuar daqui sem lotar o contexto antigo!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ],
      draftWorkouts: null,
      weeklyContextSnapshot: promptContext
    };

    setConversations((prev) => [weeklyConv, ...prev]);
    setActiveConversationId(weeklyConv.id);
    setShowConversationsList(false);
    setAppliedMessageId(null);

    await sendMessageInConversation(weeklyConv, userSummaryText, true);
  };

  // Excluir uma conversa
  const handleDeleteConversation = (convId: string) => {
    if (conversations.length === 1) {
      const fresh = createInitialConversation(null);
      setConversations([fresh]);
      setActiveConversationId(fresh.id);
      feedback.info('Conversa reiniciada.');
      return;
    }
    const remaining = conversations.filter((c) => c.id !== convId);
    setConversations(remaining);
    if (activeConversationId === convId && remaining.length > 0) {
      setActiveConversationId(remaining[0].id);
    }
    feedback.info('Conversa removida.');
  };

  // Reiniciar conversa atual
  const handleResetChat = () => {
    if (!activeConversation) return;
    if (window.confirm('Deseja reiniciar esta conversa com o Treinador IA?')) {
      const fresh = createInitialConversation(null);
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConversation.id ? { ...fresh, id: activeConversation.id } : c))
      );
      setAppliedMessageId(null);
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
    'Ajustar treino para meu déficit calórico'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-dark-bg text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] animate-in fade-in duration-200">

      {/* ======================================================== */}
      {/* 1. TOP HEADER DA TELA DE CHAT                             */}
      {/* ======================================================== */}
      <header className="h-16 px-3 sm:px-4 bg-dark-card/95 backdrop-blur-xl border-b border-dark-border flex items-center justify-between shrink-0 shadow-lg select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-dark-surface hover:bg-dark-border border border-dark-border text-slate-300 hover:text-white flex items-center justify-center transition active:scale-95 shrink-0"
            title="Voltar para Meus Treinos"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-mint-400 flex items-center justify-center text-slate-950 font-black shadow-mint-glow-sm">
                <Sparkles className="w-5 h-5 fill-current" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-mint-400 border-2 border-dark-card rounded-full"></span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-white leading-tight truncate">
                  Treinador IA
                </h1>
                <span className="hidden sm:inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shrink-0">
                  {aiSettings.model || 'gemini-4-hydrogen'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {activeConversation?.title || 'Chat de Treinos'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleStartWeeklyContextChat}
            disabled={isSending}
            className="px-2.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-cyan-300 text-[11px] font-bold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
            title="Enviar última semana de dieta e treino em uma nova conversa"
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Última Semana</span>
          </button>

          <button
            onClick={() => setShowConversationsList((prev) => !prev)}
            className={`px-2.5 py-2 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition ${
              showConversationsList
                ? 'bg-mint-500/20 text-mint-300 border-mint-500/40'
                : 'bg-dark-surface border-dark-border text-slate-300 hover:text-white hover:bg-dark-border'
            }`}
            title="Alternar ou criar conversas"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{conversations.length}</span>
          </button>

          <button
            onClick={handleNewConversation}
            className="p-2 rounded-xl bg-dark-surface hover:bg-dark-border border border-dark-border text-slate-300 hover:text-mint-400 transition"
            title="Nova Conversa"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowKeyForm((prev) => !prev)}
            className={`p-2 rounded-xl border transition ${
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
            className="p-2 rounded-xl bg-dark-surface hover:bg-dark-border border border-dark-border text-slate-400 hover:text-rose-400 transition"
            title="Reiniciar Conversa Atual"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* PAINEL DE CONVERSAS (EXPANSÍVEL)                         */}
      {/* ======================================================== */}
      {showConversationsList && (
        <div className="p-3 sm:p-4 bg-dark-card/95 border-b border-dark-border shrink-0 animate-in slide-in-from-top-2">
          <div className="max-w-3xl mx-auto space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-mint-400" />
                Suas Conversas ({conversations.length})
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleStartWeeklyContextChat}
                  disabled={isSending}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 font-bold flex items-center gap-1"
                >
                  <CalendarRange className="w-3 h-3" />
                  Nova c/ Última Semana
                </button>
                <button
                  onClick={handleNewConversation}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-mint-500 text-slate-950 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Nova Conversa
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
              {conversations.map((conv) => {
                const isActive = conv.id === activeConversation?.id;
                return (
                  <div
                    key={conv.id}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-2xl border transition cursor-pointer ${
                      isActive
                        ? 'bg-mint-500/10 border-mint-500/50 text-white'
                        : 'bg-dark-surface border-dark-border text-slate-300 hover:border-slate-600'
                    }`}
                    onClick={() => {
                      setActiveConversationId(conv.id);
                      setShowConversationsList(false);
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {conv.weeklyContextSnapshot && (
                          <CalendarRange className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        )}
                        <span className="text-xs font-bold truncate">{conv.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {conv.messages.length} mensagens •{' '}
                        {new Date(conv.updatedAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv.id);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition"
                      title="Excluir conversa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
                <option value="gemini-4-hydrogen">gemini-4-hydrogen (Recomendado)</option>
                <option value="gemini-3.8-flash">gemini-3.8-flash</option>
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
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-5 scrollbar-thin">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* Banner de Ação Rápida na Conversa Inicial */}
          {messages.length <= 1 && !activeConversation?.weeklyContextSnapshot && (
            <div className="p-4 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-dark-card to-mint-500/10 border border-cyan-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Contexto Inteligente
                </span>
                <p className="text-xs text-slate-200 font-semibold">
                  Quer que a IA analise sua última semana de dieta e treino?
                </p>
                <p className="text-[11px] text-slate-400">
                  Abre uma nova conversa dedicada com seus treinos, cargas, calorias e macros dos últimos 7 dias.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartWeeklyContextChat}
                disabled={isSending}
                className="px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-2 shrink-0 shadow-cyan-glow-sm transition active:scale-95 disabled:opacity-50"
              >
                <CalendarRange className="w-4 h-4" />
                <span>Enviar Última Semana</span>
              </button>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const hasWorkouts = msg.workouts && msg.workouts.length > 0;
            const activeTabIdx = previewTabs[msg.id] ?? 0;
            const previewWorkout = hasWorkouts
              ? msg.workouts![activeTabIdx] || msg.workouts![0]
              : null;
            const isApplied = appliedMessageId === msg.id;
            const isCollapsed = !!collapsedCards[msg.id];

            // Estatísticas do treino em pré-visualização
            const totalSets = previewWorkout
              ? previewWorkout.exercises.reduce((acc, ex) => acc + ex.sets, 0)
              : 0;
            const muscleBreakdown = previewWorkout
              ? Object.entries(
                  previewWorkout.exercises.reduce<Record<string, number>>((acc, ex) => {
                    acc[ex.muscleGroup] = (acc[ex.muscleGroup] || 0) + ex.sets;
                    return acc;
                  }, {})
                )
              : [];

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* Avatar do Treinador */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-mint-400 text-slate-950 flex items-center justify-center shrink-0 font-black shadow-sm mt-1">
                    <Sparkles className="w-4 h-4 fill-current" />
                  </div>
                )}

                {/* Conteúdo da Mensagem */}
                <div className="max-w-[90%] sm:max-w-[84%] space-y-2.5">
                  {/* Balão de Texto */}
                  <div
                    className={`p-3.5 sm:p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? msg.isWeeklyContext
                          ? 'bg-gradient-to-br from-cyan-500 to-mint-400 text-slate-950 font-medium rounded-tr-sm shadow-cyan-glow-sm'
                          : 'bg-mint-500 text-slate-950 font-medium rounded-tr-sm shadow-mint-glow-sm'
                        : 'bg-dark-surface border border-dark-border text-slate-200 rounded-tl-sm shadow-md'
                    }`}
                  >
                    {renderFormattedMessage(msg.content)}

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
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5" />
                              {msg.workouts!.length > 1
                                ? `Rotina (${msg.workouts!.length} treinos)`
                                : 'Ficha de Treino'}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-dark-surface border border-dark-border text-slate-300 flex items-center gap-1">
                              <Layers className="w-3 h-3 text-mint-400" />
                              {totalSets} séries
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-dark-surface border border-dark-border text-slate-300 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-cyan-400" />
                              ~{previewWorkout.estimatedMinutes} min
                            </span>
                          </div>

                          <h3 className="text-sm sm:text-base font-black text-white mt-1.5">
                            {previewWorkout.title}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">{previewWorkout.focus}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setCollapsedCards((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }))
                          }
                          className="p-2 rounded-xl bg-dark-surface border border-dark-border text-slate-400 hover:text-white shrink-0 transition"
                          title={isCollapsed ? 'Expandir exercícios' : 'Recolher exercícios'}
                        >
                          {isCollapsed ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronUp className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Distribuição Muscular */}
                      {muscleBreakdown.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {muscleBreakdown.map(([mg, sets]) => (
                            <span
                              key={mg}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                                MUSCLE_BADGE_COLORS[mg] ||
                                'bg-dark-surface text-slate-300 border-dark-border'
                              }`}
                            >
                              {MUSCLE_LABELS[mg] || mg}: {sets} séries
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Seletor de Treinos (Treino A, B, C...) se for mais de 1 */}
                      {msg.workouts!.length > 1 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                          {msg.workouts!.map((w, idx) => (
                            <button
                              key={idx}
                              onClick={() => setPreviewTabs((prev) => ({ ...prev, [msg.id]: idx }))}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                                activeTabIdx === idx
                                  ? 'bg-cyan-500 text-slate-950 font-black shadow-cyan-glow-sm'
                                  : 'bg-dark-surface border border-dark-border text-slate-300 hover:text-white'
                              }`}
                            >
                              <span>Treino {w.code}</span>
                              <span className="text-[10px] opacity-80">({w.exercises.length} ex)</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Lista de Exercícios do Treino Ativo */}
                      {!isCollapsed && (
                        <div className="space-y-2">
                          {previewWorkout.exercises.map((ex, exIdx) => (
                            <div
                              key={exIdx}
                              className="p-3 bg-dark-surface rounded-2xl border border-dark-border hover:border-slate-600 transition space-y-1.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-cyan-400 font-black text-[11px] font-mono bg-cyan-500/10 px-1.5 py-0.5 rounded-md">
                                      {previewWorkout.code}{exIdx + 1}
                                    </span>
                                    <span className="font-bold text-white text-xs sm:text-sm">
                                      {ex.name}
                                    </span>
                                    {ex.isDumbbell && (
                                      <span
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 flex items-center gap-1"
                                        title="Com halteres"
                                      >
                                        <Dumbbell className="w-3 h-3 text-mint-400" />
                                        Halteres
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                                      MUSCLE_BADGE_COLORS[ex.muscleGroup] ||
                                      'bg-dark-card text-slate-300 border-dark-border'
                                    }`}
                                  >
                                    {MUSCLE_LABELS[ex.muscleGroup] || ex.muscleGroup}
                                  </span>

                                  {onOpenGuide && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onOpenGuide(`${previewWorkout.code}${exIdx + 1}`, ex.name)
                                      }
                                      className="p-1.5 rounded-lg bg-dark-card border border-dark-border text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition"
                                      title="Ver guia de execução"
                                    >
                                      <BookOpen className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Métricas do Exercício */}
                              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                                <span className="px-2 py-0.5 rounded-lg bg-dark-bg border border-dark-border text-slate-200 font-semibold">
                                  {ex.sets} × {ex.reps}
                                </span>
                                <span className="px-2 py-0.5 rounded-lg bg-dark-bg border border-dark-border text-slate-400">
                                  ⏱ {ex.restSeconds}s descanso
                                </span>
                                {ex.targetLoadKg !== undefined && ex.targetLoadKg > 0 && (
                                  <span className="px-2 py-0.5 rounded-lg bg-mint-500/10 border border-mint-500/25 text-mint-300 font-bold font-mono">
                                    {ex.targetLoadKg} kg{ex.isDumbbell ? '/lado' : ''}
                                  </span>
                                )}
                              </div>

                              {ex.notes && (
                                <p className="text-[11px] text-slate-400 leading-snug pt-0.5">
                                  💡 {ex.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

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
                                  onClick={() =>
                                    handleApplyWorkoutPlans(msg.id, msg.workouts!, 'replace_all')
                                  }
                                  className="w-full h-11 bg-mint-500 hover:bg-mint-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-mint-glow transition active:scale-95"
                                >
                                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                  <span>
                                    Substituir Minha Rotina Atual ({msg.workouts!.length} treinos)
                                  </span>
                                </button>

                                <button
                                  onClick={() =>
                                    handleApplyWorkoutPlans(msg.id, msg.workouts!, 'append')
                                  }
                                  className="w-full py-2 bg-dark-surface hover:bg-dark-border border border-dark-border text-slate-300 hover:text-white font-bold rounded-xl text-xs transition active:scale-95"
                                >
                                  Ou adicionar estes {msg.workouts!.length} treinos aos existentes
                                </button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button
                                  onClick={() =>
                                    handleApplyWorkoutPlans(msg.id, msg.workouts!, 'update')
                                  }
                                  className="h-11 bg-mint-500 hover:bg-mint-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-mint-glow transition active:scale-95"
                                >
                                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                  <span>Salvar / Atualizar Este Treino</span>
                                </button>

                                <button
                                  onClick={() =>
                                    handleApplyWorkoutPlans(msg.id, msg.workouts!, 'append')
                                  }
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
                <span>O Treinador IA está analisando seus dados e montando a resposta...</span>
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
