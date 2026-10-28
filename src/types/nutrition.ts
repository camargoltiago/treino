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

