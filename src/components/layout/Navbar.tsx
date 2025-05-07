import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { Badge } from '@/components/ui/badge';
import LogoutButton from '@/components/LogoutButton';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetClose
} from '@/components/ui/sheet';

const Navbar = () => {
  const { notifications, user } = useAppContext();
  const unreadCount = notifications.filter(n => !n.read).length;
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/workout/planning", label: "Treinos" },
    { to: "/nutrition/planning", label: "Nutrição" },
    { to: "/progress", label: "Progresso" }
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto flex justify-between items-center h-16 px-4">
        {/* Logo - visível em todas as telas */}
        <div className="flex items-center">
          <Link to="/dashboard" className="text-xl font-bold text-fitness-primary">
            FitTrack
          </Link>
          
          {/* Links de navegação - visíveis apenas em desktop */}
          <div className="hidden md:flex ml-10 space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.to} 
                to={link.to} 
                className="text-gray-700 hover:text-fitness-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        
        {/* Ícones de ação - adaptados para mobile e desktop */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <Link to="/notifications" className="md:block">
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={20} />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-2 bg-fitness-secondary">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </Link>
          
          <Link to="/profile" className="hidden md:block">
            <div className="h-8 w-8 rounded-full bg-fitness-primary flex items-center justify-center text-white">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </Link>
          
          {/* Botão de logout - visível apenas em desktop */}
          <div className="hidden md:block">
            <LogoutButton />
          </div>
          
          {/* Menu mobile */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center py-4 border-b">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon">
                      <X size={20} />
                    </Button>
                  </SheetClose>
                </div>
                
                <div className="mt-6 flex flex-col space-y-6">
                  {/* Perfil do usuário no mobile */}
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-fitness-primary flex items-center justify-center text-white">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-medium">{user?.name || 'Usuário'}</p>
                      <Link to="/profile" className="text-sm text-gray-500">Ver perfil</Link>
                    </div>
                  </div>
                  
                  {/* Links de navegação no mobile */}
                  <div className="flex flex-col space-y-2">
                    {navLinks.map((link) => (
                      <SheetClose asChild key={link.to}>
                        <Link 
                          to={link.to} 
                          className="py-2 px-4 rounded-md hover:bg-gray-100 text-gray-800"
                          onClick={() => setIsOpen(false)}
                        >
                          {link.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                  
                  {/* Botão de logout no mobile - na parte inferior */}
                  <div className="mt-auto py-4 border-t">
                    <SheetClose asChild>
                      <div onClick={() => setIsOpen(false)}>
                        <LogoutButton className="w-full" />
                      </div>
                    </SheetClose>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
