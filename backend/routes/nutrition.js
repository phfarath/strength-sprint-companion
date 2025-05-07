const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get all foods
router.get('/foods', async (req, res) => {
  try {
    const foods = await prisma.food.findMany();
    res.json(foods);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get diet plans for user
router.get('/plans', async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const dietPlans = await prisma.dietPlan.findMany({
      where: { user_id: userId },
      include: {
        meals: {
          include: {
            foods: {
              include: {
                food: true
              }
            }
          }
        }
      }
    });
    
    res.json(dietPlans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create diet plan
router.post('/plans', async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const { title, start_date, end_date, meals } = req.body;
    
    const dietPlan = await prisma.dietPlan.create({
      data: {
        title,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        user: { connect: { id: userId } }
      }
    });
    
    // Add meals to plan if provided
    if (meals && meals.length > 0) {
      for (const meal of meals) {
        await prisma.dietPlanMeal.create({
          data: {
            plan: { connect: { id: dietPlan.id } },
            meal_name: meal.name,
            scheduled_time: meal.time,
            notes: meal.notes
          }
        });
        
        // Add foods to meal if provided
        if (meal.foods && meal.foods.length > 0) {
          for (const food of meal.foods) {
            await prisma.dietPlanFood.create({
              data: {
                plan: { connect: { id: dietPlan.id } },
                meal: { 
                  connect: { 
                    plan_id_meal_name: {
                      plan_id: dietPlan.id,
                      meal_name: meal.name
                    }
                  }
                },
                food: { connect: { id: food.food_id } },
                portion_g: food.portion_g
              }
            });
          }
        }
      }
    }
    
    // Get complete plan with meals and foods
    const completePlan = await prisma.dietPlan.findUnique({
      where: { id: dietPlan.id },
      include: {
        meals: {
          include: {
            foods: {
              include: {
                food: true
              }
            }
          }
        }
      }
    });
    
    res.status(201).json(completePlan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;