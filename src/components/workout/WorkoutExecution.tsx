
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { WorkoutPlan, WorkoutLog } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface WorkoutExecutionProps {
  workout: WorkoutPlan;
  onComplete: () => void;
}

const WorkoutExecution: React.FC<WorkoutExecutionProps> = ({ workout, onComplete }) => {
  const { logWorkout, getCurrentDate } = useAppContext();
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [executionData, setExecutionData] = useState<WorkoutLog['exercises']>(
    workout.exercises.map(exercise => ({
      exerciseId: exercise.id,
      actualSets: exercise.sets,
      actualReps: exercise.reps,
      actualWeight: exercise.weight,
      notes: ''
    }))
  );
  const [notes, setNotes] = useState('');
  const [completedExercises, setCompletedExercises] = useState<boolean[]>(
    workout.exercises.map(() => false)
  );

  const handleExerciseChange = (index: number, field: string, value: string | number) => {
    setExecutionData(
      executionData.map((ex, i) => 
        i === index ? { ...ex, [field]: value } : ex
      )
    );
  };

  const handleCompleteExercise = (index: number) => {
    const newCompletedExercises = [...completedExercises];
    newCompletedExercises[index] = true;
    setCompletedExercises(newCompletedExercises);
    
    // Move to next exercise if there is one
    if (index < workout.exercises.length - 1) {
      setActiveExerciseIndex(index + 1);
    }
  };

  const handleFinishWorkout = () => {
    const workoutLog: Omit<WorkoutLog, 'id'> = {
      date: getCurrentDate(),
      workoutPlanId: workout.id,
      completed: true,
      exercises: executionData,
      notes: notes
    };
    
    logWorkout(workoutLog);
    onComplete();
  };

  const allExercisesCompleted = completedExercises.every(completed => completed);

  return (
    <div className="space-y-6">
      <div className="bg-fitness-primary/10 p-4 rounded-md">
        <h2 className="font-bold text-xl mb-2">{workout.name}</h2>
        <p className="text-sm text-gray-600">Registre sua execução do treino e marque os exercícios conforme os completa.</p>
      </div>
      
      <div className="space-y-4">
        {workout.exercises.map((exercise, index) => (
          <Card key={index} className={`border ${completedExercises[index] ? 'border-green-500 bg-green-50' : ''}`}>
            <CardContent className="p-4">
              <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setActiveExerciseIndex(activeExerciseIndex === index ? -1 : index)}
              >
                <div className="flex items-center">
                  {completedExercises[index] && (
                    <CheckCircle className="text-green-500 mr-2" size={18} />
                  )}
                  <h3 className="font-medium">{exercise.name}</h3>
                </div>
                <button>
                  {activeExerciseIndex === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
              
              {activeExerciseIndex === index && (
                <div className="mt-4 space-y-4">
                  <div className="text-sm text-gray-500">{exercise.muscleGroup}</div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Séries</label>
                      <Input
                        type="number"
                        value={executionData[index].actualSets}
                        onChange={(e) => handleExerciseChange(index, 'actualSets', parseInt(e.target.value))}
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Repetições</label>
                      <Input
                        type="number"
                        value={executionData[index].actualReps}
                        onChange={(e) => handleExerciseChange(index, 'actualReps', parseInt(e.target.value))}
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Carga (kg)</label>
                      <Input
                        type="number"
                        value={executionData[index].actualWeight}
                        onChange={(e) => handleExerciseChange(index, 'actualWeight', parseInt(e.target.value))}
                        min={0}
                        step={0.5}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Observações</label>
                    <Textarea
                      value={executionData[index].notes || ''}
                      onChange={(e) => handleExerciseChange(index, 'notes', e.target.value)}
                      placeholder="Como se sentiu? Foi fácil ou difícil?"
                      rows={2}
                    />
                  </div>
                  
                  <Button 
                    onClick={() => handleCompleteExercise(index)}
                    className="w-full bg-green-500 hover:bg-green-600"
                    disabled={completedExercises[index]}
                  >
                    {completedExercises[index] ? 'Exercício Completo' : 'Marcar como Completo'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div>
        <label className="block font-medium mb-1">Observações do Treino</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observações gerais sobre o treino de hoje"
          rows={3}
        />
      </div>
      
      <Button 
        onClick={handleFinishWorkout}
        className="w-full bg-fitness-primary hover:bg-fitness-primary/90"
        disabled={!allExercisesCompleted}
      >
        Finalizar Treino
      </Button>

      {!allExercisesCompleted && (
        <p className="text-sm text-center text-gray-500">
          Complete todos os exercícios para finalizar o treino
        </p>
      )}
    </div>
  );
};

export default WorkoutExecution;
