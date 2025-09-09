const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const {
  generateWorkoutPlan,
  generateMealPlan,
  generateHealthAssessment,
  analyzeHealthDocument,
  answerQuestion
} = require('../services/aiService');

const prisma = new PrismaClient();

/**
 * POST /api/ai/workout-plans
 * Gera um plano de treino personalizado com base nos dados do usuário
 */
router.post('/workout-plans', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        nutritionGoals: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Preparar dados para a IA
    const userData = {
      name: user.name,
      age: user.birthdate
        ? Math.floor(
            (new Date() - new Date(user.birthdate)) /
              (365.25 * 24 * 60 * 60 * 1000)
          )
        : null,
      weight: user.weight,
      height: user.height,
      // Adicione mais campos conforme necessário
    };

    // Gerar plano de treino com a IA
    const workoutPlanText = await generateWorkoutPlan(userData);

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
      };
      return map[day?.toLowerCase()] ?? 0;
    };

    const createdPlans = [];

    for (const dayPlan of planData.plan) {
      const exercisesData = [];

      if (Array.isArray(dayPlan.exercises)) {
        for (let i = 0; i < dayPlan.exercises.length; i++) {
          const ex = dayPlan.exercises[i];

          let exercise = await prisma.exercise.findFirst({
            where: { name: ex.name }
          });

          if (!exercise) {
            exercise = await prisma.exercise.create({
              data: {
                name: ex.name,
                muscle_group: ex.muscleGroup || 'unknown',
                user_id: parseInt(userId),
              }
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
          user_id: parseInt(userId),
          exercises: { create: exercisesData },
        },
        include: {
          exercises: { include: { exercise: true } },
        },
      });

      createdPlans.push(storedPlan);
    }

    res.json({
      success: true,
      workoutPlan: createdPlans,
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
    const userId = req.user.id;
    
    // Buscar dados do usuário e metas nutricionais
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        nutritionGoals: true
      }
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
    
    const nutritionalGoals = user.nutritionGoals || {};

    // Gerar plano alimentar com a IA
    const aiResponse = await generateMealPlan(userData, nutritionalGoals);

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
          userId: parseInt(userId)
        }
      });

      for (const meal of parsedPlan.meals || []) {
        const mealRecord = await tx.meal.create({
          data: {
            name: meal.name,
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
              userId: parseInt(userId)
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

    res.json({
      success: true,
      mealPlan: storedPlan
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
    const userId = req.user.id;
    const { question, context } = req.body; // Pergunta e contexto enviados pelo usuário
    
    if (!question) {
      return res.status(400).json({ message: 'Pergunta é obrigatória' });
    }
    
    // Buscar dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        nutritionGoals: true
      }
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
      fitnessLevel: 'intermediário', // Valor padrão, ajuste conforme necessário
      goal: 'melhorar a saúde', // Valor padrão, ajuste conforme necessário
      // Adicione mais campos conforme necessário
    };
    
    // Responder pergunta com a IA
    const answer = await answerQuestion(question, userData, context);
    
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

module.exports = router;
