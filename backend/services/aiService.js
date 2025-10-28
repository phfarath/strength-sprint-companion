const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

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
    Com base nas informações acima, crie um plano de treino personalizado para uma semana:

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
    Com base nas informações acima, crie um plano alimentar personalizado para um dia:
    
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
    Usuário: ${userData.name || 'Usuário do StrengthSprint'}
    Pergunta: ${question}
    
    Informações do usuário:
    - Idade: ${userData.age || 'Não informada'} anos
    - Peso: ${userData.weight || 'Não informado'} kg
    - Altura: ${userData.height || 'Não informada'} cm
    - Nível de experiência: ${userData.fitnessLevel || 'Não informado'}
    - Objetivo: ${userData.goal || 'Não informado'}
    
    Contexto adicional:
    ${context || 'Sem contexto adicional fornecido.'}${adaptiveContext}
    
    Responda de forma clara, personalizada e baseada nas interações anteriores e progresso do usuário.
    Priorize recomendações práticas, seguras e adaptadas ao histórico apresentado.
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

module.exports = {
  generateWorkoutPlan,
  generateMealPlan,
  generateHealthAssessment,
  analyzeHealthDocument,
  answerQuestion,
  getUserMemory,
  saveUserMemory,
  analyzeProgressPatterns,
  buildAdaptiveContext,
};
