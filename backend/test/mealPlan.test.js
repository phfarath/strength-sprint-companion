const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'testsecret';

const mockPrisma = {
  $queryRaw: jest.fn().mockResolvedValue([{ test: 1 }]),
  mealPlan: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  meal: {
    create: jest.fn(),
    deleteMany: jest.fn()
  },
  mealFood: {
    create: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn()
  },
  food: {
    findUnique: jest.fn(),
    findMany: jest.fn()
  },
  $transaction: jest.fn(async (cb) => cb(mockPrisma))
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

const app = require('../index');
const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);

describe('Meal Plans API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates a meal plan', async () => {
    mockPrisma.mealPlan.create.mockResolvedValueOnce({ id: 1 });
    mockPrisma.mealPlan.findUnique.mockResolvedValueOnce({ id: 1, name: 'Plan', date: '2024-01-01', meals: [] });

    const res = await request(app)
      .post('/api/nutrition/meal-plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Plan', date: '2024-01-01', meals: [] });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('name', 'Plan');
  });

  test('lists user meal plans', async () => {
    mockPrisma.mealPlan.findMany.mockResolvedValueOnce([{ id: 1, name: 'Plan', date: '2024-01-01', meals: [], is_public: false }]);

    const res = await request(app)
      .get('/api/nutrition/meal-plans')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  test('updates a meal plan', async () => {
    mockPrisma.mealPlan.findFirst.mockResolvedValueOnce({ id: 1, userId: 1 });
    mockPrisma.food.findMany.mockResolvedValueOnce([]);
    mockPrisma.mealPlan.update.mockResolvedValueOnce({ id: 1, name: 'Updated', date: '2024-01-01', meals: [] });
    
    const res = await request(app)
      .put('/api/nutrition/meal-plans/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated', date: '2024-01-01', meals: [] });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'Updated');
  });

  test('deletes a meal plan', async () => {
    mockPrisma.mealPlan.findFirst.mockResolvedValueOnce({ id: 1, userId: 1 });
    mockPrisma.mealPlan.delete.mockResolvedValueOnce({});

    const res = await request(app)
      .delete('/api/nutrition/meal-plans/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
});
