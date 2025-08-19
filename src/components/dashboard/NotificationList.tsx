import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { Bell, Check, X, AlertCircle, Info, Trophy, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationList = () => {
  const { notifications, markNotificationAsRead } = useAppContext();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
  };

  const getNotificationIcon = (type: string) => {
    const iconMap = {
      'workout': <Zap className="w-5 h-5" />,
      'nutrition': <AlertCircle className="w-5 h-5" />,
      'achievement': <Trophy className="w-5 h-5" />,
      'reminder': <Bell className="w-5 h-5" />,
      'info': <Info className="w-5 h-5" />
    };
    return iconMap[type as keyof typeof iconMap] || <Bell className="w-5 h-5" />;
  };

  const getNotificationStyle = (type: string) => {
    const styleMap = {
      'workout': 'from-blue-50 to-indigo-50 border-blue-200',
      'nutrition': 'from-green-50 to-emerald-50 border-green-200',
      'achievement': 'from-yellow-50 to-orange-50 border-yellow-200',
      'reminder': 'from-purple-50 to-pink-50 border-purple-200',
      'info': 'from-gray-50 to-slate-50 border-gray-200'
    };
    return styleMap[type as keyof typeof styleMap] || 'from-gray-50 to-slate-50 border-gray-200';
  };

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Agora há pouco';
      if (diffInHours < 24) return `${diffInHours}h atrás`;
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return timeString;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Bell size={20} className="text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Notificações</CardTitle>
                <p className="text-sm text-gray-600">
                  {notifications.filter(n => !n.read).length} não lidas
                </p>
              </div>
            </div>
            {notifications.some(n => !n.read) && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-3 h-3 bg-red-500 rounded-full"
              />
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {notifications.length > 0 ? (
            <div className="space-y-3">
              <AnimatePresence>
                {notifications.slice(0, 5).map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className={`
                      relative rounded-xl p-4 border transition-all duration-300 cursor-pointer
                      bg-gradient-to-r ${getNotificationStyle(notification.type)}
                      ${!notification.read 
                        ? 'shadow-md hover:shadow-lg' 
                        : 'opacity-75'
                      }
                    `}
                    onClick={() => setExpandedId(
                      expandedId === notification.id ? null : notification.id
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        p-2 rounded-lg shrink-0
                        ${notification.type === 'workout' ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-600'
                        }
                      `}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 mb-1">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.time)}
                          </span>
                          
                          {!notification.read && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
                            >
                              <Check size={12} />
                              Marcar
                            </motion.button>
                          )}
                        </div>
                        
                        {/* Conteúdo expandido */}
                        <AnimatePresence>
                          {expandedId === notification.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 pt-3 border-t border-white/60"
                            >
                              <p className="text-sm text-gray-700">
                                Detalhes da notificação apareceriam aqui...
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {notifications.length > 5 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center pt-4"
                >
                  <Button asChild variant="outline" size="sm" className="hover:bg-indigo-50 hover:text-indigo-600 border-indigo-200">
                    <a href="/notifications">Ver todas ({notifications.length})</a>
                  </Button>
                </motion.div>
              )}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium mb-1">Tudo em dia!</p>
              <p className="text-sm text-gray-400">Não há notificações no momento</p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NotificationList;
