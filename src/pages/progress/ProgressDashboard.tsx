
import React from 'react';
import Layout from '@/components/layout/Layout';
import ExerciseProgressChart from '@/components/progress/ExerciseProgressChart';
import MacroDistributionChart from '@/components/progress/MacroDistributionChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';

const ProgressDashboard = () => {
  const { workoutLogs } = useAppContext();
  
  // Calcular estatísticas de treino
  const totalWorkouts = workoutLogs.length;
  const completedWorkouts = workoutLogs.filter(log => log.completed).length;
  const completionRate = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;
  
  // Obter dados para mês atual
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const workoutsThisMonth = workoutLogs.filter(log => {
    const logDate = new Date(log.date);
    return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
  }).length;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Progresso</h1>
        <p className="text-gray-600">Acompanhe sua evolução nos treinos e na nutrição.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-500 mb-1">Treinos Concluídos</p>
              <p className="text-4xl font-bold text-fitness-primary">{completedWorkouts}</p>
              <p className="text-xs text-gray-500 mt-1">de {totalWorkouts} agendados</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-500 mb-1">Taxa de Conclusão</p>
              <p className="text-4xl font-bold text-fitness-primary">{completionRate}%</p>
              <p className="text-xs text-gray-500 mt-1">de treinos concluídos</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-500 mb-1">Treinos Este Mês</p>
              <p className="text-4xl font-bold text-fitness-primary">{workoutsThisMonth}</p>
              <p className="text-xs text-gray-500 mt-1">vs. 8 no mês passado</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="workout">
        <TabsList className="mb-6">
          <TabsTrigger value="workout">Evolução de Treino</TabsTrigger>
          <TabsTrigger value="nutrition">Evolução Nutricional</TabsTrigger>
        </TabsList>
        
        <TabsContent value="workout">
          <div className="space-y-6">
            <ExerciseProgressChart />
            
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Histórico de Treinos</CardTitle>
              </CardHeader>
              <CardContent>
                {workoutLogs.length > 0 ? (
                  <div className="space-y-4">
                    {workoutLogs.slice(0, 5).map((log, index) => (
                      <div key={index} className="flex justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">
                            {log.workoutPlanId.replace('wp', 'Treino ')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(log.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${log.completed ? 'text-green-500' : 'text-red-500'}`}>
                            {log.completed ? 'Concluído' : 'Incompleto'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {log.exercises.length} exercícios
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {workoutLogs.length > 5 && (
                      <div className="text-center pt-2">
                        <Button variant="outline" size="sm">
                          Ver Histórico Completo
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Nenhum treino registrado ainda.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="nutrition">
          <div className="space-y-6">
            <MacroDistributionChart />
            
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Análise de Macronutrientes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Sua distribuição de macronutrientes está bem equilibrada. Para otimizar seu ganho de massa muscular, 
                  considere aumentar ligeiramente seu consumo de proteínas em cerca de 10-15%.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Proteínas</p>
                    <p className="text-xl font-bold text-blue-500">26%</p>
                    <p className="text-xs text-gray-500">Ideal: 25-35%</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Carboidratos</p>
                    <p className="text-xl font-bold text-yellow-500">48%</p>
                    <p className="text-xs text-gray-500">Ideal: 45-55%</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Gorduras</p>
                    <p className="text-xl font-bold text-red-500">26%</p>
                    <p className="text-xs text-gray-500">Ideal: 20-30%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default ProgressDashboard;
