
import React from 'react';
import Layout from '@/components/layout/Layout';
import WeeklyCalendar from '@/components/dashboard/WeeklyCalendar';
import TodayWorkout from '@/components/dashboard/TodayWorkout';
import TodayMeals from '@/components/dashboard/TodayMeals';
import NutritionProgress from '@/components/dashboard/NutritionProgress';
import NotificationList from '@/components/dashboard/NotificationList';
import WeeklyWorkoutProgress from '@/components/dashboard/WeeklyWorkoutProgress';
import NutritionGoalsFeedback from '@/components/dashboard/NutritionGoalsFeedback';
import UserAchievements from '@/components/gamification/UserAchievements';
import DeviceMonitoring from '@/components/tracking/DeviceMonitoring';
import AccessibilityControls from '@/components/accessibility/AccessibilityControls';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const { user } = useAppContext();

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Olá, {user.name}!</h1>
        <p className="text-gray-600">Acompanhe seu progresso e planeje seus treinos e refeições.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeeklyCalendar />
          
          {/* Nova seção de progresso semanal */}
          <WeeklyWorkoutProgress />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TodayWorkout />
            <TodayMeals />
          </div>
          
          {/* Nova seção de feedback nutricional */}
          <NutritionGoalsFeedback />
          
          {/* Nova seção de monitoramento de dispositivos */}
          <DeviceMonitoring />
          
          {/* Botão de feedback */}
          <div className="mt-6 text-center">
            <Button asChild className="bg-fitness-primary hover:bg-fitness-primary/90">
              <Link to="/feedback">
                <Send className="mr-2 h-4 w-4" /> Enviar Feedback
              </Link>
            </Button>
          </div>
        </div>
        
        <div>
          {/* Nova seção de conquistas do usuário */}
          <UserAchievements />
          
          <NutritionProgress />
          <NotificationList />
          
          {/* Nova seção de controles de acessibilidade */}
          <AccessibilityControls />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
