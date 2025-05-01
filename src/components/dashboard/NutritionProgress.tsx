
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import { calculateDailyNutrition } from '@/data/mockData';
import { PieChart } from 'lucide-react';

const NutritionProgress = () => {
  const { mealPlans, user, getCurrentDate } = useAppContext();
  const todayMealPlan = mealPlans.find(plan => plan.date === getCurrentDate());
  
  const goals = user.nutritionGoals;
  let consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  
  if (todayMealPlan) {
    consumed = calculateDailyNutrition(todayMealPlan);
  }
  
  // Calcula porcentagem consumida em relação às metas
  const percentages = {
    calories: Math.min(Math.round((consumed.calories / goals.calories) * 100), 100),
    protein: Math.min(Math.round((consumed.protein / goals.protein) * 100), 100),
    carbs: Math.min(Math.round((consumed.carbs / goals.carbs) * 100), 100),
    fat: Math.min(Math.round((consumed.fat / goals.fat) * 100), 100)
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
                {Math.round(consumed.calories)} / {goals.calories} kcal
              </span>
            </div>
            <Progress value={percentages.calories} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="font-medium">Proteína</span>
              <span className="text-sm text-gray-500">
                {Math.round(consumed.protein)} / {goals.protein} g
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
                {Math.round(consumed.carbs)} / {goals.carbs} g
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
                {Math.round(consumed.fat)} / {goals.fat} g
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
