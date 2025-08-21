import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { MealPlan, Meal } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import MealForm from './MealForm';

interface MealPlanFormWithAIProps {
  onSubmit: (mealPlan: Omit<MealPlan, 'id'> | MealPlan) => void;
  initialMealPlan?: MealPlan;
}

const MealPlanFormWithAI: React.FC<MealPlanFormWithAIProps> = ({ 
  onSubmit, 
  initialMealPlan
}) => {
  const { generateAIMealPlan, user } = useAppContext();
  const { toast } = useToast();
  
  const [name, setName] = useState(initialMealPlan?.name || '');
  const [date, setDate] = useState(initialMealPlan?.date || new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(initialMealPlan?.notes || '');
  const [meals, setMeals] = useState<Meal[]>(initialMealPlan?.meals || []);
  const [isPublic, setIsPublic] = useState(initialMealPlan?.isPublic || false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddMeal = () => {
    const newMeal: Meal = {
      id: `temp-${Date.now()}`,
      name: '',
      time: '',
      foods: []
    };
    setMeals([...meals, newMeal]);
  };

  const handleRemoveMeal = (index: number) => {
    setMeals(meals.filter((_, i) => i !== index));
  };

  const handleMealChange = (index: number, meal: Meal) => {
    setMeals(meals.map((m, i) => i === index ? meal : m));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mealPlan = {
      id: initialMealPlan?.id,
      name,
      date,
      notes,
      isPublic,
      meals
    };
    onSubmit(mealPlan);
  };

  // Função para gerar plano alimentar com IA
  const handleGenerateWithAI = async () => {
    try {
      setIsLoading(true);
      
      // Dados do usuário para a IA
      const userData = {
        age: user?.birthdate ? Math.floor((new Date().getTime() - new Date(user.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
        weight: user?.weight,
        height: user?.height,
        goal: 'melhorar a saúde'
      };
      
      const nutritionalGoals = user?.nutritionGoals || {};
      
      // Chamar a IA para gerar o plano
      const response = await generateAIMealPlan({ userData, nutritionalGoals });
      
      // Aqui você pode processar a resposta da IA e atualizar o formulário
      // Por enquanto, vamos mostrar a resposta em um toast
      toast({
        title: "Plano gerado com IA",
        description: "O plano alimentar foi gerado com sucesso. Verifique a resposta da IA.",
      });
      
      // Em uma implementação completa, você processaria a resposta da IA
      // e atualizaria os campos do formulário com base nela
    } catch (error) {
      console.error('Erro ao gerar plano com IA:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o plano com IA. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular totais nutricionais
  const calculateTotals = () => {
    return meals.reduce((totals, meal) => {
      return meal.foods.reduce((mealTotals, food) => {
        const servings = parseFloat(food.servings.toString()) || 0;
        return {
          calories: mealTotals.calories + (food.food?.calories || 0) * servings,
          protein: mealTotals.protein + (food.food?.protein || 0) * servings,
          carbs: mealTotals.carbs + (food.food?.carbs || 0) * servings,
          fat: mealTotals.fat + (food.food?.fat || 0) * servings
        };
      }, totals);
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const totals = calculateTotals();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="meal-plan-name">Nome do Plano</Label>
          <Input
            id="meal-plan-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="meal-plan-date">Data</Label>
          <Input
            id="meal-plan-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="meal-plan-notes">Observações</Label>
        <Input
          id="meal-plan-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observações opcionais sobre este plano"
        />
      </div>

      <div className="flex justify-between items-center">
        <Label>Refeições</Label>
        <div className="flex gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleGenerateWithAI}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Sparkles className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Gerar com IA
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleAddMeal}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Refeição
            </Button>
          </motion.div>
        </div>
      </div>

      {meals.length > 0 ? (
        <div className="space-y-4">
          {meals.map((meal, index) => (
            <Card key={index} className="meal-plan-card">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">Refeição {index + 1}</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMeal(index)}
                  >
                    <Trash size={16} className="text-red-500" />
                  </Button>
                </div>
                <MealForm
                  initialMeal={meal}
                  onSubmit={(updatedMeal) => handleMealChange(index, updatedMeal)}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-gray-500 mb-4">Nenhuma refeição adicionada</p>
          <Button 
            type="button" 
            variant="outline"
            onClick={handleAddMeal}
          >
            <Plus size={16} className="mr-1" /> Adicionar Refeição
          </Button>
        </div>
      )}

      {/* Totais nutricionais */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">Totais Nutricionais</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Calorias</p>
              <p className="font-bold text-lg">{Math.round(totals.calories)}</p>
              <p className="text-xs text-gray-500">kcal</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Proteínas</p>
              <p className="font-bold text-lg">{Math.round(totals.protein)}</p>
              <p className="text-xs text-gray-500">g</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Carboidratos</p>
              <p className="font-bold text-lg">{Math.round(totals.carbs)}</p>
              <p className="text-xs text-gray-500">g</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Gorduras</p>
              <p className="font-bold text-lg">{Math.round(totals.fat)}</p>
              <p className="text-xs text-gray-500">g</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button 
        type="submit" 
        className="w-full bg-fitness-secondary hover:bg-fitness-secondary/90"
      >
        {initialMealPlan ? 'Atualizar Plano' : 'Criar Plano'}
      </Button>
    </form>
  );
};

export default MealPlanFormWithAI;
