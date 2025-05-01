
import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { daysOfWeek } from '@/types';
import { Calendar } from 'lucide-react';

const WeeklyCalendar = () => {
  const { workoutPlans, mealPlans, getCurrentDate } = useAppContext();
  const today = new Date();
  const currentDayOfWeek = today.getDay();

  // Gerar dias da semana
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - today.getDay() + i);
    return {
      date,
      dayOfWeek: i,
      isToday: i === currentDayOfWeek,
      hasWorkout: workoutPlans.some(plan => plan.dayOfWeek === i),
      hasMeal: mealPlans.some(plan => 
        plan.date === `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      )
    };
  });

  const formatDate = (date: Date): string => {
    return date.getDate().toString().padStart(2, '0');
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center mb-4">
        <Calendar className="mr-2 text-fitness-primary" size={20} />
        <h2 className="text-lg font-semibold">Seu Planejamento Semanal</h2>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={`calendar-day ${day.isToday ? 'active' : ''} ${
              day.hasWorkout ? 'has-workout' : ''
            } ${day.hasMeal ? 'has-meal' : ''}`}
          >
            <div className="text-xs uppercase font-medium">{daysOfWeek[day.dayOfWeek].substring(0, 3)}</div>
            <div className="text-lg font-bold">{formatDate(day.date)}</div>
            <div className="flex justify-center mt-1 space-x-1">
              {day.hasWorkout && (
                <span className="block h-2 w-2 rounded-full bg-fitness-primary"></span>
              )}
              {day.hasMeal && (
                <span className="block h-2 w-2 rounded-full bg-fitness-secondary"></span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center mt-4 text-xs text-gray-500 space-x-4">
        <div className="flex items-center">
          <span className="block h-3 w-3 rounded-full bg-fitness-primary mr-1"></span>
          <span>Treino</span>
        </div>
        <div className="flex items-center">
          <span className="block h-3 w-3 rounded-full bg-fitness-secondary mr-1"></span>
          <span>Refeição</span>
        </div>
      </div>
    </div>
  );
};

export default WeeklyCalendar;
