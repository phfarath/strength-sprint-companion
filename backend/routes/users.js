const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth'); // Importe o middleware de autenticação

const prisma = new PrismaClient();

// Rota de registro
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Usuário já existe' });
    }
    
    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: hashedPassword
      }
    });
    
    // Gerar JWT
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Erro ao registrar:', error);
    res.status(500).json({ message: 'Erro no servidor: ' + error.message });
  }
});

// Rota de login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Encontrar usuário
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }
    
    // Verificar senha
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }
    
    // Gerar JWT
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Rota para obter perfil do usuário (PROTEGIDA)
router.get('/profile', auth, async (req, res) => { // Aplica o middleware auth
  try {
    // req.user é definido pelo middleware auth
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
        // Adicione outros campos conforme necessário
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;