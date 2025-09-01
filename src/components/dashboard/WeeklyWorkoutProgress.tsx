
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAppContext } from '@/context/AppContext';
import { Activity } from 'lucide-react';

const WeeklyWorkoutProgress = () => {
  const { workoutLogs, workoutPlans } = useAppContext();
  
  // Calcular estatísticas da semana atual
  const calculateWeeklyStats = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Início da semana (domingo)
    
    // Treinos planejados para esta semana
    const plannedWorkouts = workoutPlans.length;
    
    // Treinos completados esta semana
    const completedWorkouts = workoutLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= startOfWeek && logDate <= today && log.completed;
    }).length;
    
    return {
      planned: plannedWorkouts,
      completed: completedWorkouts,
      percentComplete: plannedWorkouts > 0 
        ? Math.min((completedWorkouts / plannedWorkouts) * 100, 100) 
        : 0
    };
  };
  
  const weeklyStats = calculateWeeklyStats();
  
  // Definir mensagem de motivação com base no progresso
  const getMotivationalMessage = () => {
    const percent = weeklyStats.percentComplete;
    
    if (percent === 0) return "Vamos começar! Todo progresso começa com o primeiro passo.";
    if (percent < 25) return "Você está no caminho certo! Continue assim.";
    if (percent < 50) return "Bom progresso! Já está na metade do caminho.";
    if (percent < 75) return "Excelente! Você está se aproximando da meta semanal.";
    if (percent < 100) return "Quase lá! Só mais alguns treinos para completar.";
    return "Parabéns! Você completou todos os treinos desta semana!";
  };

  return (
    <Card className="bg-white rounded-lg shadow mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <Activity className="mr-2 h-5 w-5 text-fitness-primary" />
          <CardTitle className="text-lg font-semibold">Progresso Semanal</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Treinos Completados</span>
            <span className="text-sm font-bold">
              {weeklyStats.completed} de {weeklyStats.planned}
            </span>
          </div>
          <Progress 
            value={weeklyStats.percentComplete} 
            className="h-2"
            aria-label="Progresso semanal de treinos"
          />
        </div>
        
        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-100">
          {getMotivationalMessage()}
        </p>
        
        {weeklyStats.percentComplete >= 100 && (
          <div className="mt-3 bg-purple-50 p-3 rounded-md border border-purple-100 text-purple-800 text-sm">
            Você alcançou 100% da sua meta semanal! Continue mantendo o ritmo!
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeeklyWorkoutProgress;
