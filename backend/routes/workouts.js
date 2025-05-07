const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth'); // Importe o middleware

const prisma = new PrismaClient();

// Adicione o middleware auth às rotas protegidas
router.get('/plans', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const workoutPlans = await prisma.workoutPlan.findMany({
      where: { user_id: userId },
      include: {
        exercises: {
          include: {
            exercise: true
          }
        }
      }
    });
    
    res.json(workoutPlans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/plans', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const { title, start_date, end_date, exercises } = req.body;
    
    const workoutPlan = await prisma.workoutPlan.create({
      data: {
        title,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        user: { connect: { id: userId } }
      }
    });
    
    // Add exercises to plan if provided
    if (exercises && exercises.length > 0) {
      for (const ex of exercises) {
        await prisma.workoutPlanExercise.create({
          data: {
            plan: { connect: { id: workoutPlan.id } },
            exercise: { connect: { id: ex.exercise_id } },
            day_of_week: ex.day_of_week,
            sets: ex.sets,
            reps: ex.reps,
            load_kg: ex.load_kg,
            notes: ex.notes
          }
        });
      }
    }
    
    // Get complete plan with exercises
    const completePlan = await prisma.workoutPlan.findUnique({
      where: { id: workoutPlan.id },
      include: {
        exercises: {
          include: {
            exercise: true
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

// Log workout session
router.post('/sessions', async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const { date, completed_at, notes, exercises } = req.body;
    
    const session = await prisma.workoutSession.create({
      data: {
        date: new Date(date),
        completed_at: completed_at ? new Date(completed_at) : null,
        notes,
        user: { connect: { id: userId } }
      }
    });
    
    // Add exercises to session if provided
    if (exercises && exercises.length > 0) {
      for (const ex of exercises) {
        await prisma.workoutSessionExercise.create({
          data: {
            session: { connect: { id: session.id } },
            exercise: { connect: { id: ex.exercise_id } },
            actual_sets: ex.actual_sets,
            actual_reps: ex.actual_reps,
            actual_load_kg: ex.actual_load_kg,
            comments: ex.comments
          }
        });
      }
    }
    
    // Get complete session with exercises
    const completeSession = await prisma.workoutSession.findUnique({
      where: { id: session.id },
      include: {
        exercises: {
          include: {
            exercise: true
          }
        }
      }
    });
    
    res.status(201).json(completeSession);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;