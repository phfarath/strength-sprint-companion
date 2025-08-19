import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { daysOfWeek } from '@/types';
import { Calendar, Dumbbell, Utensils } from 'lucide-react';
import { motion } from 'framer-motion';

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

  const getMonthYear = () => {
    return today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100 hover:shadow-xl transition-shadow"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
            <Calendar className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Planejamento Semanal</h2>
            <p className="text-sm text-gray-500 capitalize">{getMonthYear()}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map((day, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`
              relative p-4 rounded-xl text-center cursor-pointer transition-all duration-200
              ${day.isToday 
                ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-105' 
                : 'bg-gray-50 hover:bg-gray-100 hover:scale-105'
              }
            `}
          >
            <div className="text-xs uppercase font-semibold mb-1 opacity-75">
              {daysOfWeek[day.dayOfWeek].substring(0, 3)}
            </div>
            <div className="text-2xl font-bold mb-2">{formatDate(day.date)}</div>
            
            {/* Indicadores de atividades */}
            <div className="flex justify-center space-x-1">
              {day.hasWorkout && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className={`
                    p-1 rounded-full 
                    ${day.isToday ? 'bg-white/30' : 'bg-blue-500'}
                  `}
                >
                  <Dumbbell size={12} className={day.isToday ? 'text-white' : 'text-white'} />
                </motion.div>
              )}
              {day.hasMeal && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className={`
                    p-1 rounded-full 
                    ${day.isToday ? 'bg-white/30' : 'bg-green-500'}
                  `}
                >
                  <Utensils size={12} className={day.isToday ? 'text-white' : 'text-white'} />
                </motion.div>
              )}
            </div>

            {/* Glow effect para hoje */}
            {day.isToday && (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl opacity-20 blur-xl -z-10"></div>
            )}
          </motion.div>
        ))}
      </div>
      
      {/* Legenda moderna */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex justify-center mt-6 space-x-6"
      >
        <div className="flex items-center bg-blue-50 px-3 py-2 rounded-full">
          <Dumbbell size={14} className="text-blue-600 mr-2" />
          <span className="text-sm font-medium text-blue-700">Treino</span>
        </div>
        <div className="flex items-center bg-green-50 px-3 py-2 rounded-full">
          <Utensils size={14} className="text-green-600 mr-2" />
          <span className="text-sm font-medium text-green-700">Refeição</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WeeklyCalendar;
