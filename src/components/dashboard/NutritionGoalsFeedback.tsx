
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppContext } from '@/context/AppContext';
import { calculateDailyNutrition } from '@/data/mockData';
import { FileText } from 'lucide-react';

const NutritionGoalsFeedback = () => {
  const { mealPlans, user, getCurrentDate } = useAppContext();
  const todayMealPlan = mealPlans.find(plan => plan.date === getCurrentDate());
  
  // Obter dados nutricionais e metas
  const goals = user.nutritionGoals;
  let consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  
  if (todayMealPlan) {
    consumed = calculateDailyNutrition(todayMealPlan);
  }
  
  // Calcular porcentagens de meta atingidas
  const percentages = {
    calories: Math.round((consumed.calories / goals.calories) * 100),
    protein: Math.round((consumed.protein / goals.protein) * 100),
    carbs: Math.round((consumed.carbs / goals.carbs) * 100),
    fat: Math.round((consumed.fat / goals.fat) * 100)
  };
  
  // Gerar feedback com base nas metas
  const getFeedbackMessages = () => {
    const messages = [];
    
    // Mensagens sobre proteína
    if (percentages.protein >= 90) {
      messages.push({
        type: "success",
        message: `Parabéns! Você atingiu ${percentages.protein}% da sua meta de proteína hoje!`
      });
    } else if (percentages.protein >= 50) {
      messages.push({
        type: "info",
        message: `Você está a caminho! ${percentages.protein}% da meta de proteína atingida.`
      });
    } else if (todayMealPlan) {
      messages.push({
        type: "warning",
        message: `Atenção para a proteína! Você atingiu apenas ${percentages.protein}% da meta diária.`
      });
    }
    
    // Mensagens sobre calorias
    if (percentages.calories > 110) {
      messages.push({
        type: "warning",
        message: `Você ultrapassou sua meta calórica em ${percentages.calories - 100}%!`
      });
    } else if (percentages.calories >= 90 && percentages.calories <= 110) {
      messages.push({
        type: "success",
        message: `Ótimo! Seu consumo calórico está dentro da meta ideal.`
      });
    }
    
    return messages;
  };
  
  const feedbackMessages = getFeedbackMessages();

  return (
    <Card className="bg-white rounded-lg shadow mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <FileText className="mr-2 h-5 w-5 text-fitness-secondary" />
          <CardTitle className="text-lg font-semibold">Feedback Nutricional</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {feedbackMessages.length > 0 ? (
          <div className="space-y-3">
            {feedbackMessages.map((msg, index) => (
              <Alert 
                key={index}
                variant={msg.type === "success" ? "default" : msg.type === "warning" ? "destructive" : "outline"}
                className={`
                  ${msg.type === "success" ? "bg-green-50 text-green-800 border-green-200" : ""}
                  ${msg.type === "warning" ? "bg-yellow-50 text-yellow-800 border-yellow-200" : ""}
                  ${msg.type === "info" ? "bg-blue-50 text-blue-800 border-blue-200" : ""}
                `}
              >
                <AlertDescription>{msg.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500">
              {todayMealPlan 
                ? "Nenhuma meta nutricional avaliada ainda hoje."
                : "Adicione suas refeições de hoje para receber feedback!"}
            </p>
          </div>
        )}
        
        {todayMealPlan && (
          <div className="mt-4 grid grid-cols-3 text-center gap-2">
            <div>
              <p className="text-xs text-gray-500">Proteínas</p>
              <p className="text-lg font-bold text-blue-600">{percentages.protein}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Carboidratos</p>
              <p className="text-lg font-bold text-yellow-600">{percentages.carbs}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Gorduras</p>
              <p className="text-lg font-bold text-red-600">{percentages.fat}%</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NutritionGoalsFeedback;
