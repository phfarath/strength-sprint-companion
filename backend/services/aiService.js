const axios = require('axios');
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
  const { activitySummary } = options;

  // Build activity context
  let activityContext = '';
  if (activitySummary && activitySummary.workouts) {
    const { workouts, feedback } = activitySummary;
    activityContext = `
Histórico Recente do Usuário (últimos ${activitySummary.range?.days || 14} dias):

Treinos:
- Total de sessões: ${workouts.summary.totalSessions}
- Sessões completadas: ${workouts.summary.completedSessions}
- Taxa de conclusão: ${workouts.summary.completionRate}%
${workouts.sessions.length > 0 ? `- Treinos recentes: ${workouts.sessions.map(s => s.workoutPlan?.name || 'Sem plano').slice(0, 5).join(', ')}` : ''}

Feedback Anterior:
${feedback.recent.length > 0 ? feedback.recent.filter(f => f.planType === 'workout' || f.planContext.includes('workout')).slice(0, 3).map(f => 
  `- Avaliação: ${f.rating}/5 estrelas${f.feedbackText ? ` - Comentário: "${f.feedbackText}"` : ''}`
).join('\n') : '- Nenhum feedback anterior'}

IMPORTANTE: Considere o histórico ao criar o plano:
- Se o usuário tem alta taxa de conclusão (>80%), você pode aumentar ligeiramente a dificuldade
- Se o usuário tem baixa taxa de conclusão (<50%), mantenha ou reduza a intensidade
- Se há feedback negativo sobre exercícios específicos, EVITE incluí-los no novo plano
- Se há feedback positivo, mantenha exercícios e estruturas similares
`;
  }

  const customRequestSection = userData.customRequest ? `
Solicitação Específica do Usuário:
${userData.customRequest}
` : '';

  const prompt = `
    Com base nas seguintes informações do usuário, crie um plano de treino personalizado para uma semana:

    Informações do Perfil do Usuário:
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
${activityContext}${customRequestSection}
    Por favor, crie um plano de treino para uma semana com os seguintes detalhes:
    1. Divisão de treino por dias (ex: Segunda - Pernas, Terça - Peito, etc.)
    2. Exercícios específicos para cada dia
    3. Número de séries e repetições para cada exercício
    4. Descanso entre séries em segundos
    5. Observações importantes

    A resposta deve ser estritamente um JSON com o formato:
    {
      "plan": [
        {
          "day": "Segunda",
          "exercises": [
            { "name": "Agachamento", "sets": 3, "reps": 12, "rest": 60, "muscleGroup": "Pernas" }
          ],
          "notes": "Observações sobre o treino do dia"
        }
      ]
    }
  `;

  return await callOpenRouter(prompt, AI_MODELS.workout, 1500, {
    response_format: { type: 'json_object' }
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
  const { activitySummary } = options;

  let activityContext = '';
  if (activitySummary && activitySummary.nutrition) {
    const { nutrition, feedback } = activitySummary;
    activityContext = `
Histórico Nutricional Recente (últimos ${activitySummary.range?.days || 14} dias):
- Dias acompanhados: ${nutrition.summary.trackedDays}
- Calorias médias: ${nutrition.summary.averageCalories} kcal
${nutrition.days.length > 0 ? `- Consumo recente: ${nutrition.days.slice(0, 3).map(day => `${new Date(day.date).toLocaleDateString('pt-BR')} (${day.totals.calories} kcal)`).join(', ')}` : ''}

Feedback de Planos Alimentares:
${feedback.recent.length > 0 ? feedback.recent.filter(f => f.planType === 'nutrition' || f.planContext.includes('nutrition')).slice(0, 3).map(f => 
  `- Avaliação: ${f.rating}/5${f.feedbackText ? ` - Comentário: "${f.feedbackText}"` : ''}`
).join('\n') : '- Nenhum feedback registrado'}

Ajustes desejados:
- Se as calorias médias reais estão abaixo da meta, aumente ligeiramente o aporte calórico.
- Evite itens que receberam feedback negativo.
`;
  }

  const customRequestSection = userData.customRequest ? `
Solicitação Específica do Usuário:
${userData.customRequest}
` : '';

  const prompt = `
    Com base nas seguintes informações do usuário, crie um plano alimentar personalizado para um dia:
    
    Informações do usuário:
    - Nome: ${userData.name || 'Não informado'}
    - Idade: ${userData.age || 'Não informada'} anos
    - Peso: ${userData.weight || 'Não informado'} kg
    - Altura: ${userData.height || 'Não informada'} cm
    - Gênero: ${userData.gender || 'Não informado'}
    - Objetivo: ${userData.goal || 'Não informado'}
    - Nível de atividade/treino: ${userData.fitnessLevel || 'Não informado'}
    - Restrições alimentares: ${userData.dietaryRestrictions || 'Nenhuma informada'}
    - Preferências alimentares: ${userData.foodPreferences || 'Nenhuma informada'}
${activityContext}${customRequestSection}
    Metas nutricionais diárias:
    - Calorias: ${nutritionalGoals.calories || 'Não informado'} kcal
    - Proteínas: ${nutritionalGoals.protein || 'Não informado'} g
    - Carboidratos: ${nutritionalGoals.carbs || 'Não informado'} g
    - Gorduras: ${nutritionalGoals.fat || 'Não informado'} g
    
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
      }
    }
    Não inclua nenhum texto fora do JSON.
  `;

  return await callOpenRouter(prompt, AI_MODELS.nutrition, 1500);
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
 * Responde a perguntas do usuário com contexto
 * @param {string} question - A pergunta do usuário
 * @param {Object} userData - Dados do usuário
 * @param {string} context - Contexto adicional (opcional)
 * @returns {Promise<string>} - A resposta à pergunta
 */
async function answerQuestion(question, userData, context = '') {
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
    ${context}
    
    Por favor, responda à pergunta do usuário de forma clara, precisa e útil.
    Seja profissional, encorajador e forneça exemplos quando apropriado.
    Se a pergunta estiver fora do escopo de fitness, nutrição ou saúde, 
    gentilmente informe que está especializado nestas áreas.
  `;

  return await callOpenRouter(prompt, AI_MODELS.general, 1000);
}

module.exports = {
  generateWorkoutPlan,
  generateMealPlan,
  generateHealthAssessment,
  analyzeHealthDocument,
  answerQuestion,
};
