const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'testsecret';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn().mockResolvedValue(true)
}));

const mockPrisma = {
  $queryRaw: jest.fn().mockResolvedValue([{ test: 1 }]),
  user: {
    findUnique: jest.fn(),
    create: jest.fn()
  },
  nutritionGoals: {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn()
  },
  userFeedback: {
    create: jest.fn(),
    findMany: jest.fn()
  }
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

const app = require('../index');

describe('Users API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('registers a new user', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    mockPrisma.user.create.mockResolvedValueOnce({ id: 1, name: 'Test', email: 'test@example.com' });

    const res = await request(app)
      .post('/api/users/register')
      .send({ name: 'Test', email: 'test@example.com', password: 'pass123' });

    expect(res.statusCode).toBe(201);
    expect(mockPrisma.user.create).toHaveBeenCalled();
    expect(res.body).toHaveProperty('token');
  });

  test('fails to register duplicate user', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 1 });

    const res = await request(app)
      .post('/api/users/register')
      .send({ name: 'Test', email: 'test@example.com', password: 'pass123' });

    expect(res.statusCode).toBe(400);
  });

  test('logs in existing user', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 1, name: 'Test', email: 'test@example.com', password_hash: 'hashed' });

    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'test@example.com', password: 'pass123' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('rejects login with wrong password', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 1, email: 'test@example.com', password_hash: 'hashed' });
    const bcrypt = require('bcrypt');
    bcrypt.compare.mockResolvedValueOnce(false);

    const res = await request(app)
      .post('/api/users/login')
      .send({ email: 'test@example.com', password: 'wrong' });

    expect(res.statusCode).toBe(400);
  });

  test('returns user profile', async () => {
    const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 1,
      name: 'Test',
      email: 'test@example.com',
      weight: 70,
      height: 180,
      birthdate: '1990-01-01',
      nutritionGoals: { calories: 2000, protein: 150, carbs: 250, fat: 70 }
    });

    const res = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email', 'test@example.com');
  });
});
