
import React from 'react';
import { useAppContext } from '@/context/AppContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { calculateMealNutrition, calculateDailyNutrition } from '@/data/mockData';
import { Edit, ArrowLeft, ArrowRight } from 'lucide-react';

const FoodDiary = () => {
  const { mealPlans, foods, user, getCurrentDate } = useAppContext();
  const [selectedDate, setSelectedDate] = React.useState<string>(getCurrentDate());
  
  const selectedMealPlan = mealPlans.find(plan => plan.date === selectedDate);
  const nutritionGoals = user.nutritionGoals;
  
  // Cálculo de nutrientes consumidos
  let consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  if (selectedMealPlan) {
    consumed = calculateDailyNutrition(selectedMealPlan);
  }
  
  // Percentagem de metas atingidas
  const percentages = {
    calories: Math.min(Math.round((consumed.calories / nutritionGoals.calories) * 100), 100),
    protein: Math.min(Math.round((consumed.protein / nutritionGoals.protein) * 100), 100),
    carbs: Math.min(Math.round((consumed.carbs / nutritionGoals.carbs) * 100), 100),
    fat: Math.min(Math.round((consumed.fat / nutritionGoals.fat) * 100), 100)
  };
  
  // Navegar entre datas
  const changeDate = (direction: -1 | 1) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + direction);
    const newDate = currentDate.toISOString().split('T')[0];
    setSelectedDate(newDate);
  };
  
  // Helper para encontrar o nome da comida pelo ID
  const getFoodName = (foodId: string): string => {
    const food = foods.find(f => f.id === foodId);
    return food ? food.name : 'Desconhecido';
  };
  
  // Formatar data
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };
  
  // Verificar se é hoje
  const isToday = (dateString: string): boolean => {
    return dateString === getCurrentDate();
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Diário Alimentar</h1>
        <p className="text-gray-600">Acompanhe o que você consumiu e sua evolução nutricional.</p>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => changeDate(-1)}
        >
          <ArrowLeft size={16} className="mr-1" /> Anterior
        </Button>
        <h2 className="text-lg font-medium">
          {isToday(selectedDate) ? 'Hoje' : formatDate(selectedDate)}
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => changeDate(1)}
          disabled={selectedDate >= getCurrentDate()}
        >
          Próximo <ArrowRight size={16} className="ml-1" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {selectedMealPlan ? (
            <div className="space-y-6">
              {selectedMealPlan.meals.map((meal, index) => {
                const nutrition = calculateMealNutrition(meal.foods);
                
                return (
                  <Card key={index} className="bg-white">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">
                          {meal.name} <span className="text-gray-500 text-sm ml-2">{meal.time}</span>
                        </CardTitle>
                        <Link to="/nutrition/plan">
                          <Button variant="ghost" size="sm">
                            <Edit size={16} />
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {meal.foods.map((item, foodIndex) => {
                          const food = foods.find(f => f.id === item.foodId);
                          if (!food) return null;
                          
                          return (
                            <div key={foodIndex} className="flex justify-between py-1 border-b">
                              <div>
                                <p className="font-medium">{food.name}</p>
                                <p className="text-xs text-gray-500">
                                  {item.servings} × {food.servingSize}{food.servingUnit}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{Math.round(food.calories * item.servings)} kcal</p>
                                <p className="text-xs text-gray-500">
                                  P: {Math.round(food.protein * item.servings)}g | 
                                  C: {Math.round(food.carbs * item.servings)}g | 
                                  G: {Math.round(food.fat * item.servings)}g
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="mt-3 text-right">
                        <p className="font-medium text-sm">Total: {Math.round(nutrition.calories)} kcal</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {selectedMealPlan.notes && (
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="text-lg">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">{selectedMealPlan.notes}</p>
                  </CardContent>
                </Card>
              )}
              
              <div className="flex justify-center mt-6">
                <Button 
                  asChild 
                  className="bg-fitness-secondary hover:bg-fitness-secondary/90"
                >
                  <Link to="/nutrition/plan">Editar Plano Alimentar</Link>
                </Button>
              </div>
            </div>
          ) : (
            <Card className="bg-white">
              <CardContent className="flex flex-col items-center py-12">
                <p className="text-gray-500 mb-4">Nenhum registro para esta data.</p>
                <Button 
                  asChild
                  className="bg-fitness-secondary hover:bg-fitness-secondary/90"
                >
                  <Link to="/nutrition/plan">Adicionar Plano Alimentar</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div>
          <Card className="bg-white sticky top-6">
            <CardHeader>
              <CardTitle>Resumo do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Calorias</span>
                    <span className="text-sm text-gray-500">
                      {Math.round(consumed.calories)} / {nutritionGoals.calories} kcal
                    </span>
                  </div>
                  <Progress value={percentages.calories} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Proteína</span>
                    <span className="text-sm text-gray-500">
                      {Math.round(consumed.protein)} / {nutritionGoals.protein} g
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
                      {Math.round(consumed.carbs)} / {nutritionGoals.carbs} g
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
                      {Math.round(consumed.fat)} / {nutritionGoals.fat} g
                    </span>
                  </div>
                  <Progress value={percentages.fat} className="h-2 bg-gray-200">
                    <div 
                      className="h-full bg-red-400" 
                      style={{ width: `${percentages.fat}%` }}
                    ></div>
                  </Progress>
                </div>
                
                <div className="border-t pt-3">
                  <h3 className="font-medium mb-2">Distribuição de Macronutrientes</h3>
                  <div className="flex h-4 rounded-md overflow-hidden mb-2">
                    <div 
                      className="bg-blue-500" 
                      style={{ width: `${consumed.protein * 4 / (consumed.protein * 4 + consumed.carbs * 4 + consumed.fat * 9) * 100 || 0}%` }}
                    ></div>
                    <div 
                      className="bg-yellow-400" 
                      style={{ width: `${consumed.carbs * 4 / (consumed.protein * 4 + consumed.carbs * 4 + consumed.fat * 9) * 100 || 0}%` }}
                    ></div>
                    <div 
                      className="bg-red-400" 
                      style={{ width: `${consumed.fat * 9 / (consumed.protein * 4 + consumed.carbs * 4 + consumed.fat * 9) * 100 || 0}%` }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-3 text-xs text-center">
                    <div>
                      <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-1"></div>
                      <p>Proteína</p>
                    </div>
                    <div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full mx-auto mb-1"></div>
                      <p>Carboidratos</p>
                    </div>
                    <div>
                      <div className="w-3 h-3 bg-red-400 rounded-full mx-auto mb-1"></div>
                      <p>Gorduras</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default FoodDiary;
