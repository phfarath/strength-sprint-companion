
import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

const TodayWorkout = () => {
  const { getTodaysWorkout, isTodayWorkoutComplete } = useAppContext();
  const todayWorkout = getTodaysWorkout();
  const isComplete = isTodayWorkoutComplete();

  if (!todayWorkout) {
    return (
      <Card className="bg-white rounded-lg shadow mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Treino de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Não há treino agendado para hoje. Dia de descanso!</p>
          <Button asChild className="mt-4 bg-fitness-primary hover:bg-fitness-primary/90">
            <Link to="/workout/plan">Ver planejamento semanal</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">{todayWorkout.name}</CardTitle>
        {isComplete && (
          <div className="flex items-center text-green-500">
            <CheckCircle size={16} className="mr-1" />
            <span className="text-sm">Concluído</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {todayWorkout.exercises.map((exercise, index) => (
            <div key={index} className="flex justify-between border-b pb-2">
              <div>
                <p className="font-medium">{exercise.name}</p>
                <p className="text-sm text-gray-500">{exercise.muscleGroup}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{exercise.sets} x {exercise.reps}</p>
                <p className="text-sm text-gray-500">{exercise.weight} kg</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex justify-between">
          {isComplete ? (
            <Button asChild variant="outline">
              <Link to={`/workout/log`}>Ver detalhes</Link>
            </Button>
          ) : (
            <Button asChild className="bg-fitness-primary hover:bg-fitness-primary/90">
              <Link to={`/workout/start`}>Iniciar treino</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayWorkout;
