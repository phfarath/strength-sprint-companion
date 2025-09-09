const request = require('supertest');
const jwt = require('jsonwebtoken');

// Define secret used by auth middleware
process.env.JWT_SECRET = 'testsecret';

// Mock PrismaClient to avoid real database connections
const mockUser = {
  id: 1,
  name: 'AI Tester',
  weight: 80,
  height: 180,
  birthdate: '1990-01-01',
  nutritionGoals: { calories: 2000, protein: 150, carbs: 250, fat: 70 }
};
const mockPrisma = {
  $queryRaw: jest.fn().mockResolvedValue([{ test: 1 }]),
  user: { findUnique: jest.fn().mockResolvedValue(mockUser) },

  mealPlan: {
    create: jest.fn().mockResolvedValue({ id: 1 }),
    findUnique: jest
      .fn()
      .mockResolvedValue({ id: 1, name: 'Plano Alimentar IA', date: '2024-01-01', meals: [] })
  },
  meal: { create: jest.fn().mockResolvedValue({ id: 1 }) },
  food: { create: jest.fn().mockResolvedValue({ id: 1 }) },
  mealFood: { create: jest.fn().mockResolvedValue({}) },
  $transaction: jest.fn(async (cb) => cb(mockPrisma))
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

// Mock AI service functions
jest.mock('../services/aiService', () => ({
  generateWorkoutPlan: jest.fn().mockResolvedValue({ plan: 'workout' }),
  generateMealPlan: jest
    .fn()
    .mockResolvedValue(
      JSON.stringify({
        meals: [
          {
            name: 'Café da manhã',
            items: [
              { name: 'Ovos', quantity: 2, calories: 150, protein: 12, carbs: 1, fat: 10 }
            ]
          }
        ]
      })
    ),
  generateHealthAssessment: jest.fn().mockResolvedValue({ status: 'ok' }),
  analyzeHealthDocument: jest.fn().mockResolvedValue({ summary: 'analysis' }),
  answerQuestion: jest.fn().mockResolvedValue('answer')
}));

const app = require('../index');

describe('AI API', () => {
  const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);

  test('deve gerar um plano de treino com IA', async () => {
    const res = await request(app)
      .post('/api/ai/workout-plans')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('workoutPlan');
  });

  test('deve gerar um plano alimentar com IA', async () => {
    const res = await request(app)
      .post('/api/ai/meal-plans')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('mealPlan');
  });

  test('deve gerar uma avaliação de saúde', async () => {
    const res = await request(app)
      .post('/api/ai/health-assessment')
      .set('Authorization', `Bearer ${token}`)
      .send({ healthData: {} });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('assessment');
  });

  test('deve analisar um documento de saúde', async () => {
    const res = await request(app)
      .post('/api/ai/document-analysis')
      .set('Authorization', `Bearer ${token}`)
      .send({ documentContent: 'doc' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('analysis');
  });

  test('deve responder uma pergunta no chat', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ question: 'Oi?' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('answer');
  });
});
