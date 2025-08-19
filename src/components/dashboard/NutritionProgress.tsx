import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import { calculateDailyNutrition } from '@/data/mockData';
import { PieChart, Loader2, Target, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const NutritionProgress = () => {
  const { mealPlans, user, getCurrentDate } = useAppContext();
  
  // Verificação de segurança
  if (!user || !user.nutritionGoals) {
    return (
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 mb-6">
        <CardHeader className="flex flex-row items-center pb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mr-3">
            <Loader2 className="text-white animate-spin" size={20} />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">Metas Nutricionais</CardTitle>
            <p className="text-sm text-gray-600">Configure suas metas primeiro</p>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-4">
            Defina suas metas nutricionais no perfil para acompanhar seu progresso.
          </p>
        </CardContent>
      </Card>
    );
  }

  const todayMealPlan = mealPlans.find(plan => plan.date === getCurrentDate());
  const todayNutrition = todayMealPlan ? calculateDailyNutrition(todayMealPlan) : {
    calories: 0, protein: 0, carbs: 0, fat: 0
  };

  const goals = user.nutritionGoals;
  
  const calculatePercentage = (current: number, goal: number) => {
    if (goal === 0) return 0;
    return Math.min(Math.round((current / goal) * 100), 100);
  };

  const nutritionData = [
    {
      name: 'Calorias',
      current: todayNutrition.calories,
      goal: goals.calories,
      unit: 'kcal',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100',
      icon: '🔥'
    },
    {
      name: 'Proteínas',
      current: todayNutrition.protein,
      goal: goals.protein,
      unit: 'g',
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100',
      icon: '💪'
    },
    {
      name: 'Carboidratos',
      current: todayNutrition.carbs,
      goal: goals.carbs,
      unit: 'g',
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'from-yellow-50 to-yellow-100',
      icon: '🌾'
    },
    {
      name: 'Gorduras',
      current: todayNutrition.fat,
      goal: goals.fat,
      unit: 'g',
      color: 'from-red-500 to-red-600',
      bgColor: 'from-red-50 to-red-100',
      icon: '🥑'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 hover:shadow-xl transition-all duration-300 mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <PieChart size={20} className="text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Progresso Nutricional</CardTitle>
                <p className="text-sm text-gray-600">Acompanhamento diário</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-purple-600">
                <Target size={16} />
                <span className="text-sm font-medium">Metas</span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nutritionData.map((item, index) => {
              const percentage = calculatePercentage(item.current, item.goal);
              const isOnTrack = percentage >= 80 && percentage <= 120;
              
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-gradient-to-r ${item.bgColor} rounded-xl p-4 border border-white/60`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.icon}</span>
                      <h4 className="font-semibold text-gray-800">{item.name}</h4>
                    </div>
                    {isOnTrack && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <TrendingUp size={16} className="text-green-600" />
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">
                        {Math.round(item.current)}/{item.goal} {item.unit}
                      </span>
                      <span className={`font-bold ${
                        isOnTrack ? 'text-green-600' : percentage > 120 ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {percentage}%
                      </span>
                    </div>
                    
                    <div className="relative">
                      <div className="w-full bg-white/60 rounded-full h-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(percentage, 100)}%` }}
                          transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                          className={`h-full bg-gradient-to-r ${item.color} rounded-full relative`}
                        >
                          {percentage > 100 && (
                            <div className="absolute right-0 top-0 h-full w-2 bg-red-500 rounded-r-full"></div>
                          )}
                        </motion.div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">
                      Restante: {Math.max(0, item.goal - item.current).toFixed(0)} {item.unit}
                    </span>
                    <span className={`px-2 py-1 rounded-full font-medium ${
                      isOnTrack 
                        ? 'bg-green-100 text-green-700'
                        : percentage > 120 
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {isOnTrack ? 'No alvo' : percentage > 120 ? 'Excesso' : 'Abaixo'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {/* Resumo geral */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 p-4 bg-white/60 rounded-xl"
          >
            <h4 className="font-semibold text-gray-800 mb-2">Resumo do Dia</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              {nutritionData.map((item, index) => {
                const percentage = calculatePercentage(item.current, item.goal);
                return (
                  <div key={index} className="text-center">
                    <div className={`text-2xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                      {percentage}%
                    </div>
                    <div className="text-xs text-gray-600">{item.name}</div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NutritionProgress;
