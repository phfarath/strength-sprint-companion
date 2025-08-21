const request = require('supertest');
const app = require('../index');

describe('AI API', () => {
  let token = '';

  beforeAll(async () => {
    // Crie usuário e faça login, igual ao mealPlan.test.js
    await request(app)
      .post('/api/users/register')
      .send({
        name: 'AI Test User',
        email: 'aiuser@example.com',
        password: 'testpassword'
      });

    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        email: 'aiuser@example.com',
        password: 'testpassword'
      });

    token = loginRes.body.token;
  });

  it('deve gerar um plano de treino com IA', async () => {
    const response = await request(app)
      .post('/api/ai/workout-plans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        age: 30,
        weight: 80,
        height: 180,
        goal: 'hipertrofia'
      });
    expect([200, 201]).toContain(response.statusCode);
    expect(response.body).toHaveProperty('workoutPlan');
  });
});