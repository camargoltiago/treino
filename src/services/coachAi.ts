import {
  WorkoutSession,
  WorkoutPlan,
  MealLog,
  NutritionGoals,
  MuscleRecoveryStatus,
  MuscleGroup,
  WeeklyAssessment,
  WeeklyAssessmentStats,
  AiWorkoutGenerationResult,
  AiWorkoutPlanItem
} from '../types';

const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

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
   * Montar ou Editar Treino com IA (pode criar/ajustar 1 treino específico OU toda a rotina de treinos)
   */
  async generateOrEditWorkout(params: {
    prompt: string;
    mode: 'new' | 'edit';
    editScope?: 'all' | 'single';
    currentWorkout?: WorkoutPlan | null;
    existingWorkouts?: Record<string, WorkoutPlan>;
    apiKey: string;
    model?: string;
  }): Promise<AiWorkoutGenerationResult> {
    const {
      prompt,
      mode,
      editScope = 'all',
      currentWorkout,
      existingWorkouts = {},
      apiKey,
      model = DEFAULT_GEMINI_MODEL
    } = params;

    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API Key do Gemini não configurada. Configure sua chave nas configurações.');
    }

    if (!prompt || prompt.trim() === '') {
      throw new Error('Descreva como deseja que o Treinador monte ou altere seu treino.');
    }

    const muscleGroupsAllowed = ['chest', 'back', 'shoulders', 'arms', 'quads', 'hamstrings', 'calves', 'abs'];

    const systemInstructions = `Você é o Treinador Mestre de musculação e periodização de hipertrofia do app MuscleTrack.
Sua missão é criar ou ajustar fichas de treino eficientes, balanceadas e seguras.
Cada treino deve ter entre 4 a 7 exercícios bem selecionados, com volume adequado (geralmente 14 a 22 séries totais por treino para hipertrofia).

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

    if (mode === 'edit') {
      if (editScope === 'all' || !currentWorkout) {
        // Ajustar TODOS os treinos da rotina
        const existingList = Object.values(existingWorkouts);
        contextData = `
O usuário quer AJUSTAR TODOS OS DIAS DA ROTINA ATUAL (${existingList.length} treinos no total):
${existingList.map(w => `
TREINO ATUAL [ID: "${w.id}", Código: "${w.code}"]: "${w.title}" (Foco: ${w.focus})
Exercícios atuais:
${w.exercises.map(e => `  * ${e.name} (${e.sets} séries x ${e.reps} reps, descanso: ${e.restSeconds}s, grupo: ${e.muscleGroup})`).join('\n')}
`).join('\n')}

PEDIDO DE AJUSTE DO USUÁRIO PARA TODOS OS TREINOS:
"${prompt.trim()}"

INSTRUÇÕES CRÍTICAS PARA AJUSTAR TODOS OS TREINOS:
1. Aplique o pedido em CADA UM dos treinos da rotina (ex: se pediu para trocar um exercício, diminuir tempo para 40 min, incluir bi-sets, mudar repetições, mudar foco, etc., faça o ajuste em todos os treinos aplicáveis).
2. Mantenha os mesmos IDs nos treinos retornados ("id": "${existingList[0]?.id || ''}") e os mesmos códigos ("A", "B", "C"...) para que o aplicativo atualize as fichas existentes sem perder o histórico do usuário!
3. Retorne TODOS os treinos da rotina atualizados no array "workouts".`;
      } else {
        // Ajustar 1 treino específico
        contextData = `
O usuário quer EDITAR APENAS 1 TREINO ESPECÍFICO:
- Treino a ser editado [ID: "${currentWorkout.id}", Código: "${currentWorkout.code}"]: "${currentWorkout.title}" (Foco: ${currentWorkout.focus})
- Exercícios atuais:
${currentWorkout.exercises.map(e => `  * ${e.name} (${e.sets} séries x ${e.reps} reps, descanso: ${e.restSeconds}s, grupo: ${e.muscleGroup})`).join('\n')}

PEDIDO DE MODIFICAÇÃO:
"${prompt.trim()}"

INSTRUÇÕES:
Aplique os ajustes no treino indicado mantendo o ID ("id": "${currentWorkout.id}") e o código ("${currentWorkout.code}").
Retorne o treino ajustado no array "workouts" (com 1 elemento).`;
      }
    } else {
      // Criar Novo Treino ou Nova Rotina Completa
      const existingTitles = Object.values(existingWorkouts).map(w => w.title).join(', ') || 'Nenhum';
      contextData = `
O usuário quer que você CRIE UMA NOVA FICHA OU ROTINA DE TREINO a partir do seguinte pedido:
"${prompt.trim()}"

Treinos que o usuário já tinha no app: ${existingTitles}.

INSTRUÇÕES CRÍTICAS PARA CRIAÇÃO:
1. Se o usuário pediu uma divisão ou rotina completa (ex: "Treino ABC", "ABCD", "Push/Pull/Legs", "Upper/Lower", "Full Body 3x", "Rotina de hipertrofia", etc.), gere TODOS OS DIAS DA ROTINA no array "workouts"!
   - Por exemplo, se pediu ABC: gere 3 treinos (Treino A, Treino B e Treino C).
   - Se pediu ABCD: gere 4 treinos (Treino A, Treino B, Treino C e Treino D).
   - Se pediu apenas 1 treino pontual (ex: "Treino de braço"): gere 1 treino no array "workouts".
2. Defina os códigos em sequência: "A", "B", "C", "D"...
3. Garanta que cada treino tenha exercícios equilibrados, aquecimento/compostos no início e isoladores no final.`;
    }

    const fullPrompt = `
${systemInstructions}

${contextData}

Retorne ESTRITAMENTE um objeto JSON com a seguinte estrutura:
{
  "message": "Explicação resumida em 1 a 2 frases da estratégia adotada para esta rotina/treino.",
  "isFullRoutine": true,
  "workouts": [
    {
      "id": "opcional_manter_se_for_edicao",
      "code": "A",
      "title": "Treino A — Peito e Tríceps",
      "shortTitle": "Peito & Tríceps",
      "focus": "Foco em peitoral maior e deltoide anterior com ênfase em sobrecarga progressiva",
      "dayLabel": "Segunda-feira",
      "estimatedMinutes": 50,
      "exercises": [
        {
          "name": "Supino Reto com Barra",
          "muscleGroup": "chest",
          "sets": 4,
          "reps": "8–10",
          "restSeconds": 120,
          "notes": "Executar cadência controlada na descida",
          "targetLoadKg": 25,
          "isDumbbell": false
        }
      ]
    }
  ]
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

    // Suportar tanto "workouts" (array) quanto "workout" (único objeto legado)
    let rawWorkouts: any[] = [];
    if (Array.isArray(parsed.workouts) && parsed.workouts.length > 0) {
      rawWorkouts = parsed.workouts;
    } else if (parsed.workout && typeof parsed.workout === 'object') {
      rawWorkouts = [parsed.workout];
    }

    if (rawWorkouts.length === 0) {
      throw new Error('A IA não gerou nenhum treino válido. Tente novamente.');
    }

    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const normalizedWorkouts: AiWorkoutPlanItem[] = rawWorkouts.map((w: any, wIdx: number) => {
      const code = String(w.code || letters[wIdx % letters.length] || `T${wIdx + 1}`).trim().toUpperCase();
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

      return {
        id: w.id ? String(w.id) : undefined,
        code,
        title: String(w.title || `Treino ${code}`).trim(),
        shortTitle: String(w.shortTitle || `Treino ${code}`).trim(),
        focus: String(w.focus || 'Hipertrofia e força').trim(),
        dayLabel: String(w.dayLabel || 'Personalizado').trim(),
        estimatedMinutes: Math.max(20, Math.round(Number(w.estimatedMinutes) || 50)),
        exercises: exercises.length > 0 ? exercises : [
          {
            name: 'Exercício Base',
            muscleGroup: 'chest',
            sets: 3,
            reps: '8–12',
            restSeconds: 90,
            notes: 'Execução controlada'
          }
        ]
      };
    });

    return {
      message: String(parsed.message || 'Treinos configurados com sucesso pelo Treinador IA!'),
      isFullRoutine: normalizedWorkouts.length > 1 || !!parsed.isFullRoutine,
      workouts: normalizedWorkouts
    };
  }
};
