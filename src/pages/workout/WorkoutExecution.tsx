
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import WorkoutExecutionComponent from '@/components/workout/WorkoutExecution';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { WorkoutPlan } from '@/types';

const WorkoutExecution = () => {
  const { workoutPlans, getTodaysWorkout } = useAppContext();
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se há um treino selecionado no localStorage
    const workoutId = localStorage.getItem('selectedWorkoutId');
    
    if (workoutId) {
      // Encontrar o treino pelo ID
      const workout = workoutPlans.find(wp => wp.id === workoutId);
      if (workout) {
        setSelectedWorkout(workout);
        setLoading(false);
        return;
      }
    }
    
    // Se não houver treino selecionado, tentar usar o treino do dia
    const todaysWorkout = getTodaysWorkout();
    if (todaysWorkout) {
      setSelectedWorkout(todaysWorkout);
    } else {
      // Se não houver treino do dia, redirecionar para a página de planejamento
      navigate('/workout');
    }
    
    setLoading(false);
  }, [workoutPlans, getTodaysWorkout, navigate]);

  const handleComplete = () => {
    // Limpar o ID do treino selecionado
    localStorage.removeItem('selectedWorkoutId');
    navigate('/workout');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-8 w-8 text-fitness-primary" />
        </div>
      </Layout>
    );
  }

  if (!selectedWorkout) {
    return (
      <Layout>
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Nenhum treino selecionado ou planejado para hoje.
          </p>
          <Button asChild className="bg-fitness-primary hover:bg-fitness-primary/90">
            <a href="/workout">Voltar para planejamento</a>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Executar Treino</h1>
        <p className="text-gray-600">Registre seu desempenho e complete seu treino.</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Registrar Treino</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkoutExecutionComponent
            workout={selectedWorkout}
            onComplete={handleComplete}
          />
        </CardContent>
      </Card>
    </Layout>
  );
};

export default WorkoutExecution;
