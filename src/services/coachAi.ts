import {
  WorkoutSession,
  WorkoutPlan,
  MealLog,
  NutritionGoals,
  MuscleRecoveryStatus,
  MuscleGroup,
  WeeklyAssessment,
  WeeklyAssessmentStats,
  AiWorkoutGenerationResult
} from '../types';

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * Extrai e sanitiza JSON retornado pelo Gemini
 */
function extractJsonFromResponse(rawText: string): any {
  let cleaned = rawText.trim();

  if (cleaned.startsWith('```')) {
    const lines = cleaned.split('\n');
    lines.shift();
    if (lines.length > 0 && lines[lines.length - 1].trim().startsWith('```')) {
      lines.pop();
    }
    cleaned = lines.join('\n').trim();
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Falha ao parsear JSON do Gemini Coach. Texto:', rawText);
    throw new Error('A IA não retornou um formato JSON válido. Tente novamente.');
  }
}

/**
 * Calcula estatísticas fáticas dos últimos N dias (padrão 7 dias)
 */
export function calculateWeekFactualStats(
  history: WorkoutSession[],
  meals: MealLog[],
  waterLogs: Record<string, number>,
  goals: NutritionGoals,
  daysCount = 7
): WeeklyAssessmentStats {
  const now = new Date();
  const startTime = new Date(now.getTime() - daysCount * 24 * 60 * 60 * 1000);
  const startIsoDate = startTime.toISOString().split('T')[0];

  // 1. Treinos concluídos nos últimos dias
  const weekSessions = history.filter(session => {
    const sessionDate = new Date(session.startedAt);
    return sessionDate >= startTime && session.status === 'concluido';
  });

  const totalWorkouts = weekSessions.length;
  let totalSets = 0;
  let totalVolumeKg = 0;
  let totalDurationMinutes = 0;
  const trainedMusclesSet = new Set<string>();

  weekSessions.forEach(session => {
    totalDurationMinutes += Math.round((session.durationSeconds || 0) / 60);
    totalVolumeKg += Math.round(session.totalVolumeKg || 0);

    session.exercises.forEach(ex => {
      const completedSets = ex.sets.filter(s => s.completed);
      totalSets += completedSets.length;
      if (completedSets.length > 0) {
        trainedMusclesSet.add(ex.name);
      }
    });
  });

  // 2. Refeições nos últimos dias
  const weekMeals = meals.filter(m => m.date >= startIsoDate);
  const mealsByDay: Record<string, { cal: number; prot: number; carbs: number; fat: number }> = {};

  weekMeals.forEach(m => {
    if (!mealsByDay[m.date]) {
      mealsByDay[m.date] = { cal: 0, prot: 0, carbs: 0, fat: 0 };
    }
    mealsByDay[m.date].cal += m.totalCalories;
    mealsByDay[m.date].prot += m.totalProtein;
    mealsByDay[m.date].carbs += m.totalCarbs;
    mealsByDay[m.date].fat += m.totalFat;
  });

  const daysLoggedNutrition = Object.keys(mealsByDay).length;
  const totalCals = Object.values(mealsByDay).reduce((acc, d) => acc + d.cal, 0);
  const totalProt = Object.values(mealsByDay).reduce((acc, d) => acc + d.prot, 0);
  const totalCarbs = Object.values(mealsByDay).reduce((acc, d) => acc + d.carbs, 0);
  const totalFat = Object.values(mealsByDay).reduce((acc, d) => acc + d.fat, 0);

  const averageDailyCalories = daysLoggedNutrition > 0 ? Math.round(totalCals / daysLoggedNutrition) : 0;
  const averageDailyProtein = daysLoggedNutrition > 0 ? Math.round(totalProt / daysLoggedNutrition) : 0;
  const averageDailyCarbs = daysLoggedNutrition > 0 ? Math.round(totalCarbs / daysLoggedNutrition) : 0;
  const averageDailyFat = daysLoggedNutrition > 0 ? Math.round(totalFat / daysLoggedNutrition) : 0;

  const calorieGoalDiff = averageDailyCalories > 0 ? averageDailyCalories - (goals.calories || 2000) : 0;
  const proteinGoalDiff = averageDailyProtein > 0 ? averageDailyProtein - (goals.protein || 150) : 0;

  // 3. Hidratação
  let totalWater = 0;
  let waterGoalHitDays = 0;
  let daysWaterLogged = 0;

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = d.toISOString().split('T')[0];
    const amount = waterLogs[dateKey] || 0;
    if (amount > 0) {
      daysWaterLogged++;
      totalWater += amount;
      if (amount >= (goals.waterMl || 2500)) {
        waterGoalHitDays++;
      }
    }
  }

  const averageDailyWaterMl = daysWaterLogged > 0 ? Math.round(totalWater / daysWaterLogged) : 0;

  return {
    periodDays: daysCount,
    totalWorkouts,
    totalSets,
    totalVolumeKg,
    totalDurationMinutes,
    trainedMuscles: Array.from(trainedMusclesSet).slice(0, 8),
    averageDailyCalories,
    averageDailyProtein,
    averageDailyCarbs,
    averageDailyFat,
    calorieGoalDiff,
    proteinGoalDiff,
    averageDailyWaterMl,
    waterGoalHitDays,
    daysLoggedNutrition
  };
}

export const CoachAiService = {
  /**
   * Avaliação Semanal Completa (Treino + Dieta + Água)
   */
  async generateWeeklyAssessment(params: {
    history: WorkoutSession[];
    meals: MealLog[];
    waterLogs: Record<string, number>;
    goals: NutritionGoals;
    recovery?: Record<MuscleGroup, MuscleRecoveryStatus>;
    apiKey: string;
    model?: string;
  }): Promise<WeeklyAssessment> {
    const { history, meals, waterLogs, goals, apiKey, model = DEFAULT_GEMINI_MODEL } = params;

    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API Key do Gemini não configurada. Configure sua chave nas configurações.');
    }

    const stats = calculateWeekFactualStats(history, meals, waterLogs, goals, 7);

    const prompt = `
Você é o Treinador Principal (Head Coach de Alta Performance e Nutricionista Esportivo) do usuário no app MuscleTrack.
Sua missão é fazer um Raio-X completo e motivador da semana do aluno, analisando os dados reais registrados de Treino, Dieta e Hidratação.

DADOS REAIS DA SEMANA DO ALUNO:
- Período avaliado: últimos 7 dias.
- TREINO:
  * Sessões de treino concluídas: ${stats.totalWorkouts} treinos.
  * Total de séries executadas: ${stats.totalSets} séries.
  * Volume total de carga levantada: ${stats.totalVolumeKg} kg acumulados.
  * Tempo total sob tensão/treino: ${stats.totalDurationMinutes} minutos.
  * Exercícios realizados: ${stats.trainedMuscles.length > 0 ? stats.trainedMuscles.join(', ') : 'Nenhum exercício registrado nesta semana'}.

- DIETA & METAS CALÓRICAS:
  * Dias com refeições registradas: ${stats.daysLoggedNutrition} de 7 dias.
  * Meta diária do aluno: ${goals.calories} kcal | ${goals.protein}g proteína | ${goals.carbs}g carboidratos | ${goals.fat}g gorduras.
  * Média diária consumida: ${stats.averageDailyCalories} kcal | ${stats.averageDailyProtein}g proteína | ${stats.averageDailyCarbs}g carbo | ${stats.averageDailyFat}g gordura.
  * Diferença calórica vs meta: ${stats.calorieGoalDiff >= 0 ? `+${stats.calorieGoalDiff} kcal (superávit)` : `${stats.calorieGoalDiff} kcal (déficit)`}.
  * Diferença proteica vs meta: ${stats.proteinGoalDiff >= 0 ? `+${stats.proteinGoalDiff}g proteína` : `${stats.proteinGoalDiff}g proteína`}.

- HIDRATAÇÃO:
  * Meta de água diária: ${goals.waterMl} ml.
  * Média diária consumida: ${stats.averageDailyWaterMl} ml.
  * Dias em que bateu a meta de água: ${stats.waterGoalHitDays} de 7 dias.

INSTRUÇÕES DE TOM E ANÁLISE:
1. Seja técnico, preciso, encorajador e direto ao ponto (estilo treinador pessoal de elite).
2. Se o aluno treinou bem, elogie a consistência e sobrecarga progressiva. Se treinou pouco ou faltou registrar, dê um puxão de orelha construtivo.
3. Se a dieta teve baixa proteína ou calorias fora da meta, aponte o impacto na recuperação muscular.
4. Se faltou água, lembre da queda de força de 10-15% causada por desidratação.
5. Calcule uma Nota Geral de 0 a 10 de acordo com a aderência geral.

Retorne ESTRITAMENTE um objeto JSON com esta estrutura exata:
{
  "overallScore": 8.5,
  "headline": "Semana Sólida com Foco em Força!",
  "summary": "Resumo de 2 a 3 frases sintetizando o desempenho geral da semana.",
  "workoutAnalysis": {
    "score": 8.0,
    "highlights": [
      "Ponto forte 1 no treino",
      "Ponto forte 2 no treino"
    ],
    "improvements": [
      "O que ajustar ou evoluir no treino"
    ],
    "recommendations": "Dica prática para os próximos treinos"
  },
  "nutritionAnalysis": {
    "score": 7.5,
    "highlights": [
      "Ponto forte na alimentação"
    ],
    "improvements": [
      "Onde a dieta falhou ou pode melhorar"
    ],
    "recommendations": "Dica prática de nutrição para hipertrofia/recuperação"
  },
  "hydrationAnalysis": {
    "score": 9.0,
    "averageMl": ${stats.averageDailyWaterMl},
    "status": "excelente",
    "recommendations": "Orientação rápida sobre consumo de água"
  },
  "nextWeekActionPlan": [
    "Meta 1 objetiva para a próxima semana",
    "Meta 2 objetiva para a próxima semana",
    "Meta 3 objetiva para a próxima semana"
  ]
}
`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model.trim())}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      let msg = `Erro ${response.status}: Falha ao contatar Gemini.`;
      try {
        const parsedErr = JSON.parse(errText);
        if (parsedErr.error && parsedErr.error.message) {
          msg = `Erro Gemini: ${parsedErr.error.message}`;
        }
      } catch (e) {}
      throw new Error(msg);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    if (!candidate || !candidate.content?.parts?.[0]?.text) {
      throw new Error('O Gemini não retornou uma resposta válida para a avaliação semanal.');
    }

    const parsed = extractJsonFromResponse(candidate.content.parts[0].text);

    return {
      id: `assessment_${Date.now()}`,
      createdAt: new Date().toISOString(),
      overallScore: Math.min(10, Math.max(0, Number(parsed.overallScore) || 7.0)),
      headline: String(parsed.headline || 'Avaliação da Semana Concluída'),
      summary: String(parsed.summary || 'Análise semanal gerada com sucesso com base nos seus dados registrados.'),
      stats,
      workoutAnalysis: {
        score: Math.min(10, Math.max(0, Number(parsed.workoutAnalysis?.score) || 7.0)),
        highlights: Array.isArray(parsed.workoutAnalysis?.highlights) ? parsed.workoutAnalysis.highlights.map(String) : [],
        improvements: Array.isArray(parsed.workoutAnalysis?.improvements) ? parsed.workoutAnalysis.improvements.map(String) : [],
        recommendations: String(parsed.workoutAnalysis?.recommendations || '')
      },
      nutritionAnalysis: {
        score: Math.min(10, Math.max(0, Number(parsed.nutritionAnalysis?.score) || 7.0)),
        highlights: Array.isArray(parsed.nutritionAnalysis?.highlights) ? parsed.nutritionAnalysis.highlights.map(String) : [],
        improvements: Array.isArray(parsed.nutritionAnalysis?.improvements) ? parsed.nutritionAnalysis.improvements.map(String) : [],
        recommendations: String(parsed.nutritionAnalysis?.recommendations || '')
      },
      hydrationAnalysis: {
        score: Math.min(10, Math.max(0, Number(parsed.hydrationAnalysis?.score) || 7.0)),
        averageMl: Number(parsed.hydrationAnalysis?.averageMl) || stats.averageDailyWaterMl,
        status: (['excelente', 'adequada', 'insuficiente'].includes(parsed.hydrationAnalysis?.status)
          ? parsed.hydrationAnalysis.status
          : 'adequada') as any,
        recommendations: String(parsed.hydrationAnalysis?.recommendations || '')
      },
      nextWeekActionPlan: Array.isArray(parsed.nextWeekActionPlan)
        ? parsed.nextWeekActionPlan.map(String)
        : ['Manter consistência nos treinos', 'Bater meta de proteína diária', 'Beber água regularmente']
    };
  },

  /**
   * Montar ou Editar Treino com IA
   */
  async generateOrEditWorkout(params: {
    prompt: string;
    mode: 'new' | 'edit';
    currentWorkout?: WorkoutPlan | null;
    existingWorkouts?: Record<string, WorkoutPlan>;
    apiKey: string;
    model?: string;
  }): Promise<AiWorkoutGenerationResult> {
    const { prompt, mode, currentWorkout, existingWorkouts = {}, apiKey, model = DEFAULT_GEMINI_MODEL } = params;

    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API Key do Gemini não configurada. Configure sua chave nas configurações.');
    }

    if (!prompt || prompt.trim() === '') {
      throw new Error('Descreva como deseja que o Treinador monte ou altere seu treino.');
    }

    const muscleGroupsAllowed = ['chest', 'back', 'shoulders', 'arms', 'quads', 'hamstrings', 'calves', 'abs'];

    let systemInstructions = `Você é um treinador mestre de musculação e hipertrofia esportiva no app MuscleTrack.
Sua função é gerar fichas de treino otimizadas, biomecanicamente seguras e com volume ideal de séries (geralmente entre 14 a 22 séries totais por treino para hipertrofia, 4 a 7 exercícios).

GRUPOS MUSCULARES VÁLIDOS (muscleGroup DEVE ser estritamente um destes):
- "chest" (Peitoral)
- "back" (Costas / Dorsais / Trapézio)
- "shoulders" (Deltoides)
- "arms" (Bíceps, Tríceps, Antebraço)
- "quads" (Quadríceps)
- "hamstrings" (Posteriores de Coxa / Glúteo)
- "calves" (Panturrilhas)
- "abs" (Abdômen / Core)`;

    let contextData = '';
    if (mode === 'edit' && currentWorkout) {
      contextData = `
O usuário quer EDITAR um treino existente:
- Treino Atual: "${currentWorkout.title}" (Código: ${currentWorkout.code}, Foco: ${currentWorkout.focus})
- Exercícios atuais:
${currentWorkout.exercises.map(e => `  * ${e.name} (${e.sets} séries x ${e.reps} reps, descanso: ${e.restSeconds}s, grupo: ${e.muscleGroup})`).join('\n')}

PEDIDO DO USUÁRIO DE MODIFICAÇÃO:
"${prompt.trim()}"

INSTRUÇÕES PARA EDIÇÃO:
Aplique os ajustes pedidos (ex: trocar exercícios que incomodam articulações, diminuir ou aumentar volume, mudar foco, transformar em bi-set, etc.) mantendo a consistência do treino.`;
    } else {
      contextData = `
O usuário quer CRIAR UM NOVO TREINO a partir da seguinte instrução:
"${prompt.trim()}"

Treinos já existentes na rotina dele: ${Object.values(existingWorkouts).map(w => w.title).join(', ') || 'Nenhum'}.

Crie uma ficha de treino completa, equilibrada, com aquecimento/composto no início e isoladores ao final.`;
    }

    const fullPrompt = `
${systemInstructions}

${contextData}

Retorne ESTRITAMENTE um objeto JSON no seguinte formato:
{
  "message": "Mensagem curta explicando o que você montou e a estratégia fisiológica adotada.",
  "workout": {
    "title": "Nome do Treino (ex: Treino D — Ombros e Braços, ou Treino B — Pernas Completo)",
    "shortTitle": "Nome curto (ex: Ombros & Braços)",
    "focus": "Descrição concisa do foco (ex: Foco em deltoide lateral e tríceps com volume moderado)",
    "dayLabel": "Dia sugerido ou 'Personalizado'",
    "estimatedMinutes": 50,
    "exercises": [
      {
        "name": "Nome do exercício (ex: Supino Inclinado com Halteres)",
        "muscleGroup": "chest", // OBRIGATÓRIO: um de ["chest", "back", "shoulders", "arms", "quads", "hamstrings", "calves", "abs"]
        "sets": 4,
        "reps": "8–12",
        "restSeconds": 90,
        "notes": "Instrução técnica rápida ou cadência",
        "targetLoadKg": 20,
        "isDumbbell": true
      }
    ]
  }
}
`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model.trim())}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.4
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      let msg = `Erro ${response.status}: Falha ao gerar treino com IA.`;
      try {
        const parsedErr = JSON.parse(errText);
        if (parsedErr.error && parsedErr.error.message) {
          msg = `Erro Gemini: ${parsedErr.error.message}`;
        }
      } catch (e) {}
      throw new Error(msg);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    if (!candidate || !candidate.content?.parts?.[0]?.text) {
      throw new Error('O Gemini não retornou um treino válido. Tente reformular seu pedido.');
    }

    const parsed = extractJsonFromResponse(candidate.content.parts[0].text);
    const w = parsed.workout || {};

    const exercises = Array.isArray(w.exercises)
      ? w.exercises.map((ex: any) => {
          let muscleGroup = (String(ex.muscleGroup || 'chest').toLowerCase()) as any;
          if (!muscleGroupsAllowed.includes(muscleGroup)) {
            muscleGroup = 'chest';
          }
          return {
            name: String(ex.name || 'Exercício').trim(),
            muscleGroup,
            sets: Math.max(1, Math.min(10, Math.round(Number(ex.sets) || 3))),
            reps: String(ex.reps || '8–12').trim(),
            restSeconds: Math.max(0, Math.round(Number(ex.restSeconds) || 90)),
            notes: String(ex.notes || '').trim(),
            targetLoadKg: ex.targetLoadKg !== undefined ? Math.round(Number(ex.targetLoadKg)) : undefined,
            isDumbbell: !!ex.isDumbbell
          };
        })
      : [];

    if (exercises.length === 0) {
      throw new Error('A IA não gerou nenhum exercício válido. Tente novamente.');
    }

    return {
      message: String(parsed.message || 'Treino configurado com sucesso!'),
      workout: {
        title: String(w.title || 'Novo Treino IA').trim(),
        shortTitle: String(w.shortTitle || 'Treino IA').trim(),
        focus: String(w.focus || 'Hipertrofia e força').trim(),
        dayLabel: String(w.dayLabel || 'Personalizado').trim(),
        estimatedMinutes: Math.max(20, Math.round(Number(w.estimatedMinutes) || 50)),
        exercises
      }
    };
  }
};
