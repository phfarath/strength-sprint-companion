import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import WorkoutForm from '@/components/workout/WorkoutForm';
import WorkoutFormWithAI from '@/components/workout/WorkoutFormWithAI';
import { daysOfWeek, WorkoutPlan } from '@/types';
import { Edit, Trash, Plus, CheckCircle, Calendar, Dumbbell, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { apiServices } from '@/services/api';

const WorkoutPlanning = () => {
  const { workoutPlans, workoutLogs, addWorkoutPlan, updateWorkoutPlan, deleteWorkoutPlan } = useAppContext();
  const [editingWorkout, setEditingWorkout] = useState<WorkoutPlan | null>(null);
  const [activeTab, setActiveTab] = useState<string>('view');
  const [exercises, setExercises] = useState<any[]>([]);
  const [publicPlans, setPublicPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Buscar exercícios ao carregar a página
  useEffect(() => {
    fetchExercises();
    fetchPublicPlans();
  }, []);

  const fetchPublicPlans = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setPublicPlans([]);
        return;
      }

      const response = await apiServices.getPublicWorkoutPlans();
      console.log("Treinos públicos recebidos:", response.data);
      setPublicPlans(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error('Erro ao buscar treinos públicos:', error);
      setPublicPlans([]);
    }
  };

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para acessar os exercícios.",
          variant: "destructive"
        });
        setExercises([]);
        return;
      }

      const response = await apiServices.getExercises();
      console.log("Exercícios recebidos:", response.data);
      setExercises(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error('Erro ao buscar exercícios:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar exercícios. Tente novamente.",
        variant: "destructive"
      });
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar exercícios pela busca
  const filteredExercises = React.useMemo(() => {
    const list = Array.isArray(exercises) ? exercises : [];
    const q = (searchQuery || '').toLowerCase();
    return list.filter(ex => 
      (ex?.name || '').toLowerCase().includes(q) ||
      (ex?.muscleGroup || '').toLowerCase().includes(q)
    );
  }, [exercises, searchQuery]);

  // Verificar quais treinos foram concluídos na semana atual
  const isWorkoutCompletedThisWeek = (workoutId: string): boolean => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Início da semana (domingo)
    
    return workoutLogs.some(log => 
      log.workoutPlanId === workoutId && 
      new Date(log.date) >= startOfWeek && 
      log.completed
    );
  };

  const handleCreateWorkout = async (workout: Omit<WorkoutPlan, 'id'>) => {
    try {
      await addWorkoutPlan(workout);
      setActiveTab('view');
    } catch (error) {
      toast({
        title: "Erro ao criar treino",
        description: "Não foi possível salvar o treino no servidor.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateWorkout = async (workout: WorkoutPlan) => {
    try {
      await updateWorkoutPlan(workout);
      setEditingWorkout(null);
      setActiveTab('view');
    } catch (error) {
      toast({
        title: "Erro ao atualizar treino",
        description: "Não foi possível atualizar o treino no servidor.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este treino?')) {
      try {
        await deleteWorkoutPlan(id);
      } catch (error) {
        toast({
          title: "Erro ao excluir treino",
          description: "Não foi possível excluir o treino no servidor.",
          variant: "destructive"
        });
      }
    }
  };

  const handleEditWorkout = (workout: WorkoutPlan) => {
    setEditingWorkout(workout);
    setActiveTab('edit');
  };

  const handleStartWorkout = (workout: WorkoutPlan) => {
    // Armazenar ID do treino selecionado no localStorage para acessar na página de execução
    localStorage.setItem('selectedWorkoutId', workout.id);
    navigate('/workout/start');
  };

  const handleImportPublicPlan = async (publicPlan: any) => {
    try {
      // Criar um novo plano baseado no público
      const workoutToImport: Omit<WorkoutPlan, 'id'> = {
        name: `${publicPlan.name} (Importado)`,
        dayOfWeek: publicPlan.dayOfWeek,
        notes: publicPlan.notes || `Treino importado da comunidade`,
        isPublic: false, // Por padrão, treinos importados não são públicos
        exercises: publicPlan.exercises.map((ex: any) => ({
          id: ex.id,
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight || 0,
          restSeconds: ex.restSeconds || 0,
          notes: ex.notes || ''
        }))
      };

      await addWorkoutPlan(workoutToImport);

      toast({
        title: "Treino importado",
        description: `O treino "${publicPlan.name}" foi importado com sucesso!`,
      });

      // Voltar para a aba de visualização para ver o treino importado
      setActiveTab('view');
    } catch (error) {
      toast({
        title: "Erro ao importar treino",
        description: "Não foi possível importar o treino. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Agrupar treinos por dia da semana
  const workoutsByDay = Array.from({ length: 7 }, (_, i) => {
    return {
      day: i,
      dayName: daysOfWeek[i],
      workouts: workoutPlans.filter(plan => plan.dayOfWeek === i)
    };
  });

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-6 max-w-7xl"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Planejamento de Treinos</h1>
          <p className="text-gray-600">
            Organize seus treinos semanais e acompanhe seu progresso.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Versão mobile - dropdown */}
          <div className="md:hidden mb-6">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {activeTab === 'view' && 'Visualizar Treinos'}
                  {activeTab === 'create' && 'Criar Novo Treino'}
                  {activeTab === 'edit' && 'Editar Treino'}
                  {activeTab === 'public' && 'Treinos Públicos'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    Visualizar Treinos
                  </div>
                </SelectItem>
                <SelectItem value="create">
                  <div className="flex items-center gap-2">
                    <Plus size={16} />
                    Criar Novo Treino
                  </div>
                </SelectItem>
                <SelectItem value="edit" disabled={!editingWorkout}>
                  <div className="flex items-center gap-2">
                    <Edit size={16} />
                    Editar Treino
                  </div>
                </SelectItem>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Search size={16} />
                    Treinos Públicos
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Versão desktop - tabs melhoradas */}
          <div className="hidden md:block mb-6">
            <TabsList className="grid w-full grid-cols-4 h-12">
              <TabsTrigger value="view" className="flex items-center gap-2 text-sm">
                <Calendar size={16} className="hidden lg:block" />
                <span className="hidden lg:inline">Visualizar</span>
                <span className="lg:hidden">Ver</span>
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2 text-sm">
                <Plus size={16} className="hidden lg:block" />
                <span className="hidden lg:inline">Criar Novo</span>
                <span className="lg:hidden">Criar</span>
              </TabsTrigger>
              <TabsTrigger value="edit" disabled={!editingWorkout} className="flex items-center gap-2 text-sm">
                <Edit size={16} className="hidden lg:block" />
                <span className="hidden lg:inline">Editar</span>
                <span className="lg:hidden">Editar</span>
              </TabsTrigger>
              <TabsTrigger value="public" className="flex items-center gap-2 text-sm">
                <Search size={16} className="hidden lg:block" />
                <span className="hidden lg:inline">Públicos</span>
                <span className="lg:hidden">Público</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TabsContent value="view" className="mt-0">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                  <h2 className="text-2xl font-semibold text-gray-900">Seus Treinos Semanais</h2>
                  <Button 
                    onClick={() => {
                      setEditingWorkout(null);
                      setActiveTab('create');
                    }}
                    className="bg-fitness-primary hover:bg-fitness-primary/90 w-full sm:w-auto"
                  >
                    <Plus size={16} className="mr-2" /> Novo Treino
                  </Button>
                </div>

                {workoutPlans.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {workoutsByDay.map((dayData) => (
                      <motion.div
                        key={dayData.day}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: dayData.day * 0.1 }}
                      >
                        <Card className="bg-white hover:shadow-lg transition-all duration-300 h-full">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-fitness-primary" />
                              {dayData.dayName.charAt(0).toUpperCase() + dayData.dayName.slice(1)}
                            </CardTitle>
                          </CardHeader>
                          
                          <CardContent>
                            {dayData.workouts.length > 0 ? (
                              <div className="space-y-4">
                                {dayData.workouts.map((workout) => {
                                  const isCompleted = isWorkoutCompletedThisWeek(workout.id);
                                  
                                  return (
                                    <motion.div 
                                      key={workout.id} 
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      className={`border rounded-lg p-4 ${
                                        isCompleted 
                                          ? 'border-purple-500 bg-purple-50' 
                                          : 'border-gray-200 hover:border-fitness-primary transition-colors'
                                      }`}
                                    >
                                      <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-medium text-gray-900 truncate">{workout.name}</h3>
                                        {isCompleted && (
                                          <CheckCircle size={16} className="text-purple-500 ml-2" />
                                        )}
                                      </div>
                                      
                                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                                        <Dumbbell className="w-4 h-4" />
                                        <span>{workout.exercises.length} exercícios</span>
                                      </div>

                                      {/* Lista de exercícios (primeiros 3) */}
                                      <div className="space-y-1 mb-3 text-xs text-gray-500">
                                        {workout.exercises.slice(0, 3).map((exercise, idx) => (
                                          <div key={idx} className="truncate">
                                            {exercise.name} - {exercise.sets}x{exercise.reps}
                                          </div>
                                        ))}
                                        {workout.exercises.length > 3 && (
                                          <div className="text-center text-gray-400">
                                            +{workout.exercises.length - 3} mais
                                          </div>
                                        )}
                                      </div>
                                    
                                      <div className="flex gap-2">
                                        <Button
                                          variant="default"
                                          size="sm"
                                          className="flex-1 bg-fitness-primary hover:bg-fitness-primary/90"
                                          onClick={() => handleStartWorkout(workout)}
                                        >
                                          {isCompleted ? 'Refazer' : 'Iniciar'}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleEditWorkout(workout)}
                                          className="hover:bg-purple-50 hover:text-purple-600"
                                        >
                                          <Edit size={14} />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="hover:bg-red-50 hover:text-red-600"
                                          onClick={() => handleDeleteWorkout(workout.id)}
                                        >
                                          <Trash size={14} />
                                        </Button>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                                <Dumbbell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm mb-3">Nenhum treino planejado</p>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setActiveTab('create');
                                  }}
                                  className="text-xs"
                                >
                                  <Plus size={14} className="mr-1" /> Adicionar
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
                  >
                    <div className="max-w-md mx-auto">
                      <Dumbbell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-600 mb-2">Nenhum treino criado</p>
                      <p className="text-gray-500 mb-6">Comece criando seu primeiro treino personalizado.</p>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                          onClick={() => {
                            setEditingWorkout(null);
                            setActiveTab('create');
                          }}
                          className="bg-fitness-primary hover:bg-fitness-primary/90"
                        >
                          <Plus size={16} className="mr-2" /> Criar Primeiro Treino
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </TabsContent>

              <TabsContent value="create" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Criar Novo Treino</CardTitle>
                      <p className="text-gray-600">Configure um novo treino personalizado.</p>
                    </CardHeader>
                    <CardContent>
                      <WorkoutFormWithAI onSubmit={handleCreateWorkout} exercises={exercises} />
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="edit" className="mt-0">
                {editingWorkout ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="bg-white">
                      <CardHeader>
                        <CardTitle>Editar Treino</CardTitle>
                        <p className="text-gray-600">Modifique as informações do seu treino.</p>
                      </CardHeader>
                      <CardContent>
                        <WorkoutForm
                          initialWorkout={editingWorkout}
                          onSubmit={handleUpdateWorkout}
                          exercises={exercises}
                        />
                        <Button 
                          variant="outline" 
                          className="mt-4 w-full"
                          onClick={() => {
                            setEditingWorkout(null);
                            setActiveTab('view');
                          }}
                        >
                          Cancelar Edição
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Selecione um treino para editar na aba "Visualizar Treinos".</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="public" className="mt-0">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>Treinos Públicos</CardTitle>
                    <p className="text-gray-600">Explore treinos criados por outros usuários e importe para seu planejamento.</p>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <Input
                          placeholder="Buscar treinos públicos..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fitness-primary mx-auto"></div>
                        <p className="text-gray-500 mt-2">Carregando treinos públicos...</p>
                      </div>
                    ) : publicPlans.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                        {publicPlans
                          .filter(plan =>
                            plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            plan.notes?.toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((plan) => (
                            <motion.div
                              key={plan.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="border rounded-lg p-4 hover:shadow-md transition-all"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Dumbbell className="w-4 h-4 text-fitness-primary" />
                                <h3 className="font-medium text-gray-900 truncate">{plan.name}</h3>
                              </div>

                              <p className="text-sm text-gray-600 mb-1">
                                <span className="font-medium">Dia:</span> {daysOfWeek[plan.dayOfWeek]}
                              </p>

                              <p className="text-sm text-gray-600 mb-2">
                                <span className="font-medium">Exercícios:</span> {plan.exercises.length}
                              </p>

                              {plan.notes && (
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                  {plan.notes}
                                </p>
                              )}

                              {/* Lista de exercícios (primeiros 2) */}
                              <div className="space-y-1 mb-3 text-xs text-gray-500">
                                {plan.exercises.slice(0, 2).map((exercise, idx) => (
                                  <div key={idx} className="truncate">
                                    • {exercise.name} ({exercise.sets}x{exercise.reps})
                                  </div>
                                ))}
                                {plan.exercises.length > 2 && (
                                  <div className="text-center text-gray-400">
                                    +{plan.exercises.length - 2} mais
                                  </div>
                                )}
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => handleImportPublicPlan(plan)}
                              >
                                <Plus size={14} className="mr-1" />
                                Importar Treino
                              </Button>
                            </motion.div>
                          ))
                        }
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Dumbbell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">Nenhum treino público encontrado</p>
                        <p className="text-sm text-gray-400">Seja o primeiro a compartilhar um treino público!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </Layout>
  );
};

export default WorkoutPlanning;
