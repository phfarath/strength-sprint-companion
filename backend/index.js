const express = require('express');
const cors = require('cors');
const prisma = require('./prisma/client');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
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
      'http://localhost:8081',
      'https://forgenfuel.vercel.app',
    ];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: '15kb' }));
app.use(express.urlencoded({ extended: true, limit: '15kb' }));

// Adicione isso no seu index.js
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Rate limiter for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
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
app.use('/api/ai', aiLimiter, require('./routes/ai'));

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
