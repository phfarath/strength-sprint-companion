const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');
const auth = require('../middleware/auth');
const {
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
  processUnifiedRequest
} = require('../services/aiService');
const { getUserActivitySummary } = require('../services/activitySummaryService');

const parseListField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      if (typeof parsed === 'string') {
        return [parsed];
      }
      if (parsed && typeof parsed === 'object') {
        return Object.values(parsed).map((item) => String(item));
      }
    } catch (error) {
      // Se não for JSON válido, tenta dividir por vírgula
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [String(value)];
};

const formatListField = (value) => {
  const list = parseListField(value);
  if (!list.length) return null;
  return list.join(', ');
};

const dayToIndex = (day) => {
  if (!day) return 0;
  const map = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    domingo: 0,
    segunda: 1,
    terça: 2,
    terca: 2,
    quarta: 3,
    quinta: 4,
    sexta: 5,
    sábado: 6,
    sabado: 6,
  };

  const normalized = String(day).toLowerCase();
  return map[normalized] ?? 0;
};

const normalizeNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  return parsed;
};

const normalizeRestSeconds = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

/**
 * Persiste um plano de treino estruturado na base de dados
 * @param {number} userId
 * @param {Object} planData
 * @param {string} planContext
 * @returns {Promise<Array>} Planos armazenados
 */
const persistAIWorkoutPlan = async (userId, planData, planContext = null) => {
  if (!planData || !Array.isArray(planData?.plan)) {
    return [];
  }

  const createdPlans = [];

  for (const dayPlan of planData.plan) {
    const exercisesData = [];

    if (Array.isArray(dayPlan?.exercises)) {
      for (let i = 0; i < dayPlan.exercises.length; i += 1) {
        const ex = dayPlan.exercises[i];
        if (!ex || !ex.name) {
          continue;
        }

        let exercise = await prisma.exercise.findFirst({
          where: {
            name: ex.name,
            user_id: userId,
          },
        });

        if (!exercise) {
          exercise = await prisma.exercise.create({
            data: {
              name: ex.name,
              muscle_group: ex.muscleGroup || 'unknown',
              user_id: userId,
            },
          });
        }

        exercisesData.push({
          exercise_id: exercise.id,
          sets: normalizeNumber(ex.sets),
          reps: normalizeNumber(ex.reps),
          weight_kg: normalizeNumber(ex.weight_kg || ex.weight),
          rest_seconds: normalizeRestSeconds(ex.rest_seconds || ex.rest),
          order_index: i,
        });
      }
    }

    const storedPlan = await prisma.workoutPlan.create({
      data: {
        name: dayPlan.day || dayPlan.name || 'Treino',
        day_of_week: dayToIndex(dayPlan.day || dayPlan.name),
        notes: dayPlan.notes || null,
        user_id: userId,
        raw_response: JSON.stringify(planData),
        exercises: {
          create: exercisesData,
        },
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
        },
      },
    });

    createdPlans.push(storedPlan);
  }

  return createdPlans;
};

/**
 * Persiste um plano alimentar estruturado na base de dados
 * @param {number} userId
 * @param {Object} planData
 * @param {string} planContext
 * @returns {Promise<Object|null>} Plano armazenado
 */
const persistAIMealPlan = async (userId, planData, planContext = null) => {
  if (!planData || !Array.isArray(planData?.meals)) {
    return null;
  }

  const storedPlan = await prisma.$transaction(async (tx) => {
    const plan = await tx.mealPlan.create({
      data: {
        name: planData.name || 'Plano Alimentar IA',
        date: new Date().toISOString().split('T')[0],
        userId,
        raw_response: JSON.stringify(planData),
      },
    });

    for (const meal of planData.meals) {
      if (!meal?.name) continue;

      const mealRecord = await tx.meal.create({
        data: {
          name: meal.name,
          time: meal.time || null,
          mealPlanId: plan.id,
        },
      });

      if (Array.isArray(meal.items)) {
        for (const item of meal.items) {
          if (!item?.name) continue;

          const food = await tx.food.create({
            data: {
              name: item.name,
              weight: normalizeNumber(item.quantity),
              calories: normalizeNumber(item.calories),
              protein: normalizeNumber(item.protein),
              carbs: normalizeNumber(item.carbs),
              fat: normalizeNumber(item.fat),
              userId,
            },
          });

          await tx.mealFood.create({
            data: {
              mealId: mealRecord.id,
              foodId: food.id,
              quantity: 1,
            },
          });
        }
      }
    }

    return tx.mealPlan.findUnique({
      where: { id: plan.id },
      include: {
        meals: {
          include: {
            mealFoods: {
              include: {
                food: true,
              },
            },
          },
        },
      },
    });
  });

  return storedPlan;
};

/**
 * POST /api/ai/workout-plans
 * Gera um plano de treino personalizado com base nos dados do usuário
 */
router.post('/workout-plans', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);

    // Buscar dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        nutritionGoals: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const age = user.birthdate
      ? Math.floor(
          (new Date() - new Date(user.birthdate)) /
            (365.25 * 24 * 60 * 60 * 1000)
        )
      : null;

    const userData = {
      id: user.id,
      name: user.name,
      age,
      weight: user.weight,
      height: user.height,
      gender: user.gender,
      goal: user.goal,
      fitnessLevel: user.fitnessLevel,
      availableDays: user.availableDays,
      equipment: user.equipment,
      injuries: formatListField(user.injuries) || 'Nenhuma informada',
      preferences: formatListField(user.workoutPreferences) || 'Nenhuma informada',
      dietaryRestrictions: formatListField(user.dietaryRestrictions),
      foodPreferences: formatListField(user.foodPreferences),
      customRequest:
        req.body?.userData?.customRequest ||
        req.body?.customRequest ||
        null,
    };

    const activitySummary = await getUserActivitySummary(prisma, userId, {
      days: req.body?.activitySummary?.range?.days || 14,
    });

    const planContext = req.body?.planContext || `ai-workout-${Date.now()}`;

    const workoutPlanText = await generateWorkoutPlan(userData, {
      activitySummary,
      userId,
      planContext,
      requestSummary: userData.customRequest || req.body?.notes || null,
    });

    let planData;
    try {
      planData = JSON.parse(workoutPlanText);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: 'Resposta da IA não é um JSON válido',
      });
    }

    if (!planData.plan || !Array.isArray(planData.plan)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de plano de treino inválido',
      });
    }

    const dayToIndex = (day) => {
      const map = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
        domingo: 0,
        segunda: 1,
        terça: 2,
        terca: 2,
        quarta: 3,
        quinta: 4,
        sexta: 5,
        sábado: 6,
        sabado: 6,
      };
      return map[day?.toLowerCase?.()] ?? 0;
    };

    const createdPlans = [];

    for (const dayPlan of planData.plan) {
      const exercisesData = [];

      if (Array.isArray(dayPlan.exercises)) {
        for (let i = 0; i < dayPlan.exercises.length; i++) {
          const ex = dayPlan.exercises[i];

          let exercise = await prisma.exercise.findFirst({
            where: {
              name: ex.name,
              user_id: userId,
            },
          });

          if (!exercise) {
            exercise = await prisma.exercise.create({
              data: {
                name: ex.name,
                muscle_group: ex.muscleGroup || 'unknown',
                user_id: userId,
              },
            });
          }

          exercisesData.push({
            exercise_id: exercise.id,
            sets: ex.sets || 0,
            reps: ex.reps || 0,
            weight_kg: ex.weight_kg || 0,
            rest_seconds: ex.rest || null,
            order_index: i,
          });
        }
      }

      const storedPlan = await prisma.workoutPlan.create({
        data: {
          name: dayPlan.day || 'Treino',
          day_of_week: dayToIndex(dayPlan.day),
          notes: dayPlan.notes || null,
          user_id: userId,
          raw_response: JSON.stringify(planData.plan ?? []),
          exercises: { create: exercisesData },
        },
        include: {
          exercises: { include: { exercise: true } },
        },
      });

      createdPlans.push(storedPlan);
    }

    try {
      await saveUserMemory(
        userId,
        'workout',
        userData.customRequest || 'Gerar plano de treino personalizado',
        JSON.stringify(planData),
        { planContext, planType: 'workout' }
      );
    } catch (memoryError) {
      console.error('Erro ao salvar memória de treino:', memoryError);
    }

    res.json({
      success: true,
      workoutPlan: createdPlans,
      activitySummary,
      planContext,
    });
  } catch (error) {
    console.error('Erro ao gerar plano de treino:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar plano de treino',
      error: error.message,
    });
  }
});

/**
 * POST /api/ai/meal-plans
 * Gera um plano alimentar personalizado com base nos dados do usuário
 */
router.post('/meal-plans', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    
    // Buscar dados do usuário e metas nutricionais
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        nutritionGoals: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const age = user.birthdate ? Math.floor((new Date() - new Date(user.birthdate)) / (365.25 * 24 * 60 * 60 * 1000)) : null;
    
    // Preparar dados para a IA
    const userData = {
      id: user.id,
      name: user.name,
      age,
      weight: user.weight,
      height: user.height,
      gender: user.gender,
      goal: user.goal,
      fitnessLevel: user.fitnessLevel,
      dietaryRestrictions: formatListField(user.dietaryRestrictions) || 'Nenhuma informada',
      foodPreferences: formatListField(user.foodPreferences) || 'Nenhuma informada',
      injuries: formatListField(user.injuries),
      workoutPreferences: formatListField(user.workoutPreferences),
      customRequest:
        req.body?.userData?.customRequest ||
        req.body?.customRequest ||
        null,
    };
    
    const nutritionalGoals = req.body?.nutritionalGoals || user.nutritionGoals || {};

    const activitySummary = await getUserActivitySummary(prisma, userId, {
      days: req.body?.activitySummary?.range?.days || 14,
    });

    const planContext = req.body?.planContext || `ai-nutrition-${Date.now()}`;

    const aiResponse = await generateMealPlan(userData, nutritionalGoals, {
      activitySummary,
      userId,
      planContext,
      requestSummary: userData.customRequest || req.body?.notes || null,
    });

    let parsedPlan;
    try {
      parsedPlan = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Erro ao parsear plano alimentar da IA:', parseError);
      return res.status(500).json({
        success: false,
        message: 'Formato de plano alimentar inválido retornado pela IA'
      });
    }

    const storedPlan = await prisma.$transaction(async (tx) => {
      const plan = await tx.mealPlan.create({
        data: {
          name: 'Plano Alimentar IA',
          date: new Date().toISOString().split('T')[0],
          userId,
          raw_response: JSON.stringify(parsedPlan)
        }
      });

      for (const meal of parsedPlan.meals || []) {
        const mealRecord = await tx.meal.create({
          data: {
            name: meal.name,
            time: meal.time || null,
            mealPlanId: plan.id
          }
        });

        for (const item of meal.items || []) {
          const food = await tx.food.create({
            data: {
              name: item.name,
              weight: parseFloat(item.quantity) || 0,
              calories: parseFloat(item.calories) || 0,
              protein: parseFloat(item.protein) || 0,
              carbs: parseFloat(item.carbs) || 0,
              fat: parseFloat(item.fat) || 0,
              userId
            }
          });

          await tx.mealFood.create({
            data: {
              mealId: mealRecord.id,
              foodId: food.id,
              quantity: 1
            }
          });
        }
      }

      return tx.mealPlan.findUnique({
        where: { id: plan.id },
        include: {
          meals: {
            include: {
              mealFoods: {
                include: { food: true }
              }
            }
          }
        }
      });
    });

    try {
      await saveUserMemory(
        userId,
        'nutrition',
        userData.customRequest || 'Gerar plano alimentar personalizado',
        JSON.stringify(parsedPlan),
        { planContext, planType: 'nutrition' }
      );
    } catch (memoryError) {
      console.error('Erro ao salvar memória de nutrição:', memoryError);
    }

    res.json({
      success: true,
      mealPlan: storedPlan,
      activitySummary,
      planContext,
    });
  } catch (error) {
    console.error('Erro ao gerar plano alimentar:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar plano alimentar',
      error: error.message 
    });
  }
});

/**
 * POST /api/ai/nutrition/single-meal
 * Gera uma única refeição personalizada
 */
router.post('/nutrition/single-meal', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const { generateSingleMeal } = require('../services/aiService');
    
    // Buscar dados do usuário e metas nutricionais
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { nutritionGoals: true }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const age = user.birthdate ? Math.floor((new Date() - new Date(user.birthdate)) / (365.25 * 24 * 60 * 60 * 1000)) : null;
    
    const userData = {
      id: user.id,
      name: user.name,
      age,
      weight: user.weight,
      height: user.height,
      gender: user.gender,
      goal: user.goal,
      fitnessLevel: user.fitnessLevel,
      dietaryRestrictions: formatListField(user.dietaryRestrictions) || 'Nenhuma informada',
      foodPreferences: formatListField(user.foodPreferences) || 'Nenhuma informada',
      customRequest: req.body?.customRequest || null,
    };
    
    const nutritionalGoals = req.body?.nutritionalGoals || user.nutritionGoals || {};
    const mealType = req.body?.mealType || 'almoço';
    const planContext = req.body?.planContext || `ai-single-meal-${Date.now()}`;

    const activitySummary = await getUserActivitySummary(prisma, userId, {
      days: req.body?.activitySummary?.range?.days || 14,
    });

    const aiResponse = await generateSingleMeal(userData, nutritionalGoals, {
      mealType,
      activitySummary,
      userId,
      planContext,
      requestSummary: userData.customRequest || req.body?.notes || null,
    });

    let parsedMeal;
    try {
      parsedMeal = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Erro ao parsear refeição da IA:', parseError);
      return res.status(500).json({
        success: false,
        message: 'Formato de refeição inválido retornado pela IA'
      });
    }

    res.json({
      success: true,
      meal: parsedMeal.meal,
      mealSummary: parsedMeal.mealSummary,
      coachingNotes: parsedMeal.coachingNotes,
      planContext,
    });
  } catch (error) {
    console.error('Erro ao gerar refeição:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar refeição',
      error: error.message 
    });
  }
});

/**
 * POST /api/ai/nutrition/program
 * Gera um programa nutricional completo (cutting, bulking, etc.)
 */
router.post('/nutrition/program', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const { generateNutritionProgram } = require('../services/aiService');
    
    // Buscar dados do usuário e metas nutricionais
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { nutritionGoals: true }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const age = user.birthdate ? Math.floor((new Date() - new Date(user.birthdate)) / (365.25 * 24 * 60 * 60 * 1000)) : null;
    
    const userData = {
      id: user.id,
      name: user.name,
      age,
      weight: user.weight,
      height: user.height,
      gender: user.gender,
      goal: user.goal,
      fitnessLevel: user.fitnessLevel,
      dietaryRestrictions: formatListField(user.dietaryRestrictions) || 'Nenhuma informada',
      foodPreferences: formatListField(user.foodPreferences) || 'Nenhuma informada',
      customRequest: req.body?.customRequest || null,
    };
    
    const nutritionalGoals = req.body?.nutritionalGoals || user.nutritionGoals || {};
    const programType = req.body?.programType || 'cutting'; // cutting, bulking, maintenance, recomp
    const duration = req.body?.duration || 8; // weeks
    const planContext = req.body?.planContext || `ai-nutrition-program-${Date.now()}`;

    const activitySummary = await getUserActivitySummary(prisma, userId, {
      days: req.body?.activitySummary?.range?.days || 14,
    });

    const aiResponse = await generateNutritionProgram(userData, nutritionalGoals, {
      programType,
      duration,
      activitySummary,
      userId,
      planContext,
      requestSummary: userData.customRequest || req.body?.notes || null,
    });

    let parsedProgram;
    try {
      parsedProgram = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Erro ao parsear programa nutricional da IA:', parseError);
      return res.status(500).json({
        success: false,
        message: 'Formato de programa inválido retornado pela IA'
      });
    }

    // Save to memory
    try {
      await saveUserMemory(
        userId,
        'nutrition',
        userData.customRequest || `Gerar programa nutricional ${programType} de ${duration} semanas`,
        JSON.stringify(parsedProgram),
        { planContext, planType: 'nutrition-program', programType, duration }
      );
    } catch (memoryError) {
      console.error('Erro ao salvar memória do programa:', memoryError);
    }

    res.json({
      success: true,
      program: parsedProgram,
      planContext,
    });
  } catch (error) {
    console.error('Erro ao gerar programa nutricional:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar programa nutricional',
      error: error.message 
    });
  }
});

/**
 * POST /api/ai/health-assessment
 * Realiza uma avaliação de saúde com base nos dados do usuário
 */
router.post('/health-assessment', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { healthData } = req.body; // Dados de saúde enviados pelo usuário
    
    // Buscar dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Preparar dados para a IA
    const userData = {
      name: user.name,
      age: user.birthdate ? Math.floor((new Date() - new Date(user.birthdate)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
      weight: user.weight,
      height: user.height,
      // Adicione mais campos conforme necessário
    };
    
    // Gerar avaliação de saúde com a IA
    const assessment = await generateHealthAssessment(userData, healthData);
    
    res.json({
      success: true,
      assessment
    });
  } catch (error) {
    console.error('Erro ao gerar avaliação de saúde:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao gerar avaliação de saúde',
      error: error.message 
    });
  }
});

/**
 * POST /api/ai/document-analysis
 * Analisa documentos de saúde do usuário
 */
router.post('/document-analysis', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { documentContent } = req.body; // Conteúdo do documento enviado pelo usuário
    
    // Buscar dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Preparar dados para a IA
    const userData = {
      name: user.name,
      age: user.birthdate ? Math.floor((new Date() - new Date(user.birthdate)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
      weight: user.weight,
      height: user.height,
      // Adicione mais campos conforme necessário
    };
    
    // Analisar documento com a IA
    const analysis = await analyzeHealthDocument(documentContent, userData);
    
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Erro ao analisar documento:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao analisar documento',
      error: error.message 
    });
  }
});

/**
 * POST /api/ai/chat
 * Responde a perguntas do usuário
 */
router.post('/chat', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const { question, context } = req.body;
    
    if (!question) {
      return res.status(400).json({ message: 'Pergunta é obrigatória' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        nutritionGoals: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const userData = {
      name: user.name,
      age: user.birthdate ? Math.floor((new Date() - new Date(user.birthdate)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
      weight: user.weight,
      height: user.height,
      fitnessLevel: user.fitnessLevel || 'intermediário',
      goal: user.goal || 'melhorar a saúde',
    };

    const activitySummary = await getUserActivitySummary(prisma, userId, {
      days: 14,
      maxWorkoutSessions: 10,
      maxNutritionDays: 10,
      maxFeedbackEntries: 8,
    });
    
    const answer = await answerQuestion(question, userData, context, {
      userId,
      activitySummary
    });
    
    res.json({
      success: true,
      answer
    });
  } catch (error) {
    console.error('Erro ao responder pergunta:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao responder pergunta',
      error: error.message 
    });
  }
});

/**
 * POST /api/ai/feedback
 * Recebe feedback do usuário sobre planos gerados pela IA
 */
router.post('/feedback', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const {
      planContext,
      planType,
      planContent,
      rating,
      feedbackText,
    } = req.body || {};

    if (!planContext) {
      return res.status(400).json({ message: 'planContext é obrigatório' });
    }

    const parsedRating = parseInt(rating, 10);
    if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: 'rating deve ser um número entre 1 e 5' });
    }

    let serializedPlanContent = null;
    if (planContent) {
      if (typeof planContent === 'string') {
        serializedPlanContent = planContent.length > 15000 ? planContent.slice(0, 15000) : planContent;
      } else {
        const stringified = JSON.stringify(planContent);
        serializedPlanContent = stringified.length > 15000 ? stringified.slice(0, 15000) : stringified;
      }
    }

    const createdFeedback = await prisma.aIFeedback.create({
      data: {
        userId,
        planContext,
        planType: planType || null,
        planContent: serializedPlanContent,
        rating: parsedRating,
        feedbackText: feedbackText ? feedbackText.trim() : null,
      },
    });

    res.status(201).json({
      success: true,
      feedback: {
        id: createdFeedback.id,
        planContext: createdFeedback.planContext,
        planType: createdFeedback.planType,
        rating: createdFeedback.rating,
        feedbackText: createdFeedback.feedbackText,
        createdAt: createdFeedback.createdAt,
      },
    });
  } catch (error) {
    console.error('Erro ao salvar feedback da IA:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar feedback da IA',
      error: error.message,
    });
  }
});

/**
 * GET /api/ai/feedback
 * Retorna o feedback recente do usuário
 */
router.get('/feedback', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const limitParam = parseInt(req.query.limit, 10);
    const limit = Number.isNaN(limitParam) ? 20 : Math.min(Math.max(limitParam, 1), 50);

    const feedback = await prisma.aIFeedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        planContext: true,
        planType: true,
        rating: true,
        feedbackText: true,
        createdAt: true,
      },
    });

    res.json({ success: true, feedback });
  } catch (error) {
    console.error('Erro ao recuperar feedback da IA:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao recuperar feedback da IA',
      error: error.message,
    });
  }
});

/**
 * GET /api/ai/memory
 * Retorna histórico de conversas do usuário
 */
router.get('/memory', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const mode = req.query.mode || null;
    const limitParam = parseInt(req.query.limit, 10);
    const limit = Number.isNaN(limitParam) ? 10 : Math.min(Math.max(limitParam, 1), 50);

    const memory = await getUserMemory(userId, mode, limit);

    res.json({ success: true, memory });
  } catch (error) {
    console.error('Erro ao recuperar memória:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao recuperar memória',
      error: error.message,
    });
  }
});

/**
 * POST /api/ai/plan-feedback
 * Recebe feedback detalhado sobre um plano
 */
router.post('/plan-feedback', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const {
      planType,
      planReference,
      rating,
      difficultyRating,
      adherence,
      notes,
      improvements,
      metadata,
    } = req.body;

    if (!planType || !['workout', 'nutrition'].includes(planType)) {
      return res.status(400).json({
        message: 'planType é obrigatório e deve ser "workout" ou "nutrition"',
      });
    }

    const serializedMetadata = metadata ? JSON.stringify(metadata) : null;

    const feedback = await prisma.planFeedback.create({
      data: {
        userId,
        planType,
        planReference: planReference || null,
        rating: rating ? parseInt(rating, 10) : null,
        difficultyRating: difficultyRating ? parseInt(difficultyRating, 10) : null,
        adherence: adherence ? parseInt(adherence, 10) : null,
        notes: notes || null,
        improvements: improvements || null,
        metadata: serializedMetadata,
      },
    });

    res.status(201).json({
      success: true,
      feedback,
    });
  } catch (error) {
    console.error('Erro ao salvar feedback do plano:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar feedback do plano',
      error: error.message,
    });
  }
});

/**
 * GET /api/ai/plan-feedback
 * Retorna feedback de planos do usuário
 */
router.get('/plan-feedback', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const planType = req.query.planType || null;
    const limitParam = parseInt(req.query.limit, 10);
    const limit = Number.isNaN(limitParam) ? 10 : Math.min(Math.max(limitParam, 1), 50);

    const whereClause = planType ? { userId, planType } : { userId };

    const feedback = await prisma.planFeedback.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json({ success: true, feedback });
  } catch (error) {
    console.error('Erro ao recuperar feedback do plano:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao recuperar feedback do plano',
      error: error.message,
    });
  }
});

/**
 * POST /api/ai/progress-log
 * Registra um evento de progresso do usuário
 */
router.post('/progress-log', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const { date, logType, category, metric, value, previousValue, notes } = req.body;

    if (!logType || !category) {
      return res.status(400).json({
        message: 'logType e category são obrigatórios',
      });
    }

    const progressLog = await prisma.progressLog.create({
      data: {
        userId,
        date: date ? new Date(date) : new Date(),
        logType,
        category,
        metric: metric || null,
        value: value ? parseFloat(value) : null,
        previousValue: previousValue ? parseFloat(previousValue) : null,
        notes: notes || null,
      },
    });

    res.status(201).json({
      success: true,
      progressLog,
    });
  } catch (error) {
    console.error('Erro ao salvar log de progresso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar log de progresso',
      error: error.message,
    });
  }
});

/**
 * GET /api/ai/progress-log
 * Retorna logs de progresso do usuário
 */
router.get('/progress-log', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const category = req.query.category || null;
    const logType = req.query.logType || null;
    const limitParam = parseInt(req.query.limit, 10);
    const limit = Number.isNaN(limitParam) ? 20 : Math.min(Math.max(limitParam, 1), 100);

    const whereClause = { userId };
    if (category) whereClause.category = category;
    if (logType) whereClause.logType = logType;

    const logs = await prisma.progressLog.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      take: limit,
    });

    res.json({ success: true, logs });
  } catch (error) {
    console.error('Erro ao recuperar logs de progresso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao recuperar logs de progresso',
      error: error.message,
    });
  }
});

/**
 * POST /api/ai/unified
 * Endpoint unificado que detecta intenção e roteia para o handler apropriado
 */
router.post('/unified', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const { message, documentContent } = req.body;
    const normalizedMessage = typeof message === 'string' ? message.trim() : '';
    const intentMessage = normalizedMessage || (documentContent ? 'Analisar documento de saúde fornecido' : '');

    if (!intentMessage) {
      return res.status(400).json({
        success: false,
        message: 'Mensagem é obrigatória'
      });
    }

    // Buscar dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        nutritionGoals: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Preparar dados do usuário
    const age = user.birthdate
      ? Math.floor((new Date() - new Date(user.birthdate)) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    const userData = {
      id: user.id,
      name: user.name,
      age,
      weight: user.weight,
      height: user.height,
      gender: user.gender,
      goal: user.goal,
      fitnessLevel: user.fitnessLevel,
      availableDays: user.availableDays,
      equipment: user.equipment,
      injuries: formatListField(user.injuries) || 'Nenhuma informada',
      preferences: formatListField(user.workoutPreferences) || 'Nenhuma informada',
      dietaryRestrictions: formatListField(user.dietaryRestrictions) || 'Nenhuma informada',
      foodPreferences: formatListField(user.foodPreferences) || 'Nenhuma informada',
    };

    // Buscar resumo de atividades
    const activitySummary = await getUserActivitySummary(prisma, userId, {
      days: 14,
      maxWorkoutSessions: 10,
      maxNutritionDays: 10,
      maxFeedbackEntries: 8,
    });

    // Processar solicitação unificada
    const result = await processUnifiedRequest(intentMessage, userData, {
      activitySummary,
      nutritionalGoals: user.nutritionGoals || {},
      userId,
      documentContent
    });

    const { intent, confidence, extractedContext, response, structuredData, planType, planContext } = result;

    // Salvar dados estruturados se houver
    let savedPlan = null;
    if (structuredData) {
      try {
        if (planType === 'workout') {
          savedPlan = await persistAIWorkoutPlan(userId, structuredData, planContext);
        } else if (planType === 'nutrition') {
          savedPlan = await persistAIMealPlan(userId, structuredData, planContext);
        }
      } catch (saveError) {
        console.error('Erro ao salvar plano estruturado:', saveError);
        // Continue mesmo se falhar ao salvar - usuário ainda recebe a resposta
      }
    }

    // Salvar na memória (chat já é salvo dentro de answerQuestion)
    if (intent !== 'chat') {
      try {
        const memoryPayload = structuredData ? JSON.stringify(structuredData) : response;
        const userMessageForMemory = normalizedMessage || intentMessage;

        await saveUserMemory(
          userId,
          intent,
          userMessageForMemory,
          memoryPayload,
          {
            planContext: planContext || `unified-${Date.now()}`,
            planType: planType || intent,
            intent,
            confidence,
            extractedContext
          }
        );
      } catch (memoryError) {
        console.error('Erro ao salvar memória:', memoryError);
        // Continue mesmo se falhar ao salvar memória
      }
    }

    res.json({
      success: true,
      intent,
      confidence,
      extractedContext,
      response,
      structuredData,
      savedPlan,
      planType,
      planContext,
      activitySummary
    });
  } catch (error) {
    console.error('Erro no endpoint unificado:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar solicitação',
      error: error.message
    });
  }
});

/**
 * GET /api/ai/workout-plans
 * Retorna planos de treino do usuário
 */
router.get('/workout-plans', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const limitParam = parseInt(req.query.limit, 10);
    const limit = Number.isNaN(limitParam) ? 10 : Math.min(Math.max(limitParam, 1), 50);

    const plans = await prisma.workoutPlan.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: { order_index: 'asc' },
        },
      },
    });

    res.json({ success: true, plans });
  } catch (error) {
    console.error('Erro ao recuperar planos de treino:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao recuperar planos de treino',
      error: error.message,
    });
  }
});

/**
 * GET /api/ai/workout-plans/:id
 * Retorna um plano de treino específico
 */
router.get('/workout-plans/:id', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const planId = parseInt(req.params.id, 10);

    if (Number.isNaN(planId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de plano inválido',
      });
    }

    const plan = await prisma.workoutPlan.findFirst({
      where: {
        id: planId,
        user_id: userId,
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: { order_index: 'asc' },
        },
      },
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plano de treino não encontrado',
      });
    }

    res.json({ success: true, plan });
  } catch (error) {
    console.error('Erro ao recuperar plano de treino:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao recuperar plano de treino',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/ai/workout-plans/:id
 * Atualiza um plano de treino existente
 */
router.patch('/workout-plans/:id', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const planId = parseInt(req.params.id, 10);
    const { name, day_of_week, notes, exercises } = req.body;

    if (Number.isNaN(planId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de plano inválido',
      });
    }

    const existingPlan = await prisma.workoutPlan.findFirst({
      where: {
        id: planId,
        user_id: userId,
      },
    });

    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        message: 'Plano de treino não encontrado',
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (day_of_week !== undefined) updateData.day_of_week = parseInt(day_of_week, 10);
    if (notes !== undefined) updateData.notes = notes;

    await prisma.workoutPlan.update({
      where: { id: planId },
      data: updateData,
    });

    if (exercises && Array.isArray(exercises)) {
      await prisma.workoutPlanExercise.deleteMany({
        where: { workout_plan_id: planId },
      });

      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        
        let exercise = await prisma.exercise.findFirst({
          where: {
            name: ex.name,
            user_id: userId,
          },
        });

        if (!exercise) {
          exercise = await prisma.exercise.create({
            data: {
              name: ex.name,
              muscle_group: ex.muscleGroup || ex.muscle_group || 'unknown',
              user_id: userId,
            },
          });
        }

        await prisma.workoutPlanExercise.create({
          data: {
            workout_plan_id: planId,
            exercise_id: exercise.id,
            sets: normalizeNumber(ex.sets),
            reps: normalizeNumber(ex.reps),
            weight_kg: normalizeNumber(ex.weight_kg || ex.weight),
            rest_seconds: normalizeRestSeconds(ex.rest_seconds || ex.rest),
            order_index: i,
          },
        });
      }
    }

    const finalPlan = await prisma.workoutPlan.findUnique({
      where: { id: planId },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: { order_index: 'asc' },
        },
      },
    });

    res.json({ success: true, plan: finalPlan });
  } catch (error) {
    console.error('Erro ao atualizar plano de treino:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar plano de treino',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/ai/workout-plans/:id
 * Remove um plano de treino
 */
router.delete('/workout-plans/:id', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const planId = parseInt(req.params.id, 10);

    if (Number.isNaN(planId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de plano inválido',
      });
    }

    const existingPlan = await prisma.workoutPlan.findFirst({
      where: {
        id: planId,
        user_id: userId,
      },
    });

    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        message: 'Plano de treino não encontrado',
      });
    }

    await prisma.workoutPlanExercise.deleteMany({
      where: { workout_plan_id: planId },
    });

    await prisma.workoutPlan.delete({
      where: { id: planId },
    });

    res.json({ success: true, message: 'Plano de treino removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover plano de treino:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover plano de treino',
      error: error.message,
    });
  }
});

/**
 * GET /api/ai/meal-plans
 * Retorna planos alimentares do usuário
 */
router.get('/meal-plans', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const limitParam = parseInt(req.query.limit, 10);
    const limit = Number.isNaN(limitParam) ? 10 : Math.min(Math.max(limitParam, 1), 50);

    const plans = await prisma.mealPlan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        meals: {
          include: {
            mealFoods: {
              include: {
                food: true,
              },
            },
          },
        },
      },
    });

    res.json({ success: true, plans });
  } catch (error) {
    console.error('Erro ao recuperar planos alimentares:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao recuperar planos alimentares',
      error: error.message,
    });
  }
});

/**
 * GET /api/ai/meal-plans/:id
 * Retorna um plano alimentar específico
 */
router.get('/meal-plans/:id', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const planId = parseInt(req.params.id, 10);

    if (Number.isNaN(planId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de plano inválido',
      });
    }

    const plan = await prisma.mealPlan.findFirst({
      where: {
        id: planId,
        userId,
      },
      include: {
        meals: {
          include: {
            mealFoods: {
              include: {
                food: true,
              },
            },
          },
        },
      },
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plano alimentar não encontrado',
      });
    }

    res.json({ success: true, plan });
  } catch (error) {
    console.error('Erro ao recuperar plano alimentar:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao recuperar plano alimentar',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/ai/meal-plans/:id
 * Atualiza um plano alimentar existente
 */
router.patch('/meal-plans/:id', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const planId = parseInt(req.params.id, 10);
    const { name, date, meals } = req.body;

    if (Number.isNaN(planId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de plano inválido',
      });
    }

    const existingPlan = await prisma.mealPlan.findFirst({
      where: {
        id: planId,
        userId,
      },
    });

    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        message: 'Plano alimentar não encontrado',
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (date !== undefined) updateData.date = date;

    await prisma.mealPlan.update({
      where: { id: planId },
      data: updateData,
    });

    if (meals && Array.isArray(meals)) {
      const existingMeals = await prisma.meal.findMany({
        where: { mealPlanId: planId },
        include: { mealFoods: true },
      });

      for (const existingMeal of existingMeals) {
        await prisma.mealFood.deleteMany({
          where: { mealId: existingMeal.id },
        });
      }

      await prisma.meal.deleteMany({
        where: { mealPlanId: planId },
      });

      for (const meal of meals) {
        const mealRecord = await prisma.meal.create({
          data: {
            name: meal.name,
            time: meal.time || null,
            mealPlanId: planId,
          },
        });

        if (Array.isArray(meal.items)) {
          for (const item of meal.items) {
            const food = await prisma.food.create({
              data: {
                name: item.name,
                weight: normalizeNumber(item.quantity || item.weight),
                calories: normalizeNumber(item.calories),
                protein: normalizeNumber(item.protein),
                carbs: normalizeNumber(item.carbs),
                fat: normalizeNumber(item.fat),
                userId,
              },
            });

            await prisma.mealFood.create({
              data: {
                mealId: mealRecord.id,
                foodId: food.id,
                quantity: 1,
              },
            });
          }
        }
      }
    }

    const finalPlan = await prisma.mealPlan.findUnique({
      where: { id: planId },
      include: {
        meals: {
          include: {
            mealFoods: {
              include: {
                food: true,
              },
            },
          },
        },
      },
    });

    res.json({ success: true, plan: finalPlan });
  } catch (error) {
    console.error('Erro ao atualizar plano alimentar:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar plano alimentar',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/ai/meal-plans/:id
 * Remove um plano alimentar
 */
router.delete('/meal-plans/:id', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const planId = parseInt(req.params.id, 10);

    if (Number.isNaN(planId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de plano inválido',
      });
    }

    const existingPlan = await prisma.mealPlan.findFirst({
      where: {
        id: planId,
        userId,
      },
    });

    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        message: 'Plano alimentar não encontrado',
      });
    }

    const meals = await prisma.meal.findMany({
      where: { mealPlanId: planId },
    });

    for (const meal of meals) {
      await prisma.mealFood.deleteMany({
        where: { mealId: meal.id },
      });
    }

    await prisma.meal.deleteMany({
      where: { mealPlanId: planId },
    });

    await prisma.mealPlan.delete({
      where: { id: planId },
    });

    res.json({ success: true, message: 'Plano alimentar removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover plano alimentar:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover plano alimentar',
      error: error.message,
    });
  }
});

/**
 * GET /api/ai/activity-trends
 * Retorna tendências e análises de atividade do usuário
 */
router.get('/activity-trends', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const daysParam = parseInt(req.query.days, 10);
    const days = Number.isNaN(daysParam) ? 30 : Math.min(Math.max(daysParam, 7), 90);

    const activitySummary = await getUserActivitySummary(prisma, userId, {
      days,
      maxWorkoutSessions: 50,
      maxNutritionDays: 30,
      maxFeedbackEntries: 20,
    });

    const workoutCount = activitySummary.recentWorkoutSessions?.length || 0;
    const avgWorkoutsPerWeek = workoutCount > 0 ? (workoutCount / days) * 7 : 0;

    const nutritionDays = activitySummary.recentNutritionDays?.length || 0;
    const avgNutritionTrackingPerWeek = nutritionDays > 0 ? (nutritionDays / days) * 7 : 0;

    const feedbackCount = activitySummary.recentFeedback?.length || 0;
    const avgFeedbackRating = feedbackCount > 0
      ? activitySummary.recentFeedback.reduce((sum, fb) => sum + (fb.rating || 0), 0) / feedbackCount
      : 0;

    const workoutPlansCount = await prisma.workoutPlan.count({
      where: { user_id: userId },
    });

    const mealPlansCount = await prisma.mealPlan.count({
      where: { userId },
    });

    const trends = {
      period: {
        days,
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      },
      workouts: {
        totalSessions: workoutCount,
        avgPerWeek: avgWorkoutsPerWeek.toFixed(1),
        totalPlans: workoutPlansCount,
      },
      nutrition: {
        totalDaysTracked: nutritionDays,
        avgTrackingPerWeek: avgNutritionTrackingPerWeek.toFixed(1),
        totalMealPlans: mealPlansCount,
      },
      feedback: {
        totalEntries: feedbackCount,
        avgRating: avgFeedbackRating.toFixed(1),
      },
      activitySummary,
    };

    res.json({ success: true, trends });
  } catch (error) {
    console.error('Erro ao gerar tendências de atividade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar tendências de atividade',
      error: error.message,
    });
  }
});

/**
 * POST /api/ai/workout-plans/:id/feedback
 * Adiciona feedback específico a um plano de treino
 */
router.post('/workout-plans/:id/feedback', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const planId = parseInt(req.params.id, 10);
    const { rating, difficultyRating, adherence, notes, improvements } = req.body;

    if (Number.isNaN(planId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de plano inválido',
      });
    }

    const existingPlan = await prisma.workoutPlan.findFirst({
      where: {
        id: planId,
        user_id: userId,
      },
    });

    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        message: 'Plano de treino não encontrado',
      });
    }

    const feedback = await prisma.planFeedback.create({
      data: {
        userId,
        planType: 'workout',
        planReference: planId.toString(),
        rating: rating ? parseInt(rating, 10) : null,
        difficultyRating: difficultyRating ? parseInt(difficultyRating, 10) : null,
        adherence: adherence ? parseInt(adherence, 10) : null,
        notes: notes || null,
        improvements: improvements || null,
        metadata: JSON.stringify({ workoutPlanId: planId }),
      },
    });

    res.status(201).json({ success: true, feedback });
  } catch (error) {
    console.error('Erro ao adicionar feedback ao plano de treino:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar feedback ao plano de treino',
      error: error.message,
    });
  }
});

/**
 * POST /api/ai/meal-plans/:id/feedback
 * Adiciona feedback específico a um plano alimentar
 */
router.post('/meal-plans/:id/feedback', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10);
    const planId = parseInt(req.params.id, 10);
    const { rating, difficultyRating, adherence, notes, improvements } = req.body;

    if (Number.isNaN(planId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de plano inválido',
      });
    }

    const existingPlan = await prisma.mealPlan.findFirst({
      where: {
        id: planId,
        userId,
      },
    });

    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        message: 'Plano alimentar não encontrado',
      });
    }

    const feedback = await prisma.planFeedback.create({
      data: {
        userId,
        planType: 'nutrition',
        planReference: planId.toString(),
        rating: rating ? parseInt(rating, 10) : null,
        difficultyRating: difficultyRating ? parseInt(difficultyRating, 10) : null,
        adherence: adherence ? parseInt(adherence, 10) : null,
        notes: notes || null,
        improvements: improvements || null,
        metadata: JSON.stringify({ mealPlanId: planId }),
      },
    });

    res.status(201).json({ success: true, feedback });
  } catch (error) {
    console.error('Erro ao adicionar feedback ao plano alimentar:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar feedback ao plano alimentar',
      error: error.message,
    });
  }
});

module.exports = router;
