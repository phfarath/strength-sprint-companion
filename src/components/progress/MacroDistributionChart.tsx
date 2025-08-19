import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useAppContext } from '@/context/AppContext';
import { calculateDailyNutrition } from '@/data/mockData';
import { PieChart as PieChartIcon } from 'lucide-react';

const MacroDistributionChart = () => {
  const { mealPlans, getCurrentDate } = useAppContext();
  
  // Buscar plano alimentar de hoje
  const todayMealPlan = mealPlans.find(plan => plan.date === getCurrentDate());
  
  let macroData = [
    { name: 'Proteínas', value: 25, color: '#3b82f6' },
    { name: 'Carboidratos', value: 50, color: '#eab308' },
    { name: 'Gorduras', value: 25, color: '#ef4444' }
  ];

  if (todayMealPlan) {
    const nutrition = calculateDailyNutrition(todayMealPlan);
    const totalCalories = nutrition.calories;
    
    if (totalCalories > 0) {
      // Calcular percentuais (4 kcal/g para proteína e carbs, 9 kcal/g para gordura)
      const proteinPercent = Math.round((nutrition.protein * 4 / totalCalories) * 100);
      const carbsPercent = Math.round((nutrition.carbs * 4 / totalCalories) * 100);
      const fatPercent = Math.round((nutrition.fat * 9 / totalCalories) * 100);
      
      macroData = [
        { name: 'Proteínas', value: proteinPercent, color: '#3b82f6' },
        { name: 'Carboidratos', value: carbsPercent, color: '#eab308' },
        { name: 'Gorduras', value: fatPercent, color: '#ef4444' }
      ];
    }
  }

  const renderTooltip = (props: any) => {
    if (props.active && props.payload && props.payload.length > 0) {
      const data = props.payload[0];
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">{data.value}% das calorias</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-fitness-primary" />
          Distribuição de Macronutrientes - Hoje
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={macroData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {macroData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={renderTooltip} />
              <Legend 
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          {macroData.map((macro) => (
            <div key={macro.name} className="text-center p-2 rounded" style={{ backgroundColor: `${macro.color}15` }}>
              <p className="text-gray-600">{macro.name}</p>
              <p className="font-bold" style={{ color: macro.color }}>{macro.value}%</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MacroDistributionChart;
