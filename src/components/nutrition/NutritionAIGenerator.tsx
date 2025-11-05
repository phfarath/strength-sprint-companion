import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Calendar, ChefHat, Target, Loader2 } from 'lucide-react';
import { apiServices } from '@/services/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { format, addDays } from 'date-fns';

type GenerationType = 'single-meal' | 'daily-plan' | 'weekly-plan' | 'nutrition-program';
type MealType = 'café da manhã' | 'almoço' | 'jantar' | 'lanche' | 'ceia';
type ProgramType = 'cutting' | 'bulking' | 'maintenance' | 'recomp';

interface GeneratedData {
  type: GenerationType;
  data: any;
  planContext?: string;
}

const NutritionAIGenerator: React.FC = () => {
  const { user, addMealPlan } = useAppContext();
  const { toast } = useToast();
  
  const [generationType, setGenerationType] = useState<GenerationType>('single-meal');
  const [mealType, setMealType] = useState<MealType>('almoço');
  const [programType, setProgramType] = useState<ProgramType>('cutting');
  const [duration, setDuration] = useState<number>(8);
  const [customRequest, setCustomRequest] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      setGeneratedData(null);

      const userData = {
        age: user?.birthdate
          ? Math.floor(
              (Date.now() - new Date(user.birthdate).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
          : undefined,
        weight: user?.weight,
        height: user?.height,
        goal: (user as any)?.goal,
        dietaryRestrictions: (user as any)?.dietaryRestrictions,
        foodPreferences: (user as any)?.foodPreferences,
        customRequest,
      };

      const nutritionalGoals = user?.nutritionGoals || {};

      let response;
      let data;

      switch (generationType) {
        case 'single-meal':
          response = await apiServices.generateSingleMeal({
            userData,
            nutritionalGoals,
            mealType,
          });
          data = response.data;
          setGeneratedData({
            type: 'single-meal',
            data: data.meal,
            planContext: data.planContext,
          });
          break;

        case 'daily-plan':
          response = await apiServices.generateMealPlan({
            userData,
            nutritionalGoals,
          });
          data = response.data;
          setGeneratedData({
            type: 'daily-plan',
            data: data.mealPlan,
            planContext: data.planContext,
          });
          break;

        case 'nutrition-program':
          response = await apiServices.generateNutritionProgram({
            userData,
            nutritionalGoals,
            programType,
            duration,
          });
          data = response.data;
          setGeneratedData({
            type: 'nutrition-program',
            data: data.program,
            planContext: data.planContext,
          });
          break;

        default:
          throw new Error('Tipo de geração não suportado');
      }

      toast({
        title: 'Gerado com sucesso!',
        description: 'Revise o conteúdo e adicione ao seu calendário.',
      });
    } catch (error: any) {
      console.error('Erro ao gerar nutrição:', error);
      toast({
        title: 'Erro ao gerar',
        description: error?.response?.data?.message || 'Não foi possível gerar o conteúdo. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCalendar = () => {
    setShowCalendarModal(true);
  };

  const handleConfirmSchedule = async () => {
    if (!selectedDate || !generatedData) return;

    try {
      if (generatedData.type === 'single-meal') {
        // Convert single meal to meal plan format
        const mealPlan = {
          name: generatedData.data.name || 'Refeição AI',
          date: format(selectedDate, 'yyyy-MM-dd'),
          notes: generatedData.data.notes || '',
          meals: [
            {
              name: generatedData.data.name,
              time: generatedData.data.time || '',
              foods: (generatedData.data.items || []).map((item: any) => {
                // Create temporary food entry
                return {
                  foodId: 0, // Will be created on backend
                  servings: 1,
                  food: {
                    name: item.name,
                    calories: item.calories || 0,
                    protein: item.protein || 0,
                    carbs: item.carbs || 0,
                    fat: item.fat || 0,
                    weight: item.quantity || 0,
                  }
                };
              })
            }
          ]
        };
        
        await addMealPlan(mealPlan);
      } else if (generatedData.type === 'daily-plan') {
        // Already in meal plan format, just schedule it
        const meals = generatedData.data.meals || [];
        const mealPlan = {
          name: 'Plano Alimentar AI',
          date: format(selectedDate, 'yyyy-MM-dd'),
          notes: generatedData.data.notes || '',
          meals: meals.map((meal: any) => ({
            name: meal.name || 'Refeição',
            time: meal.time || '',
            foods: (meal.mealFoods || []).map((mf: any) => ({
              foodId: mf.foodId,
              servings: mf.quantity,
              food: mf.food
            }))
          }))
        };
        
        await addMealPlan(mealPlan);
      }

      setShowCalendarModal(false);
      toast({
        title: 'Adicionado ao calendário!',
        description: `Seu plano foi agendado para ${format(selectedDate, 'dd/MM/yyyy')}.`,
      });
    } catch (error) {
      console.error('Erro ao adicionar ao calendário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar ao calendário.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Gerador de Nutrição com IA
          </CardTitle>
          <CardDescription>
            Gere refeições, planos alimentares ou programas nutricionais completos com inteligência artificial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tipo de Geração */}
          <div className="space-y-3">
            <Label>Tipo de Geração</Label>
            <RadioGroup value={generationType} onValueChange={(value) => setGenerationType(value as GenerationType)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Label
                    htmlFor="single-meal"
                    className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      generationType === 'single-meal' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value="single-meal" id="single-meal" />
                    <div className="flex items-center gap-2">
                      <ChefHat className="w-5 h-5" />
                      <div>
                        <div className="font-medium">Refeição Única</div>
                        <div className="text-xs text-gray-500">Gere uma refeição específica</div>
                      </div>
                    </div>
                  </Label>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Label
                    htmlFor="daily-plan"
                    className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      generationType === 'daily-plan' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value="daily-plan" id="daily-plan" />
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      <div>
                        <div className="font-medium">Plano Diário</div>
                        <div className="text-xs text-gray-500">Plano completo para um dia</div>
                      </div>
                    </div>
                  </Label>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Label
                    htmlFor="nutrition-program"
                    className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      generationType === 'nutrition-program' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value="nutrition-program" id="nutrition-program" />
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      <div>
                        <div className="font-medium">Programa Nutricional</div>
                        <div className="text-xs text-gray-500">Programa completo de semanas</div>
                      </div>
                    </div>
                  </Label>
                </motion.div>
              </div>
            </RadioGroup>
          </div>

          {/* Opções específicas por tipo */}
          <AnimatePresence mode="wait">
            {generationType === 'single-meal' && (
              <motion.div
                key="single-meal-options"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <Label htmlFor="meal-type">Tipo de Refeição</Label>
                <Select value={mealType} onValueChange={(value) => setMealType(value as MealType)}>
                  <SelectTrigger id="meal-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="café da manhã">Café da Manhã</SelectItem>
                    <SelectItem value="almoço">Almoço</SelectItem>
                    <SelectItem value="jantar">Jantar</SelectItem>
                    <SelectItem value="lanche">Lanche</SelectItem>
                    <SelectItem value="ceia">Ceia</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>
            )}

            {generationType === 'nutrition-program' && (
              <motion.div
                key="program-options"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="space-y-3">
                  <Label htmlFor="program-type">Tipo de Programa</Label>
                  <Select value={programType} onValueChange={(value) => setProgramType(value as ProgramType)}>
                    <SelectTrigger id="program-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cutting">Cutting (Perda de Gordura)</SelectItem>
                      <SelectItem value="bulking">Bulking (Ganho de Massa)</SelectItem>
                      <SelectItem value="maintenance">Manutenção</SelectItem>
                      <SelectItem value="recomp">Recomposição Corporal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="duration">Duração (semanas)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="4"
                    max="24"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 8)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pedido personalizado */}
          <div className="space-y-3">
            <Label htmlFor="custom-request">Pedido Personalizado (Opcional)</Label>
            <Textarea
              id="custom-request"
              placeholder="Ex: Preciso de refeições rápidas, sem lactose, com alto teor de proteína..."
              value={customRequest}
              onChange={(e) => setCustomRequest(e.target.value)}
              rows={3}
            />
          </div>

          {/* Botão de gerar */}
          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar com IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado Gerado */}
      <AnimatePresence>
        {generatedData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Conteúdo Gerado</CardTitle>
                <CardDescription>Revise e adicione ao seu calendário</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preview do conteúdo gerado */}
                <div className="p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">
                    {JSON.stringify(generatedData.data, null, 2)}
                  </pre>
                </div>

                {/* Botão para adicionar ao calendário */}
                {(generatedData.type === 'single-meal' || generatedData.type === 'daily-plan') && (
                  <Button
                    onClick={handleAddToCalendar}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Adicionar ao Calendário
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de calendário */}
      <Dialog open={showCalendarModal} onOpenChange={setShowCalendarModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agendar no Calendário</DialogTitle>
            <DialogDescription>
              Escolha a data para adicionar este plano ao seu calendário
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center py-4">
            <CalendarPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCalendarModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmSchedule} disabled={!selectedDate}>
              Confirmar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NutritionAIGenerator;
