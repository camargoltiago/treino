import React from 'react';
import { X, Edit3, Trash2, Flame, UtensilsCrossed, Clock, Calendar } from 'lucide-react';
import { MealLog, MEAL_TYPE_LABELS, MEAL_TYPE_EMOJIS } from '../types';

interface MealDetailsModalProps {
  isOpen: boolean;
  meal: MealLog | null;
  onClose: () => void;
  onEdit: (meal: MealLog) => void;
  onDelete: (meal: MealLog) => void;
}

export const MealDetailsModal: React.FC<MealDetailsModalProps> = ({
  isOpen,
  meal,
  onClose,
  onEdit,
  onDelete
}) => {
  if (!isOpen || !meal) return null;

  const timeFormatted = new Date(meal.timestamp).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const dateFormatted = new Date(meal.date + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-dark-card border border-dark-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabeçalho */}
        <div className="p-4 sm:p-5 border-b border-dark-border bg-dark-surface/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 bg-dark-card border border-dark-border rounded-2xl">
              {MEAL_TYPE_EMOJIS[meal.mealType] || '🍴'}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">{meal.name}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-mint-500/15 text-mint-400 border border-mint-500/30 uppercase tracking-wider">
                  {MEAL_TYPE_LABELS[meal.mealType]}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {timeFormatted}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {dateFormatted}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Card Principal: Total de Calorias & Macros */}
          <div className="bg-gradient-to-br from-dark-surface via-dark-card to-dark-bg border border-mint-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total da Refeição</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-black text-mint-400 font-mono">{meal.totalCalories}</span>
                  <span className="text-xs font-bold text-slate-400">kcal</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-mint-500/15 text-mint-400 flex items-center justify-center border border-mint-500/30">
                <Flame className="w-6 h-6" />
              </div>
            </div>

            {/* Grid de Macros */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-dark-border/80 text-center">
              <div className="bg-dark-bg/60 p-2.5 rounded-2xl border border-dark-border">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Proteína</span>
                <span className="text-base font-black text-indigo-400 font-mono">{meal.totalProtein || 0}g</span>
              </div>
              <div className="bg-dark-bg/60 p-2.5 rounded-2xl border border-dark-border">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Carboidratos</span>
                <span className="text-base font-black text-amber-400 font-mono">{meal.totalCarbs || 0}g</span>
              </div>
              <div className="bg-dark-bg/60 p-2.5 rounded-2xl border border-dark-border">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Gordura</span>
                <span className="text-base font-black text-rose-400 font-mono">{meal.totalFat || 0}g</span>
              </div>
            </div>
          </div>

          {/* Lista de Alimentos Consumidos */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <UtensilsCrossed className="w-4 h-4 text-mint-400" />
                <span>Alimentos & Detalhes</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {meal.items?.length || 0} {meal.items?.length === 1 ? 'item' : 'itens'}
              </span>
            </div>

            {meal.items && meal.items.length > 0 ? (
              <div className="space-y-2">
                {meal.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-dark-surface rounded-2xl border border-dark-border space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-white">{item.name}</h4>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Porção: <strong className="text-slate-300">{item.portion}</strong>
                        </span>
                      </div>
                      <span className="text-xs font-black text-mint-400 font-mono bg-mint-500/10 px-2.5 py-1 rounded-xl border border-mint-500/20 shrink-0">
                        {item.calories} kcal
                      </span>
                    </div>

                    {/* Detalhamento de Macros por Item */}
                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-dark-border/50 text-center text-[11px]">
                      <div className="bg-dark-card/80 py-1 px-2 rounded-lg border border-dark-border/40">
                        <span className="text-[9px] text-slate-400 block">Proteína</span>
                        <span className="font-bold text-indigo-400 font-mono">{item.protein || 0}g</span>
                      </div>
                      <div className="bg-dark-card/80 py-1 px-2 rounded-lg border border-dark-border/40">
                        <span className="text-[9px] text-slate-400 block">Carbo</span>
                        <span className="font-bold text-amber-400 font-mono">{item.carbs || 0}g</span>
                      </div>
                      <div className="bg-dark-card/80 py-1 px-2 rounded-lg border border-dark-border/40">
                        <span className="text-[9px] text-slate-400 block">Gordura</span>
                        <span className="font-bold text-rose-400 font-mono">{item.fat || 0}g</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-dark-surface rounded-2xl border border-dark-border text-center text-xs text-slate-400">
                Lançamento rápido de calorias sem divisão de alimentos.
              </div>
            )}
          </div>

          {/* Observações da Refeição */}
          {meal.notes && (
            <div className="p-3.5 bg-dark-surface rounded-2xl border border-dark-border space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Observações</span>
              <p className="text-xs text-slate-300 italic">{meal.notes}</p>
            </div>
          )}

        </div>

        {/* Rodapé de Ações: Editar e Excluir */}
        <div className="p-4 sm:p-5 border-t border-dark-border bg-dark-surface/60 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => {
              onClose();
              onDelete(meal);
            }}
            className="px-3.5 py-3 rounded-2xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onEdit(meal);
            }}
            className="flex-1 py-3 px-4 rounded-2xl bg-mint-500 hover:bg-mint-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-mint-glow transition active:scale-95"
          >
            <Edit3 className="w-4 h-4" />
            <span>Editar Refeição</span>
          </button>
        </div>

      </div>
    </div>
  );
};
