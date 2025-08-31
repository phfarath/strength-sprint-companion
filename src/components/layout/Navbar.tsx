import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Menu, X, User, Settings, Zap, Brain, LayoutDashboard, Dumbbell, Utensils, LineChart } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar = () => {
  const { notifications, user } = useAppContext();
  const location = useLocation();
  const unreadCount = notifications.filter(n => !n.read).length;
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Efeito de scroll para mudar o estilo da navbar
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/workout/planning", label: "Treinos", icon: Dumbbell },
    { to: "/nutrition/planning", label: "Nutrição", icon: Utensils },
    { to: "/progress", label: "Progresso", icon: LineChart },
    { to: "/ai/assistant", label: "IA", icon: Brain }
  ];

  const isActivePath = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className={`
        sticky top-0 z-50 transition-all duration-300 backdrop-blur-lg
        ${scrolled
          ? 'bg-white/90 shadow-lg border-b border-gray-200/50'
          : 'bg-white/95 border-b border-gray-100'
        }
      `}
    >
      <div className="container mx-auto h-16 px-4">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2 group">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center shadow-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-transparent">
                ForgeNFuel
              </span>
            </Link>

            {/* Links de navegação - Desktop */}
            <div className="hidden lg:flex ml-12 space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                    isActivePath(link.to)
                      ? 'bg-gradient-to-r from-purple-500 to-purple-700 text-white shadow-lg'
                      : 'text-gray-700 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Ações do usuário */}
          <div className="flex items-center space-x-3">
            <div>
              <Link to="/notifications">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hover:bg-purple-50 rounded-full transition-colors"
                >
                  <Bell size={20} className="text-gray-600" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-purple-600 text-white border-0 text-xs font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
            
            {/* Menu do usuário - Desktop */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="flex items-center space-x-2 p-2 rounded-full hover:bg-purple-50 transition-colors group"
                    type="button"
                  >
                    <div>
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-purple-300">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-medium text-gray-900">{user?.name || 'Usuário'}</p>
                      <p className="text-xs text-gray-500">Ver perfil</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur-lg border border-gray-200/50 shadow-xl">
                  <DropdownMenuLabel className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-medium">{user?.name || 'Usuário'}</p>
                      <p className="text-xs text-gray-500">{(user as { email?: string } | undefined)?.email || 'usuario@email.com'}</p>
                    </div>
                  </DropdownMenuLabel>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center space-x-2 cursor-pointer">
                      <User className="w-4 h-4" />
                      <span>Meu Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center space-x-2 cursor-pointer">
                      <Settings className="w-4 h-4" />
                      <span>Configurações</span>
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem className="flex items-center space-x-2 text-red-600 focus:text-red-600 focus:bg-red-50">
                    <LogoutButton className="p-0 h-auto font-normal justify-start text-red-600 hover:text-red-600 hover:bg-transparent" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Menu Mobile */}
            <div className="md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Menu size={24} />
                  </Button>
                </SheetTrigger>

                <SheetContent side="right" className="w-[280px] bg-white/95 backdrop-blur-lg border-l border-gray-200/50">
                  <div className="flex flex-col h-full">
                    {/* Header do menu mobile */}
                    <div className="flex items-center justify-between py-4 border-b border-gray-200">
                      <h2 className="text-lg font-semibold bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-transparent">
                        Menu
                      </h2>
                      <SheetClose asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                          <X size={20} />
                        </Button>
                      </SheetClose>
                    </div>

                    <div className="flex-1 py-6 space-y-6">
                      {/* Perfil do usuário no mobile */}
                      <div className="flex items-center space-x-3 p-4 rounded-xl bg-purple-50">
                        <div>
                          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-purple-300">
                            {user?.name?.charAt(0) || 'U'}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{user?.name || 'Usuário'}</p>
                          <SheetClose asChild>
                            <Link to="/profile" className="text-sm text-purple-600 hover:text-purple-700">
                              Ver perfil →
                            </Link>
                          </SheetClose>
                        </div>
                      </div>

                      {/* Links de navegação no mobile */}
                      <div className="space-y-2">
                        {navLinks.map((link) => (
                          <SheetClose asChild key={link.to}>
                            <Link
                              to={link.to}
                              className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                                isActivePath(link.to)
                                  ? 'bg-gradient-to-r from-purple-500 to-purple-700 text-white shadow-lg'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                              onClick={() => setIsOpen(false)}
                            >
                              <link.icon className="w-5 h-5" />
                              <span>{link.label}</span>
                            </Link>
                          </SheetClose>
                        ))}
                      </div>
                    </div>

                    {/* Footer do menu mobile */}
                    <div className="border-t border-gray-200 pt-4">
                      <SheetClose asChild>
                        <div onClick={() => setIsOpen(false)}>
                          <LogoutButton className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0 shadow-lg" />
                        </div>
                      </SheetClose>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
