import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Camera, Edit3, Sparkles, Loader2, Plus, Trash2, 
  Check, AlertTriangle, Key, Flame, ArrowRight, RefreshCw, Upload
} from 'lucide-react';
import { MealLog, MealType, FoodItem, AiNutritionSettings, MEAL_TYPE_LABELS, MEAL_TYPE_EMOJIS } from '../types';
import { compressImageToBase64 } from '../services/imageCompression';
import { GeminiNutritionService, NutritionAiAnalysisResult } from '../services/gemini';
import { feedback } from '../services/feedback';

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMeal: (meal: MealLog) => void;
  settings: AiNutritionSettings;
  onOpenSettings: () => void;
  targetDate: string; // YYYY-MM-DD
  initialMealType?: MealType;
}

export const AddMealModal: React.FC<AddMealModalProps> = ({
  isOpen,
  onClose,
  onSaveMeal,
  settings,
  onOpenSettings,
  targetDate,
  initialMealType = 'almoco'
}) => {
  if (!isOpen) return null;

  const [inputMode, setInputMode] = useState<'camera' | 'text' | 'manual'>('camera');
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

  // Estados de IA e Imagem
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-definir nome inicial da refeição com base no tipo
  useEffect(() => {
    if (!mealName) {
      setMealName(MEAL_TYPE_LABELS[mealType]);
    }
  }, [mealType]);

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

    if (!settings.apiKey) {
      feedback.warning('Configure sua API Key nas configurações para usar a IA por foto.');
      onOpenSettings();
      return;
    }

    setAnalyzing(true);
    setAiError(null);

    try {
      // Comprime a imagem em memória (converte para max 1024x1024 JPEG ~150KB)
      const { dataUrl, base64 } = await compressImageToBase64(file);
      setImagePreview(dataUrl);

      // Envia para a IA
      const result: NutritionAiAnalysisResult = await GeminiNutritionService.analyzeMealFromImage({
        base64Image: base64,
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
      setAiError(err.message || 'Falha ao analisar imagem com a IA.');
      feedback.error('Erro ao analisar a foto.');
    } finally {
      setAnalyzing(false);
      // Limpar o input para permitir selecionar o mesmo arquivo se quiser
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Analisar descrição em texto com IA
  const handleAnalyzeText = async () => {
    if (!textDescription.trim()) {
      feedback.warning('Digite os alimentos consumidos para a IA analisar.');
      return;
    }

    if (!settings.apiKey) {
      feedback.warning('Configure sua API Key nas configurações para usar a IA.');
      onOpenSettings();
      return;
    }

    setAnalyzing(true);
    setAiError(null);

    try {
      const result = await GeminiNutritionService.analyzeMealFromText({
        description: textDescription.trim(),
        apiKey: settings.apiKey,
        model: settings.model || 'gemini-3.8-flash',
        mealHint: MEAL_TYPE_LABELS[mealType]
      });

      if (result.name) setMealName(result.name);
      if (result.notes) setNotes(result.notes);
      setItems(result.items);

      feedback.success('Alimentos calculados pela IA!');
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Falha ao analisar texto com a IA.');
      feedback.error('Erro ao processar texto.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Manipular adição e edição de itens individuais
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        name: 'Novo Alimento',
        portion: '100g',
        calories: 100,
        protein: 10,
        carbs: 10,
        fat: 2
      }
    ]);
  };

  const handleUpdateItem = (index: number, field: keyof FoodItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
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

        {/* Abas de Modo (Foto IA, Texto IA, Manual) */}
        <div className="grid grid-cols-3 p-2 bg-dark-bg/70 border-b border-dark-border gap-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setInputMode('camera')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              inputMode === 'camera'
                ? 'bg-mint-500 text-dark-bg font-bold shadow-mint-glow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> Foto com IA
          </button>
          <button
            type="button"
            onClick={() => setInputMode('text')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              inputMode === 'text'
                ? 'bg-mint-500 text-dark-bg font-bold shadow-mint-glow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Texto com IA
          </button>
          <button
            type="button"
            onClick={() => setInputMode('manual')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              inputMode === 'manual'
                ? 'bg-mint-500 text-dark-bg font-bold shadow-mint-glow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" /> Manual
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

          {/* Aviso se a API Key não estiver configurada */}
          {!settings.apiKey && (inputMode === 'camera' || inputMode === 'text') && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <Key className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300">
                <p className="font-bold text-amber-300 mb-1">Chave da IA necessária</p>
                <p className="text-slate-400 mb-2">
                  Para analisar fotos ou textos automaticamente, configure sua chave nas configurações.
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

          {/* ÁREA DE INPUT: FOTO */}
          {inputMode === 'camera' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelected}
                className="hidden"
              />

              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-dark-border hover:border-mint-500/60 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer bg-dark-bg/40 hover:bg-dark-bg/70 transition-all text-center group"
                >
                  <div className="w-14 h-14 rounded-full bg-mint-500/10 border border-mint-500/20 flex items-center justify-center text-mint-400 group-hover:scale-110 transition-transform shadow-mint-glow-sm">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200">
                      Tirar foto ou escolher da galeria
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      A IA identifica os alimentos, porções e calorias na hora
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-mint-400 bg-mint-500/10 px-3 py-1 rounded-full border border-mint-500/20">
                    <Sparkles className="w-3 h-3" /> Foto processada em memória e descartada
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-dark-border bg-black/60">
                  <img
                    src={imagePreview}
                    alt="Foto do prato"
                    className="w-full h-44 object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-transparent to-transparent" />
                  
                  {analyzing ? (
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4 text-center">
                      <Loader2 className="w-8 h-8 text-mint-400 animate-spin" />
                      <div>
                        <p className="text-sm font-bold text-slate-100">
                          Analisando prato com IA...
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Calculando porções, calorias e macronutrientes
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-300 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                        Foto carregada
                      </span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-semibold text-mint-400 bg-dark-card/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-mint-500/30 hover:bg-mint-500/20 transition-all flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3 h-3" /> Tirar outra foto
                      </button>
                    </div>
                  )}
                </div>
              )}

              {aiError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}
            </div>
          )}

          {/* ÁREA DE INPUT: TEXTO */}
          {inputMode === 'text' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  Descreva o que você comeu:
                </label>
                <textarea
                  value={textDescription}
                  onChange={(e) => setTextDescription(e.target.value)}
                  placeholder="Ex: 2 filés médios de peito de frango grelhado, 4 colheres de sopa de arroz branco, concha de feijão carioca e salada de alface e tomate"
                  rows={3}
                  className="w-full bg-dark-bg/80 border border-dark-border rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-mint-500"
                />
              </div>

              <button
                type="button"
                onClick={handleAnalyzeText}
                disabled={analyzing || !textDescription.trim()}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-mint-500/15 hover:bg-mint-500/25 text-mint-400 border border-mint-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analisando com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Calcular Calorias com IA
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

          {/* ÁREA DE INPUT: MANUAL */}
          {inputMode === 'manual' && (
            <div className="p-4 rounded-2xl bg-dark-bg/60 border border-dark-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-mint-400">
                  Lançamento Rápido Manual
                </span>
                <span className="text-[10px] text-slate-400">Total direto</span>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">
                  Calorias Totais (kcal) *
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

          {/* ITENS IDENTIFICADOS / EDITÁVEIS */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Alimentos e Porções ({items.length})
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-semibold text-mint-400 hover:text-mint-300 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar item
              </button>
            </div>

            {items.length === 0 ? (
              <div className="p-4 rounded-2xl bg-dark-bg/30 border border-dark-border text-center text-xs text-slate-500">
                Nenhum alimento na lista ainda. Tire uma foto com IA, descreva por texto ou adicione manualmente.
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-dark-bg/60 border border-dark-border space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                        placeholder="Nome do alimento"
                        className="flex-1 bg-transparent border-b border-dark-border pb-1 text-xs font-bold text-slate-200 focus:outline-none focus:border-mint-500"
                      />
                      <input
                        type="text"
                        value={item.portion}
                        onChange={(e) => handleUpdateItem(idx, 'portion', e.target.value)}
                        placeholder="Porção (ex: 150g)"
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
              disabled={items.length === 0}
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
