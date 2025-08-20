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
      age: user.birthdate ? Math.floor((new Date() - new Date(user.birthdate)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
      weight: user.weight,
      height: user.height,
      // Adicione mais campos conforme necessário
    };
    
    // Gerar plano de treino com a IA
    const workoutPlan = await generateWorkoutPlan(userData);
    
    res.json({
      success: true,
      workoutPlan
    });
  } catch (error) {
    console.error('Erro ao gerar plano de treino:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao gerar plano de treino',
      error: error.message 
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
    const mealPlan = await generateMealPlan(userData, nutritionalGoals);
    
    res.json({
      success: true,
      mealPlan
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
