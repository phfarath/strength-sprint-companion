const request = require('supertest');

const mockPrisma = {
  $queryRaw: jest.fn().mockResolvedValue([{ test: 1 }]),
  exercise: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  }
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

const app = require('../index');

describe('Exercises API', () => {
  beforeEach(() => jest.clearAllMocks());

  test('lists exercises', async () => {
    mockPrisma.exercise.findMany.mockResolvedValueOnce([{ id: 1, name: 'Squat' }]);
    const res = await request(app).get('/api/exercises');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  test('gets exercise by id', async () => {
    mockPrisma.exercise.findUnique.mockResolvedValueOnce({ id: 1, name: 'Squat' });
    const res = await request(app).get('/api/exercises/1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'Squat');
  });

  test('returns 404 for missing exercise', async () => {
    mockPrisma.exercise.findUnique.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/exercises/999');
    expect(res.statusCode).toBe(404);
  });

  test('creates exercise', async () => {
    mockPrisma.exercise.create.mockResolvedValueOnce({ id: 1, name: 'Squat' });
    const res = await request(app)
      .post('/api/exercises')
      .send({ name: 'Squat', muscle_group: 'Legs', description: 'desc' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('name', 'Squat');
  });

  test('updates exercise', async () => {
    mockPrisma.exercise.update.mockResolvedValueOnce({ id: 1, name: 'New' });
    const res = await request(app)
      .put('/api/exercises/1')
      .send({ name: 'New', muscle_group: 'Legs', description: 'desc' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'New');
  });
});
