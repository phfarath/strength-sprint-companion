
import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Meal, Food } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash } from 'lucide-react';
import { calculateMealNutrition } from '@/data/mockData';

interface MealFormProps {
  initialMeal?: Meal;
  onSubmit: (meal: Meal) => void;
}

const MealForm: React.FC<MealFormProps> = ({ initialMeal, onSubmit }) => {
  const { foods } = useAppContext();
  
  const [name, setName] = useState(initialMeal?.name || '');
  const [time, setTime] = useState(initialMeal?.time || '');
  const [selectedFoods, setSelectedFoods] = useState<{ foodId: string; servings: number }[]>(
    initialMeal?.foods || []
  );

  const nutrition = calculateMealNutrition(selectedFoods);

  const handleAddFood = (foodId: string) => {
    if (!selectedFoods.some(item => item.foodId === foodId)) {
      setSelectedFoods([...selectedFoods, { foodId, servings: 1 }]);
    }
  };

  const handleRemoveFood = (index: number) => {
    setSelectedFoods(selectedFoods.filter((_, i) => i !== index));
  };

  const handleServingsChange = (index: number, servings: number) => {
    setSelectedFoods(
      selectedFoods.map((item, i) => 
        i === index ? { ...item, servings } : item
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const meal: Meal = {
      id: initialMeal?.id || `meal-${Date.now()}`,
      name,
      time,
      foods: selectedFoods
    };
    onSubmit(meal);
  };

  // Helper para encontrar o nome da comida pelo ID
  const getFoodById = (foodId: string): Food | undefined => {
    return foods.find(f => f.id === foodId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="meal-name">Nome da Refeição</Label>
          <Input
            id="meal-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Café da manhã, Almoço..."
            required
          />
        </div>
        
        <div>
          <Label htmlFor="meal-time">Horário</Label>
          <Input
            id="meal-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <Label>Alimentos</Label>
          <Select onValueChange={handleAddFood}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Adicionar alimento" />
            </SelectTrigger>
            <SelectContent>
              {foods.map(food => (
                <SelectItem key={food.id} value={food.id}>
                  {food.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedFoods.length > 0 ? (
          <div className="space-y-3">
            {selectedFoods.map((item, index) => {
              const food = getFoodById(item.foodId);
              if (!food) return null;
              
              return (
                <Card key={index} className="meal-card">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{food.name}</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFood(index)}
                      >
                        <Trash size={16} className="text-red-500" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor={`servings-${index}`} className="text-xs">Porções</Label>
                        <Input
                          id={`servings-${index}`}
                          type="number"
                          value={item.servings}
                          onChange={(e) => handleServingsChange(index, parseFloat(e.target.value))}
                          className="h-8"
                          min="0.25"
                          step="0.25"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Tamanho da porção</p>
                        <p className="text-sm">{food.servingSize} {food.servingUnit}</p>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-600 grid grid-cols-4 gap-1">
                      <div>
                        <p className="font-medium">{Math.round(food.calories * item.servings)} kcal</p>
                      </div>
                      <div>
                        <p>P: {Math.round(food.protein * item.servings)}g</p>
                      </div>
                      <div>
                        <p>C: {Math.round(food.carbs * item.servings)}g</p>
                      </div>
                      <div>
                        <p>G: {Math.round(food.fat * item.servings)}g</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            <div className="border-t pt-3 mt-4">
              <h3 className="font-medium mb-2">Total da Refeição</h3>
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Calorias</p>
                  <p className="font-medium">{Math.round(nutrition.calories)} kcal</p>
                </div>
                <div>
                  <p className="text-gray-500">Proteínas</p>
                  <p className="font-medium">{Math.round(nutrition.protein)} g</p>
                </div>
                <div>
                  <p className="text-gray-500">Carboidratos</p>
                  <p className="font-medium">{Math.round(nutrition.carbs)} g</p>
                </div>
                <div>
                  <p className="text-gray-500">Gorduras</p>
                  <p className="font-medium">{Math.round(nutrition.fat)} g</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed rounded-md">
            <p className="text-gray-500">Nenhum alimento adicionado</p>
            <Button 
              type="button" 
              variant="outline" 
              className="mt-2"
              onClick={() => handleAddFood(foods[0]?.id || '')}
            >
              <Plus size={16} className="mr-1" /> Adicionar Alimento
            </Button>
          </div>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full bg-fitness-secondary hover:bg-fitness-secondary/90"
      >
        {initialMeal ? 'Atualizar Refeição' : 'Criar Refeição'}
      </Button>
    </form>
  );
};

export default MealForm;
