import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Meal, Food } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FoodModal from './FoodModal';
import { apiServices } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

function normalizeId(id: string | number): number {
  // Remove prefixo 'f' se existir e converte para número
  const s = id.toString();
  const clean = s.startsWith('f') ? s.slice(1) : s;
  const n = parseInt(clean, 10);
  return isNaN(n) ? -1 : n;
}

// (Opcional) helper para garantir que salvamos foodId sempre numérico
function ensureNumericFoodId(foodId: string | number): number {
  return normalizeId(foodId);
}

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

// NOVO: separar minhas comidas e públicas
  const [myFoods, setMyFoods] = useState<any[]>([]);
  const [publicFoods, setPublicFoods] = useState<any[]>([]);

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
      const [myRes, pubRes] = await Promise.all([
        apiServices.getMyFoods(),
        apiServices.getPublicFoods()
      ]);
      const my = Array.isArray(myRes.data) ? myRes.data : [];
      const pub = Array.isArray(pubRes.data) ? pubRes.data : [];
      setMyFoods(my);
      setPublicFoods(pub);
      setFoods([...my, ...pub]); // compat para quem usa foods combinado
    } catch (error) {
      console.error("Erro ao buscar alimentos:", error);
      // Fallback: usa combinado
      try {
        const response = await apiServices.getFoods();
        const all = response.data || [];
        setMyFoods(all.filter((f: any) => !f.isPublic));
        setPublicFoods(all.filter((f: any) => f.isPublic));
        setFoods(all);
      } catch (e2) {
        console.error("Fallback /foods também falhou:", e2);
        setMyFoods([]);
        setPublicFoods([]);
        setFoods([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateNutrition = () => {
    // helper para achar o alimento em qualquer fonte
    const findAnyFood = (fid: string | number) => {
      const idNum = ensureNumericFoodId(fid);
      if (idNum !== -1) {
        // procurar nos bancos (meus e públicos)
        const f =
          myFoods.find((x: any) => x.id === idNum) ||
          publicFoods.find((x: any) => x.id === idNum);
        if (f) return f;
      }
      // se for default-id (ex: default-1), use a tabela local de defaults
      const fidStr = fid.toString();
      if (fidStr.startsWith('default-')) {
        return defaultFoods.find(df => df.id === fidStr);
      }
      return null;
    };

    return selectedFoods.reduce((acc, item) => {
      const food = findAnyFood(item.foodId);
      if (food) {
        acc.calories += food.calories * item.servings;
        acc.protein  += food.protein  * item.servings;
        acc.carbs    += food.carbs    * item.servings;
        acc.fat      += food.fat      * item.servings;
      }
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const nutrition = calculateNutrition();

  const handleAddFood = async (foodId: string) => {
    console.log("handleAddFood recebeu ID:", foodId);

    // Se for default, apenas adiciona à refeição, sem persistir agora
    if (foodId.startsWith("default-")) {
      setSelectedFoods(prev => [...prev, { foodId, servings: 1 }]);
      return;
    }

    // Regular food ID - evitar duplicata
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

// ATUALIZADO: submit assíncrono para materializar defaults como públicos
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // mapear default-* -> criar como público (isPublic: true) se ainda não existir
  const defaultsInUse = selectedFoods
    .map(sf => sf.foodId.toString())
    .filter(id => id.startsWith('default-'));

  // criar apenas uma vez por default-id
  const uniqueDefaults = Array.from(new Set(defaultsInUse));

  // mapa default-id -> novo id numérico
  const defaultIdMap: Record<string, number> = {};

  // tentar reaproveitar públicos existentes por nome (evita duplicatas)
  for (const defId of uniqueDefaults) {
    const df = defaultFoods.find(d => d.id === defId);
    if (!df) continue;

    // procurar em publicFoods por nome igual
    const existing = publicFoods.find(p => p.name === df.name);
    if (existing) {
      defaultIdMap[defId] = existing.id;
      continue;
    }

    try {
      const payload = {
        name: df.name,
        weight: df.weight,
        calories: df.calories,
        protein: df.protein,
        carbs: df.carbs,
        fat: df.fat,
        isPublic: true
      };
      const created = await apiServices.createFood(payload);
      defaultIdMap[defId] = created.data.id;
    } catch (err) {
      console.error("Falha ao criar alimento padrão como público:", err);
    }
  }

  // Normaliza os IDs dos alimentos para números
  const normalizedFoods = selectedFoods.map(item => {
    const fidStr = item.foodId.toString();
    // se for default-*, substitui pelo id público criado/encontrado
    if (fidStr.startsWith('default-')) {
      const mapped = defaultIdMap[fidStr];
      if (typeof mapped === 'number') {
        return { foodId: mapped, servings: parseFloat(item.servings.toString()) };
      }
      // se não conseguiu mapear, ignora o item (não enviar inválido)
      return null;
    }

    // caso normal (da API), garantir numérico
    const fid = ensureNumericFoodId(item.foodId);
    if (fid === -1) return null;

    return {
      foodId: fid,
      servings: parseFloat(item.servings.toString())
    };
  }).filter(Boolean);

  console.log('Alimentos normalizados para envio:', normalizedFoods);

  const meal: Partial<Meal> = {
    ...(initialMeal?.id && { id: initialMeal.id }),
    name,
    time,
    foods: normalizedFoods as any
  };

  console.log('Enviando refeição para o backend:', JSON.stringify(meal, null, 2));

  onSubmit(meal as Meal);

  // opcional: refresh listas públicas após criar defaults
  if (Object.keys(defaultIdMap).length > 0) {
    await fetchFoods();
  }
};

  const handleFoodCreated = (newFood) => {
    setFoods([...foods, newFood]);
  };

  // Simpler: buscar alimento em qualquer fonte
const getFoodById = (foodId: string) => {
  const fidStr = foodId.toString();
  // procurar default
  if (fidStr.startsWith('default-')) {
    return defaultFoods.find(f => f.id === fidStr) || null;
  }
  const idNum = ensureNumericFoodId(fidStr);
  return (
    myFoods.find(f => f.id === idNum) ||
    publicFoods.find(f => f.id === idNum) ||
    null
  );
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
              <>
                {publicFoods.map(food => (
                  <SelectItem key={`pub-${food.id}`} value={food.id}>
                    {food.name} - {food.calories} kcal
                  </SelectItem>
                ))}
                {defaultFoods.map(food => (
                  <SelectItem key={food.id} value={food.id}>
                    {food.name} - {food.calories} kcal
                  </SelectItem>
                ))}
              </>
            ) : (
              myFoods.map(food => (
                <SelectItem key={`my-${food.id}`} value={food.id}>
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

