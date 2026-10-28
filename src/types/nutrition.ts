export type MealType = 'cafe' | 'almoco' | 'lanche' | 'jantar' | 'ceia' | 'outro';

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  cafe: 'Café da Manhã',
  almoco: 'Almoço',
  lanche: 'Lanche',
  jantar: 'Jantar',
  ceia: 'Ceia',
  outro: 'Outro'
};

export const MEAL_TYPE_EMOJIS: Record<MealType, string> = {
  cafe: '☕',
  almoco: '🍽️',
  lanche: '🥪',
  jantar: '🥗',
  ceia: '🌙',
  outro: '🍴'
};

/**
 * Retorna o tipo de refeição pré-selecionado de acordo com o horário atual:
 * - 05:00 às 10:00 -> Café da manhã
 * - 12:00 às 14:00 -> Almoço
 * - 15:30 às 18:00 -> Lanche
 * - 20:00 às 22:00 -> Jantar
 * - 22:00 às 23:59 -> Ceia
 * - Restante -> Outro
 */
export function getMealTypeByCurrentTime(date: Date = new Date()): MealType {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // 05:00 às 10:00 -> Café da manhã
  if (timeInMinutes >= 5 * 60 && timeInMinutes <= 10 * 60) {
    return 'cafe';
  }

  // 12:00 às 14:00 -> Almoço
  if (timeInMinutes >= 12 * 60 && timeInMinutes <= 14 * 60) {
    return 'almoco';
  }

  // 15:30 às 18:00 -> Lanche
  if (timeInMinutes >= 15 * 60 + 30 && timeInMinutes <= 18 * 60) {
    return 'lanche';
  }

  // 20:00 às 22:00 -> Jantar
  if (timeInMinutes >= 20 * 60 && timeInMinutes < 22 * 60) {
    return 'jantar';
  }

  // 22:00 às 23:59 -> Ceia
  if (timeInMinutes >= 22 * 60 && timeInMinutes < 24 * 60) {
    return 'ceia';
  }

  // Restante -> Outro
  return 'outro';
}

export interface FoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealLog {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO
  mealType: MealType;
  name: string;
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  notes?: string;
}

export interface NutritionGoals {
  calories: number; // Ex: 2200 kcal
  protein: number;  // Ex: 160 g
  carbs: number;    // Ex: 220 g
  fat: number;      // Ex: 65 g
  waterMl: number;  // Ex: 2500 ml
}

export interface WaterLog {
  date: string; // YYYY-MM-DD
  amountMl: number;
}

export interface AiNutritionSettings {
  apiKey: string;
  model: string; // ex: 'gemini-3.8-flash'
  provider?: 'gemini' | 'deepseek';
}

// Compatibilidade de tipos
export type GeminiSettings = AiNutritionSettings;
export type DeepSeekSettings = AiNutritionSettings;

