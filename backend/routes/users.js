const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth'); // Importe o middleware de autenticação

const prisma = new PrismaClient();

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
    
    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: hashedPassword
      }
    });
    
    // Gerar JWT
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
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
    
    // Log detalhado para depuração
    console.log('Dados do usuário sendo enviados:', JSON.stringify(user, null, 2));
    
    // Retorna o usuário formatado corretamente
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      weight: user.weight,
      height: user.height,
      birthdate: user.birthdate,
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
    const { name, weight, height, birthdate } = req.body;
    
    console.log("Dados recebidos para atualização:", req.body);
    console.log("ID do usuário:", userId);
    
    // Verificar se o usuário existe
    const userExists = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });
    
    if (!userExists) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Converter tipos apropriadamente
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        name,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        birthdate: birthdate || null
      }
    });
    
    console.log("Usuário atualizado com sucesso:", updatedUser);
    
    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      weight: updatedUser.weight,
      height: updatedUser.height,
      birthdate: updatedUser.birthdate,
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
    
    console.log("Dados de metas recebidos:", { calories, protein, carbs, fat });
    console.log("ID do usuário:", userId);
    
    // Converter para os tipos corretos
    const nutritionData = {
      calories: parseInt(calories),
      protein: parseInt(protein), 
      carbs: parseInt(carbs),
      fat: parseInt(fat)
    };
    
    // Verifique se já existem metas nutricionais
    let nutritionGoals = await prisma.nutritionGoals.findUnique({
      where: { userId }
    });
    
    if (nutritionGoals) {
      // Atualizar metas existentes
      nutritionGoals = await prisma.nutritionGoals.update({
        where: { userId },
        data: nutritionData
      });
    } else {
      // Criar novas metas
      nutritionGoals = await prisma.nutritionGoals.create({
        data: {
          userId,
          ...nutritionData
        }
      });
    }
    
    console.log("Metas nutricionais atualizadas:", nutritionGoals);
    res.json(nutritionGoals);
  } catch (error) {
    console.error('Erro ao atualizar metas nutricionais:', error.message);
    console.error('Stack trace:', error.stack);
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

module.exports = router;