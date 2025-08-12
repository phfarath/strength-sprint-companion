import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { MealPlan, Meal } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MealForm from './MealForm';
import { Plus, Trash, Edit } from 'lucide-react';
import MealTemplates from './MealTemplates';
import { Switch } from '@/components/ui/switch';

interface MealPlanFormProps {
  initialMealPlan?: MealPlan;
  onSubmit: (mealPlan: MealPlan | Omit<MealPlan, 'id'>) => void;
}

const MealPlanForm: React.FC<MealPlanFormProps> = ({ initialMealPlan, onSubmit }) => {
  const { user, foods: contextFoods } = useAppContext();

  const [date, setDate] = useState(
    initialMealPlan?.date || new Date().toISOString().split('T')[0]
  );
  const [meals, setMeals] = useState<Meal[]>(
    initialMealPlan?.meals?.map(meal => ({
      ...meal,
      foods: (meal as any).foods || []
    })) || []
  );
  const [notes, setNotes] = useState(initialMealPlan?.notes || '');
  const [isPublic, setIsPublic] = useState(initialMealPlan?.isPublic || false);
  const [editingMealIndex, setEditingMealIndex] = useState<number | null>(null);
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [name, setName] = useState(initialMealPlan?.name || '');

  // Normalizar refeições vindas do backend (mealFoods -> foods)
  useEffect(() => {
    if (initialMealPlan) {
      setMeals(
        (initialMealPlan.meals || []).map(m => {
          const foods =
            (m as any).foods && (m as any).foods.length
              ? (m as any).foods
              : (((m as any).mealFoods || []) as any[]).map(mf => ({
                  foodId:
                    typeof mf.foodId === 'string'
                      ? parseInt(mf.foodId, 10)
                      : mf.foodId ?? mf.food?.id,
                  servings: parseFloat(
                    (mf.servings ?? mf.quantity ?? 1).toString()
                  )
                }));
          return {
            ...m,
            foods: foods.filter((f: any) => !isNaN(Number(f.foodId)))
          };
        })
      );
    }
  }, [initialMealPlan]);

  // Mapa de alimentos para lookup
  const foodsMap = React.useMemo(
    () => new Map(contextFoods.map(f => [Number(f.id), f])),
    [contextFoods]
  );

  // Nutrição de uma refeição
  const computeMealNutrition = React.useCallback(
    (meal: any) =>
      (meal.foods || []).reduce(
        (acc: any, f: any) => {
          const foodData = foodsMap.get(Number(f.foodId));
            if (foodData) {
              const servings =
                parseFloat(f.servings?.toString() || '1') || 1;
              acc.calories += foodData.calories * servings;
              acc.protein += foodData.protein * servings;
              acc.carbs += foodData.carbs * servings;
              acc.fat += foodData.fat * servings;
            }
          return acc;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      ),
    [foodsMap]
  );

  // Refeições calculadas
  const computedMeals = React.useMemo(
    () => meals.map(m => ({ ...m, nutrition: computeMealNutrition(m) })),
    [meals, computeMealNutrition]
  );

  // Totais do plano
  const planTotals = React.useMemo(
    () =>
      computedMeals.reduce(
        (acc, m: any) => {
          acc.calories += m.nutrition.calories;
          acc.protein += m.nutrition.protein;
          acc.carbs += m.nutrition.carbs;
          acc.fat += m.nutrition.fat;
          return acc;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      ),
    [computedMeals]
  );

  const handleAddMeal = (meal: Meal) => {
    setMeals(prev => [...prev, meal]);
    setIsAddingMeal(false);
  };

  const handleUpdateMeal = (meal: Meal, index: number) => {
    setMeals(prev => prev.map((m, i) => (i === index ? meal : m)));
    setEditingMealIndex(null);
  };

  const handleRemoveMeal = (index: number) => {
    setMeals(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedMeals = computedMeals.map(m => ({
      ...(m.id && { id: m.id }),
      name: (m as any).name,
      time: (m as any).time,
      foods: (m as any).foods.map((f: any) => ({
        foodId: Number(f.foodId),
        servings: parseFloat(f.servings?.toString() || '1')
      }))
    }));
    onSubmit({
      ...(initialMealPlan?.id && { id: initialMealPlan.id }),
      name,
      date,
      notes,
      isPublic,
      meals: normalizedMeals
    } as any);
  };

  const setEditingMealTemplate = (newMealTemplate: {
    id: string;
    name: string;
    time: string;
    foods: Meal['foods'];
  }) => {
    setMeals(prev => [...prev, newMealTemplate]);
    setEditingMealIndex(meals.length);
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
              onSelectTemplate={template => {
                setIsAddingMeal(false);
                const newMealTemplate = {
                  id: `temp-${Date.now()}`,
                  name: template.name,
                  time: template.time,
                  foods: []
                };
                if (template.name === 'Refeição Livre') {
                  setEditingMealTemplate(newMealTemplate);
                } else {
                  setMeals(prev => [...prev, newMealTemplate]);
                  setEditingMealIndex(meals.length);
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
                onSubmit={meal => handleUpdateMeal(meal, editingMealIndex)}
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
              onChange={e => setName(e.target.value)}
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
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
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
                  const mealData: any = computedMeals[index];
                  return (
                    <Card key={meal.id || index} className="meal-card">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <h3 className="font-medium">{mealData.name}</h3>
                            <p className="text-sm text-gray-500">
                              {mealData.time}
                            </p>
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

                        {mealData.foods && mealData.foods.length > 0 && (
                          <>
                            <div className="text-xs text-gray-500 mb-1">
                              {mealData.foods.length}{' '}
                              {mealData.foods.length === 1
                                ? 'alimento'
                                : 'alimentos'}
                            </div>

                            <div className="text-sm grid grid-cols-4 gap-2">
                              <div>
                                <p className="font-medium">
                                  {Math.round(mealData.nutrition.calories)} kcal
                                </p>
                              </div>
                              <div>
                                <p>
                                  P:{' '}
                                  {Math.round(mealData.nutrition.protein)}g
                                </p>
                              </div>
                              <div>
                                <p>
                                  C:{' '}
                                  {Math.round(mealData.nutrition.carbs)}g
                                </p>
                              </div>
                              <div>
                                <p>
                                  G: {Math.round(mealData.nutrition.fat)}g
                                </p>
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
                        <p className="font-medium">
                          {Math.round(planTotals.calories)} kcal
                        </p>
                        <p className="text-gray-500">
                          / {user?.nutritionGoals?.calories ?? 0}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500">Proteínas</p>
                      <div className="flex justify-between">
                        <p className="font-medium">
                          {Math.round(planTotals.protein)} g
                        </p>
                        <p className="text-gray-500">
                          / {user?.nutritionGoals?.protein ?? 0}g
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500">Carboidratos</p>
                      <div className="flex justify-between">
                        <p className="font-medium">
                          {Math.round(planTotals.carbs)} g
                        </p>
                        <p className="text-gray-500">
                          / {user?.nutritionGoals?.carbs ?? 0}g
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500">Gorduras</p>
                      <div className="flex justify-between">
                        <p className="font-medium">
                          {Math.round(planTotals.fat)} g
                        </p>
                        <p className="text-gray-500">
                          / {user?.nutritionGoals?.fat ?? 0}g
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed rounded-md">
                <p className="text-gray-500 mb-2">
                  Nenhuma refeição adicionada
                </p>
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
              onChange={e => setNotes(e.target.value)}
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
