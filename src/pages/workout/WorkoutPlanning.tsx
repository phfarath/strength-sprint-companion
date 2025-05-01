
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WorkoutForm from '@/components/workout/WorkoutForm';
import { daysOfWeek, WorkoutPlan } from '@/types';
import { Edit, Trash, Plus, CheckCircle } from 'lucide-react';

const WorkoutPlanning = () => {
  const { workoutPlans, workoutLogs, addWorkoutPlan, updateWorkoutPlan, deleteWorkoutPlan, getCurrentDate } = useAppContext();
  const [editingWorkout, setEditingWorkout] = useState<WorkoutPlan | null>(null);
  const [activeTab, setActiveTab] = useState<string>('view');
  const navigate = useNavigate();

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

  const handleCreateWorkout = (workout: Omit<WorkoutPlan, 'id'>) => {
    addWorkoutPlan(workout);
    setActiveTab('view');
  };

  const handleUpdateWorkout = (workout: WorkoutPlan) => {
    updateWorkoutPlan(workout);
    setEditingWorkout(null);
    setActiveTab('view');
  };

  const handleDeleteWorkout = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este treino?')) {
      deleteWorkoutPlan(id);
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Planejamento de Treinos</h1>
        <p className="text-gray-600">Organize seus treinos semanais e acompanhe seu progresso.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="view">Visualizar Treinos</TabsTrigger>
          <TabsTrigger value="create">Criar Novo Treino</TabsTrigger>
          {editingWorkout && <TabsTrigger value="edit">Editar Treino</TabsTrigger>}
        </TabsList>

        <TabsContent value="view">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workoutsByDay.map((dayData) => (
              <Card key={dayData.day} className="bg-white">
                <CardHeader>
                  <CardTitle>
                    {dayData.dayName.charAt(0).toUpperCase() + dayData.dayName.slice(1)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dayData.workouts.length > 0 ? (
                    <div className="space-y-4">
                      {dayData.workouts.map((workout) => {
                        const isCompleted = isWorkoutCompletedThisWeek(workout.id);
                        
                        return (
                          <div 
                            key={workout.id} 
                            className={`border rounded-lg p-4 ${isCompleted ? 'border-green-500 bg-green-50' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-medium">{workout.name}</h3>
                              {isCompleted && (
                                <CheckCircle size={16} className="text-green-500" />
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-500 mb-3">
                              {workout.exercises.length} exercícios
                            </p>
                            
                            <div className="flex space-x-2">
                              <Button
                                variant="default"
                                size="sm"
                                className="flex-1 bg-fitness-primary hover:bg-fitness-primary/90"
                                onClick={() => handleStartWorkout(workout)}
                              >
                                {isCompleted ? 'Refazer' : 'Iniciar'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditWorkout(workout)}
                              >
                                <Edit size={16} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteWorkout(workout.id)}
                              >
                                <Trash size={16} />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 border border-dashed rounded">
                      <p className="text-gray-500 mb-2">Nenhum treino planejado</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setActiveTab('create');
                        }}
                      >
                        <Plus size={16} className="mr-1" /> Adicionar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Criar Novo Treino</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkoutForm onSubmit={handleCreateWorkout} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit">
          {editingWorkout && (
            <Card>
              <CardHeader>
                <CardTitle>Editar Treino</CardTitle>
              </CardHeader>
              <CardContent>
                <WorkoutForm 
                  initialWorkout={editingWorkout}
                  onSubmit={handleUpdateWorkout}
                />
                <Button 
                  variant="outline" 
                  className="mt-4 w-full"
                  onClick={() => {
                    setEditingWorkout(null);
                    setActiveTab('view');
                  }}
                >
                  Cancelar
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default WorkoutPlanning;
