import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { apiServices } from '@/services/api';
import { motion } from 'framer-motion';

interface FoodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFood?: any;
  onFoodCreated?: (food: any) => void;
}

const FoodModal: React.FC<FoodModalProps> = ({ 
  open, 
  onOpenChange, 
  initialFood, 
  onFoodCreated 
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [foodData, setFoodData] = useState({
    name: '',
    weight: 100,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    isPublic: false
  });

  // Carregar dados do alimento para edição se houver
  useEffect(() => {
    if (initialFood) {
      setFoodData({
        name: initialFood.name || '',
        weight: initialFood.weight || 100,
        calories: initialFood.calories || 0,
        protein: initialFood.protein || 0,
        carbs: initialFood.carbs || 0,
        fat: initialFood.fat || 0,
        isPublic: initialFood.isPublic || false
      });
    } else {
      // Reset para valores padrão ao abrir para criação
      setFoodData({
        name: '',
        weight: 100,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        isPublic: false
      });
    }
  }, [initialFood, open]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFoodData({
      ...foodData,
      [name]: type === 'number' ? parseFloat(value) : value
    });
  };
  
  const handleCheckboxChange = (checked: boolean) => {
    setFoodData({
      ...foodData,
      isPublic: checked
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!foodData.name || !foodData.weight) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o nome e peso do alimento.",
        variant: "destructive"
      });
      return;
    }
    
    // Preparar dados com tipos corretos
    const dataToSend = {
      name: foodData.name,
      weight: parseFloat(foodData.weight.toString()),
      calories: parseFloat(foodData.calories.toString() || "0"),
      protein: parseFloat(foodData.protein.toString() || "0"),
      carbs: parseFloat(foodData.carbs.toString() || "0"),
      fat: parseFloat(foodData.fat.toString() || "0"),
      isPublic: Boolean(foodData.isPublic)
    };
    
    console.log("Enviando dados para API:", dataToSend);
    
    setIsSubmitting(true);
    
    try {
      let response;
      
      if (initialFood?.id) {
        // Atualizar alimento existente
        response = await apiServices.updateFood(initialFood.id, dataToSend);
        toast({
          title: "Alimento atualizado",
          description: `${foodData.name} foi atualizado com sucesso.`
        });
      } else {
        // Criar novo alimento
        response = await apiServices.createFood(dataToSend);
        toast({
          title: "Alimento adicionado",
          description: `${foodData.name} foi adicionado com sucesso.`
        });
      }
      
      if (onFoodCreated) {
        onFoodCreated(response.data);
      }
      
      // Fechar modal
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar alimento:", error);
      
      // Mostrar mais detalhes do erro para debugging
      if (error.response) {
        console.error("Resposta do servidor:", error.response.data);
      }
      
      toast({
        title: "Erro ao salvar alimento",
        description: "Não foi possível salvar o alimento. Verifique o console para mais detalhes.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calcular kcal por macronutriente
  const macroCalories = {
    protein: Math.round(foodData.protein * 4),
    carbs: Math.round(foodData.carbs * 4),
    fat: Math.round(foodData.fat * 9)
  };
  
  // Verificar se calorias batem com macros
  const calculatedCalories = macroCalories.protein + macroCalories.carbs + macroCalories.fat;
  const caloriesDifference = Math.abs(calculatedCalories - foodData.calories);
  const showCaloriesWarning = caloriesDifference > 10 && calculatedCalories > 0;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialFood ? 'Editar Alimento' : 'Adicionar Novo Alimento'}
          </DialogTitle>
          <DialogDescription>
            Informe os dados nutricionais do alimento. Os valores devem ser baseados na porção informada.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Alimento *</Label>
            <Input
              id="name"
              name="name"
              value={foodData.name}
              onChange={handleInputChange}
              placeholder="Ex: Frango Grelhado"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Porção (g) *</Label>
              <Input
                id="weight"
                name="weight"
                type="number"
                value={foodData.weight}
                onChange={handleInputChange}
                min="1"
                step="1"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="calories">Calorias (kcal)</Label>
              <Input
                id="calories"
                name="calories"
                type="number"
                value={foodData.calories}
                onChange={handleInputChange}
                min="0"
                step="1"
                className={showCaloriesWarning ? "border-yellow-500" : ""}
              />
              {showCaloriesWarning && (
                <p className="text-xs text-yellow-600 mt-1">
                  Pelos macros, seria {calculatedCalories} kcal (dif: {caloriesDifference})
                </p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="protein">Proteínas (g)</Label>
              <Input
                id="protein"
                name="protein"
                type="number"
                value={foodData.protein}
                onChange={handleInputChange}
                min="0"
                step="0.1"
              />
              <p className="text-xs text-gray-500">{macroCalories.protein} kcal</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="carbs">Carboidratos (g)</Label>
              <Input
                id="carbs"
                name="carbs"
                type="number"
                value={foodData.carbs}
                onChange={handleInputChange}
                min="0"
                step="0.1"
              />
              <p className="text-xs text-gray-500">{macroCalories.carbs} kcal</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fat">Gorduras (g)</Label>
              <Input
                id="fat"
                name="fat"
                type="number"
                value={foodData.fat}
                onChange={handleInputChange}
                min="0"
                step="0.1"
              />
              <p className="text-xs text-gray-500">{macroCalories.fat} kcal</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="isPublic" 
              checked={foodData.isPublic}
              onCheckedChange={handleCheckboxChange}
            />
            <Label htmlFor="isPublic" className="text-sm font-normal">
              Tornar este alimento público para todos os usuários
            </Label>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
            >
              <Button type="submit" disabled={isSubmitting} className="bg-fitness-primary">
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-1">⟳</span>
                    {initialFood ? 'Atualizando...' : 'Salvando...'}
                  </>
                ) : initialFood ? 'Atualizar Alimento' : 'Adicionar Alimento'}
              </Button>
            </motion.div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FoodModal;