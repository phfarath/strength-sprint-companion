
import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { MealPlan, Meal } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MealForm from './MealForm';
import { calculateMealNutrition } from '@/data/mockData';
import { Plus, Trash, Edit } from 'lucide-react';

interface MealPlanFormProps {
  initialMealPlan?: MealPlan;
  onSubmit: (mealPlan: MealPlan | Omit<MealPlan, 'id'>) => void;
}

const MealPlanForm: React.FC<MealPlanFormProps> = ({ initialMealPlan, onSubmit }) => {
  const { user } = useAppContext();
  const [date, setDate] = useState(initialMealPlan?.date || new Date().toISOString().split('T')[0]);
  const [meals, setMeals] = useState<Meal[]>(initialMealPlan?.meals || []);
  const [notes, setNotes] = useState(initialMealPlan?.notes || '');
  const [editingMealIndex, setEditingMealIndex] = useState<number | null>(null);
  const [isAddingMeal, setIsAddingMeal] = useState(false);

  // Calcular total de nutrientes para o plano
  const totalNutrition = meals.reduce((acc, meal) => {
    const mealNutrition = calculateMealNutrition(meal.foods);
    return {
      calories: acc.calories + mealNutrition.calories,
      protein: acc.protein + mealNutrition.protein,
      carbs: acc.carbs + mealNutrition.carbs,
      fat: acc.fat + mealNutrition.fat
    };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const handleAddMeal = (meal: Meal) => {
    setMeals([...meals, meal]);
    setIsAddingMeal(false);
  };

  const handleUpdateMeal = (meal: Meal, index: number) => {
    const updatedMeals = [...meals];
    updatedMeals[index] = meal;
    setMeals(updatedMeals);
    setEditingMealIndex(null);
  };

  const handleRemoveMeal = (index: number) => {
    setMeals(meals.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mealPlan = {
      id: initialMealPlan?.id || undefined,
      date,
      meals,
      notes
    };
    onSubmit(mealPlan);
  };

  return (
    <div className="space-y-6">
      {isAddingMeal ? (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Nova Refeição</CardTitle>
          </CardHeader>
          <CardContent>
            <MealForm 
              onSubmit={handleAddMeal}
            />
            <Button 
              variant="outline" 
              className="mt-4 w-full"
              onClick={() => setIsAddingMeal(false)}
            >
              Cancelar
            </Button>
          </CardContent>
        </Card>
      ) : editingMealIndex !== null ? (
        <Card>
          <CardHeader>
            <CardTitle>Editar Refeição</CardTitle>
          </CardHeader>
          <CardContent>
            <MealForm 
              initialMeal={meals[editingMealIndex]}
              onSubmit={(meal) => handleUpdateMeal(meal, editingMealIndex)}
            />
            <Button 
              variant="outline" 
              className="mt-4 w-full"
              onClick={() => setEditingMealIndex(null)}
            >
              Cancelar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="date">Data do Plano</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Refeições</Label>
              <Button 
                type="button" 
                onClick={() => setIsAddingMeal(true)}
                className="bg-fitness-secondary hover:bg-fitness-secondary/90"
                size="sm"
              >
                <Plus size={16} className="mr-1" /> Adicionar Refeição
              </Button>
            </div>

            {meals.length > 0 ? (
              <div className="space-y-4">
                {meals.map((meal, index) => {
                  const nutrition = calculateMealNutrition(meal.foods);
                  
                  return (
                    <Card key={index} className="meal-card">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <h3 className="font-medium">{meal.name}</h3>
                            <p className="text-sm text-gray-500">{meal.time}</p>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingMealIndex(index)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMeal(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash size={16} />
                            </Button>
                          </div>
                        </div>
                        
                        {meal.foods.length > 0 && (
                          <>
                            <div className="text-xs text-gray-500 mb-1">
                              {meal.foods.length} {meal.foods.length === 1 ? 'alimento' : 'alimentos'}
                            </div>
                            
                            <div className="text-sm grid grid-cols-4 gap-2">
                              <div>
                                <p className="font-medium">{Math.round(nutrition.calories)} kcal</p>
                              </div>
                              <div>
                                <p>P: {Math.round(nutrition.protein)}g</p>
                              </div>
                              <div>
                                <p>C: {Math.round(nutrition.carbs)}g</p>
                              </div>
                              <div>
                                <p>G: {Math.round(nutrition.fat)}g</p>
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium mb-2">Total do Dia</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Calorias</p>
                      <div className="flex justify-between">
                        <p className="font-medium">{Math.round(totalNutrition.calories)} kcal</p>
                        <p className="text-gray-500">/ {user.nutritionGoals.calories}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500">Proteínas</p>
                      <div className="flex justify-between">
                        <p className="font-medium">{Math.round(totalNutrition.protein)} g</p>
                        <p className="text-gray-500">/ {user.nutritionGoals.protein}g</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500">Carboidratos</p>
                      <div className="flex justify-between">
                        <p className="font-medium">{Math.round(totalNutrition.carbs)} g</p>
                        <p className="text-gray-500">/ {user.nutritionGoals.carbs}g</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500">Gorduras</p>
                      <div className="flex justify-between">
                        <p className="font-medium">{Math.round(totalNutrition.fat)} g</p>
                        <p className="text-gray-500">/ {user.nutritionGoals.fat}g</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed rounded-md">
                <p className="text-gray-500 mb-2">Nenhuma refeição adicionada</p>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingMeal(true)}
                >
                  <Plus size={16} className="mr-1" /> Adicionar Refeição
                </Button>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre este plano alimentar"
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-fitness-secondary hover:bg-fitness-secondary/90"
          >
            {initialMealPlan ? 'Atualizar Plano Alimentar' : 'Criar Plano Alimentar'}
          </Button>
        </form>
      )}
    </div>
  );
};

export default MealPlanForm;
