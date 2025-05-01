
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { calculateDailyNutrition } from '@/data/mockData';
import { useAppContext } from '@/context/AppContext';

const MacroDistributionChart = () => {
  const { mealPlans, getCurrentDate } = useAppContext();
  const todayMealPlan = mealPlans.find(plan => plan.date === getCurrentDate());
  
  // Calculo de macronutrientes
  let macros = { protein: 0, carbs: 0, fat: 0 };
  
  if (todayMealPlan) {
    const nutrition = calculateDailyNutrition(todayMealPlan);
    macros = {
      protein: Math.round(nutrition.protein),
      carbs: Math.round(nutrition.carbs),
      fat: Math.round(nutrition.fat)
    };
  } else {
    // Dados de exemplo se não houver plano para hoje
    macros = {
      protein: 120,
      carbs: 200,
      fat: 60
    };
  }
  
  // Calculando calorias de cada macronutriente
  const proteinCalories = macros.protein * 4;
  const carbsCalories = macros.carbs * 4;
  const fatCalories = macros.fat * 9;
  const totalCalories = proteinCalories + carbsCalories + fatCalories;
  
  const data = [
    { name: 'Proteínas', value: proteinCalories, macroValue: macros.protein, color: '#3b82f6' },
    { name: 'Carboidratos', value: carbsCalories, macroValue: macros.carbs, color: '#eab308' },
    { name: 'Gorduras', value: fatCalories, macroValue: macros.fat, color: '#ef4444' },
  ];
  
  // Calcula porcentagens
  const getPercent = (value: number) => {
    if (totalCalories === 0) return 0;
    return Math.round((value / totalCalories) * 100);
  };

  return (
    <Card className="bg-white rounded-lg shadow mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Distribuição de Macronutrientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string, props: any) => {
                  const entry = props.payload;
                  return [
                    `${entry.macroValue}g (${getPercent(entry.value)}%)`, 
                    entry.name
                  ];
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div className="text-center">
            <p className="text-gray-500">Proteínas</p>
            <p className="font-bold text-blue-500">{macros.protein}g</p>
            <p className="text-xs">{getPercent(proteinCalories)}% das calorias</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Carboidratos</p>
            <p className="font-bold text-yellow-500">{macros.carbs}g</p>
            <p className="text-xs">{getPercent(carbsCalories)}% das calorias</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Gorduras</p>
            <p className="font-bold text-red-500">{macros.fat}g</p>
            <p className="text-xs">{getPercent(fatCalories)}% das calorias</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MacroDistributionChart;
