const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
const PORT = process.env.PORT || 5000;

// Testar conexão com o banco no início do servidor
async function testDatabaseConnection() {
  try {
    // Tentar uma consulta simples
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Conexão com banco de dados bem-sucedida:', result);
    
    // Verificar tabelas existentes
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `;
    console.log('📋 Tabelas existentes no banco:', tables);
    
  } catch (error) {
    console.error('❌ ERRO NA CONEXÃO COM O BANCO DE DADOS:', error);
    process.exit(1); // Sair do servidor se não puder conectar ao banco
  }
}

testDatabaseConnection();

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
  : [
      'http://localhost:5173',
      'http://localhost:8080',
      'https://forgenfuel.vercel.app',
    ];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

// Adicione isso no seu index.js
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Basic route
app.get('/', (req, res) => {
  res.send('ForgeNFuel API is running');
});

// Routes setup
app.use('/api/users', require('./routes/users'));
app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/workouts', require('./routes/workouts'));
app.use('/api/nutrition', require('./routes/nutrition'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/ai', require('./routes/ai'));

// Verificar se a rota de nutrição está registrada
app.use('/api/nutrition', require('./routes/nutrition'));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
