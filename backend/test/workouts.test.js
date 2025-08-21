const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'testsecret';

const mockPlan = { id: 1, name: 'Plan', day_of_week: 'monday', notes: null, exercises: [] };

const mockPrisma = {
  $queryRaw: jest.fn().mockResolvedValue([{ test: 1 }]),
  workoutPlan: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  workoutPlanExercise: {
    create: jest.fn(),
    deleteMany: jest.fn()
  },
  $transaction: jest.fn(async (cb) => cb(mockPrisma))
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

const app = require('../index');
const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);

describe('Workout Plans API', () => {
  beforeEach(() => jest.clearAllMocks());

  test('creates a workout plan', async () => {
    mockPrisma.workoutPlan.create.mockResolvedValueOnce(mockPlan);
    mockPrisma.workoutPlan.findUnique.mockResolvedValueOnce(mockPlan);

    const res = await request(app)
      .post('/api/workouts/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Plan', dayOfWeek: 'monday', exercises: [] });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('name', 'Plan');
  });

  test('lists workout plans', async () => {
    mockPrisma.workoutPlan.findMany.mockResolvedValueOnce([mockPlan]);
    const res = await request(app)
      .get('/api/workouts/plans')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  test('updates a workout plan', async () => {
    mockPrisma.workoutPlan.findFirst.mockResolvedValueOnce(mockPlan);
    mockPrisma.workoutPlan.update.mockResolvedValueOnce({ ...mockPlan, name: 'Updated' });
    mockPrisma.workoutPlan.findUnique.mockResolvedValueOnce({ ...mockPlan, name: 'Updated' });

    const res = await request(app)
      .put('/api/workouts/plans/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated', dayOfWeek: 'monday', exercises: [] });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'Updated');
  });

  test('deletes a workout plan', async () => {
    mockPrisma.workoutPlan.findFirst.mockResolvedValueOnce(mockPlan);
    mockPrisma.workoutPlan.delete.mockResolvedValueOnce({});

    const res = await request(app)
      .delete('/api/workouts/plans/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  test('returns 404 when deleting missing plan', async () => {
    mockPrisma.workoutPlan.findFirst.mockResolvedValueOnce(null);
    const res = await request(app)
      .delete('/api/workouts/plans/1')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });
});
