import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import { calculateDailyNutrition } from '@/data/mockData';
import { PieChart, Loader2 } from 'lucide-react';

const NutritionProgress = () => {
  const { mealPlans, user, getCurrentDate } = useAppContext();
  
  // Console.log para debug
  console.log('NutritionProgress - user:', user);
  console.log('NutritionProgress - nutritionGoals:', user?.nutritionGoals);
  
  // Verificação de segurança - retorna um estado de carregamento se não houver dados
  if (!user || !user.nutritionGoals) {
    return (
      <Card className="bg-white rounded-lg shadow mb-6">
        <CardHeader className="flex flex-row items-center pb-2">
          <PieChart className="mr-2 text-fitness-primary" size={20} />
          <CardTitle className="text-lg font-semibold">Progresso Nutricional</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-fitness-primary" />
          <span className="ml-2 text-gray-500">Carregando dados nutricionais...</span>
        </CardContent>
      </Card>
    );
  }
  
  const todayMealPlan = mealPlans.find(plan => plan.date === getCurrentDate());
  
  const goals = user.nutritionGoals;
  let consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  
  if (todayMealPlan) {
    consumed = calculateDailyNutrition(todayMealPlan);
  }
  
  // Certifique-se que todas as propriedades de goals são números válidos
  // usando operador || para valores de fallback
  const safeGoals = {
    calories: goals.calories || 2000,
    protein: goals.protein || 150,
    carbs: goals.carbs || 200,
    fat: goals.fat || 70
  };
  
  // Calcula porcentagem consumida em relação às metas
  const percentages = {
    calories: Math.min(Math.round((consumed.calories / safeGoals.calories) * 100), 100),
    protein: Math.min(Math.round((consumed.protein / safeGoals.protein) * 100), 100),
    carbs: Math.min(Math.round((consumed.carbs / safeGoals.carbs) * 100), 100),
    fat: Math.min(Math.round((consumed.fat / safeGoals.fat) * 100), 100)
  };

  return (
    <Card className="bg-white rounded-lg shadow mb-6">
      <CardHeader className="flex flex-row items-center pb-2">
        <PieChart className="mr-2 text-fitness-primary" size={20} />
        <CardTitle className="text-lg font-semibold">Progresso Nutricional</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-medium">Calorias</span>
              <span className="text-sm text-gray-500">
                {Math.round(consumed.calories)} / {safeGoals.calories} kcal
              </span>
            </div>
            <Progress value={percentages.calories} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-medium">Proteína</span>
              <span className="text-sm text-gray-500">
                {Math.round(consumed.protein)} / {safeGoals.protein} g
              </span>
            </div>
            <Progress value={percentages.protein} className="h-2 bg-gray-200">
              <div 
                className="h-full bg-blue-500" 
                style={{ width: `${percentages.protein}%` }}
              ></div>
            </Progress>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-medium">Carboidratos</span>
              <span className="text-sm text-gray-500">
                {Math.round(consumed.carbs)} / {safeGoals.carbs} g
              </span>
            </div>
            <Progress value={percentages.carbs} className="h-2 bg-gray-200">
              <div 
                className="h-full bg-yellow-400" 
                style={{ width: `${percentages.carbs}%` }}
              ></div>
            </Progress>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-medium">Gorduras</span>
              <span className="text-sm text-gray-500">
                {Math.round(consumed.fat)} / {safeGoals.fat} g
              </span>
            </div>
            <Progress value={percentages.fat} className="h-2 bg-gray-200">
              <div 
                className="h-full bg-red-400" 
                style={{ width: `${percentages.fat}%` }}
              ></div>
            </Progress>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NutritionProgress;
