import { FoodItem, MealLog } from '../types';

export const DEFAULT_POPULAR_FOODS: FoodItem[] = [
  { name: 'Pão francês', portion: '1 unid (50g)', calories: 135, protein: 4, carbs: 28, fat: 1 },
  { name: 'Pão integral', portion: '2 fatias (50g)', calories: 120, protein: 5, carbs: 22, fat: 2 },
  { name: 'Ovo mexido', portion: '2 unidades (100g)', calories: 150, protein: 13, carbs: 1, fat: 10 },
  { name: 'Ovo cozido', portion: '1 unidade (50g)', calories: 75, protein: 6, carbs: 0.5, fat: 5 },
  { name: 'Peito de frango grelhado', portion: '150g', calories: 240, protein: 46, carbs: 0, fat: 5 },
  { name: 'Arroz branco cozido', portion: '150g (4 colheres)', calories: 195, protein: 4, carbs: 42, fat: 0.5 },
  { name: 'Arroz integral cozido', portion: '150g', calories: 180, protein: 4, carbs: 38, fat: 1.5 },
  { name: 'Feijão carioca cozido', portion: '100g (1 concha)', calories: 76, protein: 5, carbs: 14, fat: 0.5 },
  { name: 'Banana prata', portion: '1 unidade (80g)', calories: 78, protein: 1, carbs: 20, fat: 0.1 },
  { name: 'Whey Protein concentrado', portion: '1 scoop (30g)', calories: 120, protein: 24, carbs: 3, fat: 1.5 },
  { name: 'Aveia em flocos', portion: '2 colheres (30g)', calories: 105, protein: 4, carbs: 17, fat: 2 },
  { name: 'Tapioca', portion: '3 colheres goma (50g)', calories: 120, protein: 0, carbs: 30, fat: 0 },
  { name: 'Azeite de oliva', portion: '1 colher sopa (13ml)', calories: 108, protein: 0, carbs: 0, fat: 12 },
  { name: 'Pasta de amendoim', portion: '1 colher sopa (30g)', calories: 180, protein: 8, carbs: 6, fat: 14 },
  { name: 'Batata doce cozida', portion: '150g', calories: 115, protein: 2, carbs: 27, fat: 0.2 },
  { name: 'Carne moída (patinho)', portion: '150g', calories: 220, protein: 35, carbs: 0, fat: 8 },
  { name: 'Queijo minas frescal', portion: '1 fatia (30g)', calories: 70, protein: 5, carbs: 1, fat: 5 },
  { name: 'Café sem açúcar', portion: '1 xícara (100ml)', calories: 2, protein: 0, carbs: 0.3, fat: 0 },
  { name: 'Leite desnatado', portion: '1 copo (200ml)', calories: 70, protein: 6, carbs: 10, fat: 0 }
];

export interface FoodLibraryItem extends FoodItem {
  frequency: number;
  lastUsedTimestamp?: string;
}

export const FoodLibraryService = {
  /**
   * Extrai e agrega todos os alimentos consumidos no histórico de refeições,
   * calculando a frequência com que aparecem e guardando as últimas porções utilizadas.
   */
  getAllKnownFoods(pastMeals: MealLog[] = []): FoodLibraryItem[] {
    const foodMap: Record<string, FoodLibraryItem> = {};

    // 1. Inicializar com a biblioteca padrão
    DEFAULT_POPULAR_FOODS.forEach((item) => {
      const key = item.name.toLowerCase().trim();
      foodMap[key] = { ...item, frequency: 1 };
    });

    // 2. Extrair das refeições passadas do usuário (da mais antiga para a mais recente)
    // Para que as porções mais recentes sobrescrevam e a frequência aumente
    const sortedMeals = [...pastMeals].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    sortedMeals.forEach((meal) => {
      if (Array.isArray(meal.items)) {
        meal.items.forEach((item) => {
          if (!item.name || !item.name.trim()) return;
          const key = item.name.toLowerCase().trim();

          if (foodMap[key]) {
            foodMap[key].frequency += 2; // alimentos do usuário têm peso maior
            foodMap[key].portion = item.portion || foodMap[key].portion;
            foodMap[key].calories = item.calories ?? foodMap[key].calories;
            foodMap[key].protein = item.protein ?? foodMap[key].protein;
            foodMap[key].carbs = item.carbs ?? foodMap[key].carbs;
            foodMap[key].fat = item.fat ?? foodMap[key].fat;
            foodMap[key].lastUsedTimestamp = meal.timestamp;
          } else {
            foodMap[key] = {
              name: item.name.trim(),
              portion: item.portion || '1 porção',
              calories: Number(item.calories) || 0,
              protein: Number(item.protein) || 0,
              carbs: Number(item.carbs) || 0,
              fat: Number(item.fat) || 0,
              frequency: 2,
              lastUsedTimestamp: meal.timestamp
            };
          }
        });
      }
    });

    // Converter para array ordenado por frequência e recência
    return Object.values(foodMap).sort((a, b) => {
      if (b.frequency !== a.frequency) {
        return b.frequency - a.frequency;
      }
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  },

  /**
   * Busca alimentos que combinam com o termo digitado (para autocomplete)
   */
  searchSuggestions(query: string, pastMeals: MealLog[] = [], limit = 6): FoodItem[] {
    const term = query.toLowerCase().trim();
    if (!term) return [];

    const allFoods = this.getAllKnownFoods(pastMeals);

    return allFoods
      .filter((food) => food.name.toLowerCase().includes(term))
      .slice(0, limit)
      .map(({ frequency, lastUsedTimestamp, ...foodItem }) => foodItem);
  },

  /**
   * Retorna os alimentos mais frequentes para atalhos rápidos com 1 clique
   */
  getTopFrequentFoods(pastMeals: MealLog[] = [], limit = 8): FoodItem[] {
    const allFoods = this.getAllKnownFoods(pastMeals);
    return allFoods
      .slice(0, limit)
      .map(({ frequency, lastUsedTimestamp, ...foodItem }) => foodItem);
  }
};
