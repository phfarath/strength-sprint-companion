import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Exercise, WorkoutPlan, daysOfWeek } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash } from 'lucide-react';

interface WorkoutFormProps {
  onSubmit: (workout: Omit<WorkoutPlan, 'id'> | WorkoutPlan) => void;
  initialWorkout?: WorkoutPlan;
  exercises?: any[]; // ← ADICIONAR ESTA PROP
}

const WorkoutForm: React.FC<WorkoutFormProps> = ({ 
  onSubmit, 
  initialWorkout,
  exercises = [] // ← DEFAULT VAZIO
}) => {
  // Usar exercises da prop ou fallback para mock
  const availableExercises = exercises.length > 0 ? exercises : [
    { id: "1", name: "Supino Reto", muscleGroup: "Peito" },
    { id: "2", name: "Agachamento", muscleGroup: "Pernas" },
    { id: "3", name: "Levantamento Terra", muscleGroup: "Costas" },
    // ...outros exercícios mock
  ];

  const [name, setName] = useState(initialWorkout?.name || '');
  const [dayOfWeek, setDayOfWeek] = useState<number>(initialWorkout?.dayOfWeek || 1);
  const [notes, setNotes] = useState(initialWorkout?.notes || '');
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>(
    initialWorkout?.exercises || []
  );

  const handleAddExercise = (exerciseId: string) => {
    const exercise = availableExercises.find(ex => ex.id === exerciseId);
    if (exercise && !selectedExercises.some(ex => ex.id === exerciseId)) {
      setSelectedExercises([...selectedExercises, { ...exercise }]);
    }
  };

  const handleRemoveExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const handleExerciseChange = (index: number, field: keyof Exercise, value: string | number) => {
    setSelectedExercises(
      selectedExercises.map((ex, i) => 
        i === index ? { ...ex, [field]: value } : ex
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const workout = {
      id: initialWorkout?.id,
      name,
      dayOfWeek,
      exercises: selectedExercises,
      notes
    };
    onSubmit(workout);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="workout-name">Nome do Treino</Label>
          <Input
            id="workout-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="day-of-week">Dia da Semana</Label>
          <Select 
            value={dayOfWeek.toString()} 
            onValueChange={(value) => setDayOfWeek(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o dia" />
            </SelectTrigger>
            <SelectContent>
              {daysOfWeek.map((day, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Observações</Label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observações opcionais sobre este treino"
        />
      </div>

      <div>
        <Label>Exercícios do Treino</Label>
        <div className="space-y-4">
          <Select onValueChange={(value) => handleAddExercise(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Adicionar exercício" />
            </SelectTrigger>
            <SelectContent>
              {availableExercises.map((exercise) => (
                <SelectItem key={exercise.id} value={exercise.id}>
                  {exercise.name} - {exercise.muscleGroup}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedExercises.length > 0 ? (
            <div className="space-y-3">
              {selectedExercises.map((exercise, index) => (
                <Card key={index} className="workout-card">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{exercise.name}</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveExercise(index)}
                      >
                        <Trash size={16} className="text-red-500" />
                      </Button>
                    </div>
                    
                    <div className="text-sm text-gray-500 mb-2">{exercise.muscleGroup}</div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label htmlFor={`sets-${index}`} className="text-xs">Séries</Label>
                        <Input
                          id={`sets-${index}`}
                          type="number"
                          value={exercise.sets}
                          onChange={(e) => handleExerciseChange(index, 'sets', parseInt(e.target.value))}
                          className="h-8"
                          min="1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`reps-${index}`} className="text-xs">Repetições</Label>
                        <Input
                          id={`reps-${index}`}
                          type="number"
                          value={exercise.reps}
                          onChange={(e) => handleExerciseChange(index, 'reps', parseInt(e.target.value))}
                          className="h-8"
                          min="1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`weight-${index}`} className="text-xs">Carga (kg)</Label>
                        <Input
                          id={`weight-${index}`}
                          type="number"
                          value={exercise.weight}
                          onChange={(e) => handleExerciseChange(index, 'weight', parseInt(e.target.value))}
                          className="h-8"
                          min="0"
                          step="0.5"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed rounded-md">
              <p className="text-gray-500">Nenhum exercício adicionado</p>
              <Button 
                type="button" 
                variant="outline" 
                className="mt-2"
                onClick={() => handleAddExercise(availableExercises[0]?.id || '')}
              >
                <Plus size={16} className="mr-1" /> Adicionar Exercício
              </Button>
            </div>
          )}
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-fitness-primary hover:bg-fitness-primary/90"
      >
        {initialWorkout ? 'Atualizar Treino' : 'Criar Treino'}
      </Button>
    </form>
  );
};

export default WorkoutForm;
