const axios = require('axios');
const prisma = require('../prisma/client');
require('dotenv').config();

// Configuração do OpenRouter
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Modelos recomendados para diferentes funcionalidades
const AI_MODELS = {
  general: 'openai/gpt-4o-mini', // Para chat e dúvidas gerais
  workout: 'openai/gpt-4o-mini', // Para geração de treinos
  nutrition: 'openai/gpt-oss-120b', // Para geração de planos alimentares
  analysis: 'openai/gpt-4o-mini', // Para análise de documentos
};

const MEMORY_LIMITS = {
  byMode: 10,
  feedback: 6,
  progress: 8,
};

const SENSITIVE_PATTERNS = [/senha/gi, /password/gi, /token/gi, /auth[_-]?code/gi];

const sanitizeContextSnippet = (text, maxLength = 220) => {
  if (!text) return '';
  const normalized = typeof text === 'string' ? text : JSON.stringify(text);
  const truncated = normalized.length <= maxLength ? normalized : `${normalized.slice(0, maxLength - 3)}...`;
  return SENSITIVE_PATTERNS.reduce((value, pattern) => value.replace(pattern, '[dado confidencial]'), truncated);
};

const truncateText = (text, maxLength = 220) => sanitizeContextSnippet(text, maxLength);

const formatDate = (value) => {
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (error) {
    return '';
  }
};

const splitByRecency = (items = [], weighting = 0.7) => {
  if (!Array.isArray(items) || items.length === 0) {
    return { recent: [], historical: [] };
  }

  const pivot = Math.max(1, Math.ceil(items.length * weighting));
  return {
    recent: items.slice(0, pivot),
    historical: items.slice(pivot),
  };
};

const safeJsonParse = (value) => {
  if (!value || typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

const roundValue = (value, precision = 2) => {
  const numberValue = Number(value || 0);
  const factor = 10 ** precision;
  return Math.round(numberValue * factor) / factor;
};

/**
 * Função para chamar a API do OpenRouter
 * @param {string} prompt - O prompt para enviar à IA
 * @param {string} model - O modelo a ser usado (opcional)
 * @param {number} maxTokens - Número máximo de tokens na resposta (opcional)
 * @returns {Promise<string>} - A resposta da IA
 */
async function callOpenRouter(
  prompt,
  model = AI_MODELS.general,
  maxTokens = 1000,
  extraParams = {}
) {
  try {
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
        ...extraParams,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://strengthsprint.com', // Opcional
          'X-Title': 'StrengthSprint Companion', // Opcional
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Erro ao chamar OpenRouter:', error.response?.data || error.message);
    throw new Error('Falha ao gerar conteúdo com IA');
  }
}

/**
 * Gera um plano de treino personalizado com base nos dados do usuário
 * @param {Object} userData - Dados do usuário
 * @param {Object} options - Opções adicionais (activitySummary, etc.)
 * @returns {Promise<string>} - O plano de treino gerado
 */
async function generateWorkoutPlan(userData, options = {}) {
  const { activitySummary, userId, planContext, requestSummary } = options;
  const resolvedUserId = userId || userData?.id || null;

  const adaptiveContext = await buildAdaptiveContext({
    userId: resolvedUserId,
    mode: 'workout',
    planType: 'workout',
    activitySummary,
  });

  let activityContext = '';
  if (activitySummary && activitySummary.workouts) {
    const { workouts, feedback } = activitySummary;
    activityContext = `
Histórico Recente do Usuário (últimos ${activitySummary.range?.days || 14} dias):

Treinos:
- Total de sessões: ${workouts.summary.totalSessions}
- Sessões completadas: ${workouts.summary.completedSessions}
- Taxa de conclusão: ${workouts.summary.completionRate}%
${workouts.sessions.length > 0 ? `- Treinos recentes: ${workouts.sessions.map((s) => s.workoutPlan?.name || 'Sem plano').slice(0, 5).join(', ')}` : ''}

Feedback agregado:
${feedback.recent.length > 0 ? feedback.recent
      .filter((f) => f.planType === 'workout' || f.planContext.includes('workout'))
      .slice(0, 3)
      .map(
        (f) =>
          `- ${formatDate(f.createdAt)} • ${f.rating}/5${f.feedbackText ? ` — "${truncateText(f.feedbackText, 120)}"` : ''}`
      )
      .join('\n')
    : '- Nenhum feedback registrado recentemente.'}
`;
  }

  const customRequestSection = userData.customRequest || requestSummary
    ? `
Solicitação Específica do Usuário:
${truncateText(userData.customRequest || requestSummary, 280)}
`
    : '';

  const prompt = `
    Você é um treinador inteligente especializado em progressão personalizada. Utilize o contexto histórico para evitar repetição e ajustar a intensidade.
    ${adaptiveContext}
    ${activityContext}
${customRequestSection}
    Com base nas informações acima, crie um plano de treino personalizado para uma semana.
    IMPORTANTE: Se estiver gerando coachingNotes, formate-as em markdown (use ### para títulos, - para listas, ** para negrito).

    Perfil do Usuário:
    - Nome: ${userData.name || 'Não informado'}
    - Idade: ${userData.age || 'Não informada'} anos
    - Peso: ${userData.weight || 'Não informado'} kg
    - Altura: ${userData.height || 'Não informada'} cm
    - Gênero: ${userData.gender || 'Não informado'}
    - Nível de experiência: ${userData.fitnessLevel || 'Não informado'}
    - Objetivo: ${userData.goal || 'Não informado'}
    - Dias disponíveis para treinar: ${userData.availableDays || 'Não informado'} dias por semana
    - Equipamentos disponíveis: ${userData.equipment || 'Não informado'}
    - Lesões ou limitações: ${userData.injuries || 'Nenhuma informada'}
    - Preferências de treino: ${userData.preferences || 'Nenhuma informada'}

    Regras para o plano:
    - Use o histórico para detectar platôs: se a adesão caiu, reduza a carga ou simplifique exercícios.
    - Reforce exercícios com boa adesão e variações que respondam ao feedback positivo.
    - Se houver queixas de dor ou sobrecarga, ajuste o volume e inclua mobilidade ou recuperação ativa.
    - Mostre progressão clara (ex.: cargas menores para recomeço ou incrementos graduais).

    Gere apenas JSON válido no formato:
    {
      "plan": [
        {
          "day": "Segunda",
          "exercises": [
            { "name": "Agachamento", "sets": 3, "reps": 12, "rest": 60, "muscleGroup": "Pernas" }
          ],
          "notes": "Observações sobre o treino do dia"
        }
      ],
      "coachingNotes": "Resumo das adaptações realizadas"
    }
  `;

  return await callOpenRouter(prompt, AI_MODELS.workout, 1500, {
    response_format: { type: 'json_object' },
    metadata: {
      planContext: planContext || null,
    },
  });
}

/**
 * Gera um plano alimentar personalizado com base nos dados do usuário
 * @param {Object} userData - Dados do usuário
 * @param {Object} nutritionalGoals - Metas nutricionais do usuário
 * @param {Object} options - Opções adicionais (activitySummary, etc.)
 * @returns {Promise<string>} - O plano alimentar gerado
 */
async function generateMealPlan(userData, nutritionalGoals, options = {}) {
  const { activitySummary, userId, planContext, requestSummary } = options;
  const resolvedUserId = userId || userData?.id || null;

  const adaptiveContext = await buildAdaptiveContext({
    userId: resolvedUserId,
    mode: 'nutrition',
    planType: 'nutrition',
    activitySummary,
  });

  let activityContext = '';
  if (activitySummary && activitySummary.nutrition) {
    const { nutrition, feedback } = activitySummary;
    activityContext = `
Histórico Nutricional Recente (últimos ${activitySummary.range?.days || 14} dias):
- Dias acompanhados: ${nutrition.summary.trackedDays}
- Calorias médias: ${nutrition.summary.averageCalories} kcal
${nutrition.days.length > 0 ? `- Consumo recente: ${nutrition.days.slice(0, 3).map((day) => `${new Date(day.date).toLocaleDateString('pt-BR')} (${day.totals.calories} kcal)`).join(', ')}` : ''}

Feedback agregado:
${feedback.recent.length > 0 ? feedback.recent
      .filter((f) => f.planType === 'nutrition' || f.planContext.includes('nutrition'))
      .slice(0, 3)
      .map(
        (f) =>
          `- ${formatDate(f.createdAt)} • ${f.rating}/5${f.feedbackText ? ` — "${truncateText(f.feedbackText, 120)}"` : ''}`
      )
      .join('\n')
    : '- Nenhum feedback registrado.'}
`;
  }

  const customRequestSection = userData.customRequest || requestSummary
    ? `
Solicitação Específica do Usuário:
${truncateText(userData.customRequest || requestSummary, 280)}
`
    : '';

  const prompt = `
    Você é um nutricionista inteligente especializado em personalização alimentar. Utilize o contexto histórico para evitar repetição e ajustar preferências.
    ${adaptiveContext}
    ${activityContext}
${customRequestSection}
    Com base nas informações acima, crie um plano alimentar personalizado para um dia.
    IMPORTANTE: Se estiver gerando coachingNotes, formate-as em markdown (use ### para títulos, - para listas, ** para negrito).
    
    Perfil do Usuário:
    - Nome: ${userData.name || 'Não informado'}
    - Idade: ${userData.age || 'Não informada'} anos
    - Peso: ${userData.weight || 'Não informado'} kg
    - Altura: ${userData.height || 'Não informada'} cm
    - Gênero: ${userData.gender || 'Não informado'}
    - Objetivo: ${userData.goal || 'Não informado'}
    - Nível de atividade/treino: ${userData.fitnessLevel || 'Não informado'}
    - Restrições alimentares: ${userData.dietaryRestrictions || 'Nenhuma informada'}
    - Preferências alimentares: ${userData.foodPreferences || 'Nenhuma informada'}

    Metas nutricionais diárias:
    - Calorias: ${nutritionalGoals.calories || 'Não informado'} kcal
    - Proteínas: ${nutritionalGoals.protein || 'Não informado'} g
    - Carboidratos: ${nutritionalGoals.carbs || 'Não informado'} g
    - Gorduras: ${nutritionalGoals.fat || 'Não informado'} g

    Regras para o plano:
    - Use o histórico para identificar alimentos bem avaliados e evite aqueles com feedback negativo.
    - Se o tracking é irregular, sugira refeições simples e fáceis de registrar.
    - Ajuste calorias com base no consumo médio real vs. meta.
    - Mantenha variedade mas respeite as preferências do usuário.
    
    Gere um plano alimentar para um dia com:
    1. 3 refeições principais (café da manhã, almoço, jantar)
    2. 2 lanches
    3. Detalhes nutricionais para cada alimento
    4. Quantidades em gramas ou porções

    Responda APENAS com JSON válido seguindo este formato:
    {
      "meals": [
        {
          "name": "Nome da refeição",
          "time": "Horário sugerido",
          "items": [
            {
              "name": "Alimento",
              "quantity": 0,
              "calories": 0,
              "protein": 0,
              "carbs": 0,
              "fat": 0
            }
          ],
          "notes": "Orientações adicionais da refeição"
        }
      ],
      "dailySummary": {
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0
      },
      "coachingNotes": "Resumo das adaptações realizadas"
    }
    Não inclua nenhum texto fora do JSON.
  `;

  return await callOpenRouter(prompt, AI_MODELS.nutrition, 1500, {
    metadata: {
      planContext: planContext || null,
    },
  });
}

/**
 * Gera uma única refeição personalizada
 * @param {Object} userData - Dados do usuário
 * @param {Object} nutritionalGoals - Metas nutricionais do usuário
 * @param {Object} options - Opções adicionais (mealType, activitySummary, etc.)
 * @returns {Promise<string>} - A refeição gerada
 */
async function generateSingleMeal(userData, nutritionalGoals, options = {}) {
  const { mealType = 'almoço', activitySummary, userId, planContext, requestSummary } = options;
  const resolvedUserId = userId || userData?.id || null;

  const adaptiveContext = await buildAdaptiveContext({
    userId: resolvedUserId,
    mode: 'nutrition',
    planType: 'single-meal',
    activitySummary,
  });

  const customRequestSection = userData.customRequest || requestSummary
    ? `
Solicitação Específica do Usuário:
${truncateText(userData.customRequest || requestSummary, 280)}
`
    : '';

  const prompt = `
    Você é um nutricionista inteligente especializado em personalização alimentar.
    ${adaptiveContext}
${customRequestSection}
    Com base nas informações acima, crie uma refeição personalizada do tipo "${mealType}".
    
    Perfil do Usuário:
    - Nome: ${userData.name || 'Não informado'}
    - Idade: ${userData.age || 'Não informada'} anos
    - Peso: ${userData.weight || 'Não informado'} kg
    - Altura: ${userData.height || 'Não informada'} cm
    - Gênero: ${userData.gender || 'Não informado'}
    - Objetivo: ${userData.goal || 'Não informado'}
    - Nível de atividade/treino: ${userData.fitnessLevel || 'Não informado'}
    - Restrições alimentares: ${userData.dietaryRestrictions || 'Nenhuma informada'}
    - Preferências alimentares: ${userData.foodPreferences || 'Nenhuma informada'}

    Metas nutricionais diárias:
    - Calorias: ${nutritionalGoals.calories || 'Não informado'} kcal
    - Proteínas: ${nutritionalGoals.protein || 'Não informado'} g
    - Carboidratos: ${nutritionalGoals.carbs || 'Não informado'} g
    - Gorduras: ${nutritionalGoals.fat || 'Não informado'} g

    Gere uma refeição balanceada do tipo "${mealType}" com valores aproximados para esta refeição considerando as metas diárias.
    
    Responda APENAS com JSON válido seguindo este formato:
    {
      "meal": {
        "name": "Nome da refeição",
        "time": "Horário sugerido",
        "type": "${mealType}",
        "items": [
          {
            "name": "Alimento",
            "quantity": 0,
            "unit": "g ou ml ou unidade",
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0
          }
        ],
        "notes": "Orientações adicionais da refeição"
      },
      "mealSummary": {
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0
      },
      "coachingNotes": "Dicas e orientações"
    }
    Não inclua nenhum texto fora do JSON.
  `;

  return await callOpenRouter(prompt, AI_MODELS.nutrition, 1500, {
    metadata: {
      planContext: planContext || null,
    },
  });
}

/**
 * Gera um programa de cutting/bulking de múltiplas semanas
 * @param {Object} userData - Dados do usuário
 * @param {Object} nutritionalGoals - Metas nutricionais do usuário
 * @param {Object} options - Opções adicionais (programType, duration, activitySummary, etc.)
 * @returns {Promise<string>} - O programa nutricional gerado
 */
async function generateNutritionProgram(userData, nutritionalGoals, options = {}) {
  const { programType = 'cutting', duration = 8, activitySummary, userId, planContext, requestSummary } = options;
  const resolvedUserId = userId || userData?.id || null;

  const adaptiveContext = await buildAdaptiveContext({
    userId: resolvedUserId,
    mode: 'nutrition',
    planType: 'nutrition-program',
    activitySummary,
  });

  const customRequestSection = userData.customRequest || requestSummary
    ? `
Solicitação Específica do Usuário:
${truncateText(userData.customRequest || requestSummary, 280)}
`
    : '';

  const programDescriptions = {
    cutting: 'perda de gordura mantendo massa muscular',
    bulking: 'ganho de massa muscular',
    maintenance: 'manutenção do peso atual',
    recomp: 'recomposição corporal (perder gordura e ganhar músculo simultaneamente)'
  };

  const prompt = `
    Você é um nutricionista especializado em periodização nutricional e programas de longo prazo.
    ${adaptiveContext}
${customRequestSection}
    Com base nas informações acima, crie um programa nutricional completo de ${duration} semanas focado em ${programDescriptions[programType] || programType}.
    
    Perfil do Usuário:
    - Nome: ${userData.name || 'Não informado'}
    - Idade: ${userData.age || 'Não informada'} anos
    - Peso: ${userData.weight || 'Não informado'} kg
    - Altura: ${userData.height || 'Não informada'} cm
    - Gênero: ${userData.gender || 'Não informado'}
    - Objetivo: ${userData.goal || 'Não informado'}
    - Nível de atividade/treino: ${userData.fitnessLevel || 'Não informado'}
    - Restrições alimentares: ${userData.dietaryRestrictions || 'Nenhuma informada'}
    - Preferências alimentares: ${userData.foodPreferences || 'Nenhuma informada'}

    Metas nutricionais base:
    - Calorias: ${nutritionalGoals.calories || 'Não informado'} kcal
    - Proteínas: ${nutritionalGoals.protein || 'Não informado'} g
    - Carboidratos: ${nutritionalGoals.carbs || 'Não informado'} g
    - Gorduras: ${nutritionalGoals.fat || 'Não informado'} g

    Diretrizes para o programa:
    1. Divida em fases (ex: 3 fases para um programa de 8 semanas)
    2. Ajuste calorias e macros progressivamente conforme a fase
    3. Para cutting: déficit calórico progressivo, mantendo proteína alta
    4. Para bulking: superávit calórico moderado com ajustes semanais
    5. Inclua estratégias como refeeds ou diet breaks se apropriado
    6. Forneça diretrizes gerais para cada fase, não planos de refeições diários detalhados
    
    Responda APENAS com JSON válido seguindo este formato:
    {
      "program": {
        "name": "Nome do Programa",
        "type": "${programType}",
        "duration": ${duration},
        "startWeight": ${userData.weight || 0},
        "targetWeight": 0,
        "description": "Descrição geral do programa"
      },
      "phases": [
        {
          "phase": 1,
          "name": "Nome da Fase",
          "weeks": [1, 2, 3],
          "weeklyGoals": {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0
          },
          "guidelines": "Diretrizes nutricionais desta fase",
          "mealSuggestions": [
            "Sugestão de estrutura de refeição 1",
            "Sugestão de estrutura de refeição 2"
          ],
          "notes": "Observações e dicas importantes"
        }
      ],
      "generalGuidelines": {
        "hydration": "Orientações de hidratação",
        "supplements": ["Suplemento recomendado 1", "Suplemento recomendado 2"],
        "cheatMeals": "Política de refeições livres",
        "adjustments": "Como ajustar o plano com base no progresso"
      },
      "coachingNotes": "Resumo executivo e motivação em markdown"
    }
    Não inclua nenhum texto fora do JSON.
  `;

  return await callOpenRouter(prompt, AI_MODELS.nutrition, 2500, {
    metadata: {
      planContext: planContext || null,
    },
  });
}

/**
 * Realiza uma avaliação de saúde com base nos dados do usuário
 * @param {Object} userData - Dados do usuário
 * @param {Object} healthData - Dados de saúde do usuário
 * @returns {Promise<string>} - A avaliação de saúde gerada
 */
async function generateHealthAssessment(userData, healthData) {
  const prompt = `
    Com base nas seguintes informações do usuário, faça uma avaliação de saúde e forneça recomendações:
    
    Informações pessoais:
    - Idade: ${userData.age || 'Não informada'} anos
    - Peso: ${userData.weight || 'Não informado'} kg
    - Altura: ${userData.height || 'Não informada'} cm
    - Sexo: ${userData.gender || 'Não informado'}
    
    Dados de saúde:
    - IMC: ${healthData.bmi || 'Não informado'}
    - Percentual de gordura: ${healthData.bodyFatPercentage || 'Não informado'}%
    - Pressão arterial: ${healthData.bloodPressure || 'Não informado'}
    - Frequência cardíaca em repouso: ${healthData.restingHeartRate || 'Não informado'} bpm
    - Nível de atividade física: ${healthData.activityLevel || 'Não informado'}
    - Qualidade do sono: ${healthData.sleepQuality || 'Não informado'}
    - Nível de estresse: ${healthData.stressLevel || 'Não informado'}
    
    Histórico:
    - Condições médicas: ${healthData.medicalConditions || 'Nenhuma informada'}
    - Medicamentos: ${healthData.medications || 'Nenhum informado'}
    - Alergias: ${healthData.allergies || 'Nenhuma informada'}
    
    Por favor, forneça:
    1. Uma avaliação geral do estado de saúde do usuário
    2. Pontos fortes e áreas de melhoria
    3. Recomendações específicas de treino
    4. Recomendações específicas de nutrição
    5. Recomendações de estilo de vida
    6. Quando procurar ajuda médica
    
    IMPORTANTE: Formate sua resposta em markdown usando:
    - ### para títulos de seções
    - - para listas
    - ** para negrito em palavras importantes
    - * para itálico em observações
    
    Formate a resposta de forma clara, profissional e encorajadora.
  `;

  return await callOpenRouter(prompt, AI_MODELS.analysis, 2000);
}

/**
 * Analisa documentos de saúde do usuário
 * @param {string} documentContent - Conteúdo do documento de saúde
 * @param {Object} userData - Dados do usuário
 * @returns {Promise<string>} - A análise do documento
 */
async function analyzeHealthDocument(documentContent, userData) {
  const prompt = `
    Com base no seguinte documento de saúde e informações do usuário, faça uma análise detalhada:
    
    Informações do usuário:
    - Idade: ${userData.age || 'Não informada'} anos
    - Peso: ${userData.weight || 'Não informado'} kg
    - Altura: ${userData.height || 'Não informada'} cm
    - Sexo: ${userData.gender || 'Não informado'}
    - Objetivo: ${userData.goal || 'Não informado'}
    
    Documento de saúde:
    ${documentContent}
    
    Por favor, forneça:
    1. Um resumo dos principais pontos do documento
    2. Interpretação dos resultados relevantes
    3. Implicações para a saúde do usuário
    4. Recomendações baseadas nos resultados
    5. Quando procurar ajuda médica adicional
    6. Como os resultados podem afetar o plano de treino e nutrição
    
    IMPORTANTE: Formate sua resposta em markdown usando:
    - ### para títulos de seções
    - - para listas
    - ** para negrito em valores/indicadores importantes
    - * para itálico em observações
    
    Formate a resposta de forma clara, profissional e acessível.
  `;

  return await callOpenRouter(prompt, AI_MODELS.analysis, 2000);
}

/**
 * Recupera o histórico de conversas do usuário
 * @param {number} userId - ID do usuário
 * @param {string} mode - Modo da conversa (opcional)
 * @param {number} limit - Limite de mensagens (padrão: 10)
 * @returns {Promise<Array>} - Array de conversas anteriores
 */
async function getUserMemory(userId, mode = null, limit = 10) {
  try {
    const whereClause = mode ? { userId, mode } : { userId };
    
    const memory = await prisma.userMemory.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        mode: true,
        userMessage: true,
        aiResponse: true,
        metadata: true,
        createdAt: true,
      },
    });

    return memory;
  } catch (error) {
    console.error('Erro ao buscar memória do usuário:', error);
    return [];
  }
}

/**
 * Salva uma conversa na memória do usuário
 * @param {number} userId - ID do usuário
 * @param {string} mode - Modo da conversa
 * @param {string} userMessage - Mensagem do usuário
 * @param {string} aiResponse - Resposta da IA
 * @param {Object} metadata - Metadados adicionais (opcional)
 * @returns {Promise<Object>} - Memória salva
 */
async function saveUserMemory(userId, mode, userMessage, aiResponse, metadata = null) {
  try {
    const serializedMetadata = metadata ? JSON.stringify(metadata) : null;

    const memory = await prisma.userMemory.create({
      data: {
        userId,
        mode,
        userMessage: userMessage.substring(0, 5000),
        aiResponse: aiResponse.substring(0, 5000),
        metadata: serializedMetadata,
      },
    });

    return memory;
  } catch (error) {
    console.error('Erro ao salvar memória do usuário:', error);
    throw error;
  }
}

/**
 * Analisa padrões de progresso do usuário
 * @param {Object} activitySummary - Resumo de atividades do usuário
 * @returns {Object} - Insights e padrões detectados
 */
function analyzeProgressPatterns(activitySummary) {
  if (!activitySummary) {
    return { insights: [], patterns: [], recommendations: [] };
  }

  const insights = [];
  const patterns = [];
  const recommendations = [];

  const { workouts, nutrition, feedback } = activitySummary;

  if (workouts?.summary) {
    const { completionRate, totalSessions, completedSessions } = workouts.summary;
    
    if (completionRate >= 80) {
      insights.push('Excelente consistência nos treinos');
      patterns.push('high_adherence');
    } else if (completionRate < 50) {
      insights.push('Baixa adesão aos treinos');
      patterns.push('low_adherence');
      recommendations.push('Considere treinos mais curtos ou menos frequentes para melhorar a adesão');
    }

    if (totalSessions < 3 && activitySummary.range?.days >= 7) {
      insights.push('Frequência de treinos abaixo do ideal');
      patterns.push('low_frequency');
      recommendations.push('Tente aumentar gradualmente a frequência de treinos');
    }
  }

  if (nutrition?.summary) {
    const { trackedDays, averageCalories } = nutrition.summary;
    
    if (trackedDays < 5 && activitySummary.range?.days >= 14) {
      insights.push('Acompanhamento nutricional inconsistente');
      patterns.push('irregular_nutrition_tracking');
      recommendations.push('Tente registrar sua alimentação diariamente para melhores resultados');
    }

    if (averageCalories > 0) {
      insights.push(`Média de ${averageCalories} kcal/dia registradas`);
    }
  }

  if (feedback?.averageRating) {
    if (feedback.averageRating >= 4) {
      insights.push('Alta satisfação com planos anteriores');
      patterns.push('high_satisfaction');
    } else if (feedback.averageRating < 3) {
      insights.push('Insatisfação com planos anteriores');
      patterns.push('low_satisfaction');
      recommendations.push('Os planos serão ajustados com base em seu feedback');
    }
  }

  if (feedback?.recent && feedback.recent.length > 0) {
    const recentNegativeFeedback = feedback.recent
      .filter(f => f.rating && f.rating < 3 && f.feedbackText)
      .map(f => f.feedbackText);
    
    if (recentNegativeFeedback.length > 0) {
      insights.push('Feedback negativo recente identificado');
      patterns.push('negative_feedback');
    }
  }

  return { insights, patterns, recommendations };
}

const transformPlanFeedbackEntry = (entry) => {
  if (!entry) return null;
  const parsedMetadata = safeJsonParse(entry.metadata);
  return {
    rating: entry.rating ?? parsedMetadata?.rating ?? null,
    difficultyRating: entry.difficultyRating ?? parsedMetadata?.difficultyRating ?? null,
    adherence: entry.adherence ?? parsedMetadata?.adherence ?? null,
    notes: entry.notes || parsedMetadata?.notes || null,
    improvements: entry.improvements || parsedMetadata?.improvements || null,
    createdAt: entry.createdAt,
  };
};

const buildPlanFeedbackSection = (feedbackEntries = []) => {
  if (!feedbackEntries.length) return '';

  const { recent, historical } = splitByRecency(feedbackEntries, 0.7);

  const formatFeedback = (entry) => {
    const ratingText = entry.rating ? `Nota ${entry.rating}/5` : null;
    const difficultyText = entry.difficultyRating ? `Percepção de dificuldade: ${entry.difficultyRating}/5` : null;
    const adherenceText = entry.adherence !== null && entry.adherence !== undefined ? `Adesão: ${entry.adherence}%` : null;
    const details = [ratingText, difficultyText, adherenceText].filter(Boolean).join(' | ');
    const notes = entry.notes ? `Comentário: ${truncateText(entry.notes, 180)}` : null;
    const improvements = entry.improvements ? `Solicitou: ${truncateText(entry.improvements, 160)}` : null;

    return `- ${formatDate(entry.createdAt)} ${details ? `(${details})` : ''}${notes ? ` — ${notes}` : ''}${improvements ? ` — ${improvements}` : ''}`;
  };

  const sections = [];
  if (recent.length) {
    sections.push(`Feedback recente:
${recent.map(formatFeedback).join('\n')}`);
  }
  if (historical.length) {
    sections.push(`Feedback histórico relevante:
${historical.map(formatFeedback).join('\n')}`);
  }

  return sections.join('\n');
};

const buildProgressSection = (progressEntries = []) => {
  if (!progressEntries.length) return '';

  const formatProgress = (entry) => {
    const metricName = (entry.metric || entry.logType || 'progresso')
      .replace(/_/g, ' ')
      .toLowerCase();
    const formattedValue = entry.value !== null && entry.value !== undefined ? `${roundValue(entry.value, 2)}` : 's/ registro';
    const delta =
      entry.value !== null && entry.value !== undefined &&
      entry.previousValue !== null &&
      entry.previousValue !== undefined
        ? roundValue(entry.value - entry.previousValue, 2)
        : null;

    const deltaText =
      delta === null
        ? 'manutenção'
        : delta > 0
        ? `+${delta}`
        : `${delta}`;

    const notes = entry.notes ? ` ${truncateText(entry.notes, 150)}` : '';

    return `- ${formatDate(entry.date)} • ${metricName}: ${formattedValue} (${deltaText} vs período anterior).${notes}`;
  };

  const { recent, historical } = splitByRecency(progressEntries, 0.6);
  const sections = [];

  if (recent.length) {
    sections.push(`Tendências recentes:
${recent.map(formatProgress).join('\n')}`);
  }

  if (historical.length) {
    sections.push(`Tendências anteriores:
${historical.map(formatProgress).join('\n')}`);
  }

  return sections.join('\n');
};

async function buildAdaptiveContext({ userId, mode, planType, activitySummary }) {
  if (!userId) return '';

  const contextPromises = [
    getUserMemory(userId, mode, MEMORY_LIMITS.byMode),
    prisma.progressLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: MEMORY_LIMITS.progress,
    }),
  ];

  if (planType) {
    contextPromises.push(
      prisma.planFeedback.findMany({
        where: { userId, planType },
        orderBy: { createdAt: 'desc' },
        take: MEMORY_LIMITS.feedback,
      })
    );
  } else {
    contextPromises.push(Promise.resolve([]));
  }

  const [memoryEntries, progressEntries, planFeedback] = await Promise.all(contextPromises);

  let normalizedFeedback = planFeedback.map(transformPlanFeedbackEntry).filter(Boolean);

  if (planType && normalizedFeedback.length < MEMORY_LIMITS.feedback) {
    const fallbackFeedback = await prisma.aIFeedback.findMany({
      where: { userId, planType },
      orderBy: { createdAt: 'desc' },
      take: MEMORY_LIMITS.feedback - normalizedFeedback.length,
    });
    const translatedFallback = fallbackFeedback.map((entry) =>
      transformPlanFeedbackEntry({
        rating: entry.rating,
        difficultyRating: safeJsonParse(entry.planContent)?.difficultyRating || null,
        adherence: safeJsonParse(entry.planContent)?.adherence || null,
        notes: entry.feedbackText,
        improvements: safeJsonParse(entry.planContent)?.improvements || null,
        metadata: entry.planContent,
        createdAt: entry.createdAt,
      })
    );
    normalizedFeedback = [...normalizedFeedback, ...translatedFallback.filter(Boolean)];
  }

  const sections = [];

  if (Array.isArray(memoryEntries) && memoryEntries.length) {
    const { recent, historical } = splitByRecency(memoryEntries, 0.7);
    const summarizeEntry = (entry) => {
      const metadata = safeJsonParse(entry.metadata);
      const focusNote = metadata?.focus ? ` [foco: ${truncateText(metadata.focus, 50)}]` : '';
      return `- ${formatDate(entry.createdAt)} Usuário: ${truncateText(entry.userMessage, 160)} | IA: ${truncateText(entry.aiResponse, 160)}${focusNote}`;
    };

    if (recent.length) {
      sections.push(`Interações recentes:
${recent.map(summarizeEntry).join('\n')}`);
    }
    if (historical.length) {
      sections.push(`Contexto histórico relevante:
${historical.map(summarizeEntry).join('\n')}`);
    }
  }

  if (normalizedFeedback.length) {
    const feedbackSection = buildPlanFeedbackSection(normalizedFeedback);
    if (feedbackSection) {
      sections.push(`Feedback do usuário:
${feedbackSection}`);
    }
  }

  if (Array.isArray(progressEntries) && progressEntries.length) {
    const progressSection = buildProgressSection(progressEntries);
    if (progressSection) {
      sections.push(`Sinais de progresso observados:
${progressSection}`);
    }
  }

  if (activitySummary) {
    const analysis = analyzeProgressPatterns(activitySummary);
    const analysisSections = [];

    if (analysis.insights.length) {
      analysisSections.push(`Insights recentes:
${analysis.insights.map((insight) => `- ${insight}`).join('\n')}`);
    }

    if (analysis.recommendations.length) {
      analysisSections.push(`Ajustes sugeridos:
${analysis.recommendations.map((rec) => `- ${rec}`).join('\n')}`);
    }

    if (analysisSections.length) {
      sections.push(analysisSections.join('\n'));
    }
  }

  if (!sections.length) {
    return '';
  }

  return `\nContexto Histórico Personalizado:\n${sections.join('\n\n')}\n`;
}

/**
 * Responde a perguntas do usuário com contexto e memória
 * @param {string} question - A pergunta do usuário
 * @param {Object} userData - Dados do usuário
 * @param {string} context - Contexto adicional (opcional)
 * @param {Object} options - Opções adicionais (userId, activitySummary, etc.)
 * @returns {Promise<string>} - A resposta à pergunta
 */
async function answerQuestion(question, userData, context = '', options = {}) {
  const { userId, activitySummary, planContext, mode = 'chat' } = options;

  const adaptiveContext = await buildAdaptiveContext({
    userId,
    mode,
    planType: null,
    activitySummary,
  });

  const prompt = `
    Você é um assistente de fitness amigável e profissional chamado StrengthSprint Assistant.
    
    Usuário: ${userData.name || 'Usuário do StrengthSprint'}
    Mensagem do usuário: "${question}"
    
    Informações do usuário:
    - Idade: ${userData.age || 'Não informada'} anos
    - Peso: ${userData.weight || 'Não informado'} kg
    - Altura: ${userData.height || 'Não informada'} cm
    - Nível de experiência: ${userData.fitnessLevel || 'Não informado'}
    - Objetivo: ${userData.goal || 'Não informado'}
    
    Contexto adicional:
    ${context || 'Sem contexto adicional fornecido.'}${adaptiveContext}
    
    INSTRUÇÕES IMPORTANTES:
    1. Seja contextual e natural na resposta
    2. Para cumprimentos simples (olá, oi, tudo bem, etc), responda de forma amigável e breve, perguntando como pode ajudar
    3. APENAS forneça planos detalhados de treino ou nutrição quando o usuário EXPLICITAMENTE solicitar (ex: "crie um treino", "monte um plano alimentar", "preciso de exercícios")
    4. Para dúvidas gerais sobre fitness, dê orientações concisas e práticas
    5. Use markdown para formatar sua resposta (títulos com ###, listas com -, negrito com **)
    6. Mantenha o tom motivador mas objetivo
    7. Se o usuário apenas está conversando ou fazendo perguntas gerais, não inunde com recomendações detalhadas a menos que seja pedido
    
    Responda de forma clara, personalizada e contextual à mensagem do usuário.
  `;

  const response = await callOpenRouter(prompt, AI_MODELS.general, 1000);

  if (userId) {
    try {
      await saveUserMemory(userId, mode, question, response, {
        planContext: planContext || `chat-${Date.now()}`,
        mode,
      });
    } catch (error) {
      console.error('Erro ao salvar memória:', error);
    }
  }

  return response;
}

/**
 * Classifies user intent from a message
 * @param {string} message - The user's message
 * @param {Object} userData - User data for context
 * @param {Object} activitySummary - Recent activity summary
 * @returns {Promise<Object>} - Intent classification with confidence
 */
async function classifyUserIntent(message, userData = {}, activitySummary = null) {
  try {
    const contextHints = [];
    
    // Add context from activity summary
    if (activitySummary) {
      if (activitySummary.workouts?.summary?.totalSessions > 0) {
        contextHints.push('Usuário tem histórico de treinos');
      }
      if (activitySummary.nutrition?.summary?.trackedDays > 0) {
        contextHints.push('Usuário tem histórico de rastreamento nutricional');
      }
    }
    
    const contextSection = contextHints.length > 0 
      ? `\nContexto do usuário: ${contextHints.join(', ')}`
      : '';

    const prompt = `
Você é um classificador de intenções para um assistente de fitness. Analise a mensagem do usuário e classifique em uma das seguintes categorias:

- **workout**: Solicitações sobre treinos, exercícios, criação de planos de treino, rotinas de exercícios
- **nutrition**: Solicitações sobre alimentação, dieta, planos alimentares, calorias, macronutrientes
- **health**: Avaliações de saúde, indicadores de saúde (IMC, pressão, etc), bem-estar geral
- **document**: Solicitações para analisar documentos, exames médicos, laudos, relatórios de saúde
- **chat**: Conversas gerais, dúvidas sobre fitness, motivação, orientações gerais

Usuário: ${userData.name || 'Usuário'}
Objetivo: ${userData.goal || 'Não informado'}
Nível: ${userData.fitnessLevel || 'Não informado'}${contextSection}

Mensagem do usuário: "${message}"

Analise a mensagem e responda APENAS com um JSON válido seguindo este formato:
{
  "intent": "categoria",
  "confidence": 0.95,
  "extractedContext": {
    "keywords": ["palavra1", "palavra2"],
    "focus": "descrição breve do foco da solicitação"
  }
}

Regras:
- Se mencionar "treino", "exercício", "musculação", "cardio" → workout
- Se mencionar "comida", "dieta", "alimentação", "calorias", "proteína" → nutrition
- Se mencionar "saúde", "IMC", "pressão", "avaliação" → health
- Se mencionar "exame", "documento", "laudo", "análise de" seguido de documento → document
- Para dúvidas gerais ou conversas → chat
- confidence deve ser entre 0 e 1
`;

    const response = await callOpenRouter(prompt, AI_MODELS.general, 300, {
      response_format: { type: 'json_object' }
    });
    
    const classification = JSON.parse(response);
    
    // Validate and ensure proper format
    return {
      intent: classification.intent || 'chat',
      confidence: Math.min(Math.max(classification.confidence || 0.5, 0), 1),
      extractedContext: classification.extractedContext || { keywords: [], focus: '' }
    };
  } catch (error) {
    console.error('Erro ao classificar intenção:', error);
    // Default to chat mode on error
    return {
      intent: 'chat',
      confidence: 0.3,
      extractedContext: { keywords: [], focus: 'Erro na classificação' }
    };
  }
}

/**
 * Processes a unified request by detecting intent and routing appropriately
 * @param {string} message - The user's message
 * @param {Object} userData - Complete user data
 * @param {Object} options - Additional options (activitySummary, nutritionalGoals, etc.)
 * @returns {Promise<Object>} - Response with intent, message, and structured data if applicable
 */
async function processUnifiedRequest(message, userData, options = {}) {
  const { activitySummary, nutritionalGoals, userId, documentContent } = options;

  // Classify user intent
  const classification = await classifyUserIntent(message, userData, activitySummary);
  const { intent, confidence, extractedContext } = classification;

  console.log(`Intent detected: ${intent} (confidence: ${confidence})`);

  let response;
  let structuredData = null;
  let planType = null;
  let planContext = null;

  // Route to appropriate handler based on intent
  switch (intent) {
    case 'workout': {
      planContext = `ai-workout-unified-${Date.now()}`;
      planType = 'workout';
      
      const workoutUserData = {
        ...userData,
        customRequest: message
      };

      const workoutPlanText = await generateWorkoutPlan(workoutUserData, {
        activitySummary,
        userId,
        planContext,
        requestSummary: message
      });

      try {
        const planData = JSON.parse(workoutPlanText);
        if (planData.plan && Array.isArray(planData.plan)) {
          structuredData = planData;
          response = formatWorkoutPlanText(planData);
        } else {
          response = workoutPlanText;
        }
      } catch (parseError) {
        response = workoutPlanText;
      }
      break;
    }

    case 'nutrition': {
      planContext = `ai-nutrition-unified-${Date.now()}`;
      planType = 'nutrition';
      
      const nutritionUserData = {
        ...userData,
        customRequest: message
      };

      const mealPlanText = await generateMealPlan(
        nutritionUserData,
        nutritionalGoals || {},
        {
          activitySummary,
          userId,
          planContext,
          requestSummary: message
        }
      );

      try {
        const planData = JSON.parse(mealPlanText);
        if (planData.meals && Array.isArray(planData.meals)) {
          structuredData = planData;
          response = formatMealPlanText(planData);
        } else {
          response = mealPlanText;
        }
      } catch (parseError) {
        response = mealPlanText;
      }
      break;
    }

    case 'health': {
      planContext = `ai-health-unified-${Date.now()}`;
      planType = 'health';
      
      const healthData = {
        bmi: userData.weight && userData.height
          ? (userData.weight / Math.pow(userData.height / 100, 2)).toFixed(1)
          : null,
        bodyFatPercentage: null,
        bloodPressure: 'não informado',
        restingHeartRate: null,
        activityLevel: userData.fitnessLevel || 'moderado',
        sleepQuality: 'boa',
        stressLevel: 'moderado',
        medicalConditions: userData.injuries || 'nenhuma',
        medications: 'nenhum',
        allergies: 'nenhuma',
        customRequest: message
      };

      response = await generateHealthAssessment(userData, healthData);
      break;
    }

    case 'document': {
      planContext = `ai-document-unified-${Date.now()}`;
      planType = 'document';
      
      if (documentContent && documentContent.trim()) {
        // User provided document content, analyze it
        response = await analyzeHealthDocument(documentContent, userData);
      } else {
        // Ask user to provide document content
        response = `Para analisar documentos de saúde, por favor, forneça o conteúdo completo do documento. 

Cole o texto do seu exame, laudo ou relatório médico e eu farei uma análise detalhada para você.

Você pode colar:
- Resultados de exames de sangue
- Laudos de exames de imagem
- Relatórios médicos
- Avaliações físicas

Estou aguardando o conteúdo do documento para análise.`;
      }
      break;
    }

    case 'chat':
    default: {
      response = await answerQuestion(message, userData, '', {
        userId,
        activitySummary,
        planContext: `chat-unified-${Date.now()}`,
        mode: 'chat'
      });
      break;
    }
  }

  return {
    intent,
    confidence,
    extractedContext,
    response,
    structuredData,
    planType,
    planContext
  };
}

/**
 * Formats workout plan data into readable text
 * @param {Object} planData - Workout plan data
 * @returns {string} - Formatted text
 */
function formatWorkoutPlanText(planData) {
  if (!planData || !planData.plan || !Array.isArray(planData.plan)) {
    return 'Plano de treino gerado com sucesso!';
  }

  const formattedDays = planData.plan.map(day => {
    const dayName = day.day || day.name || 'Treino';
    const exercises = Array.isArray(day.exercises)
      ? day.exercises.map((ex, idx) => 
          `${idx + 1}. **${ex.name || 'Exercício'}** - ${ex.sets || 0} séries x ${ex.reps || 0} reps${ex.rest ? ` (${ex.rest}s descanso)` : ''}`
        ).join('\n')
      : '  Nenhum exercício';
    
    const notes = day.notes ? `\n\n*Obs: ${day.notes}*` : '';
    return `### ${dayName}\n\n${exercises}${notes}`;
  }).join('\n\n');

  const coachingNotes = planData.coachingNotes 
    ? `\n\n### 📝 Observações do Treinador\n\n${planData.coachingNotes}`
    : '';

  return `## 🏋️ Plano de Treino Gerado\n\n${formattedDays}${coachingNotes}`;
}

/**
 * Formats meal plan data into readable text
 * @param {Object} planData - Meal plan data
 * @returns {string} - Formatted text
 */
function formatMealPlanText(planData) {
  if (!planData || !planData.meals || !Array.isArray(planData.meals)) {
    return 'Plano alimentar gerado com sucesso!';
  }

  const formattedMeals = planData.meals.map(meal => {
    const mealName = meal.name || 'Refeição';
    const mealTime = meal.time ? ` (${meal.time})` : '';
    const items = Array.isArray(meal.items)
      ? meal.items.map((item, idx) => {
          const macros = [];
          if (item.calories) macros.push(`${item.calories} kcal`);
          if (item.protein) macros.push(`${item.protein}g prot`);
          if (item.carbs) macros.push(`${item.carbs}g carb`);
          if (item.fat) macros.push(`${item.fat}g gord`);
          
          const macroInfo = macros.length > 0 ? ` *(${macros.join(', ')})*` : '';
          const quantity = item.quantity ? ` - ${item.quantity}g` : '';
          
          return `${idx + 1}. **${item.name}**${quantity}${macroInfo}`;
        }).join('\n')
      : '  Nenhum item';
    
    const notes = meal.notes ? `\n\n*Obs: ${meal.notes}*` : '';
    return `### ${mealName}${mealTime}\n\n${items}${notes}`;
  }).join('\n\n');

  let summary = '';
  if (planData.dailySummary) {
    const s = planData.dailySummary;
    summary = `\n\n### 📊 Resumo Diário\n\n- **Calorias:** ${s.calories || 0} kcal\n- **Proteína:** ${s.protein || 0}g\n- **Carboidratos:** ${s.carbs || 0}g\n- **Gorduras:** ${s.fat || 0}g`;
  }

  const coachingNotes = planData.coachingNotes
    ? `\n\n### 📝 Observações do Nutricionista\n\n${planData.coachingNotes}`
    : '';

  return `## 🍎 Plano Alimentar Gerado\n\n${formattedMeals}${summary}${coachingNotes}`;
}

module.exports = {
  generateWorkoutPlan,
  generateMealPlan,
  generateSingleMeal,
  generateNutritionProgram,
  generateHealthAssessment,
  analyzeHealthDocument,
  answerQuestion,
  getUserMemory,
  saveUserMemory,
  analyzeProgressPatterns,
  buildAdaptiveContext,
  classifyUserIntent,
  processUnifiedRequest,
};
