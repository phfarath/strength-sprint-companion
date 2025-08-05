import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { MealPlan, Meal } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MealForm from './MealForm';
import { Plus, Trash, Edit } from 'lucide-react';
import MealTemplates from "./MealTemplates";
import { AnimatePresence, motion } from "framer-motion";
import { Switch } from '@/components/ui/switch';

interface MealPlanFormProps {
  initialMealPlan?: MealPlan;
  onSubmit: (mealPlan: MealPlan | Omit<MealPlan, 'id'>) => void;
}

const MealPlanForm: React.FC<MealPlanFormProps> = ({ initialMealPlan, onSubmit }) => {
  const { user, foods: allFoods } = useAppContext();
  const [date, setDate] = useState(initialMealPlan?.date || new Date().toISOString().split('T')[0]);
  // Ensure all meals have a foods array
  const [meals, setMeals] = useState<Meal[]>(
    initialMealPlan?.meals?.map(meal => ({
      ...meal,
      foods: meal.foods || [] // Ensure foods is never undefined
    })) || []
  );
  const [notes, setNotes] = useState(initialMealPlan?.notes || '');
  const [isPublic, setIsPublic] = useState(initialMealPlan?.isPublic || false);
  const [editingMealIndex, setEditingMealIndex] = useState<number | null>(null);
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [name, setName] = useState(initialMealPlan?.name || '');

  const findFood = (id: string | number) =>
    allFoods.find(f => f.id.toString() === id.toString() || `f${f.id}` === id.toString());

  const calculateNutrition = (items: { foodId: string | number; servings: number }[]) =>
    items.reduce((acc, item) => {
      const food = findFood(item.foodId);
      if (food) {
        acc.calories += food.calories * item.servings;
        acc.protein += food.protein * item.servings;
        acc.carbs += food.carbs * item.servings;
        acc.fat += food.fat * item.servings;
      }
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const totalNutrition = meals.reduce((acc, meal) => {
    const mealNutrition = calculateNutrition(meal.foods);
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
      name: name || `Plano de ${new Date(date).toLocaleDateString()}`,
      date,
      meals,
      notes,
      isPublic
    };
    onSubmit(mealPlan);
  };

  const setEditingMealTemplate = (newMealTemplate: { id: string; name: string; time: string; foods: Meal['foods']; }) => {
    // Add the new meal template to the meals array
    setMeals([...meals, newMealTemplate]);
    // Set the editing index to point to the newly added meal
    setEditingMealIndex(meals.length);
    // Close the "adding meal" state as we're now in edit mode
    setIsAddingMeal(false);
  };

  return (
    <div className="space-y-6">
      {isAddingMeal ? (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Nova Refeição</CardTitle>
          </CardHeader>
          <CardContent>
            <MealTemplates 
              onSelectTemplate={(template) => {
                setIsAddingMeal(false);
                // Criar uma "shell" de refeição baseada no template
                const newMealTemplate = {
                  id: `temp-${Date.now()}`,
                  name: template.name,
                  time: template.time,
                  foods: []
                };
                
                // Se for um template livre, vá direto para o MealForm
                if (template.name === "Refeição Livre") {
                  setEditingMealTemplate(newMealTemplate);
                } else {
                  // Se for um template predefinido, adicione-o diretamente
                  // e vá para a seleção de alimentos
                  setMeals([...meals, newMealTemplate]);
                  setEditingMealIndex(meals.length); // Índice da nova refeição
                }
              }}
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
            <Label htmlFor="name">Nome do Plano</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Plano de Definição"
              required
            />
          </div>

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

          <div className="flex items-center space-x-2">
            <Switch id="isPublic" checked={isPublic} onCheckedChange={setIsPublic} />
            <Label htmlFor="isPublic">Plano público</Label>
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
                  const nutrition = calculateNutrition(meal.foods || []);
                  
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
                        
                        {(meal.foods && meal.foods.length > 0) && (
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
