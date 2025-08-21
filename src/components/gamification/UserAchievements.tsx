
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Award, Star } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

const UserAchievements = () => {
  const { workoutLogs, mealPlans } = useAppContext();
  
  // Cálculo de pontos e conquistas
  const workoutPoints = workoutLogs.filter(log => log.completed).length * 10;
  const nutritionPoints = mealPlans.length * 5;
  const totalPoints = workoutPoints + nutritionPoints;
  
  // Títulos baseados em pontuação
  const getTitles = () => {
    const titles = [];
    
    if (workoutLogs.filter(log => log.completed).length >= 3) {
      titles.push({
        name: "Conquistador da Semana",
        icon: <Trophy className="h-5 w-5 text-yellow-500" />
      });
    }
    
    if (mealPlans.length >= 3) {
      titles.push({
        name: "Nutricionista da Própria Vida",
        icon: <Award className="h-5 w-5 text-purple-500" />
      });
    }
    
    if (totalPoints > 50) {
      titles.push({
        name: "Dedicação Total",
        icon: <Star className="h-5 w-5 text-purple-500" />
      });
    }
    
    return titles;
  };
  
  const titles = getTitles();
  
  // Progresso para próxima recompensa
  const nextRewardThreshold = Math.ceil(totalPoints / 50) * 50;
  const progressToNextReward = (totalPoints / nextRewardThreshold) * 100;

  return (
    <Card className="bg-white rounded-lg shadow mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Suas Conquistas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Total de Pontos</span>
            <span className="text-sm font-bold">{totalPoints} pts</span>
          </div>
          <Progress value={progressToNextReward} className="h-2" />
          <p className="text-xs text-gray-500 mt-1">
            {nextRewardThreshold - totalPoints} pontos para próxima recompensa
          </p>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Seus Títulos</h4>
          {titles.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {titles.map((title, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1 py-1 px-2">
                  {title.icon}
                  <span>{title.name}</span>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Complete mais treinos e refeições para ganhar títulos!
            </p>
          )}
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">Pontos por Atividade</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-50 p-2 rounded">
              <p className="font-medium flex items-center">
                <Trophy className="h-4 w-4 mr-1 text-fitness-primary" /> Treinos
              </p>
              <p className="text-lg font-bold">{workoutPoints} pts</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <p className="font-medium flex items-center">
                <Award className="h-4 w-4 mr-1 text-fitness-secondary" /> Nutrição
              </p>
              <p className="text-lg font-bold">{nutritionPoints} pts</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserAchievements;
