import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LogoutButton = ({ className = '' }) => {
  const { logout: contextLogout } = useAppContext();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    // Remove o token de autenticação
    localStorage.removeItem('auth_token');
    
    // Executa o logout do contexto
    contextLogout();
    
    // Redireciona para a página de login
    navigate('/auth/login');
  };
  
  return (
    <Button 
      onClick={handleLogout}
      variant="ghost"
      className={`flex items-center text-gray-700 hover:text-red-600 ${className}`}
    >
      <LogOut size={16} className="mr-2" /> Sair
    </Button>
  );
};

export default LogoutButton;