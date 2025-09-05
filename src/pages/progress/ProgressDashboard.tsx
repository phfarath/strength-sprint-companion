import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import ExerciseProgressChart from '@/components/progress/ExerciseProgressChart';
import MacroDistributionChart from '@/components/progress/MacroDistributionChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { apiServices } from '@/services/api';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Calendar, Award, Loader2, Activity, BarChart3 } from 'lucide-react';

const ProgressDashboard = () => {
  const { workoutLogs, mealPlans } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('workout');
  
  // Buscar dados de progresso do servidor
  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Buscar dados de progresso (se a API existir)
      // const [workoutProgress, nutritionProgress] = await Promise.all([
      //   apiServices.getWorkoutProgress?.(),
      //   apiServices.getNutritionProgress?.()
      // ]);
      
      // Por enquanto usar dados locais
      setProgressData({
        workoutProgress: workoutLogs,
        nutritionProgress: mealPlans
      });
    } catch (error) {
      console.error('Erro ao buscar dados de progresso:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // Calcular streak de treinos (dias consecutivos)
  const calculateWorkoutStreak = () => {
    if (workoutLogs.length === 0) return 0;
    
    const sortedLogs = [...workoutLogs]
      .filter(log => log.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let streak = 0;
    let currentDate = new Date();
    
    for (const log of sortedLogs) {
      const logDate = new Date(log.date);
      const diffDays = Math.floor((currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
        currentDate = logDate;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const workoutStreak = calculateWorkoutStreak();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-fitness-primary" />
          <span className="ml-2 text-gray-600">Carregando dados de progresso...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-6 max-w-7xl"
      >
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Progresso</h1>
          <p className="text-sm md:text-base text-gray-600">
            Acompanhe sua evolução nos treinos e na nutrição.
          </p>
        </div>
        
        {/* Cards de estatísticas - responsivos */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-4 md:pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-2 md:mb-0">
                    <p className="text-gray-500 text-xs md:text-sm mb-1">Treinos Concluídos</p>
                    <p className="text-xl md:text-3xl font-bold text-fitness-primary">{completedWorkouts}</p>
                    <p className="text-xs text-gray-500 mt-1">de {totalWorkouts} agendados</p>
                  </div>
                  <Target className="h-6 w-6 md:h-8 md:w-8 text-fitness-primary opacity-80 self-end md:self-auto" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-4 md:pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-2 md:mb-0">
                    <p className="text-gray-500 text-xs md:text-sm mb-1">Taxa de Conclusão</p>
                    <p className="text-xl md:text-3xl font-bold text-fitness-primary">{completionRate}%</p>
                    <p className="text-xs text-gray-500 mt-1">de treinos concluídos</p>
                  </div>
                  <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-fitness-primary opacity-80 self-end md:self-auto" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-4 md:pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-2 md:mb-0">
                    <p className="text-gray-500 text-xs md:text-sm mb-1">Este Mês</p>
                    <p className="text-xl md:text-3xl font-bold text-fitness-primary">{workoutsThisMonth}</p>
                    <p className="text-xs text-gray-500 mt-1">treinos realizados</p>
                  </div>
                  <Calendar className="h-6 w-6 md:h-8 md:w-8 text-fitness-primary opacity-80 self-end md:self-auto" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white hover:shadow-lg transition-shadow">
              <CardContent className="p-4 md:pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-2 md:mb-0">
                    <p className="text-gray-500 text-xs md:text-sm mb-1">Sequência</p>
                    <p className="text-xl md:text-3xl font-bold text-fitness-primary">{workoutStreak}</p>
                    <p className="text-xs text-gray-500 mt-1">dias consecutivos</p>
                  </div>
                  <Award className="h-6 w-6 md:h-8 md:w-8 text-fitness-primary opacity-80 self-end md:self-auto" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Versão mobile - dropdown */}
          <div className="md:hidden mb-6">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {activeTab === 'workout' && 'Evolução de Treino'}
                  {activeTab === 'nutrition' && 'Evolução Nutricional'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="workout">
                  <div className="flex items-center gap-2">
                    <Activity size={16} />
                    Evolução de Treino
                  </div>
                </SelectItem>
                <SelectItem value="nutrition">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} />
                    Evolução Nutricional
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Versão desktop - tabs */}
          <div className="hidden md:block mb-6">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="workout" className="flex items-center gap-2">
                <Activity size={16} />
                Evolução de Treino
              </TabsTrigger>
              <TabsTrigger value="nutrition" className="flex items-center gap-2">
                <BarChart3 size={16} />
                Evolução Nutricional
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="workout">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Gráfico de progresso com altura responsiva */}
              <div className="w-full">
                <ExerciseProgressChart />
              </div>
              
              <Card className="bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg md:text-xl">Histórico de Treinos Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  {workoutLogs.length > 0 ? (
                    <div className="space-y-3 md:space-y-4">
                      {workoutLogs.slice(0, 10).map((log, index) => (
                        <motion.div 
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b pb-3 last:border-b-0 gap-2"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm md:text-base">
                              Treino do dia {new Date(log.date).toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-xs md:text-sm text-gray-500">
                              {log.exercises.length} exercícios • {
                                log.exercises.reduce((total, ex) => total + ex.actualSets, 0)
                              } séries totais
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              log.completed 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {log.completed ? 'Concluído' : 'Incompleto'}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                      
                      {workoutLogs.length > 10 && (
                        <div className="text-center pt-4">
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            Ver Histórico Completo
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-base md:text-lg font-medium mb-2">Nenhum treino registrado ainda</p>
                      <p className="text-sm">Comece a treinar para ver seu progresso aqui!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          
          <TabsContent value="nutrition">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Gráfico de macros com altura responsiva */}
              <div className="w-full">
                <MacroDistributionChart />
              </div>
              
              <Card className="bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg md:text-xl">Análise Nutricional</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <div className="border rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-500 mb-2">Proteínas</p>
                      <p className="text-xl md:text-2xl font-bold text-purple-600 mb-1">25%</p>
                      <p className="text-xs text-gray-500">Ideal: 25-35%</p>
                      <div className="mt-2 text-xs text-purple-600">✓ Dentro da meta</div>
                    </div>
                    
                    <div className="border rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-500 mb-2">Carboidratos</p>
                      <p className="text-xl md:text-2xl font-bold text-yellow-600 mb-1">50%</p>
                      <p className="text-xs text-gray-500">Ideal: 45-55%</p>
                      <div className="mt-2 text-xs text-purple-600">✓ Dentro da meta</div>
                    </div>
                    
                    <div className="border rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-500 mb-2">Gorduras</p>
                      <p className="text-xl md:text-2xl font-bold text-red-600 mb-1">25%</p>
                      <p className="text-xs text-gray-500">Ideal: 20-30%</p>
                      <div className="mt-2 text-xs text-purple-600">✓ Dentro da meta</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2 text-sm md:text-base">Recomendações</h4>
                    <ul className="text-xs md:text-sm text-purple-800 space-y-1">
                      <li>• Sua distribuição de macronutrientes está equilibrada</li>
                      <li>• Continue mantendo o consumo de proteínas para preservar massa muscular</li>
                      <li>• Considere ajustar as porções conforme seus objetivos de treino</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </Layout>
  );
};

export default ProgressDashboard;
