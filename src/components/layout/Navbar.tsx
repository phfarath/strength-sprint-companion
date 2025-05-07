import React from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { Badge } from '@/components/ui/badge';

const Navbar = () => {
  const { notifications, logout } = useAppContext();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-fitness-primary">FitTrack</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-600 hover:text-fitness-primary px-3 py-2 rounded-md font-medium">
              Dashboard
            </Link>
            <Link to="/workout" className="text-gray-600 hover:text-fitness-primary px-3 py-2 rounded-md font-medium">
              Treinos
            </Link>
            <Link to="/nutrition" className="text-gray-600 hover:text-fitness-primary px-3 py-2 rounded-md font-medium">
              Nutrição
            </Link>
            <Link to="/progress" className="text-gray-600 hover:text-fitness-primary px-3 py-2 rounded-md font-medium">
              Progresso
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Link to="/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-2 bg-fitness-secondary">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link to="/profile">
              <div className="h-8 w-8 rounded-full bg-fitness-primary flex items-center justify-center text-white">
                {useAppContext().user.name.charAt(0)}
              </div>
            </Link>
            <button 
              onClick={logout} 
              className="ml-4 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
