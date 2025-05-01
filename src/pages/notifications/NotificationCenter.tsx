
import React from 'react';
import { useAppContext } from '@/context/AppContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Bell } from 'lucide-react';

const NotificationCenter = () => {
  const { notifications, markNotificationAsRead } = useAppContext();

  // Separar notificações por tipo
  const workoutNotifications = notifications.filter(n => n.type === 'workout');
  const mealNotifications = notifications.filter(n => n.type === 'meal');
  const generalNotifications = notifications.filter(n => n.type === 'general');

  // Verificar se há notificações não lidas
  const hasUnread = notifications.some(n => !n.read);

  // Ordenar notificações por data
  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
  );

  // Formatar horário
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Formatar data
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  // Marcar todas como lidas
  const markAllAsRead = () => {
    notifications.forEach(notification => {
      if (!notification.read) {
        markNotificationAsRead(notification.id);
      }
    });
  };

  // Agrupar notificações por data
  const groupByDate = (notificationsArray: typeof notifications) => {
    const groups: Record<string, typeof notifications> = {};
    
    notificationsArray.forEach(notification => {
      const date = new Date(notification.time).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notification);
    });
    
    return Object.entries(groups).map(([date, notifs]) => ({
      date,
      notifications: notifs
    }));
  };

  const groupedNotifications = groupByDate(sortedNotifications);

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Notificações</h1>
        <p className="text-gray-600">Acompanhe suas notificações e lembretes.</p>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div>
          {hasUnread && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
            >
              <Check size={16} className="mr-1" /> Marcar todas como lidas
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="workout">Treinos</TabsTrigger>
          <TabsTrigger value="meal">Alimentação</TabsTrigger>
          <TabsTrigger value="general">Geral</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {notifications.length > 0 ? (
            <div className="space-y-6">
              {groupedNotifications.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    {new Date(group.date).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                  </h3>
                  <Card>
                    <CardContent className="p-0">
                      {group.notifications.map((notification, index) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b last:border-b-0 ${
                            notification.read ? 'bg-white' : 'bg-blue-50'
                          }`}
                        >
                          <div className="flex items-start">
                            <div className="mr-3 mt-1">
                              <Bell
                                size={18}
                                className={`${notification.read ? 'text-gray-400' : 'text-fitness-primary'}`}
                              />
                            </div>
                            <div className="flex-1">
                              <p>{notification.message}</p>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-xs text-gray-500">
                                  {formatTime(notification.time)}
                                </span>
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto py-1 text-xs text-fitness-primary"
                                    onClick={() => markNotificationAsRead(notification.id)}
                                  >
                                    Marcar como lida
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <Bell size={48} className="text-gray-300 mb-3" />
                <p className="text-gray-500">Você não tem notificações.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="workout">
          {workoutNotifications.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Notificações de Treino</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {workoutNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b last:border-b-0 ${
                      notification.read ? 'bg-white' : 'bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="mr-3 mt-0.5">
                        <span className="text-fitness-primary">🏋️‍♂️</span>
                      </div>
                      <div className="flex-1">
                        <p>{notification.message}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-500">
                            {formatDate(notification.time)} {formatTime(notification.time)}
                          </span>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto py-1 text-xs text-fitness-primary"
                              onClick={() => markNotificationAsRead(notification.id)}
                            >
                              Marcar como lida
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <p className="text-gray-500">Não há notificações de treino.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="meal">
          {mealNotifications.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Notificações de Alimentação</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {mealNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b last:border-b-0 ${
                      notification.read ? 'bg-white' : 'bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="mr-3 mt-0.5">
                        <span className="text-fitness-secondary">🍽️</span>
                      </div>
                      <div className="flex-1">
                        <p>{notification.message}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-500">
                            {formatDate(notification.time)} {formatTime(notification.time)}
                          </span>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto py-1 text-xs text-fitness-primary"
                              onClick={() => markNotificationAsRead(notification.id)}
                            >
                              Marcar como lida
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <p className="text-gray-500">Não há notificações de alimentação.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="general">
          {generalNotifications.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Notificações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {generalNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b last:border-b-0 ${
                      notification.read ? 'bg-white' : 'bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="mr-3 mt-0.5">
                        <span className="text-blue-500">📢</span>
                      </div>
                      <div className="flex-1">
                        <p>{notification.message}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-500">
                            {formatDate(notification.time)} {formatTime(notification.time)}
                          </span>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto py-1 text-xs text-fitness-primary"
                              onClick={() => markNotificationAsRead(notification.id)}
                            >
                              Marcar como lida
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <p className="text-gray-500">Não há notificações gerais.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default NotificationCenter;
