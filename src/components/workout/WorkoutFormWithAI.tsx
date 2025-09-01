import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Exercise, WorkoutPlan, daysOfWeek } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash, Sparkles, Dumbbell } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { apiServices } from '@/services/api';

interface WorkoutFormWithAIProps {
  onSubmit: (workout: Omit<WorkoutPlan, 'id'> | WorkoutPlan) => void;
  initialWorkout?: WorkoutPlan;
  exercises?: any[];
}

const WorkoutFormWithAI: React.FC<WorkoutFormWithAIProps> = ({
  onSubmit,
  initialWorkout,
  exercises = []
}) => {
  const { generateAIWorkoutPlan } = useAppContext();
  const { toast } = useToast();

  // Usar exercises da prop ou array vazio
  const [availableExercises, setAvailableExercises] = useState(exercises);

  const [name, setName] = useState(initialWorkout?.name || '');
  const [dayOfWeek, setDayOfWeek] = useState<number>(initialWorkout?.dayOfWeek || 1);
  const [notes, setNotes] = useState(initialWorkout?.notes || '');
  const [isPublic, setIsPublic] = useState(initialWorkout?.isPublic || false);
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>(
    initialWorkout?.exercises || []
  );
  const [isLoading, setIsLoading] = useState(false);

  // Estados para criar novo exercício
  const [showCreateExercise, setShowCreateExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscleGroup, setNewExerciseMuscleGroup] = useState('');
  const [newExerciseEquipment, setNewExerciseEquipment] = useState('');
  const [newExerciseInstructions, setNewExerciseInstructions] = useState('');
  const [creatingExercise, setCreatingExercise] = useState(false);

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

  // Função para criar novo exercício
  const handleCreateExercise = async () => {
    if (!newExerciseName.trim() || !newExerciseMuscleGroup.trim()) {
      toast({
        title: "Erro",
        description: "Nome do exercício e grupo muscular são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setCreatingExercise(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para criar exercícios.",
          variant: "destructive"
        });
        return;
      }

      const response = await apiServices.createExercise({
        name: newExerciseName,
        muscleGroup: newExerciseMuscleGroup,
        equipment: newExerciseEquipment || null,
        instructions: newExerciseInstructions || null
      });

      // Adicionar o novo exercício à lista disponível
      setAvailableExercises(prev => [...prev, response.data]);

      // Limpar formulário
      setNewExerciseName('');
      setNewExerciseMuscleGroup('');
      setNewExerciseEquipment('');
      setNewExerciseInstructions('');
      setShowCreateExercise(false);

      toast({
        title: "Sucesso",
        description: "Exercício criado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao criar exercício:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o exercício. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setCreatingExercise(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const workout = {
      id: initialWorkout?.id,
      name,
      dayOfWeek,
      exercises: selectedExercises,
      notes,
      isPublic
    };
    onSubmit(workout);
  };

  // Função para gerar plano de treino com IA
  const handleGenerateWithAI = async () => {
    try {
      setIsLoading(true);
      
      // Dados do usuário para a IA
      const userData = {
        goal: 'melhorar a saúde',
        fitnessLevel: 'intermediário',
        availableDays: 5,
        equipment: 'academia completa',
        injuries: 'nenhuma',
        preferences: 'musculação'
      };
      
      // Chamar a IA para gerar o plano
      const response = await generateAIWorkoutPlan(userData);
      
      // Aqui você pode processar a resposta da IA e atualizar o formulário
      // Por enquanto, vamos mostrar a resposta em um toast
      toast({
        title: "Plano gerado com IA",
        description: "O plano de treino foi gerado com sucesso. Verifique a resposta da IA.",
      });
      
      // Em uma implementação completa, você processaria a resposta da IA
      // e atualizaria os campos do formulário com base nela
    } catch (error) {
      console.error('Erro ao gerar plano com IA:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o plano com IA. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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

      {/* Switch para tornar o treino público */}
      <div className="flex items-center space-x-2">
        <Switch
          id="is-public"
          checked={isPublic}
          onCheckedChange={setIsPublic}
        />
        <Label htmlFor="is-public" className="text-sm">
          Tornar este treino público (outros usuários poderão visualizá-lo)
        </Label>
      </div>

      <div className="flex justify-between items-center">
        <Label>Exercícios do Treino</Label>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateWithAI}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <Sparkles className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Gerar com IA
          </Button>
        </motion.div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Select onValueChange={(value) => handleAddExercise(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Adicionar exercício existente" />
              </SelectTrigger>
              <SelectContent>
                {availableExercises.map((exercise) => (
                  <SelectItem key={exercise.id} value={exercise.id}>
                    {exercise.name} - {exercise.muscleGroup}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCreateExercise(!showCreateExercise)}
            className="flex items-center gap-2"
          >
            <Dumbbell size={16} />
            Criar Novo
          </Button>
        </div>

        {/* Formulário para criar novo exercício */}
        {showCreateExercise && (
          <Card className="border-dashed">
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">Criar Novo Exercício</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="exercise-name" className="text-sm">Nome do Exercício</Label>
                    <Input
                      id="exercise-name"
                      value={newExerciseName}
                      onChange={(e) => setNewExerciseName(e.target.value)}
                      placeholder="Ex: Supino Inclinado"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="exercise-muscle" className="text-sm">Grupo Muscular</Label>
                    <Input
                      id="exercise-muscle"
                      value={newExerciseMuscleGroup}
                      onChange={(e) => setNewExerciseMuscleGroup(e.target.value)}
                      placeholder="Ex: Peito"
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="exercise-equipment" className="text-sm">Equipamento (opcional)</Label>
                    <Input
                      id="exercise-equipment"
                      value={newExerciseEquipment}
                      onChange={(e) => setNewExerciseEquipment(e.target.value)}
                      placeholder="Ex: Barra, Halteres"
                      className="h-9"
                    />
                  </div>
                  <div>
                    <Label htmlFor="exercise-instructions" className="text-sm">Instruções (opcional)</Label>
                    <Input
                      id="exercise-instructions"
                      value={newExerciseInstructions}
                      onChange={(e) => setNewExerciseInstructions(e.target.value)}
                      placeholder="Como executar o exercício"
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleCreateExercise}
                    disabled={creatingExercise}
                    className="bg-fitness-primary hover:bg-fitness-primary/90"
                  >
                    {creatingExercise ? 'Criando...' : 'Criar Exercício'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateExercise(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
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

      <Button 
        type="submit" 
        className="w-full bg-fitness-primary hover:bg-fitness-primary/90"
      >
        {initialWorkout ? 'Atualizar Treino' : 'Criar Treino'}
      </Button>
    </form>
  );
};

export default WorkoutFormWithAI;
