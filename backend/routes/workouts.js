const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/workouts/plans - Buscar planos de treino do usuário
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
          },
          orderBy: { order_index: 'asc' }
        }
      },
      orderBy: { day_of_week: 'asc' }
    });
    
    // Transformar para formato do frontend
    const transformedPlans = workoutPlans.map(plan => ({
      id: plan.id.toString(),
      name: plan.name,
      dayOfWeek: plan.day_of_week,
      notes: plan.notes,
      isPublic: plan.is_public,
      rawResponse: plan.raw_response,
      exercises: plan.exercises.map(pe => ({
        id: pe.exercise.id.toString(),
        name: pe.exercise.name,
        muscleGroup: pe.exercise.muscle_group,
        sets: pe.sets,
        reps: pe.reps,
        weight: pe.weight_kg,
        restSeconds: pe.rest_seconds,
        notes: pe.notes
      }))
    }));
    
    res.json(transformedPlans);
  } catch (error) {
    console.error('Erro ao buscar planos de treino:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/workouts/plans - Criar plano de treino
router.post('/plans', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const { name, dayOfWeek, exercises, notes, isPublic, rawResponse } = req.body;
    
    const workoutPlan = await prisma.$transaction(async (tx) => {
      // 1. Criar o plano
      const plan = await tx.workoutPlan.create({
        data: {
          name,
          day_of_week: dayOfWeek,
          notes: notes || null,
          is_public: Boolean(isPublic),
          user_id: userId,
          raw_response: rawResponse || null
        }
      });
      
      // 2. Adicionar exercícios ao plano
      if (exercises && exercises.length > 0) {
        for (let i = 0; i < exercises.length; i++) {
          const ex = exercises[i];
          await tx.workoutPlanExercise.create({
            data: {
              workout_plan_id: plan.id,
              exercise_id: parseInt(ex.id),
              sets: ex.sets,
              reps: ex.reps,
              weight_kg: ex.weight,
              rest_seconds: ex.restSeconds || null,
              notes: ex.notes || null,
              order_index: i
            }
          });
        }
      }
      
      // 3. Buscar plano completo
      return await tx.workoutPlan.findUnique({
        where: { id: plan.id },
        include: {
          exercises: {
            include: {
              exercise: true
            },
            orderBy: { order_index: 'asc' }
          }
        }
      });
    });
    
    // Transformar para formato do frontend
    const transformed = {
      id: workoutPlan.id.toString(),
      name: workoutPlan.name,
      dayOfWeek: workoutPlan.day_of_week,
      notes: workoutPlan.notes,
      isPublic: workoutPlan.is_public,
      rawResponse: workoutPlan.raw_response,
      exercises: workoutPlan.exercises.map(pe => ({
        id: pe.exercise.id.toString(),
        name: pe.exercise.name,
        muscleGroup: pe.exercise.muscle_group,
        sets: pe.sets,
        reps: pe.reps,
        weight: pe.weight_kg,
        restSeconds: pe.rest_seconds,
        notes: pe.notes
      }))
    };
    
    res.status(201).json(transformed);
  } catch (error) {
    console.error('Erro ao criar plano de treino:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/workouts/plans/:id - Atualizar plano de treino
router.put('/plans/:id', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const planId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const { name, dayOfWeek, exercises, notes, isPublic, rawResponse } = req.body;
    
    const updatedPlan = await prisma.$transaction(async (tx) => {
      // Verificar se o plano pertence ao usuário
      const existingPlan = await tx.workoutPlan.findFirst({
        where: { id: planId, user_id: userId }
      });
      
      if (!existingPlan) {
        throw new Error('Plano não encontrado');
      }
      
      // 1. Atualizar o plano
      const plan = await tx.workoutPlan.update({
        where: { id: planId },
        data: {
          name,
          day_of_week: dayOfWeek,
          notes: notes || null,
          is_public: Boolean(isPublic),
          ...(rawResponse !== undefined ? { raw_response: rawResponse } : {})
        }
      });
      
      // 2. Remover exercícios antigos
      await tx.workoutPlanExercise.deleteMany({
        where: { workout_plan_id: planId }
      });
      
      // 3. Adicionar novos exercícios
      if (exercises && exercises.length > 0) {
        for (let i = 0; i < exercises.length; i++) {
          const ex = exercises[i];
          await tx.workoutPlanExercise.create({
            data: {
              workout_plan_id: plan.id,
              exercise_id: parseInt(ex.id),
              sets: ex.sets,
              reps: ex.reps,
              weight_kg: ex.weight,
              rest_seconds: ex.restSeconds || null,
              notes: ex.notes || null,
              order_index: i
            }
          });
        }
      }
      
      // 4. Buscar plano completo
      return await tx.workoutPlan.findUnique({
        where: { id: plan.id },
        include: {
          exercises: {
            include: {
              exercise: true
            },
            orderBy: { order_index: 'asc' }
          }
        }
      });
    });
    
    // Transformar para formato do frontend
    const transformed = {
      id: updatedPlan.id.toString(),
      name: updatedPlan.name,
      dayOfWeek: updatedPlan.day_of_week,
      notes: updatedPlan.notes,
      isPublic: updatedPlan.is_public,
      rawResponse: updatedPlan.raw_response,
      exercises: updatedPlan.exercises.map(pe => ({
        id: pe.exercise.id.toString(),
        name: pe.exercise.name,
        muscleGroup: pe.exercise.muscle_group,
        sets: pe.sets,
        reps: pe.reps,
        weight: pe.weight_kg,
        restSeconds: pe.rest_seconds,
        notes: pe.notes
      }))
    };
    
    res.json(transformed);
  } catch (error) {
    console.error('Erro ao atualizar plano de treino:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/workouts/plans/:id - Excluir plano de treino
router.delete('/plans/:id', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const planId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Verificar se o plano pertence ao usuário
    const existingPlan = await prisma.workoutPlan.findFirst({
      where: { id: planId, user_id: userId }
    });
    
    if (!existingPlan) {
      return res.status(404).json({ message: 'Plano não encontrado' });
    }
    
    // Excluir plano (exercícios são excluídos em cascata)
    await prisma.workoutPlan.delete({
      where: { id: planId }
    });
    
    res.json({ message: 'Plano excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir plano de treino:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/workouts/sessions - Buscar sessões de treino do usuário
router.get('/sessions', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const sessions = await prisma.workoutSession.findMany({
      where: { user_id: userId },
      include: {
        exercises: {
          include: {
            exercise: true
          }
        },
        workout_plan: true
      },
      orderBy: { date: 'desc' }
    });
    
    // Transformar para formato do frontend
    const transformedSessions = sessions.map(session => ({
      id: session.id.toString(),
      date: session.date.toISOString().split('T')[0],
      workoutPlanId: session.workout_plan_id?.toString() || null,
      completed: !!session.completed_at,
      notes: session.notes,
      exercises: session.exercises.map(se => ({
        exerciseId: se.exercise.id.toString(),
        actualSets: se.actual_sets,
        actualReps: se.actual_reps,
        actualWeight: se.actual_weight_kg,
        notes: se.comments
      }))
    }));
    
    res.json(transformedSessions);
  } catch (error) {
    console.error('Erro ao buscar sessões de treino:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/workouts/sessions - Registrar sessão de treino
router.post('/sessions', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const { date, workoutPlanId, completed, exercises, notes } = req.body;
    
    const session = await prisma.$transaction(async (tx) => {
      // 1. Criar sessão
      const newSession = await tx.workoutSession.create({
        data: {
          date: new Date(date),
          completed_at: completed ? new Date() : null,
          notes: notes || null,
          user_id: userId,
          workout_plan_id: workoutPlanId ? parseInt(workoutPlanId) : null
        }
      });
      
      // 2. Adicionar exercícios da sessão
      if (exercises && exercises.length > 0) {
        for (const ex of exercises) {
          await tx.workoutSessionExercise.create({
            data: {
              session_id: newSession.id,
              exercise_id: parseInt(ex.exerciseId),
              actual_sets: ex.actualSets,
              actual_reps: ex.actualReps,
              actual_weight_kg: ex.actualWeight,
              comments: ex.notes || null
            }
          });
        }
      }
      
      // 3. Buscar sessão completa
      return await tx.workoutSession.findUnique({
        where: { id: newSession.id },
        include: {
          exercises: {
            include: {
              exercise: true
            }
          }
        }
      });
    });
    
    // Transformar para formato do frontend
    const transformed = {
      id: session.id.toString(),
      date: session.date.toISOString().split('T')[0],
      workoutPlanId: session.workout_plan_id?.toString() || null,
      completed: !!session.completed_at,
      notes: session.notes,
      exercises: session.exercises.map(se => ({
        exerciseId: se.exercise.id.toString(),
        actualSets: se.actual_sets,
        actualReps: se.actual_reps,
        actualWeight: se.actual_weight_kg,
        notes: se.comments
      }))
    };
    
    res.status(201).json(transformed);
  } catch (error) {
    console.error('Erro ao registrar sessão de treino:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/workouts/exercises - Buscar exercícios disponíveis
router.get('/exercises', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Buscar exercícios públicos + exercícios do usuário
    const exercises = await prisma.exercise.findMany({
      where: {
        OR: [
          { is_public: true },
          { user_id: userId }
        ]
      },
      orderBy: [
        { is_public: 'desc' }, // Públicos primeiro
        { name: 'asc' }
      ]
    });
    
    // Transformar para formato do frontend
    const transformed = exercises.map(ex => ({
      id: ex.id.toString(),
      name: ex.name,
      muscleGroup: ex.muscle_group,
      equipment: ex.equipment,
      instructions: ex.instructions,
      isPublic: ex.is_public
    }));
    
    res.json(transformed);
  } catch (error) {
    console.error('Erro ao buscar exercícios:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/workouts/exercises - Criar exercício personalizado
router.post('/exercises', auth, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, muscleGroup, equipment, instructions } = req.body;

    // Verificar se já existe um exercício com mesmo nome, grupo muscular e usuário
    const existingExercise = await prisma.exercise.findFirst({
      where: {
        name: name.trim(),
        muscle_group: muscleGroup.trim(),
        user_id: userId
      }
    });

    if (existingExercise) {
      return res.status(409).json({
        message: 'Já existe um exercício com este nome e grupo muscular para este usuário'
      });
    }

    const exercise = await prisma.exercise.create({
      data: {
        name: name.trim(),
        muscle_group: muscleGroup.trim(),
        equipment: equipment || null,
        instructions: instructions || null,
        user_id: userId,
        is_public: false
      }
    });

    const transformed = {
      id: exercise.id.toString(),
      name: exercise.name,
      muscleGroup: exercise.muscle_group,
      equipment: exercise.equipment,
      instructions: exercise.instructions,
      isPublic: exercise.is_public
    };

    res.status(201).json(transformed);
  } catch (error) {
    console.error('Erro ao criar exercício:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/workouts/exercises/public - Buscar apenas exercícios públicos
router.get('/exercises/public', auth, async (req, res) => {
  try {
    const exercises = await prisma.exercise.findMany({
      where: { is_public: true },
      orderBy: { name: 'asc' }
    });

    const transformed = exercises.map(ex => ({
      id: ex.id.toString(),
      name: ex.name,
      muscleGroup: ex.muscle_group,
      equipment: ex.equipment,
      instructions: ex.instructions,
      isPublic: ex.is_public
    }));

    res.json(transformed);
  } catch (error) {
    console.error('Erro ao buscar exercícios públicos:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/workouts/plans/public - Buscar treinos públicos
router.get('/plans/public', auth, async (req, res) => {
  try {
    const publicPlans = await prisma.workoutPlan.findMany({
      where: { is_public: true },
      include: {
        exercises: {
          include: {
            exercise: true
          },
          orderBy: { order_index: 'asc' }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Transformar para formato do frontend
    const transformedPlans = publicPlans.map(plan => ({
      id: plan.id.toString(),
      name: plan.name,
      dayOfWeek: plan.day_of_week,
      notes: plan.notes,
      isPublic: plan.is_public,
      rawResponse: plan.raw_response,
      exercises: plan.exercises.map(pe => ({
        id: pe.exercise.id.toString(),
        name: pe.exercise.name,
        muscleGroup: pe.exercise.muscle_group,
        sets: pe.sets,
        reps: pe.reps,
        weight: pe.weight_kg,
        restSeconds: pe.rest_seconds,
        notes: pe.notes
      }))
    }));

    res.json(transformedPlans);
  } catch (error) {
    console.error('Erro ao buscar treinos públicos:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
