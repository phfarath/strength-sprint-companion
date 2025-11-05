/**
 * Script de Verificação das Implementações da Sprint 1
 * 
 * Este script verifica se todos os endpoints da Sprint 1 estão
 * devidamente implementados no backend.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando Implementações da Sprint 1...\n');

// Ler o arquivo de rotas
const routesPath = path.join(__dirname, '../routes/ai.js');
const routesContent = fs.readFileSync(routesPath, 'utf8');

// Endpoints esperados da Sprint 1
const expectedEndpoints = {
  'Gestão de Workout Plans': [
    { method: 'GET', path: "router.get('/workout-plans'", name: 'Listar workout plans' },
    { method: 'GET', path: "router.get('/workout-plans/:id'", name: 'Obter workout plan específico' },
    { method: 'PATCH', path: "router.patch('/workout-plans/:id'", name: 'Atualizar workout plan' },
    { method: 'DELETE', path: "router.delete('/workout-plans/:id'", name: 'Remover workout plan' },
  ],
  'Gestão de Meal Plans': [
    { method: 'GET', path: "router.get('/meal-plans'", name: 'Listar meal plans' },
    { method: 'GET', path: "router.get('/meal-plans/:id'", name: 'Obter meal plan específico' },
    { method: 'PATCH', path: "router.patch('/meal-plans/:id'", name: 'Atualizar meal plan' },
    { method: 'DELETE', path: "router.delete('/meal-plans/:id'", name: 'Remover meal plan' },
  ],
  'Feedback de Planos': [
    { method: 'POST', path: "router.post('/workout-plans/:id/feedback'", name: 'Feedback de workout plan' },
    { method: 'POST', path: "router.post('/meal-plans/:id/feedback'", name: 'Feedback de meal plan' },
  ],
  'Dashboard de Tendências': [
    { method: 'GET', path: "router.get('/activity-trends'", name: 'Tendências de atividade' },
  ]
};

let allImplemented = true;
let totalEndpoints = 0;
let implementedEndpoints = 0;

// Verificar cada categoria
for (const [category, endpoints] of Object.entries(expectedEndpoints)) {
  console.log(`\n📋 ${category}`);
  console.log('─'.repeat(50));
  
  for (const endpoint of endpoints) {
    totalEndpoints++;
    const isImplemented = routesContent.includes(endpoint.path);
    
    if (isImplemented) {
      implementedEndpoints++;
      console.log(`✅ ${endpoint.method.padEnd(6)} ${endpoint.name}`);
    } else {
      allImplemented = false;
      console.log(`❌ ${endpoint.method.padEnd(6)} ${endpoint.name}`);
    }
  }
}

// Verificar features importantes
console.log('\n\n🔧 Verificando Features Importantes');
console.log('─'.repeat(50));

const features = [
  { name: 'Middleware de autenticação (auth)', check: /auth,.*async.*\(req, res\)/g.test(routesContent) },
  { name: 'Validação de userId', check: routesContent.includes('parseInt(req.user.id, 10)') },
  { name: 'Validação de propriedade do usuário', check: routesContent.includes('user_id: userId') },
  { name: 'Paginação com limite', check: routesContent.includes('Math.min(Math.max(limitParam, 1), 50)') },
  { name: 'Ordenação por data (desc)', check: routesContent.includes("orderBy: { created_at: 'desc' }") },
  { name: 'Include de relacionamentos', check: routesContent.includes('include: {') },
  { name: 'Tratamento de erros 404', check: routesContent.includes('res.status(404)') },
  { name: 'Transações do Prisma', check: routesContent.includes('prisma.$transaction') },
  { name: 'Validação de ID numérico', check: routesContent.includes('Number.isNaN(planId)') },
  { name: 'Remoção em cascata', check: routesContent.includes('deleteMany') },
];

let featuresImplemented = 0;
for (const feature of features) {
  if (feature.check) {
    featuresImplemented++;
    console.log(`✅ ${feature.name}`);
  } else {
    console.log(`❌ ${feature.name}`);
  }
}

// Verificar estrutura de resposta
console.log('\n\n📦 Verificando Estruturas de Resposta');
console.log('─'.repeat(50));

const responseStructures = [
  { name: 'Success flag', check: routesContent.includes("success: true") },
  { name: 'Error messages', check: routesContent.includes("success: false") },
  { name: 'Status codes corretos', check: routesContent.includes('res.status(201)') },
  { name: 'JSON responses', check: routesContent.includes('res.json') },
];

let responsesCorrect = 0;
for (const structure of responseStructures) {
  if (structure.check) {
    responsesCorrect++;
    console.log(`✅ ${structure.name}`);
  } else {
    console.log(`❌ ${structure.name}`);
  }
}

// Resumo final
console.log('\n\n' + '='.repeat(50));
console.log('📊 RESUMO DA VERIFICAÇÃO');
console.log('='.repeat(50));

console.log(`\n📍 Endpoints:`);
console.log(`   Total: ${totalEndpoints}`);
console.log(`   Implementados: ${implementedEndpoints}`);
console.log(`   Taxa: ${((implementedEndpoints / totalEndpoints) * 100).toFixed(1)}%`);

console.log(`\n🔧 Features:`);
console.log(`   Total: ${features.length}`);
console.log(`   Implementadas: ${featuresImplemented}`);
console.log(`   Taxa: ${((featuresImplemented / features.length) * 100).toFixed(1)}%`);

console.log(`\n📦 Estruturas de Resposta:`);
console.log(`   Total: ${responseStructures.length}`);
console.log(`   Corretas: ${responsesCorrect}`);
console.log(`   Taxa: ${((responsesCorrect / responseStructures.length) * 100).toFixed(1)}%`);

const overallScore = ((implementedEndpoints / totalEndpoints) + 
                     (featuresImplemented / features.length) + 
                     (responsesCorrect / responseStructures.length)) / 3 * 100;

console.log(`\n📈 Score Geral: ${overallScore.toFixed(1)}%`);

if (allImplemented && featuresImplemented === features.length) {
  console.log('\n✅ TODAS AS IMPLEMENTAÇÕES DA SPRINT 1 ESTÃO COMPLETAS!\n');
  process.exit(0);
} else {
  console.log('\n⚠️  ALGUMAS IMPLEMENTAÇÕES ESTÃO FALTANDO\n');
  process.exit(1);
}
