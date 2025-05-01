
import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateMealNutrition } from '@/data/mockData';

const TodayMeals = () => {
  const { mealPlans, foods, getCurrentDate } = useAppContext();
  const todayMealPlan = mealPlans.find(plan => plan.date === getCurrentDate());

  if (!todayMealPlan) {
    return (
      <Card className="bg-white rounded-lg shadow mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Refeições de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Nenhum plano de refeição definido para hoje.</p>
          <Button asChild className="mt-4 bg-fitness-secondary hover:bg-fitness-secondary/90">
            <Link to="/nutrition/plan">Planejar refeições</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Helper para encontrar o nome da comida pelo ID
  const getFoodName = (foodId: string): string => {
    const food = foods.find(f => f.id === foodId);
    return food ? food.name : 'Desconhecido';
  };

  return (
    <Card className="bg-white rounded-lg shadow mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Refeições de Hoje</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {todayMealPlan.meals.map((meal, index) => {
            const nutrition = calculateMealNutrition(meal.foods);
            
            return (
              <div key={index} className="border-b pb-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{meal.name}</h3>
                  <span className="text-sm text-gray-500">{meal.time}</span>
                </div>
                
                <div className="pl-2 mb-2">
                  <ul className="text-sm text-gray-600">
                    {meal.foods.map((food, foodIndex) => (
                      <li key={foodIndex} className="flex justify-between">
                        <span>{getFoodName(food.foodId)}</span>
                        <span>{food.servings} porções</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>{Math.round(nutrition.calories)} kcal</span>
                  <span>P: {Math.round(nutrition.protein)}g</span>
                  <span>C: {Math.round(nutrition.carbs)}g</span>
                  <span>G: {Math.round(nutrition.fat)}g</span>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4">
          <Button asChild className="bg-fitness-secondary hover:bg-fitness-secondary/90">
            <Link to="/nutrition/diary">Ver diário completo</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayMeals;
