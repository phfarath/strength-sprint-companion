import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateMealNutrition } from '@/data/mockData';
import { Utensils, Clock, Zap, Apple, Droplets } from 'lucide-react';
import { motion } from 'framer-motion';

const TodayMeals = () => {
  const { mealPlans, foods, getCurrentDate } = useAppContext();
  const todayMealPlan = mealPlans.find(plan => plan.date === getCurrentDate());

  const getFoodName = (foodId: string | number) => {
    const food = foods.find(f => f.id.toString() === foodId.toString());
    return food ? food.name : 'Alimento não encontrado';
  };

  if (!todayMealPlan) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Utensils size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Sem Plano Alimentar</h3>
            <p className="text-gray-500 mb-4">Nenhuma refeição planejada para hoje</p>
            <Button asChild variant="outline" className="hover:bg-green-50 hover:text-green-600 border-green-200">
              <Link to="/nutrition/planning">Planejar refeições</Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Calcular totais nutricionais do dia
  const totalNutrition = todayMealPlan.meals.reduce(
    (total, meal) => {
      const mealNutrition = calculateMealNutrition(
        meal.foods.map(food => ({
          ...food,
          foodId: food.foodId.toString()
        }))
      );
      return {
        calories: total.calories + mealNutrition.calories,
        protein: total.protein + mealNutrition.protein,
        carbs: total.carbs + mealNutrition.carbs,
        fat: total.fat + mealNutrition.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Utensils size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Refeições de Hoje</h3>
              <p className="text-sm text-gray-600 font-normal">{todayMealPlan.meals.length} refeições planejadas</p>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Resumo nutricional */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="text-center bg-white/60 rounded-lg p-3">
              <Zap className="w-5 h-5 mx-auto mb-1 text-orange-600" />
              <p className="text-lg font-bold text-gray-900">{Math.round(totalNutrition.calories)}</p>
              <p className="text-xs text-gray-600">kcal</p>
            </div>
            <div className="text-center bg-white/60 rounded-lg p-3">
              <Apple className="w-5 h-5 mx-auto mb-1 text-blue-600" />
              <p className="text-lg font-bold text-gray-900">{Math.round(totalNutrition.protein)}</p>
              <p className="text-xs text-gray-600">Prot</p>
            </div>
            <div className="text-center bg-white/60 rounded-lg p-3">
              <Droplets className="w-5 h-5 mx-auto mb-1 text-yellow-600" />
              <p className="text-lg font-bold text-gray-900">{Math.round(totalNutrition.carbs)}</p>
              <p className="text-xs text-gray-600">Carb</p>
            </div>
            <div className="text-center bg-white/60 rounded-lg p-3">
              <div className="w-5 h-5 mx-auto mb-1 bg-red-600 rounded-full"></div>
              <p className="text-lg font-bold text-gray-900">{Math.round(totalNutrition.fat)}</p>
              <p className="text-xs text-gray-600">Gord</p>
            </div>
            {todayMealPlan.meals.slice(0, 3).map((meal, index) => {
              const nutrition = calculateMealNutrition(
                meal.foods.map(food => ({
                  ...food,
                  foodId: food.foodId.toString()
                }))
              );
              
              return (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/60 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-500" />
                      <span className="font-medium text-gray-900">{meal.name}</span>
                      {meal.time && (
                        <span className="text-sm text-gray-500">({meal.time})</span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-green-600">
                      {Math.round(nutrition.calories)} kcal
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {meal.foods.slice(0, 2).map((food, foodIndex) => (
                      <div key={foodIndex} className="flex justify-between">
                        <span>{getFoodName(food.foodId)}</span>
                        <span>{food.servings} porções</span>
                      </div>
                    ))}
                    {meal.foods.length > 2 && (
                      <div className="text-center text-gray-400 mt-1">
                        +{meal.foods.length - 2} itens
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Botão de ação */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              asChild 
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg"
            >
              <Link to="/nutrition/diary">Ver diário completo</Link>
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TodayMeals;
