import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Meal, Food } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash } from 'lucide-react';
import { calculateMealNutrition } from '@/data/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import FoodModal from './FoodModal';
import { apiServices } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

const defaultFoods = [
  { id: "default-1", name: "Frango Grelhado", calories: 165, protein: 31, carbs: 0, fat: 3.6, weight: 100 },
  { id: "default-2", name: "Arroz Branco", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, weight: 100 },
  { id: "default-3", name: "Feijão Carioca", calories: 77, protein: 5.4, carbs: 13.6, fat: 0.5, weight: 100 },
  { id: "default-4", name: "Batata Doce", calories: 86, protein: 1.6, carbs: 20.1, fat: 0.1, weight: 100 },
  { id: "default-5", name: "Ovo", calories: 155, protein: 13, carbs: 1.1, fat: 11, weight: 100 },
  { id: "default-6", name: "Whey Protein", calories: 120, protein: 24, carbs: 3, fat: 2, weight: 30 },
  { id: "default-7", name: "Banana", calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, weight: 100 },
  { id: "default-8", name: "Aveia", calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9, weight: 100 },
  { id: "default-9", name: "Leite Desnatado", calories: 35, protein: 3.4, carbs: 4.8, fat: 0.1, weight: 100 },
  { id: "default-10", name: "Azeite de Oliva", calories: 884, protein: 0, carbs: 0, fat: 100, weight: 100 }
];

interface MealFormProps {
  initialMeal?: Meal;
  onSubmit: (meal: Meal) => void;
}

const MealForm: React.FC<MealFormProps> = ({ initialMeal, onSubmit }) => {
  const { foods: contextFoods } = useAppContext();
  const { toast } = useToast();
  
  const [name, setName] = useState(initialMeal?.name || '');
  const [time, setTime] = useState(initialMeal?.time || '');
  const [selectedFoods, setSelectedFoods] = useState<{ foodId: string; servings: number }[]>(
    initialMeal?.foods ? 
    initialMeal.foods.map(food => ({
      ...food,
      foodId: food.foodId.toString()
    })) : 
    []
  );
  const [foods, setFoods] = useState([]);
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDefaultFoods, setShowDefaultFoods] = useState(false);

  useEffect(() => {
    fetchFoods();
  }, []);

  // No início do MealForm, adicione esse código para formatar os IDs
  useEffect(() => {
    if (initialMeal?.foods) {
      // Normalizar os IDs dos alimentos para garantir compatibilidade
      setSelectedFoods(initialMeal.foods.map(food => ({
        ...food,
        foodId: food.foodId.toString().startsWith('f') ? 
          food.foodId.toString() : // Call toString() here to ensure it's a string
          `f${food.foodId}`
      })));
    }
  }, [initialMeal]);

  // Adicione isso onde o MealForm recebe os dados iniciais 
  useEffect(() => {
    if (initialMeal) {
      console.log("Meal Form - Dados recebidos:", initialMeal);
      console.log("Meal Form - Alimentos recebidos:", initialMeal.foods);
    }
  }, [initialMeal]);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      const response = await apiServices.getFoods();
      setFoods(response.data);
    } catch (error) {
      console.error("Erro ao buscar alimentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const nutrition = calculateMealNutrition(selectedFoods);

  const handleAddFood = async (foodId: string) => {
    console.log("handleAddFood recebeu ID:", foodId);
    
    // If it's a default food, add it to the database first
    if (foodId.startsWith("default-")) {
      try {
        const defaultFood = defaultFoods.find(f => f.id === foodId);
        if (defaultFood) {
          // Create a copy without the 'id' property
          const { id, ...foodData } = defaultFood;
          
          // Add the food to the database
          const response = await apiServices.createFood(foodData);
          console.log("Alimento padrão adicionado ao BD:", response.data);
          
          // Use the new database ID - verificando se precisa de normalização
          const newFoodId = response.data.id.toString();
          setSelectedFoods([...selectedFoods, { foodId: newFoodId, servings: 1 }]);
          return;
        }
      } catch (error) {
        console.error("Erro ao adicionar alimento padrão:", error);
        // Implementar toast adequadamente
        alert("Não foi possível adicionar o alimento padrão.");
      }
    }
    
    // Regular food ID - Defina porção como 1.0 explicitamente
    // Verifica se o alimento já não está na lista (evitando duplicatas)
    // Usa função auxiliar para normalizar IDs
    const foodAlreadySelected = selectedFoods.some(item => 
      normalizeId(item.foodId) === normalizeId(foodId)
    );
    
    if (!foodAlreadySelected) {
      console.log(`Adicionando alimento: ${foodId} com porção 1.0`);
      setSelectedFoods([...selectedFoods, { foodId: foodId.toString(), servings: 1.0 }]);
    } else {
      console.log(`Alimento ${foodId} já está na refeição`);
    }
  };

  // Função auxiliar para normalizar IDs
  const normalizeId = (id: string | number): string => {
    const stringId = id.toString();
    return stringId.startsWith('f') ? stringId.substring(1) : stringId;
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

  // Modificar a função handleSubmit para simplificar a normalização de IDs

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  // Normaliza os IDs dos alimentos para números
  const normalizedFoods = selectedFoods.map(item => {
      // Simplificar a conversão de ID
      let foodId = item.foodId.toString();
      
      // Remover prefixo 'f' se existir
      if (foodId.startsWith('f')) {
        foodId = foodId.substring(1);
      }
      
      // Validar se representa um número válido (sem converter para número)
      const numericValue = parseInt(foodId, 10);
      if (isNaN(numericValue) || numericValue <= 0) {
        console.error(`ID de alimento inválido: ${item.foodId}`);
        return null;
      }
      
      // Converter para número para compatibilidade com o tipo MealFood
      return {
        foodId: parseInt(foodId, 10), // Converter para número
        servings: parseFloat(item.servings.toString())
      };
    }).filter(item => item !== null); // Remover itens inválidos
  
  console.log('Alimentos normalizados para envio:', normalizedFoods);
  
  const meal: Partial<Meal> = {
    // Não defina ID para novas refeições
    ...(initialMeal?.id && { id: initialMeal.id }), // Só inclui ID se for edição
    name,
    time,
    foods: normalizedFoods
  };
  
  // Log detalhado para depuração
  console.log('Enviando refeição para o backend:', JSON.stringify(meal, null, 2));
  
  onSubmit(meal as Meal);
};

  const handleFoodCreated = (newFood) => {
    setFoods([...foods, newFood]);
  };

  // Modifique a função getFoodById para tratar IDs com mais flexibilidade
const getFoodById = (foodId: string) => {
  // Normaliza o ID - remove prefixo 'f' para comparação
  const normalizedId = foodId.toString().startsWith('f') 
    ? foodId.substring(1) 
    : foodId;
    
  // Log para depuração
  console.log(`Procurando alimento. ID original: ${foodId}, ID normalizado: ${normalizedId}`);
  
  // Primeiro tenta com ID exato
  let apiFood = foods.find(food => food.id === foodId);
  if (apiFood) return apiFood;
  
  // Tenta com ID numérico
  apiFood = foods.find(food => food.id === parseInt(normalizedId) || food.id === `f${normalizedId}`);
  if (apiFood) return apiFood;
  
  // Tenta com prefixo f
  apiFood = foods.find(food => `f${food.id}` === foodId);
  if (apiFood) return apiFood;
  
  // Procura nos alimentos padrão
  const defaultFood = defaultFoods.find(food => food.id === foodId);
  if (defaultFood) return defaultFood;
  
  console.warn(`Alimento não encontrado para ID: ${foodId}`);
  return null;
};

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="meal-name">Nome da Refeição</Label>
        <Input
          id="meal-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Café da manhã, Almoço..."
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="meal-time">Horário</Label>
        <Input
          id="meal-time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          placeholder="Ex: 08:00"
        />
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Alimentos</Label>
          <div className="flex space-x-2">
            <Button 
              type="button" 
              variant={showDefaultFoods ? "outline" : "default"} 
              size="sm"
              onClick={() => setShowDefaultFoods(false)}
            >
              Meus
            </Button>
            <Button 
              type="button"
              variant={!showDefaultFoods ? "outline" : "default"}
              size="sm"
              onClick={() => setShowDefaultFoods(true)}
            >
              Padrão
            </Button>
          </div>
        </div>
        
        <Select onValueChange={handleAddFood}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um alimento..." />
          </SelectTrigger>
          <SelectContent>
            {showDefaultFoods ? (
              defaultFoods.map(food => (
                <SelectItem key={food.id} value={food.id}>
                  {food.name} - {food.calories} kcal
                </SelectItem>
              ))
            ) : (
              foods.map(food => (
                <SelectItem key={food.id} value={food.id}>
                  {food.name} - {food.calories} kcal
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <AnimatePresence>
        {selectedFoods.length > 0 ? (
          <div className="space-y-3 mt-2">
            {selectedFoods.map((item, index) => {
              const food = getFoodById(item.foodId);
              if (!food) return null;
              
              return (
                <motion.div
                  key={`${food.id}-${index}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="meal-card">
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
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <Label htmlFor={`servings-${index}`} className="text-xs text-gray-500">
                            Porções
                          </Label>
                          <Input
                            id={`servings-${index}`}
                            type="number"
                            min="0.25"
                            step="0.25"
                            value={item.servings}
                            onChange={(e) => handleServingsChange(index, parseFloat(e.target.value))}
                            className="h-8"
                          />
                        </div>
                        
                        <div className="text-sm grid grid-cols-4 gap-2 flex-grow">
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
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
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
          <div className="text-center py-6 border border-dashed rounded-md mt-2">
            <p className="text-gray-500 mb-2">Nenhum alimento adicionado</p>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setFoodModalOpen(true)}
            >
              <Plus size={16} className="mr-1" /> Adicionar Alimento
            </Button>
          </div>
        )}
      </AnimatePresence>
      
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <Button 
          type="submit" 
          className="w-full bg-fitness-secondary hover:bg-fitness-secondary/90"
        >
          {initialMeal ? 'Atualizar Refeição' : 'Criar Refeição'}
        </Button>
      </motion.div>
      
      {/* Modal para criar alimento */}
      <FoodModal 
        open={foodModalOpen}
        onOpenChange={setFoodModalOpen}
        onFoodCreated={handleFoodCreated}
      />
    </form>
  );
};

export default MealForm;
function toast(arg0: { title: string; description: string; variant: string; }) {
  throw new Error('Function not implemented.');
}

