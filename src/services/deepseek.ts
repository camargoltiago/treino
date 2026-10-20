import { FoodItem } from '../types/nutrition';

export interface NutritionAiAnalysisResult {
  name: string;
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  notes?: string;
}

const DEFAULT_MODEL = 'deepseek-flash';
const DEFAULT_ENDPOINT = 'https://api.deepseek.com/chat/completions';

/**
 * Limpa e extrai um objeto JSON da resposta da IA, tratando blocos markdown ```json
 */
function extractJsonFromResponse(rawText: string): any {
  let cleaned = rawText.trim();

  // Remover marcações markdown do tipo ```json ... ```
  if (cleaned.startsWith('```')) {
    const lines = cleaned.split('\n');
    lines.shift(); // remove primeira linha ``` ou ```json
    if (lines.length > 0 && lines[lines.length - 1].trim().startsWith('```')) {
      lines.pop(); // remove última linha ```
    }
    cleaned = lines.join('\n').trim();
  }

  // Se ainda houver texto ao redor, buscar o primeiro { e o último }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Falha ao parsear JSON da IA. Texto bruto:', rawText);
    throw new Error('A resposta da IA não retornou um formato JSON válido. Tente novamente.');
  }
}

/**
 * Sanitiza e normaliza o resultado retornado pela IA para o formato FoodItem[]
 */
function normalizeAiResult(parsed: any): NutritionAiAnalysisResult {
  const items: FoodItem[] = Array.isArray(parsed.items)
    ? parsed.items.map((item: any) => ({
        name: String(item.name || 'Alimento').trim(),
        portion: String(item.portion || '1 porção').trim(),
        calories: Math.max(0, Math.round(Number(item.calories) || 0)),
        protein: Math.max(0, Math.round(Number(item.protein) || 0)),
        carbs: Math.max(0, Math.round(Number(item.carbs) || 0)),
        fat: Math.max(0, Math.round(Number(item.fat) || 0))
      }))
    : [];

  // Se os totais não vieram ou vieram zerados, soma a partir dos itens
  const sumCalories = items.reduce((acc, it) => acc + it.calories, 0);
  const sumProtein = items.reduce((acc, it) => acc + it.protein, 0);
  const sumCarbs = items.reduce((acc, it) => acc + it.carbs, 0);
  const sumFat = items.reduce((acc, it) => acc + it.fat, 0);

  const totalCalories = Math.round(Number(parsed.totalCalories)) || sumCalories;
  const totalProtein = Math.round(Number(parsed.totalProtein)) || sumProtein;
  const totalCarbs = Math.round(Number(parsed.totalCarbs)) || sumCarbs;
  const totalFat = Math.round(Number(parsed.totalFat)) || sumFat;

  return {
    name: String(parsed.name || 'Refeição').trim(),
    items,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    notes: parsed.notes ? String(parsed.notes).trim() : undefined
  };
}

export const DeepSeekNutritionService = {
  /**
   * Analisa uma foto de refeição através de imagem em Base64 usando o modelo deepseek-flash
   */
  async analyzeMealFromImage(params: {
    base64Image: string;
    apiKey: string;
    model?: string;
    mealHint?: string;
    customEndpoint?: string;
  }): Promise<NutritionAiAnalysisResult> {
    const { base64Image, apiKey, model = DEFAULT_MODEL, mealHint, customEndpoint = DEFAULT_ENDPOINT } = params;

    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API Key da DeepSeek não configurada. Configure sua chave nas configurações de Nutrição.');
    }

    const systemPrompt = `Você é um nutricionista esportivo de alta precisão.
Analise a refeição da imagem e estime porções, calorias (kcal) e macronutrientes (proteínas, carboidratos, gorduras).
Seja realista com porções típicas.
Responda ESTRITAMENTE com um objeto JSON válido, sem texto conversacional antes ou depois.`;

    const userPrompt = `Analise os alimentos visíveis nesta foto de refeição${mealHint ? ` (Momento sugerido: ${mealHint})` : ''}.
Identifique cada item, estime a quantidade/peso, calorias (kcal), proteínas (g), carboidratos (g) e gorduras (g).
Retorne estritamente um JSON no seguinte formato:
{
  "name": "Nome descritivo da refeição (ex: Almoço com Arroz, Feijão e Frango)",
  "items": [
    {
      "name": "Nome do alimento",
      "portion": "estimativa (ex: 150g, 2 colheres de servir)",
      "calories": 210,
      "protein": 35,
      "carbs": 5,
      "fat": 4
    }
  ],
  "totalCalories": 210,
  "totalProtein": 35,
  "totalCarbs": 5,
  "totalFat": 4,
  "notes": "Observação curta sobre o equilíbrio da refeição"
}`;

    const payload = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      temperature: 0.2
    };

    const response = await fetch(customEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorMsg = `Erro na API da DeepSeek (${response.status} ${response.statusText})`;
      try {
        const errorJson = await response.json();
        if (errorJson.error?.message) {
          errorMsg = `DeepSeek: ${errorJson.error.message}`;
        }
      } catch {}
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const messageContent = data.choices?.[0]?.message?.content;
    if (!messageContent) {
      throw new Error('A DeepSeek respondeu com conteúdo vazio.');
    }

    const parsedJson = extractJsonFromResponse(messageContent);
    return normalizeAiResult(parsedJson);
  },

  /**
   * Analisa uma refeição descrita por texto (ex: "2 ovos cozidos e 1 tapioca com queijo coalho")
   */
  async analyzeMealFromText(params: {
    description: string;
    apiKey: string;
    model?: string;
    mealHint?: string;
    customEndpoint?: string;
  }): Promise<NutritionAiAnalysisResult> {
    const { description, apiKey, model = DEFAULT_MODEL, mealHint, customEndpoint = DEFAULT_ENDPOINT } = params;

    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API Key da DeepSeek não configurada.');
    }

    const systemPrompt = `Você é um nutricionista esportivo de precisão.
Analise a refeição descrita pelo usuário e calcule porções, calorias (kcal) e macronutrientes (proteínas, carboidratos, gorduras).
Responda ESTRITAMENTE com um objeto JSON válido, sem explicações ou introduções.`;

    const userPrompt = `Analise os seguintes alimentos consumidos: "${description}"${mealHint ? ` (Refeição: ${mealHint})` : ''}.
Retorne estritamente um JSON no seguinte formato:
{
  "name": "Nome resumido da refeição",
  "items": [
    {
      "name": "Nome do alimento",
      "portion": "estimativa (ex: 2 unidades, 100g)",
      "calories": 140,
      "protein": 12,
      "carbs": 1,
      "fat": 10
    }
  ],
  "totalCalories": 140,
  "totalProtein": 12,
  "totalCarbs": 1,
  "totalFat": 10,
  "notes": "Observação curta nutricional"
}`;

    const payload = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2
    };

    const response = await fetch(customEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorMsg = `Erro na API da DeepSeek (${response.status} ${response.statusText})`;
      try {
        const errorJson = await response.json();
        if (errorJson.error?.message) {
          errorMsg = `DeepSeek: ${errorJson.error.message}`;
        }
      } catch {}
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const messageContent = data.choices?.[0]?.message?.content;
    if (!messageContent) {
      throw new Error('A DeepSeek respondeu com conteúdo vazio.');
    }

    const parsedJson = extractJsonFromResponse(messageContent);
    return normalizeAiResult(parsedJson);
  },

  /**
   * Testa a validade da API Key fazendo uma chamada leve de teste
   */
  async testConnection(apiKey: string, model = DEFAULT_MODEL, customEndpoint = DEFAULT_ENDPOINT): Promise<boolean> {
    if (!apiKey || apiKey.trim() === '') return false;

    const response = await fetch(customEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Ping! Responda apenas "OK".' }],
        max_tokens: 10
      })
    });

    if (!response.ok) {
      let errorMsg = `Falha na conexão (${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson.error?.message) errorMsg = errorJson.error.message;
      } catch {}
      throw new Error(errorMsg);
    }

    return true;
  }
};
