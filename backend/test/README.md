# Backend Tests - StrengthSprint Companion

## Estrutura de Testes

```
backend/test/
├── README.md                          # Este arquivo
├── SPRINT1_TEST_DOCUMENTATION.md      # Documentação detalhada dos testes da Sprint 1
├── setup.js                           # Configuração global de testes
├── ai.test.js                         # Testes de endpoints de IA (geração de planos)
├── sprint1-features.test.js           # Testes das features da Sprint 1
├── exercicies.test.js                 # Testes de exercícios
├── foods.test.js                      # Testes de alimentos
├── mealPlan.test.js                   # Testes de planos alimentares
├── progress.test.js                   # Testes de progresso
├── users.test.js                      # Testes de usuários
└── workouts.test.js                   # Testes de treinos
```

## Comandos Disponíveis

### Executar Todos os Testes
```bash
npm test
```

### Executar Testes Específicos
```bash
# Testes da Sprint 1
npm test sprint1-features.test.js

# Testes de IA
npm test ai.test.js

# Testes de usuários
npm test users.test.js
```

### Executar com Cobertura
```bash
npm run test:coverage
```

### Modo Watch (desenvolvimento)
```bash
npm run test:watch
```

### Executar com Logs Detalhados
```bash
VERBOSE_TESTS=1 npm test
```

## Configuração de Testes

### Jest Configuration (jest.config.js)
```javascript
{
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js']
}
```

### Variáveis de Ambiente
Os testes usam as seguintes variáveis de ambiente:
- `NODE_ENV=test` - Ativa modo de teste
- `JWT_SECRET=testsecret` - Secret para tokens JWT
- `PORT=3001` - Porta alternativa para testes
- `VERBOSE_TESTS=1` - (Opcional) Ativa logs detalhados

## Escrevendo Novos Testes

### Template Básico

```javascript
const request = require('supertest');
const jwt = require('jsonwebtoken');

// Definir secret
process.env.JWT_SECRET = 'testsecret';

// Mock do Prisma
const mockPrisma = {
  // Suas implementações mock
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));

const app = require('../index');

describe('Feature Name', () => {
  const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);

  test('deve fazer algo específico', async () => {
    const res = await request(app)
      .get('/api/endpoint')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });
});
```

### Boas Práticas

1. **Use Mocks Apropriados**
   - Mock do Prisma para evitar conexão com banco
   - Mock de serviços externos (AI, email, etc.)

2. **Teste Casos Positivos e Negativos**
   ```javascript
   test('deve criar recurso com dados válidos', async () => {
     // Teste de sucesso
   });

   test('deve retornar 400 com dados inválidos', async () => {
     // Teste de erro
   });

   test('deve retornar 404 para recurso inexistente', async () => {
     // Teste de não encontrado
   });

   test('deve retornar 401 sem autenticação', async () => {
     // Teste de autorização
   });
   ```

3. **Organize por Feature**
   - Um arquivo de teste por rota ou feature
   - Use `describe` para agrupar testes relacionados

4. **Limpe Mocks Após Cada Teste**
   - Feito automaticamente no setup.js
   - Use `jest.clearAllMocks()` se necessário

5. **Valide Estrutura Completa**
   ```javascript
   expect(res.body).toHaveProperty('success', true);
   expect(res.body).toHaveProperty('data');
   expect(Array.isArray(res.body.data)).toBe(true);
   ```

## Testes da Sprint 1

A Sprint 1 implementou três features principais:

### 1. Gestão Completa de Planos
- CRUD completo de workout plans
- CRUD completo de meal plans
- Paginação e filtros
- Validação de propriedade

### 2. Feedback Específico de Planos
- Feedback detalhado para workout plans
- Feedback detalhado para meal plans
- Rating, dificuldade, aderência

### 3. Dashboard de Tendências
- Métricas agregadas de atividade
- Período configurável (7-90 dias)
- Médias calculadas automaticamente

Ver [SPRINT1_TEST_DOCUMENTATION.md](./SPRINT1_TEST_DOCUMENTATION.md) para detalhes completos.

## Estatísticas dos Testes

### Cobertura Atual (todos os testes)
- **Total de Testes:** 65+
- **Test Suites:** 8
- **Taxa de Sucesso:** ~94%

### Sprint 1 Específica
- **Total de Testes:** 33
- **Taxa de Sucesso:** 100% ✅

## Mocking Strategies

### Prisma Client Mock
```javascript
const mockPrisma = {
  user: {
    findUnique: jest.fn().mockResolvedValue(mockUser)
  },
  workoutPlan: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue(mockPlan)
  }
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma)
}));
```

### Dynamic Mocks
```javascript
// Para retornar dados baseados no input
create: jest.fn().mockImplementation((data) => 
  Promise.resolve({ id: 1, ...data.data })
)
```

### Conditional Mocks
```javascript
// Para simular diferentes cenários
findFirst: jest.fn().mockImplementation((query) => {
  if (query.where.id === 999) {
    return Promise.resolve(null); // Not found
  }
  return Promise.resolve(mockData);
})
```

## Debugging Testes

### Ver Logs Completos
```bash
VERBOSE_TESTS=1 npm test
```

### Executar Teste Único
```bash
npm test -- -t "nome do teste específico"
```

### Ver Cobertura Detalhada
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

### Debug com Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Continuous Integration

Os testes são executados automaticamente em:
- Commits no branch de desenvolvimento
- Pull Requests
- Deploy para staging/production

### GitHub Actions Example
```yaml
- name: Run Backend Tests
  run: |
    cd backend
    npm test
```

## Troubleshooting

### Erro: "process.exit called with 1"
**Causa:** O servidor tenta conectar ao banco em test environment.
**Solução:** Verificar que `NODE_ENV=test` está configurado no setup.js

### Erro: "Port already in use"
**Causa:** Servidor já está rodando na porta.
**Solução:** O index.js não deve iniciar o servidor em modo test.

### Erro: "Cannot find module"
**Causa:** Dependências não instaladas.
**Solução:** `npm install` no diretório backend

### Testes Intermitentes
**Causa:** Mocks não resetados entre testes.
**Solução:** Usar `jest.clearAllMocks()` em `afterEach`

## Recursos Adicionais

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)

## Contribuindo

Ao adicionar novas features:
1. ✅ Escreva testes primeiro (TDD)
2. ✅ Cubra casos positivos e negativos
3. ✅ Valide autenticação/autorização
4. ✅ Documente edge cases
5. ✅ Mantenha cobertura > 80%

## Contato

Para dúvidas sobre os testes, consulte a documentação ou abra uma issue.
