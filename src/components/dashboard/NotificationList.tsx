
import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const NotificationList = () => {
  const { notifications, markNotificationAsRead } = useAppContext();
  const sortedNotifications = [...notifications]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 3);

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'workout':
        return <span className="text-fitness-primary">🏋️‍♂️</span>;
      case 'meal':
        return <span className="text-fitness-secondary">🍽️</span>;
      default:
        return <span className="text-blue-500">📢</span>;
    }
  };

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
  };

  return (
    <Card className="bg-white rounded-lg shadow mb-6">
      <CardHeader className="flex flex-row items-center pb-2">
        <Bell className="mr-2 text-fitness-primary" size={20} />
        <CardTitle className="text-lg font-semibold">Notificações</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedNotifications.length > 0 ? (
          <div className="space-y-3">
            {sortedNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-3 border rounded-md text-sm transition-colors ${
                  notification.read ? 'bg-white' : 'bg-blue-50 border-blue-100'
                }`}
              >
                <div className="flex items-start">
                  <div className="mr-2 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <p>{notification.message}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">{formatTime(notification.time)}</span>
                      {!notification.read && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 h-auto text-xs text-fitness-primary"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          Marcar como lida
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Não há notificações recentes.</p>
        )}
        {notifications.length > 3 && (
          <div className="mt-4 text-center">
            <Button asChild variant="outline" size="sm">
              <a href="/notifications">Ver todas</a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationList;
