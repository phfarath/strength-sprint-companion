const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auth = require('../middleware/auth');

function calculateMealNutrition(meal) {
  return meal.mealFoods.reduce((totals, mf) => {
    if (mf.food) {
      totals.calories += mf.food.calories * mf.quantity;
      totals.protein += mf.food.protein * mf.quantity;
      totals.carbs += mf.food.carbs * mf.quantity;
      totals.fat += mf.food.fat * mf.quantity;
    }
    return totals;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

function attachNutrition(plan) {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const meals = (plan.meals || []).map(meal => {
    const nutrition = calculateMealNutrition(meal);
    totals.calories += nutrition.calories;
    totals.protein += nutrition.protein;
    totals.carbs += nutrition.carbs;
    totals.fat += nutrition.fat;
    return { ...meal, nutrition };
  });
  const { is_public, raw_response, ...rest } = plan;
  return {
    ...rest,
    rawResponse: raw_response,
    meals,
    isPublic: plan.isPublic ?? is_public ?? false,
    totalNutrition: totals,
  };
}

// Adicione util para mapear foods
function mapFood(dbFood) {
  if (!dbFood) return dbFood;
  const { is_public, ...rest } = dbFood;
  // Se modelo food tiver is_public; se não, mantenha
  return {
    ...rest,
    isPublic: dbFood.isPublic ?? is_public ?? false
  };
}

// Corrigindo a rota GET /foods
router.get('/foods', auth, async (req, res) => {
  try {
    console.log('Buscando alimentos para o usuário ID:', req.user?.id);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Usuário não autenticado ou ID não disponível' });
    }

    let userId = parseInt(req.user.id);
    
    // Verifique se o modelo do seu banco corresponde exatamente a esta consulta
    const foods = await prisma.food.findMany({
      where: {
        OR: [
          { userId: userId },
          { is_public: true } // <- ajustado
        ]
      }
    });
    return res.json(foods.map(mapFood));
  } catch (error) {
    console.error('Erro completo:', error);
    return res.status(500).json({ 
      message: 'Erro ao obter alimentos',
      error: error.toString()
    });
  }
});

// Corrigindo a rota POST /foods
router.post('/foods', auth, async (req, res) => {
  try {
    console.log('Corpo da requisição recebida:', req.body);
    
    const { name, weight, calories, protein, carbs, fat, isPublic } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Nome é obrigatório' });
    }

    const userId = parseInt(req.user.id);
    
    // Garantindo que não haja valores NaN
    const foodData = {
      name,
      weight: parseFloat(weight || 0),
      calories: parseFloat(calories || 0),
      protein: parseFloat(protein || 0),
      carbs: parseFloat(carbs || 0),
      fat: parseFloat(fat || 0),
      is_public: Boolean(isPublic), // <- ajustado
      userId: userId
    };

    console.log('Dados formatados para criar alimento:', foodData);
    
    const food = await prisma.food.create({
      data: foodData
    });
    
    console.log('Alimento criado com sucesso:', food);
    res.status(201).json(mapFood(food));
  } catch (error) {
    console.error('Erro completo ao criar alimento:', error);
    res.status(500).json({ 
      message: 'Erro ao criar alimento',
      error: error.toString()
    });
  }
});

// Adicione também endpoints de atualização e exclusão de alimentos
router.put('/foods/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, weight, calories, protein, carbs, fat, isPublic } = req.body;
    
    // Verificar se o alimento existe e pertence ao usuário
    const existingFood = await prisma.food.findFirst({
      where: {
        id,
        userId: parseInt(req.user.id)
      }
    });
    
    if (!existingFood) {
      return res.status(404).json({ message: 'Alimento não encontrado ou não pertence a este usuário' });
    }
    
    const updatedFood = await prisma.food.update({
      where: { id },
      data: {
        name,
        weight: parseFloat(weight),
        calories: parseFloat(calories || 0),
        protein: parseFloat(protein || 0),
        carbs: parseFloat(carbs || 0),
        fat: parseFloat(fat || 0),
        is_public: Boolean(isPublic) // <- ajustado
      }
    });
    
    res.json(mapFood(updatedFood));
  } catch (error) {
    console.error('Erro ao atualizar alimento:', error);
    res.status(500).json({ message: 'Erro ao atualizar alimento' });
  }
});

router.delete('/foods/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = parseInt(req.user.id);

    const existingFood = await prisma.food.findFirst({
      where: { id, userId }
    });

    if (!existingFood) {
      return res.status(404).json({ message: 'Alimento não encontrado ou não pertence a este usuário' });
    }

    // Remover referências das SUAS refeições primeiro
    await prisma.mealFood.deleteMany({
      where: {
        foodId: id,
        meal: { mealPlan: { userId } }
      }
    });

    // Verificar se ainda há referências (de outros usuários)
    const stillInUse = await prisma.mealFood.count({ where: { foodId: id } });
    if (stillInUse > 0) {
      // Não deletar para não quebrar planos de outros usuários
      return res.status(409).json({
        message: 'Este alimento está sendo utilizado em planos de outros usuários e não pode ser excluído.'
      });
    }

    await prisma.food.delete({ where: { id } });
    return res.json({ message: 'Alimento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir alimento:', error);
    return res.status(500).json({ message: 'Erro ao excluir alimento', error: error.toString() });
  }
});

// Melhorando a rota GET /meal-plans
router.get('/meal-plans', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id);
    
    console.log('Buscando planos alimentares para o usuário:', userId);
    
    const mealPlans = await prisma.mealPlan.findMany({
      where: { userId: userId },
      include: {
        meals: {
          include: {
            mealFoods: {
              include: {
                food: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    console.log(`Encontrados ${mealPlans.length} planos alimentares`);
    const enriched = mealPlans.map(attachNutrition);
    res.json(enriched);
  } catch (error) {
    console.error('Erro completo ao buscar planos alimentares:', error);
    res.status(500).json({ 
      message: 'Erro ao obter planos alimentares',
      error: error.toString()
    });
  }
});

// Planos alimentares públicos
router.get('/meal-plans/public', auth, async (req, res) => {
  try {
    const mealPlans = await prisma.mealPlan.findMany({
      where: { is_public: true },
      include: {
        meals: {
          include: {
            mealFoods: {
              include: {
                food: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    const enriched = mealPlans.map(attachNutrition);
    res.json(enriched);
  } catch (error) {
    console.error('Erro ao buscar planos alimentares públicos:', error);
    res.status(500).json({
      message: 'Erro ao obter planos públicos',
      error: error.toString()
    });
  }
});

// Correção na rota POST /meal-plans

router.post('/meal-plans', auth, async (req, res) => {
  try {
    console.log('Criando plano alimentar, dados recebidos:', JSON.stringify(req.body, null, 2));
    const { name, date, frequency, meals, notes, isPublic, rawResponse } = req.body;
    
    if (!name || !date) {
      return res.status(400).json({ message: 'Nome e data são obrigatórios' });
    }
    
    const userId = parseInt(req.user.id);
    
    // Log detalhado para diagnóstico
    console.log(`Processando ${meals?.length || 0} refeições`);
    
    // Usar transação para garantir consistência
    const mealPlan = await prisma.$transaction(async (tx) => {
      // 1. Criar o plano alimentar
      const plan = await tx.mealPlan.create({
        data: {
          name,
          date,
          frequency: frequency || null,
          notes: notes || null,
          is_public: Boolean(isPublic), // <- ajustado
          raw_response: rawResponse || null,
          userId
        }
      });
      
      console.log(`Plano alimentar criado com ID: ${plan.id}`);
      
      // 2. Para cada refeição, criar explicitamente um registro na tabela meals
      for (const mealData of meals || []) {
        console.log(`Processando refeição: ${mealData.name}`);
        
        // Criar a refeição no banco de dados - SEMPRE criar, mesmo sem alimentos
        const meal = await tx.meal.create({
          data: {
            name: mealData.name || 'Refeição',
            time: mealData.time || null,
            mealPlanId: plan.id
          }
        });
        
        console.log(`Refeição criada com ID: ${meal.id}`);
        
        // Processar alimentos dessa refeição
        if (mealData.foods && mealData.foods.length > 0) {
          for (const foodItem of mealData.foods) {
            try {
              // Converter para número garantido
              const foodId = parseInt(foodItem.foodId.toString().replace('f', ''));
              const servings = parseFloat(foodItem.servings || 1);
              
              if (isNaN(foodId)) {
                console.warn(`ID de alimento inválido: ${foodItem.foodId}`);
                continue;
              }
              
              console.log(`Adicionando alimento ID ${foodId} com ${servings} porções`);
              
              // Verificar se o alimento existe
              const foodExists = await tx.food.findUnique({
                where: { id: foodId }
              });
              
              if (foodExists) {
                await tx.mealFood.create({
                  data: {
                    mealId: meal.id,
                    foodId: foodId,
                    quantity: servings
                  }
                });
              } else {
                console.warn(`Alimento com ID ${foodId} não encontrado`);
              }
            } catch (error) {
              console.error(`Erro ao processar alimento:`, error);
            }
          }
        } else {
          console.log(`Refeição ${meal.id} não possui alimentos`);
        }
      }
      
      // 3. Retornar o plano completo
      return tx.mealPlan.findUnique({
        where: { id: plan.id },
        include: {
          meals: {
            include: {
              mealFoods: {
                include: {
                  food: true
                }
              }
            }
          }
        }
      });
    });
    
    console.log('Plano alimentar criado com sucesso');
    res.status(201).json(attachNutrition(mealPlan));
  } catch (error) {
    console.error('Erro completo ao criar plano alimentar:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Erro ao criar plano alimentar',
      error: error.toString()
    });
  }
});

// Implementar corretamente a rota PUT para atualizar planos alimentares

// Atualizar um plano alimentar
router.put('/meal-plans/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = parseInt(req.user.id);
    const { name, date, frequency, meals, notes, isPublic, rawResponse } = req.body;
    
    console.log(`Tentando atualizar plano alimentar com ID: ${id}`);
    console.log('Dados recebidos:', JSON.stringify(meals, null, 2));
    
    // Verificar se o plano existe e pertence ao usuário
    const existingPlan = await prisma.mealPlan.findFirst({
      where: {
        id,
        userId
      }
    });
    
    if (!existingPlan) {
      return res.status(404).json({ message: 'Plano alimentar não encontrado ou não pertence a este usuário' });
    }

    // Verificar se todos os IDs de alimentos existem no banco de dados
    const foodIds = [];
    meals.forEach(meal => {
      meal.foods?.forEach(food => {
        const foodId = parseInt(food.foodId);
        if (!isNaN(foodId)) {
          foodIds.push(foodId);
        }
      });
    });
    
    // Buscar alimentos existentes
    const existingFoods = await prisma.food.findMany({
      where: {
        id: {
          in: foodIds
        }
      },
      select: { id: true }
    });
    
    const existingFoodIds = existingFoods.map(f => f.id);
    console.log('IDs de alimentos existentes:', existingFoodIds);
    
    // Filtrar apenas alimentos que existem no banco de dados
    const validMeals = meals.map(meal => ({
      ...meal,
      foods: (meal.foods || []).filter(food => {
        const foodId = parseInt(food.foodId);
        return !isNaN(foodId) && existingFoodIds.includes(foodId);
      })
    }));
    
    console.log('Refeições válidas após filtragem:', validMeals.length);
    
    // Primeiro excluir os mealFoods das refeições deste plano
    await prisma.mealFood.deleteMany({
      where: {
        meal: {
          mealPlanId: id
        }
      }
    });

    // Agora sim, excluir as refeições
    await prisma.meal.deleteMany({
      where: {
        mealPlanId: id
      }
    });
    
    // Atualizar o plano alimentar
    const updatedPlan = await prisma.mealPlan.update({
      where: { id },
      data: {
        name,
        date,
        frequency: frequency || null,
        notes: notes || null,
        is_public: Boolean(isPublic),
        ...(rawResponse !== undefined ? { raw_response: rawResponse } : {}),
        meals: {
          create: validMeals.map(meal => ({
            name: meal.name || 'Refeição',
            time: meal.time || null,
            mealFoods: {
              create: (meal.foods || []).map(mealFood => ({
                quantity: parseFloat(mealFood.servings || mealFood.quantity || 0),
                foodId: parseInt(mealFood.foodId)
              }))
            }
          }))
        }
      },
      include: {
        meals: {
          include: {
            mealFoods: {
              include: {
                food: true
              }
            }
          }
        }
      }
    });
    
    console.log('Plano alimentar atualizado com sucesso:', updatedPlan.id);
    res.json(attachNutrition(updatedPlan));
  } catch (error) {
    console.error('Erro detalhado ao atualizar plano:', error);
    res.status(500).json({ 
      message: 'Erro ao atualizar plano alimentar',
      error: error.toString()
    });
  }
});

// Excluir um plano alimentar
router.delete('/meal-plans/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = parseInt(req.user.id);

    // Verificar se o plano existe e pertence ao usuário
    const existingPlan = await prisma.mealPlan.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingPlan) {
      return res.status(404).json({ 
        message: 'Plano alimentar não encontrado ou não pertence a este usuário' 
      });
    }

    // Excluir todos os mealFoods das refeições deste plano
    await prisma.mealFood.deleteMany({
      where: {
        meal: {
          mealPlanId: id
        }
      }
    });

    // Excluir todas as refeições deste plano
    await prisma.meal.deleteMany({
      where: {
        mealPlanId: id
      }
    });

    // Agora sim, excluir o plano alimentar
    await prisma.mealPlan.delete({
      where: { id }
    });

    res.json({ message: 'Plano alimentar excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir plano alimentar:', error);
    res.status(500).json({ 
      message: 'Erro ao excluir plano alimentar',
      error: error.toString()
    });
  }
});

// NOVO: separar listas
router.get('/foods/my', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id);
    // Apenas alimentos privados do usuário (não listar públicos aqui)
    const foods = await prisma.food.findMany({
      where: { userId, is_public: false }
    });
    return res.json(foods.map(mapFood));
  } catch (error) {
    console.error('Erro ao obter meus alimentos:', error);
    return res.status(500).json({ message: 'Erro ao obter meus alimentos' });
  }
});

router.get('/foods/public', auth, async (req, res) => {
  try {
    const foods = await prisma.food.findMany({
      where: { is_public: true }
    });
    return res.json(foods.map(mapFood));
  } catch (error) {
    console.error('Erro ao obter alimentos públicos:', error);
    return res.status(500).json({ message: 'Erro ao obter alimentos públicos' });
  }
});

module.exports = router;
