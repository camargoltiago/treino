import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Camera, Edit3, Sparkles, Loader2, Plus, Trash2, 
  Check, AlertTriangle, Key, Flame, RefreshCw, Mic, MicOff, Search, History
} from 'lucide-react';
import { MealLog, MealType, FoodItem, AiNutritionSettings, MEAL_TYPE_LABELS, MEAL_TYPE_EMOJIS } from '../types';
import { compressImageToBase64 } from '../services/imageCompression';
import { GeminiNutritionService, NutritionAiAnalysisResult } from '../services/gemini';
import { SpeechService } from '../services/speech';
import { FoodLibraryService } from '../services/foodLibrary';
import { feedback } from '../services/feedback';

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMeal: (meal: MealLog) => void;
  settings: AiNutritionSettings;
  onOpenSettings: () => void;
  targetDate: string; // YYYY-MM-DD
  initialMealType?: MealType;
  pastMeals?: MealLog[];
}

export const AddMealModal: React.FC<AddMealModalProps> = ({
  isOpen,
  onClose,
  onSaveMeal,
  settings,
  onOpenSettings,
  targetDate,
  initialMealType = 'almoco',
  pastMeals = []
}) => {
  if (!isOpen) return null;

  // Modos de entrada: 'ai' (Foto, Texto e/ou Áudio unificados) ou 'manual' (Itens frequentes e autocomplete)
  const [inputMode, setInputMode] = useState<'ai' | 'manual'>('ai');
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [mealName, setMealName] = useState<string>('');
  const [textDescription, setTextDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Itens da refeição
  const [items, setItems] = useState<FoodItem[]>([]);

  // Lançamento rápido manual
  const [quickCalories, setQuickCalories] = useState<string>('');
  const [quickProtein, setQuickProtein] = useState<string>('');
  const [quickCarbs, setQuickCarbs] = useState<string>('');
  const [quickFat, setQuickFat] = useState<string>('');

  // Estados de Imagem e IA
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Estados de Gravação de Áudio
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const recognitionRef = useRef<any>(null);

  // Estados de Autocomplete
  const [activeAutocompleteIdx, setActiveAutocompleteIdx] = useState<number | null>(null);
  const [autocompleteQuery, setAutocompleteQuery] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verificar suporte a gravação de voz
  useEffect(() => {
    setSpeechSupported(SpeechService.isSupported());
  }, []);

  // Auto-definir nome inicial da refeição com base no tipo
  useEffect(() => {
    if (!mealName) {
      setMealName(MEAL_TYPE_LABELS[mealType]);
    }
  }, [mealType]);

  // Alimentos mais frequentes do usuário para atalhos com 1 clique
  const frequentFoods = FoodLibraryService.getTopFrequentFoods(pastMeals, 8);

  // Totais calculados dinamicamente dos itens ou do lançamento rápido
  const computedTotals = items.length > 0
    ? items.reduce(
        (acc, it) => ({
          calories: acc.calories + (Number(it.calories) || 0),
          protein: acc.protein + (Number(it.protein) || 0),
          carbs: acc.carbs + (Number(it.carbs) || 0),
          fat: acc.fat + (Number(it.fat) || 0)
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      )
    : {
        calories: Number(quickCalories) || 0,
        protein: Number(quickProtein) || 0,
        carbs: Number(quickCarbs) || 0,
        fat: Number(quickFat) || 0
      };

  // Manipular upload/captura de foto
  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Comprime a imagem em memória (converte para max 1024x1024 JPEG ~150KB)
      const { dataUrl, base64 } = await compressImageToBase64(file);
      setImagePreview(dataUrl);
      setImageBase64(base64);
      setAiError(null);
    } catch (err: any) {
      feedback.error('Erro ao processar imagem.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageBase64(null);
  };

  // Gravação de voz com transcrição instantânea
  const toggleSpeechRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    if (!speechSupported) {
      feedback.warning('Reconhecimento de áudio não suportado neste navegador. Digite no campo de texto.');
      return;
    }

    const recognition = SpeechService.createRecognitionInstance({
      onStart: () => {
        setIsRecording(true);
        feedback.info('Ouvindo... Fale os alimentos que consumiu.');
      },
      onResult: (transcript) => {
        setTextDescription((prev) => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${transcript}` : transcript;
        });
      },
      onError: (errMsg) => {
        setIsRecording(false);
        feedback.warning(errMsg);
      },
      onEnd: () => {
        setIsRecording(false);
      }
    });

    if (recognition) {
      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (e) {
        setIsRecording(false);
      }
    }
  };

  // Executar análise unificada da IA (Foto + Texto, só Foto ou só Texto)
  const handleAnalyzeWithAi = async () => {
    const hasPhoto = !!imageBase64;
    const hasText = !!textDescription.trim();

    if (!hasPhoto && !hasText) {
      feedback.warning('Tire uma foto ou descreva o que comeu para a IA analisar.');
      return;
    }

    if (!settings.apiKey) {
      feedback.warning('Configure sua API Key nas configurações para usar a IA.');
      onOpenSettings();
      return;
    }

    // Se estiver gravando áudio, encerra
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    setAnalyzing(true);
    setAiError(null);

    try {
      const result: NutritionAiAnalysisResult = await GeminiNutritionService.analyzeMealUnified({
        base64Image: imageBase64,
        description: textDescription.trim() || undefined,
        apiKey: settings.apiKey,
        model: settings.model || 'gemini-3.8-flash',
        mealHint: MEAL_TYPE_LABELS[mealType]
      });

      if (result.name) setMealName(result.name);
      if (result.notes) setNotes(result.notes);
      setItems(result.items);

      feedback.success('Refeição analisada com sucesso pela IA!');
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Falha ao analisar refeição com a IA.');
      feedback.error('Erro na análise da IA.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Manipular adição manual de itens
  const handleAddItem = (preset?: Partial<FoodItem>) => {
    setItems((prev) => [
      ...prev,
      {
        name: preset?.name || 'Novo Alimento',
        portion: preset?.portion || '100g',
        calories: preset?.calories ?? 100,
        protein: preset?.protein ?? 10,
        carbs: preset?.carbs ?? 10,
        fat: preset?.fat ?? 2
      }
    ]);
  };

  const handleUpdateItem = (index: number, field: keyof FoodItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    if (field === 'name') {
      setActiveAutocompleteIdx(index);
      setAutocompleteQuery(String(value));
    }
  };

  const handleSelectAutocompleteFood = (index: number, food: FoodItem) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...food };
      return updated;
    });
    setActiveAutocompleteIdx(null);
    setAutocompleteQuery('');
  };

  const handleDeleteItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Salvar refeição
  const handleSave = () => {
    let finalItems = [...items];

    if (finalItems.length === 0) {
      const qKcal = Number(quickCalories) || 0;
      if (qKcal <= 0) {
        feedback.warning('Informe as calorias da refeição ou adicione alimentos.');
        return;
      }
      finalItems = [
        {
          name: mealName.trim() || MEAL_TYPE_LABELS[mealType],
          portion: '1 porção',
          calories: qKcal,
          protein: Number(quickProtein) || 0,
          carbs: Number(quickCarbs) || 0,
          fat: Number(quickFat) || 0
        }
      ];
    }

    const totalCal = finalItems.reduce((acc, it) => acc + (Number(it.calories) || 0), 0);
    const totalProt = finalItems.reduce((acc, it) => acc + (Number(it.protein) || 0), 0);
    const totalCarb = finalItems.reduce((acc, it) => acc + (Number(it.carbs) || 0), 0);
    const totalFt = finalItems.reduce((acc, it) => acc + (Number(it.fat) || 0), 0);

    const mealLog: MealLog = {
      id: `meal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      date: targetDate,
      timestamp: new Date().toISOString(),
      mealType,
      name: mealName.trim() || MEAL_TYPE_LABELS[mealType],
      items: finalItems,
      totalCalories: totalCal,
      totalProtein: totalProt,
      totalCarbs: totalCarb,
      totalFat: totalFt,
      notes: notes.trim() || undefined
    };

    onSaveMeal(mealLog);
    feedback.success('Refeição registrada com sucesso!');
    onClose();
  };

  // Sugestões de autocomplete ativas
  const autocompleteSuggestions = activeAutocompleteIdx !== null && autocompleteQuery.trim()
    ? FoodLibraryService.searchSuggestions(autocompleteQuery, pastMeals, 5)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-dark-card border border-dark-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-dark-border bg-dark-bg/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-mint-500/10 border border-mint-500/20 flex items-center justify-center text-mint-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-100">
                Registrar Refeição
              </h2>
              <p className="text-xs text-slate-400">
                Data: {new Date(targetDate + 'T12:00:00').toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas Unificadas: IA vs Manual & Frequentes */}
        <div className="grid grid-cols-2 p-2 bg-dark-bg/70 border-b border-dark-border gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setInputMode('ai')}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              inputMode === 'ai'
                ? 'bg-mint-500 text-dark-bg font-bold shadow-mint-glow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Analisar com IA (Foto / Voz / Texto)
          </button>
          <button
            type="button"
            onClick={() => setInputMode('manual')}
            className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              inputMode === 'manual'
                ? 'bg-mint-500 text-dark-bg font-bold shadow-mint-glow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Edit3 className="w-4 h-4" /> Manual & Frequentes
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto">
          {/* Seletor de Tipo de Refeição */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Tipo de Refeição
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {(Object.keys(MEAL_TYPE_LABELS) as MealType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setMealType(type);
                    if (!mealName || Object.values(MEAL_TYPE_LABELS).includes(mealName)) {
                      setMealName(MEAL_TYPE_LABELS[type]);
                    }
                  }}
                  className={`py-2 px-2 rounded-xl text-center text-xs transition-all border ${
                    mealType === type
                      ? 'border-mint-500 bg-mint-500/10 text-mint-400 font-bold'
                      : 'border-dark-border bg-dark-bg/40 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="text-sm mb-0.5">{MEAL_TYPE_EMOJIS[type]}</div>
                  <div className="text-[10px] truncate">{MEAL_TYPE_LABELS[type]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Aviso se a API Key não estiver configurada no modo IA */}
          {!settings.apiKey && inputMode === 'ai' && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <Key className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300">
                <p className="font-bold text-amber-300 mb-1">Chave da IA necessária</p>
                <p className="text-slate-400 mb-2">
                  Configure sua chave do Gemini nas configurações para que a IA analise fotos e descrições.
                </p>
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-all"
                >
                  Configurar Chave Agora
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODO UNIFICADO DE IA (FOTO + VOZ + TEXTO JUNTOS OU SEPARADOS) */}
          {/* ============================================================== */}
          {inputMode === 'ai' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelected}
                className="hidden"
              />

              {/* CARD DE FOTO (OPCIONAL OU PRINCIPAL) */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Foto do Prato (opcional)
                </label>

                {!imagePreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-dark-border hover:border-mint-500/60 rounded-2xl p-4 flex items-center justify-between cursor-pointer bg-dark-bg/40 hover:bg-dark-bg/70 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-mint-500/10 border border-mint-500/20 flex items-center justify-center text-mint-400 group-hover:scale-105 transition-transform shadow-mint-glow-sm">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">
                          Tirar foto ou anexar imagem
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Você pode enviar só a foto, ou adicionar texto/áudio abaixo
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-mint-400 bg-mint-500/10 px-2.5 py-1 rounded-lg border border-mint-500/20">
                      Anexar
                    </span>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-dark-border bg-black/60">
                    <img
                      src={imagePreview}
                      alt="Foto do prato"
                      className="w-full h-36 object-cover opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-transparent to-transparent" />
                    
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] font-semibold text-slate-200 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20 hover:bg-black/90 transition-all flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3 text-mint-400" /> Trocar
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-[11px] font-semibold text-rose-300 bg-black/70 backdrop-blur-md p-1 rounded-lg border border-white/20 hover:bg-rose-500/20 transition-all"
                        title="Remover foto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="absolute bottom-2 left-3">
                      <span className="text-[11px] font-semibold text-mint-400 bg-dark-card/90 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-mint-500/30">
                        ✓ Foto pronta para análise
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* CAMPO DE TEXTO E MICROFONE PARA ÁUDIO */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {imagePreview ? 'Detalhes ou Observações da Foto' : 'Descreva o que comeu (Texto ou Áudio)'}
                  </label>
                  {isRecording && (
                    <span className="text-[10px] font-bold text-rose-400 animate-pulse flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                      Ouvindo sua voz...
                    </span>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    value={textDescription}
                    onChange={(e) => setTextDescription(e.target.value)}
                    placeholder={
                      imagePreview
                        ? "Ex: 'O pão é integral e usei 1 colher de azeite no frango' (ajuda a IA a ser mais precisa)"
                        : "Ex: '2 ovos mexidos com 2 fatias de pão integral e 1 xícara de café com leite' ou clique no microfone..."
                    }
                    rows={3}
                    className="w-full bg-dark-bg/80 border border-dark-border rounded-xl p-3 pr-12 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-mint-500"
                  />

                  {/* Botão de Gravação de Áudio */}
                  <button
                    type="button"
                    onClick={toggleSpeechRecording}
                    className={`absolute right-2.5 bottom-2.5 p-2 rounded-xl transition-all shadow-md ${
                      isRecording
                        ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                        : 'bg-dark-surface hover:bg-dark-card border border-dark-border text-slate-400 hover:text-mint-400'
                    }`}
                    title={isRecording ? 'Parar gravação de voz' : 'Falar o que comeu (Voz para Texto)'}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* BOTÃO PRINCIPAL DE EXECUÇÃO DA IA */}
              <button
                type="button"
                onClick={handleAnalyzeWithAi}
                disabled={analyzing || (!imagePreview && !textDescription.trim())}
                className="w-full py-3.5 px-4 rounded-2xl text-xs font-bold bg-gradient-to-r from-mint-500 via-mint-400 to-emerald-400 text-dark-bg shadow-mint-glow-sm hover:brightness-105 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-98"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-dark-bg" />
                    <span>IA calculando alimentos e calorias...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-dark-bg" />
                    <span>
                      {imagePreview && textDescription.trim()
                        ? '✨ Analisar Foto + Detalhes com IA'
                        : imagePreview
                        ? '✨ Analisar Imagem com IA'
                        : '✨ Calcular Alimentos com IA'}
                    </span>
                  </>
                )}
              </button>

              {aiError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* MODO MANUAL: ATALHOS FREQUENTES E AUTOCOMPLETE DE ITENS        */}
          {/* ============================================================== */}
          {inputMode === 'manual' && (
            <div className="space-y-4">
              {/* CHIPS DE ALIMENTOS FREQUENTES / REPETIDOS */}
              <div className="p-3.5 rounded-2xl bg-dark-bg/60 border border-dark-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-mint-400 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" /> Seus Alimentos Frequentes
                  </span>
                  <span className="text-[10px] text-slate-500">1 toque para adicionar</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {frequentFoods.map((food, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddItem(food)}
                      className="text-xs px-2.5 py-1.5 rounded-xl bg-dark-card hover:bg-mint-500/15 border border-dark-border hover:border-mint-500/40 text-slate-300 hover:text-mint-400 transition-all flex items-center gap-1 active:scale-95"
                    >
                      <Plus className="w-3 h-3 text-mint-400" />
                      <span>{food.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({food.calories} kcal)</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* LANÇAMENTO RÁPIDO DIRETO (QUANDO SÓ QUER O TOTAL) */}
              {items.length === 0 && (
                <div className="p-4 rounded-2xl bg-dark-bg/40 border border-dark-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Lançamento Rápido (Calorias Totais)
                    </span>
                    <span className="text-[10px] text-slate-500">Ou adicione itens abaixo</span>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-medium block mb-1">
                      Calorias da Refeição (kcal)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={quickCalories}
                        onChange={(e) => setQuickCalories(e.target.value)}
                        placeholder="Ex: 650"
                        className="w-full bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-base font-bold text-mint-400 focus:outline-none focus:border-mint-500"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">kcal</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Proteína (g)</label>
                      <input
                        type="number"
                        value={quickProtein}
                        onChange={(e) => setQuickProtein(e.target.value)}
                        placeholder="0"
                        className="w-full bg-dark-bg border border-dark-border rounded-xl px-2.5 py-1.5 text-xs font-semibold text-indigo-400 focus:outline-none focus:border-mint-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Carbo (g)</label>
                      <input
                        type="number"
                        value={quickCarbs}
                        onChange={(e) => setQuickCarbs(e.target.value)}
                        placeholder="0"
                        className="w-full bg-dark-bg border border-dark-border rounded-xl px-2.5 py-1.5 text-xs font-semibold text-amber-400 focus:outline-none focus:border-mint-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Gordura (g)</label>
                      <input
                        type="number"
                        value={quickFat}
                        onChange={(e) => setQuickFat(e.target.value)}
                        placeholder="0"
                        className="w-full bg-dark-bg border border-dark-border rounded-xl px-2.5 py-1.5 text-xs font-semibold text-rose-400 focus:outline-none focus:border-mint-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Nome / Título da Refeição */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Nome da Refeição
            </label>
            <input
              type="text"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder="Ex: Almoço pós-treino"
              className="w-full bg-dark-bg/80 border border-dark-border rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-mint-500"
            />
          </div>

          {/* ITENS IDENTIFICADOS / EDITÁVEIS COM AUTOCOMPLETE */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Alimentos e Porções ({items.length})
              </label>
              <button
                type="button"
                onClick={() => handleAddItem()}
                className="text-xs font-semibold text-mint-400 hover:text-mint-300 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar alimento
              </button>
            </div>

            {items.length === 0 ? (
              <div className="p-4 rounded-2xl bg-dark-bg/30 border border-dark-border text-center text-xs text-slate-500">
                Nenhum alimento detalhado. Você pode usar a IA acima ou clicar em "+ Adicionar alimento".
              </div>
            ) : (
              <div className="space-y-2.5">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-dark-bg/60 border border-dark-border space-y-2 relative"
                  >
                    <div className="flex items-center gap-2 relative">
                      {/* Campo Nome com Autocomplete */}
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                          onFocus={() => {
                            setActiveAutocompleteIdx(idx);
                            setAutocompleteQuery(item.name);
                          }}
                          placeholder="Digite o nome (ex: Pão, Ovo...)"
                          className="w-full bg-transparent border-b border-dark-border pb-1 text-xs font-bold text-slate-200 focus:outline-none focus:border-mint-500"
                        />

                        {/* Dropdown de Autocomplete Flutuante */}
                        {activeAutocompleteIdx === idx && autocompleteSuggestions.length > 0 && (
                          <div className="absolute left-0 top-full mt-1.5 w-full min-w-[240px] max-w-sm z-30 bg-dark-card border border-dark-border rounded-2xl shadow-2xl overflow-hidden py-1 divide-y divide-dark-border/40 animate-fadeIn">
                            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-dark-bg/50">
                              Sugestões de Alimentos
                            </div>
                            {autocompleteSuggestions.map((sug, sIdx) => (
                              <button
                                key={sIdx}
                                type="button"
                                onClick={() => handleSelectAutocompleteFood(idx, sug)}
                                className="w-full text-left px-3 py-2 hover:bg-mint-500/10 flex items-center justify-between gap-2 transition-colors group"
                              >
                                <div>
                                  <span className="text-xs font-bold text-slate-200 group-hover:text-mint-400 block">
                                    {sug.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {sug.portion}
                                  </span>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-[11px] font-black text-mint-400 block font-mono">
                                    {sug.calories} kcal
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-mono">
                                    {sug.protein}P • {sug.carbs}C • {sug.fat}G
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <input
                        type="text"
                        value={item.portion}
                        onChange={(e) => handleUpdateItem(idx, 'portion', e.target.value)}
                        placeholder="Porção (ex: 50g)"
                        className="w-24 bg-transparent border-b border-dark-border pb-1 text-xs text-slate-400 text-right focus:outline-none focus:border-mint-500"
                      />

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Remover alimento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-1 text-[11px]">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Kcal</span>
                        <input
                          type="number"
                          value={item.calories}
                          onChange={(e) => handleUpdateItem(idx, 'calories', Number(e.target.value))}
                          className="w-full bg-dark-bg border border-dark-border rounded-lg px-2 py-1 text-mint-400 font-bold focus:outline-none focus:border-mint-500"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Prot (g)</span>
                        <input
                          type="number"
                          value={item.protein}
                          onChange={(e) => handleUpdateItem(idx, 'protein', Number(e.target.value))}
                          className="w-full bg-dark-bg border border-dark-border rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-mint-500"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Carb (g)</span>
                        <input
                          type="number"
                          value={item.carbs}
                          onChange={(e) => handleUpdateItem(idx, 'carbs', Number(e.target.value))}
                          className="w-full bg-dark-bg border border-dark-border rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-mint-500"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Gord (g)</span>
                        <input
                          type="number"
                          value={item.fat}
                          onChange={(e) => handleUpdateItem(idx, 'fat', Number(e.target.value))}
                          className="w-full bg-dark-bg border border-dark-border rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-mint-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Observações Opcionais */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Observações (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Pouco azeite, sem açúcar..."
              className="w-full bg-dark-bg/80 border border-dark-border rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-mint-500"
            />
          </div>
        </div>

        {/* Rodapé com Totais e Salvar */}
        <div className="p-4 border-t border-dark-border bg-dark-bg/80 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <span className="text-[11px] text-slate-400 block">Total da Refeição</span>
              <span className="text-xl font-black text-mint-400">
                {computedTotals.calories} <span className="text-xs font-bold text-slate-400">kcal</span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div>
                <span className="text-[10px] text-slate-500 block">Proteína</span>
                <span className="font-bold text-slate-200">{computedTotals.protein}g</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Carbo</span>
                <span className="font-bold text-slate-200">{computedTotals.carbs}g</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Gordura</span>
                <span className="font-bold text-slate-200">{computedTotals.fat}g</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={items.length === 0 && (!quickCalories || Number(quickCalories) <= 0)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-mint-500 hover:bg-mint-400 text-dark-bg shadow-mint-glow-sm transition-all transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Salvar Refeição
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
