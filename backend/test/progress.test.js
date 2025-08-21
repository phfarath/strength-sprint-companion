const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'testsecret';

const mockPrisma = {
  $queryRaw: jest.fn().mockResolvedValue([{ test: 1 }]),
  workoutSession: {
    findMany: jest.fn()
  },
  foodDiary: {
    findMany: jest.fn()
  },
  deviceData: {
    create: jest.fn()
  }
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

const app = require('../index');
const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);

describe('Progress API', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns workout sessions', async () => {
    mockPrisma.workoutSession.findMany.mockResolvedValueOnce([{ id: 1 }]);
    const res = await request(app)
      .get('/api/progress/workout')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  test('rejects nutrition diary without auth', async () => {
    const res = await request(app).get('/api/progress/nutrition');
    expect(res.statusCode).toBe(401);
  });

  test('rejects device data without auth', async () => {
    const res = await request(app)
      .post('/api/progress/device')
      .send({ date: '2024-01-01', steps: 1000 });
    expect(res.statusCode).toBe(401);
  });
});
