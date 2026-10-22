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

const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

/**
 * Limpa e extrai um objeto JSON da resposta da IA, tratando blocos markdown ```json se existirem
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
    console.error('Falha ao parsear JSON retornado pela IA. Texto bruto:', rawText);
    throw new Error('A IA não retornou um formato JSON válido. Tente novamente.');
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

export const GeminiNutritionService = {
  /**
   * Analisa refeição de forma unificada:
   * - Apenas Foto
   * - Apenas Texto ou Áudio transcrito
   * - Foto + Texto/Áudio juntos (para enriquecer com detalhes como "é pão integral", "frango com azeite")
   */
  async analyzeMealUnified(params: {
    base64Image?: string | null;
    description?: string | null;
    apiKey: string;
    model?: string;
    mealHint?: string;
  }): Promise<NutritionAiAnalysisResult> {
    const { base64Image, description, apiKey, model = DEFAULT_GEMINI_MODEL, mealHint } = params;

    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API Key do Gemini não configurada. Configure sua chave nas configurações de Nutrição.');
    }

    const hasImage = !!base64Image && base64Image.trim().length > 0;
    const hasText = !!description && description.trim().length > 0;

    if (!hasImage && !hasText) {
      throw new Error('Forneça uma foto ou descreva o que comeu para a IA analisar.');
    }

    let promptText = `Você é um nutricionista esportivo de precisão.`;

    if (hasImage && hasText) {
      promptText += `
O usuário enviou uma FOTO da refeição e também forneceu uma DESCRIÇÃO/OBSERVAÇÃO COMPLEMENTAR:
"${description?.trim()}".
${mealHint ? `Momento da refeição sugerido: ${mealHint}.` : ''}

INSTRUÇÕES CRÍTICAS:
1. Combine as informações visuais da foto com a descrição do usuário. Se o usuário especificou ingredientes específicos ou detalhes que a imagem não mostra claramente (ex: "é pão integral", "frango grelhado no azeite", "leite desnatado", "3 ovos mexidos"), dê prioridade e considere rigorosamente essas informações!
2. Identifique cada item presente, estime as porções (em gramas ou unidades), calcule calorias (kcal), proteínas (g), carboidratos (g) e gorduras (g).`;
    } else if (hasImage) {
      promptText += `
Analise os alimentos visíveis nesta foto de refeição${mealHint ? ` (Momento da refeição: ${mealHint})` : ''}.
Identifique cada item presente no prato, estime a porção/peso aproximado (em gramas ou unidades), calcule calorias (kcal), proteínas (g), carboidratos (g) e gorduras (g).`;
    } else {
      promptText += `
Analise os seguintes alimentos descritos pelo usuário: "${description?.trim()}"${mealHint ? ` (Refeição: ${mealHint})` : ''}.
Identifique cada item, estime as porções, calcule calorias (kcal), proteínas (g), carboidratos (g) e gorduras (g).`;
    }

    promptText += `
Retorne ESTRITAMENTE um objeto JSON com a seguinte estrutura:
{
  "name": "Nome resumido do prato",
  "items": [
    {
      "name": "Nome do alimento",
      "portion": "estimativa (ex: 150g, 2 colheres)",
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

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model.trim())}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

    const parts: any[] = [{ text: promptText }];

    if (hasImage) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image
        }
      });
    }

    const payload = {
      contents: [
        {
          role: 'user',
          parts
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorMsg = `Erro na API do Gemini (${response.status} ${response.statusText})`;
      try {
        const errorJson = await response.json();
        if (errorJson.error?.message) {
          errorMsg = `Gemini: ${errorJson.error.message}`;
        }
      } catch {}
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const textOutput = candidate?.content?.parts?.[0]?.text;

    if (!textOutput) {
      throw new Error('A IA respondeu com conteúdo vazio ou bloqueado por filtros de segurança.');
    }

    const parsedJson = extractJsonFromResponse(textOutput);
    return normalizeAiResult(parsedJson);
  },

  /**
   * Analisa a foto do prato usando a API multimodal do Google Gemini
   */
  async analyzeMealFromImage(params: {
    base64Image: string;
    apiKey: string;
    model?: string;
    mealHint?: string;
  }): Promise<NutritionAiAnalysisResult> {
    return this.analyzeMealUnified({
      base64Image: params.base64Image,
      apiKey: params.apiKey,
      model: params.model,
      mealHint: params.mealHint
    });
  },

  /**
   * Analisa refeição descrita por texto
   */
  async analyzeMealFromText(params: {
    description: string;
    apiKey: string;
    model?: string;
    mealHint?: string;
  }): Promise<NutritionAiAnalysisResult> {
    return this.analyzeMealUnified({
      description: params.description,
      apiKey: params.apiKey,
      model: params.model,
      mealHint: params.mealHint
    });
  },

  /**
   * Testa a validade da API Key fazendo uma chamada leve de ping
   */
  async testConnection(apiKey: string, model = DEFAULT_GEMINI_MODEL): Promise<boolean> {
    if (!apiKey || apiKey.trim() === '') return false;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model.trim())}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Ping! Responda apenas "OK".' }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 5
        }
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
