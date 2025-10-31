const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const crypto = require('crypto');
const { getUserActivitySummary } = require('../services/activitySummaryService');

const DEFAULT_NUTRITION_GOALS = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fat: 70
};

const parseNumericField = (
  value,
  fieldName,
  { integer = false, allowNull = true, required = false, min } = {}
) => {
  if (value === undefined) {
    if (required) {
      throw new Error(`O campo ${fieldName} é obrigatório e deve ser numérico.`);
    }
    return undefined;
  }

  if (value === null || value === '') {
    if (!allowNull) {
      throw new Error(`O campo ${fieldName} é obrigatório e deve ser numérico.`);
    }
    return null;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    throw new Error(`O campo ${fieldName} deve ser um número válido.`);
  }

  if (integer && !Number.isInteger(numericValue)) {
    throw new Error(`O campo ${fieldName} deve ser um número inteiro.`);
  }

  if (min !== undefined && numericValue < min) {
    throw new Error(`O campo ${fieldName} deve ser maior ou igual a ${min}.`);
  }

  return numericValue;
};

// Rota de registro
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Log dos dados recebidos (sem a senha)
    console.log(`Tentando registrar usuário: ${name}, ${email}`);

    // Verifica se todas as tabelas necessárias existem
    try {
      const tables = await prisma.$queryRaw`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      `;
      console.log('Tabelas no banco antes de verificar usuário:', tables);
    } catch (error) {
      console.error('Erro ao verificar tabelas:', error);
    }

    // Use tryCatch específico para a verificação de usuário
    let existingUser = null;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email }
      });
      console.log('Resultado da verificação de usuário:', existingUser ? 'Encontrado' : 'Não encontrado');
    } catch (error) {
      console.error('Erro específico ao buscar usuário:', error);
      return res.status(500).json({ 
        message: 'Erro ao verificar usuário existente', 
        error: error.message,
        details: 'Possível problema com a tabela users'
      });
    }
    
    if (existingUser) {
      return res.status(400).json({ message: 'Este email já está em uso' });
    }
    
    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: hashedPassword
      }
    });

    let nutritionGoalsRecord;
    try {
      nutritionGoalsRecord = await prisma.nutritionGoals.create({
        data: {
          userId: user.id,
          ...DEFAULT_NUTRITION_GOALS,
        }
      });
    } catch (goalError) {
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
      throw goalError;
    }
    
    // Gerar JWT
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    const normalizedGoals = nutritionGoalsRecord
      ? {
          calories: nutritionGoalsRecord.calories,
          protein: nutritionGoalsRecord.protein,
          carbs: nutritionGoalsRecord.carbs,
          fat: nutritionGoalsRecord.fat,
        }
      : { ...DEFAULT_NUTRITION_GOALS };

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        nutritionGoals: normalizedGoals
      }
    });
  } catch (error) {
    console.error('Erro ao registrar:', error);
    res.status(500).json({ message: 'Erro no servidor: ' + error.message });
  }
});

// Rota de login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Encontrar usuário
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }
    
    // Verificar senha
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }
    
    // Gerar JWT
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Rota para obter perfil do usuário (PROTEGIDA)
router.get('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Busca o usuário incluindo suas metas nutricionais
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        nutritionGoals: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Retorna o usuário formatado corretamente
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      weight: user.weight,
      height: user.height,
      birthdate: user.birthdate,
      gender: user.gender,
      fitnessLevel: user.fitnessLevel,
      goal: user.goal,
      availableDays: user.availableDays,
      equipment: user.equipment,
      injuries: user.injuries,
      workoutPreferences: user.workoutPreferences,
      dietaryRestrictions: user.dietaryRestrictions,
      foodPreferences: user.foodPreferences,
      nutritionGoals: user.nutritionGoals ? {
        calories: user.nutritionGoals.calories,
        protein: user.nutritionGoals.protein,
        carbs: user.nutritionGoals.carbs,
        fat: user.nutritionGoals.fat
      } : null
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Rota para atualizar perfil do usuário
router.put('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      name, 
      weight, 
      height, 
      birthdate,
      gender,
      fitnessLevel,
      goal,
      availableDays,
      equipment,
      injuries,
      workoutPreferences,
      dietaryRestrictions,
      foodPreferences
    } = req.body;
    
    // Verificar se o usuário existe
    const userExists = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });
    
    if (!userExists) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    let updateData = {};

    try {
      if (name !== undefined) updateData.name = name;

      const weightValue = parseNumericField(weight, 'weight', { allowNull: true, min: 0 });
      if (weightValue !== undefined) updateData.weight = weightValue;

      const heightValue = parseNumericField(height, 'height', { allowNull: true, min: 0 });
      if (heightValue !== undefined) updateData.height = heightValue;

      if (birthdate !== undefined) {
        updateData.birthdate = birthdate || null;
      }

      if (gender !== undefined) updateData.gender = gender;
      if (fitnessLevel !== undefined) updateData.fitnessLevel = fitnessLevel;
      if (goal !== undefined) updateData.goal = goal;

      const availableDaysValue = parseNumericField(availableDays, 'availableDays', {
        integer: true,
        allowNull: true,
        min: 0,
      });
      if (availableDaysValue !== undefined) updateData.availableDays = availableDaysValue;

      if (equipment !== undefined) updateData.equipment = equipment;
      if (injuries !== undefined) updateData.injuries = injuries;
      if (workoutPreferences !== undefined) updateData.workoutPreferences = workoutPreferences;
      if (dietaryRestrictions !== undefined) updateData.dietaryRestrictions = dietaryRestrictions;
      if (foodPreferences !== undefined) updateData.foodPreferences = foodPreferences;
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: updateData
    });
    
    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      weight: updatedUser.weight,
      height: updatedUser.height,
      birthdate: updatedUser.birthdate,
      gender: updatedUser.gender,
      fitnessLevel: updatedUser.fitnessLevel,
      goal: updatedUser.goal,
      availableDays: updatedUser.availableDays,
      equipment: updatedUser.equipment,
      injuries: updatedUser.injuries,
      workoutPreferences: updatedUser.workoutPreferences,
      dietaryRestrictions: updatedUser.dietaryRestrictions,
      foodPreferences: updatedUser.foodPreferences,
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Erro no servidor ao atualizar perfil', 
      error: error.message 
    });
  }
});

// Rota para atualizar metas nutricionais
router.put('/profile/nutrition-goals', auth, async (req, res) => {
  try {
    const userId = parseInt(req.user.id);
    const { calories, protein, carbs, fat } = req.body;

    if (Number.isNaN(userId)) {
      return res.status(400).json({ message: 'Usuário inválido' });
    }
    
    let nutritionData;
    try {
      nutritionData = {
        calories: parseNumericField(calories, 'calories', {
          integer: true,
          required: true,
          min: 0,
        }),
        protein: parseNumericField(protein, 'protein', {
          integer: true,
          required: true,
          min: 0,
        }),
        carbs: parseNumericField(carbs, 'carbs', {
          integer: true,
          required: true,
          min: 0,
        }),
        fat: parseNumericField(fat, 'fat', { integer: true, required: true, min: 0 }),
      };
    } catch (validationError) {
      return res.status(400).json({ message: validationError.message });
    }
    
    let nutritionGoals = await prisma.nutritionGoals.findUnique({
      where: { userId }
    });
    
    if (nutritionGoals) {
      nutritionGoals = await prisma.nutritionGoals.update({
        where: { userId },
        data: nutritionData
      });
    } else {
      nutritionGoals = await prisma.nutritionGoals.create({
        data: {
          userId,
          ...nutritionData
        }
      });
    }
    
    res.json(nutritionGoals);
  } catch (error) {
    console.error('Erro ao atualizar metas nutricionais:', error.message);
    res.status(500).json({ 
      message: 'Erro no servidor ao atualizar metas',
      error: error.message 
    });
  }
});

// POST /api/users/feedback - Enviar feedback do usuário
router.post('/feedback', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { name, email, message, feedbackType, rating } = req.body;
    
    if (!message || !feedbackType) {
      return res.status(400).json({ 
        message: 'Mensagem e tipo de feedback são obrigatórios' 
      });
    }
    
    // Mapear feedbackType para sentiment numérico
    const sentimentMap = {
      'positive': 1,
      'neutral': 0, 
      'negative': -1
    };
    
    const feedback = await prisma.userFeedback.create({
      data: {
        user_id: userId || null,
        name: name || null,
        email: email || null,
        rating: rating || null,
        sentiment: sentimentMap[feedbackType],
        comment: message
      }
    });
    
    res.status(201).json({
      id: feedback.id,
      message: 'Feedback enviado com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao salvar feedback:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/users/feedback - Buscar feedbacks do usuário (opcional)
router.get('/feedback', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const feedbacks = await prisma.userFeedback.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        rating: true,
        sentiment: true,
        comment: true,
        created_at: true
      }
    });
    
    res.json(feedbacks);
  } catch (error) {
    console.error('Erro ao buscar feedbacks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id/activity-summary - Resumo das atividades do usuário
router.get('/:id/activity-summary', auth, async (req, res) => {
  try {
    const requestedId = parseInt(req.params.id, 10);
    const authenticatedId = parseInt(req.user?.id, 10);

    if (Number.isNaN(requestedId)) {
      return res.status(400).json({ message: 'ID de usuário inválido' });
    }

    if (requestedId !== authenticatedId) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const daysParam = req.query.days ? parseInt(req.query.days, 10) : null;
    const days = daysParam && daysParam > 0 && daysParam <= 60 ? daysParam : 14;

    const summary = await getUserActivitySummary(prisma, authenticatedId, { days });

    res.json(summary);
  } catch (error) {
    console.error('Erro ao obter resumo de atividades:', error);
    res.status(500).json({ message: 'Erro ao obter resumo de atividades' });
  }
});

// Login com Google
router.post('/google-login', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'Token do Google ausente' });
    }

    // Verificar token do Google
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name || email;
    if (!email) {
      return res.status(400).json({ message: 'Não foi possível obter email do Google' });
    }

    // Encontrar ou criar usuário
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Gera uma senha aleatória para satisfazer constraint de NOT NULL (se existir)
      const randomPassword = crypto.randomUUID();
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await prisma.user.create({
        data: {
          name,
          email,
          password_hash: hashedPassword
        }
      });
    }

    // Gerar JWT
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Erro no login com Google:', error);
    return res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;