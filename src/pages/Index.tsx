
import React from 'react';
import Layout from '@/components/layout/Layout';
import WeeklyCalendar from '@/components/dashboard/WeeklyCalendar';
import TodayWorkout from '@/components/dashboard/TodayWorkout';
import TodayMeals from '@/components/dashboard/TodayMeals';
import NutritionProgress from '@/components/dashboard/NutritionProgress';
import NotificationList from '@/components/dashboard/NotificationList';
import { useAppContext } from '@/context/AppContext';

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TodayWorkout />
            <TodayMeals />
          </div>
        </div>
        <div>
          <NutritionProgress />
          <NotificationList />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
