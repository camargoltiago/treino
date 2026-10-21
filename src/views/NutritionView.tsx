import React, { useState } from 'react';
import { 
  Flame, Plus, Camera, Sparkles, Settings2, Droplets, ChevronLeft, ChevronRight, 
  Trash2, Clock, Calendar, Check, AlertCircle, UtensilsCrossed 
} from 'lucide-react';
import { 
  MealLog, NutritionGoals, AiNutritionSettings, MealType, 
  MEAL_TYPE_LABELS, MEAL_TYPE_EMOJIS 
} from '../types';
import { AddMealModal } from '../components/AddMealModal';
import { NutritionSettingsModal } from '../components/NutritionSettingsModal';
import { feedback } from '../services/feedback';

interface NutritionViewProps {
  meals: MealLog[];
  goals: NutritionGoals;
  waterLogs: Record<string, number>;
  deepseekSettings: AiNutritionSettings;
  onSaveMeal: (meal: MealLog) => void;
  onDeleteMeal: (mealId: string) => void;
  onUpdateWater: (date: string, amountMl: number) => void;
  onSaveSettings: (settings: AiNutritionSettings, goals: NutritionGoals) => void;
}

export const NutritionView: React.FC<NutritionViewProps> = ({
  meals,
  goals,
  waterLogs,
  deepseekSettings,
  onSaveMeal,
  onDeleteMeal,
  onUpdateWater,
  onSaveSettings
}) => {
  // Data selecionada (padrão: hoje em formato YYYY-MM-DD local)
  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [defaultMealType, setDefaultMealType] = useState<MealType>('almoco');

  const todayStr = getTodayDateStr();
  const isToday = selectedDate === todayStr;

  // Navegação de dias
  const handleChangeDay = (offset: number) => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + offset);

    const newYear = date.getFullYear();
    const newMonth = String(date.getMonth() + 1).padStart(2, '0');
    const newDay = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${newYear}-${newMonth}-${newDay}`);
  };

  // Filtrar refeições do dia selecionado
  const dayMeals = meals.filter((m) => m.date === selectedDate);

  // Totais do dia
  const dayCalories = dayMeals.reduce((acc, m) => acc + (m.totalCalories || 0), 0);
  const dayProtein = dayMeals.reduce((acc, m) => acc + (m.totalProtein || 0), 0);
  const dayCarbs = dayMeals.reduce((acc, m) => acc + (m.totalCarbs || 0), 0);
  const dayFat = dayMeals.reduce((acc, m) => acc + (m.totalFat || 0), 0);

  // Água do dia
  const currentWater = waterLogs[selectedDate] || 0;

  // Cálculos de progresso
  const caloriePercent = Math.min(100, Math.round((dayCalories / goals.calories) * 100)) || 0;
  const remainingCalories = goals.calories - dayCalories;

  const proteinPercent = Math.min(100, Math.round((dayProtein / goals.protein) * 100)) || 0;
  const carbsPercent = Math.min(100, Math.round((dayCarbs / goals.carbs) * 100)) || 0;
  const fatPercent = Math.min(100, Math.round((dayFat / goals.fat) * 100)) || 0;
  const waterPercent = Math.min(100, Math.round((currentWater / goals.waterMl) * 100)) || 0;

  // Ajuste de água
  const handleAddWater = (deltaMl: number) => {
    const updated = Math.max(0, currentWater + deltaMl);
    onUpdateWater(selectedDate, updated);
  };

  // Exclusão de refeição
  const handleDelete = async (meal: MealLog) => {
    const confirmed = await feedback.confirm({
      title: 'Excluir Refeição',
      message: `Deseja remover "${meal.name}" (${meal.totalCalories} kcal)?`,
      variant: 'danger',
      confirmText: 'Excluir'
    });

    if (confirmed) {
      onDeleteMeal(meal.id);
      feedback.success('Refeição removida.');
    }
  };

  // Formatação de data amigável
  const formatDateTitle = (dateStr: string) => {
    if (dateStr === todayStr) return 'Hoje';
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    
    // Verificar se é ontem
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Ontem';

    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const openAddModalWith = (type: MealType) => {
    setDefaultMealType(type);
    setIsAddModalOpen(true);
  };

  return (
    <div className="pb-28 pt-4 px-4 max-w-md mx-auto space-y-5 animate-fadeIn">
      {/* Barra de Data e Atalho de Configurações */}
      <div className="flex items-center justify-between bg-dark-card border border-dark-border rounded-2xl p-2.5">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleChangeDay(-1)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            title="Dia anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center px-2">
            <span className="text-xs font-black text-slate-100 block">
              {formatDateTitle(selectedDate)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}
            </span>
          </div>

          <button
            onClick={() => handleChangeDay(1)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            title="Próximo dia"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="text-[10px] font-bold text-mint-400 bg-mint-500/10 hover:bg-mint-500/20 px-2 py-1 rounded-lg border border-mint-500/20 transition-all ml-1"
            >
              Voltar p/ Hoje
            </button>
          )}
        </div>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 text-slate-400 hover:text-mint-400 hover:bg-white/5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold"
          title="Configurações de IA & Metas"
        >
          <Settings2 className="w-4 h-4" />
          <span className="hidden sm:inline">Metas</span>
        </button>
      </div>

      {/* CARD PRINCIPAL: CONTADOR DE CALORIAS */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-card via-dark-card/90 to-dark-bg border border-dark-border p-5 shadow-2xl space-y-4">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-mint-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-mint-400 uppercase tracking-wider">
              <Flame className="w-4 h-4" /> Balanço Diário
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
                {dayCalories}
              </span>
              <span className="text-sm font-bold text-slate-400">
                / {goals.calories} kcal
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 font-semibold block">
              {remainingCalories >= 0 ? 'Restam' : 'Excedeu'}
            </span>
            <span
              className={`text-lg font-black ${
                remainingCalories >= 0 ? 'text-mint-400' : 'text-rose-400'
              }`}
            >
              {Math.abs(remainingCalories)} kcal
            </span>
          </div>
        </div>

        {/* Barra de Progresso de Calorias */}
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-dark-bg/80 border border-dark-border rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                remainingCalories < 0
                  ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                  : 'bg-gradient-to-r from-mint-500 to-emerald-400 shadow-[0_0_12px_rgba(0,229,153,0.4)]'
              }`}
              style={{ width: `${caloriePercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>{caloriePercent}% da meta atingida</span>
            <span>Meta: {goals.calories} kcal</span>
          </div>
        </div>

        {/* BARRAS DE MACRONUTRIENTES */}
        <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-dark-border/60">
          {/* Proteína */}
          <div className="p-2.5 rounded-2xl bg-dark-bg/50 border border-dark-border/60 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-slate-400">Proteína</span>
              <span className="font-extrabold text-indigo-400">{proteinPercent}%</span>
            </div>
            <div className="text-xs font-black text-slate-200">
              {dayProtein} <span className="text-[10px] font-medium text-slate-400">/ {goals.protein}g</span>
            </div>
            <div className="h-1.5 w-full bg-dark-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${proteinPercent}%` }}
              />
            </div>
          </div>

          {/* Carboidrato */}
          <div className="p-2.5 rounded-2xl bg-dark-bg/50 border border-dark-border/60 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-slate-400">Carbo</span>
              <span className="font-extrabold text-amber-400">{carbsPercent}%</span>
            </div>
            <div className="text-xs font-black text-slate-200">
              {dayCarbs} <span className="text-[10px] font-medium text-slate-400">/ {goals.carbs}g</span>
            </div>
            <div className="h-1.5 w-full bg-dark-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${carbsPercent}%` }}
              />
            </div>
          </div>

          {/* Gordura */}
          <div className="p-2.5 rounded-2xl bg-dark-bg/50 border border-dark-border/60 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-slate-400">Gordura</span>
              <span className="font-extrabold text-rose-400">{fatPercent}%</span>
            </div>
            <div className="text-xs font-black text-slate-200">
              {dayFat} <span className="text-[10px] font-medium text-slate-400">/ {goals.fat}g</span>
            </div>
            <div className="h-1.5 w-full bg-dark-bg rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all"
                style={{ width: `${fatPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* REGISTRO DE ÁGUA */}
      <div className="p-4 rounded-3xl bg-dark-card border border-dark-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-200">Hidratação</span>
              <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                {waterPercent}%
              </span>
            </div>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              {currentWater} <span className="text-[10px] text-slate-500">/ {goals.waterMl} ml</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {currentWater > 0 && (
            <button
              onClick={() => handleAddWater(-250)}
              className="px-2.5 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 bg-dark-bg rounded-xl border border-dark-border transition-colors"
              title="-250ml"
            >
              -250
            </button>
          )}
          <button
            onClick={() => handleAddWater(250)}
            className="px-3 py-1.5 text-xs font-bold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 rounded-xl border border-sky-500/20 transition-all active:scale-95"
          >
            +250ml
          </button>
          <button
            onClick={() => handleAddWater(500)}
            className="px-3 py-1.5 text-xs font-bold text-sky-300 bg-sky-500/20 hover:bg-sky-500/30 rounded-xl border border-sky-500/30 transition-all active:scale-95"
          >
            +500ml
          </button>
        </div>
      </div>

      {/* BOTÃO PRINCIPAL DE ADICIONAR COM IA */}
      <button
        type="button"
        onClick={() => openAddModalWith('almoco')}
        className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-mint-500 via-mint-400 to-emerald-400 text-dark-bg font-black text-sm shadow-[0_0_20px_rgba(0,229,153,0.4)] hover:shadow-[0_0_25px_rgba(0,229,153,0.6)] transition-all transform active:scale-[0.98] flex items-center justify-center gap-2.5"
      >
        <Camera className="w-5 h-5 text-dark-bg" />
        <span>Analisar Imagem com IA</span>
        <Sparkles className="w-4 h-4 text-dark-bg/80 animate-pulse" />
      </button>

      {/* LISTA DE REFEIÇÕES DO DIA */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-mint-400" /> Refeições de {formatDateTitle(selectedDate)} ({dayMeals.length})
          </h3>
          <button
            onClick={() => openAddModalWith('lanche')}
            className="text-xs text-mint-400 hover:text-mint-300 font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar
          </button>
        </div>

        {dayMeals.length === 0 ? (
          <div className="rounded-3xl border border-dark-border bg-dark-card/50 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-mint-500/10 border border-mint-500/20 flex items-center justify-center text-mint-400 mx-auto">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">Nenhuma refeição registrada hoje</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Tire uma foto do seu prato e a IA identificará os alimentos e calorias automaticamente.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <button
                onClick={() => openAddModalWith('cafe')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-dark-bg border border-dark-border text-slate-300 hover:border-mint-500/50 hover:text-mint-400 transition-all"
              >
                ☕ Café da Manhã
              </button>
              <button
                onClick={() => openAddModalWith('almoco')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-dark-bg border border-dark-border text-slate-300 hover:border-mint-500/50 hover:text-mint-400 transition-all"
              >
                🍽️ Almoço
              </button>
              <button
                onClick={() => openAddModalWith('jantar')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-dark-bg border border-dark-border text-slate-300 hover:border-mint-500/50 hover:text-mint-400 transition-all"
              >
                🥗 Jantar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {dayMeals.map((meal) => {
              const timeFormatted = new Date(meal.timestamp).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={meal.id}
                  className="rounded-2xl border border-dark-border bg-dark-card p-4 space-y-3 hover:border-mint-500/30 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{MEAL_TYPE_EMOJIS[meal.mealType] || '🍴'}</span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                          {meal.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {MEAL_TYPE_LABELS[meal.mealType]} • {timeFormatted}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-mint-400 bg-mint-500/10 px-2.5 py-1 rounded-xl border border-mint-500/20">
                        {meal.totalCalories} kcal
                      </span>
                      <button
                        onClick={() => handleDelete(meal)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Excluir refeição"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Alimentos listados */}
                  {meal.items && meal.items.length > 0 && (
                    <div className="pt-2 border-t border-dark-border/60 space-y-1">
                      {meal.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs text-slate-300 py-0.5"
                        >
                          <span className="truncate pr-2">
                            • {item.name}{' '}
                            <span className="text-[10px] text-slate-500 font-mono">({item.portion})</span>
                          </span>
                          <span className="text-[11px] font-bold text-slate-400 font-mono shrink-0">
                            {item.calories} kcal
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Macros da Refeição */}
                  <div className="flex items-center justify-between pt-2 border-t border-dark-border/40 text-[10px] text-slate-400 font-semibold">
                    <div className="flex items-center gap-3">
                      <span>P: <strong className="text-indigo-400">{meal.totalProtein || 0}g</strong></span>
                      <span>C: <strong className="text-amber-400">{meal.totalCarbs || 0}g</strong></span>
                      <span>G: <strong className="text-rose-400">{meal.totalFat || 0}g</strong></span>
                    </div>

                    {meal.notes && (
                      <span className="italic text-slate-500 truncate max-w-[150px]" title={meal.notes}>
                        {meal.notes}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL ADICIONAR REFEIÇÃO */}
      <AddMealModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaveMeal={onSaveMeal}
        settings={deepseekSettings}
        onOpenSettings={() => {
          setIsAddModalOpen(false);
          setIsSettingsOpen(true);
        }}
        targetDate={selectedDate}
        initialMealType={defaultMealType}
        pastMeals={meals}
      />

      {/* MODAL CONFIGURAÇÕES DE NUTRIÇÃO & IA */}
      <NutritionSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={deepseekSettings}
        goals={goals}
        onSave={onSaveSettings}
      />
    </div>
  );
};
