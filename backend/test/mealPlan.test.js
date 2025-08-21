const request = require('supertest');
const app = require('../index');

describe('MealPlan API', () => {
  let token = '';

  beforeAll(async () => {
    // Crie um usuário de teste (ou garanta que ele exista)
    await request(app)
      .post('/api/users/register')
      .send({
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'testpassword'
      });

    // Faça login para obter o token
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: 'testuser@example.com',
        password: 'testpassword'
      });

    console.log('LOGIN RESPONSE:', loginRes.body);

    token = loginRes.body.token;
    expect(token).toBeDefined();
  });

  it('deve criar um novo plano alimentar', async () => {
    const response = await request(app)
      .post('/api/nutrition/meal-plans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Plano Teste',
        date: '2025-08-21',
        frequency: 'diario',
        notes: 'Plano de teste automatizado',
        meals: []
      });
    expect(response.statusCode).toBe(201); // <-- altere para 201
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Plano Teste');
  });

  it('deve buscar planos alimentares', async () => {
    const response = await request(app)
      .get('/api/nutrition/meal-plans')
      .set('Authorization', `Bearer ${token}`);
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});