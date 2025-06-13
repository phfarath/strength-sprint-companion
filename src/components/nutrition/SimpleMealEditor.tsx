import React, { useState, useEffect } from "react";
import { Meal } from "@/types";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calculateMealNutrition } from "@/data/mockData";
import { Trash2, Plus, Edit, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SimpleMealEditorProps {
  meal: Meal;
  onSave: (meal: Meal) => void;
  onCancel: () => void;
}

const SimpleMealEditor: React.FC<SimpleMealEditorProps> = ({ meal, onSave, onCancel }) => {
  const { foods } = useAppContext();
  const [name, setName] = useState(meal.name);
  const [time, setTime] = useState(meal.time || "");
  const [selectedFoods, setSelectedFoods] = useState(meal.foods);
  const [selectedFoodId, setSelectedFoodId] = useState("");

  // Cálculo de nutrição total da refeição
  const nutrition = calculateMealNutrition(
    selectedFoods.map(food => ({
      ...food,
      foodId: food.foodId.toString()
    }))
  );
  
  // Função para adicionar alimento à refeição
  const addFood = (foodId: string) => {
    // Converter para número e remover prefixo 'f' se existir
    const numericFoodId = parseInt(foodId.replace(/^f/, ''), 10);
    
    // Verificar se já existe
    if (selectedFoods.some(f => f.foodId === numericFoodId)) {
      return;
    }
    
    setSelectedFoods([...selectedFoods, { foodId: numericFoodId, servings: 1 }]);
    setSelectedFoodId("");
  };
  
  // Função para remover alimento da refeição
  const removeFood = (index: number) => {
    setSelectedFoods(selectedFoods.filter((_, i) => i !== index));
  };
  
  // Função para atualizar a quantidade de porções
  const updateServings = (index: number, servings: number) => {
    setSelectedFoods(
      selectedFoods.map((food, i) => 
        i === index ? { ...food, servings } : food
      )
    );
  };
  
  // Encontra o nome do alimento pelo ID
  const getFoodName = (foodId: string | number): string => {
    const foodIdStr = foodId.toString();
    const food = foods.find(f => 
      f.id.toString() === foodIdStr || 
      f.id.toString() === foodIdStr.replace(/^f/, '') || // Fix: Compare strings with strings
      `f${f.id}` === foodIdStr
    );
    return food ? food.name : "Desconhecido";
  };
  
  // Função para salvar a refeição
  const handleSave = () => {
    onSave({
      ...meal,
      name,
      time,
      foods: selectedFoods
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar Refeição</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="meal-name">Nome da Refeição</Label>
            <Input
              id="meal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Café da manhã"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="meal-time">Horário</Label>
            <Input
              id="meal-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="Ex: 08:00"
              className="mt-1"
            />
          </div>
        </div>
        
        <div className="space-y-3">
          <Label>Adicionar Alimentos</Label>
          <div className="flex gap-2">
            <Select 
              value={selectedFoodId} 
              onValueChange={setSelectedFoodId}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione um alimento..." />
              </SelectTrigger>
              <SelectContent>
                {foods.map((food) => (
                  <SelectItem key={food.id} value={food.id.toString()}>
                    {food.name} - {Math.round(food.calories)} kcal
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              type="button" 
              onClick={() => selectedFoodId && addFood(selectedFoodId)}
              disabled={!selectedFoodId}
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Alimentos Selecionados</Label>
          
          {selectedFoods.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">
              Nenhum alimento adicionado. Adicione alimentos acima.
            </p>
            ) : (
            <AnimatePresence>
              {selectedFoods.map((food: { foodId: number; servings: number }, index: number) => {
              const foodData: { id: number | string; name: string; calories: number; protein: number } | undefined = foods.find(f => 
                f.id.toString() === food.foodId.toString() || 
                f.id.toString() === food.foodId.toString().replace(/^f/, '') || // Fix: Compare strings with strings
                `f${f.id}` === food.foodId.toString()
              );
                return (
                  <motion.div
                    key={`${food.foodId}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-between border rounded-md p-2"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{getFoodName(food.foodId)}</p>
                      {foodData && (
                        <p className="text-xs text-gray-500">
                          {Math.round(foodData.calories * food.servings)} kcal 
                          ({Math.round(foodData.protein * food.servings)}g proteína)
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => updateServings(index, Math.max(0.5, food.servings - 0.5))}
                          className="w-8 h-8 flex items-center justify-center rounded"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={food.servings}
                          onChange={(e) => updateServings(index, parseFloat(e.target.value) || 0)}
                          className="w-16 text-center border rounded-md py-1 px-2"
                        />
                        <button
                          type="button"
                          onClick={() => updateServings(index, food.servings + 0.5)}
                          className="w-8 h-8 flex items-center justify-center rounded"
                        >
                          +
                        </button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFood(index)}
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
        
        <div className="border-t pt-4 mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-gray-500 text-sm">Calorias</p>
              <p className="font-medium">{Math.round(nutrition.calories)} kcal</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Proteínas</p>
              <p className="font-medium">{Math.round(nutrition.protein)} g</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Carboidratos</p>
              <p className="font-medium">{Math.round(nutrition.carbs)} g</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Gorduras</p>
              <p className="font-medium">{Math.round(nutrition.fat)} g</p>
            </div>
          </div>
          
          <div className="flex justify-between gap-4">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-fitness-secondary">
              Salvar Refeição
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleMealEditor;