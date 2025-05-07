const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Obter token do cabeçalho
  const token = req.header('x-auth-token');
  
  // Log para debug
  console.log('Token recebido:', token);
  
  // Verificar se não há token
  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido, acesso negado' });
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decodificado:', decoded);
    
    // Adicionar o usuário decodificado à requisição
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Erro na verificação do token:', err);
    res.status(401).json({ message: 'Token inválido' });
  }
};