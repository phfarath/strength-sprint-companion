const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'testsecret';

const mockPrisma = {
  $queryRaw: jest.fn().mockResolvedValue([{ test: 1 }]),
  food: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  mealFood: {
    deleteMany: jest.fn(),
    count: jest.fn()
  }
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

const app = require('../index');

const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);

describe('Foods API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates a food', async () => {
    mockPrisma.food.create.mockResolvedValueOnce({ id: 1, name: 'Apple' });
    const res = await request(app)
      .post('/api/nutrition/foods')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Apple' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('name', 'Apple');
  });

  test('fails to create food without name', async () => {
    const res = await request(app)
      .post('/api/nutrition/foods')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.statusCode).toBe(400);
  });

  test('lists my foods', async () => {
    mockPrisma.food.findMany.mockResolvedValueOnce([{ id: 1, name: 'Apple', is_public: false }]);
    const res = await request(app)
      .get('/api/nutrition/foods/my')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  test('updates a food', async () => {
    mockPrisma.food.findFirst.mockResolvedValueOnce({ id: 1, userId: 1 });
    mockPrisma.food.update.mockResolvedValueOnce({ id: 1, name: 'Updated' });
    const res = await request(app)
      .put('/api/nutrition/foods/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'Updated');
  });

  test('returns 404 when deleting missing food', async () => {
    mockPrisma.food.findFirst.mockResolvedValueOnce(null);
    const res = await request(app)
      .delete('/api/nutrition/foods/1')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });
});
