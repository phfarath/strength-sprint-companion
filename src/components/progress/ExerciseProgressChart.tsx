
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppContext } from '@/context/AppContext';
import { getExerciseProgressData } from '@/data/mockData';

const ExerciseProgressChart = () => {
  const { exercises, workoutLogs } = useAppContext();
  const [selectedExercise, setSelectedExercise] = useState<string>(exercises[0]?.id || '');
  const [chartData, setChartData] = useState<{ date: string; weight: number }[]>([]);

  useEffect(() => {
    if (selectedExercise) {
      // Gerar dados históricos para o gráfico
      const progressData = getExerciseProgressData(selectedExercise);
      
      // Se não houver dados reais suficientes, adicionar alguns dados artificiais
      if (progressData.length < 5) {
        const artificialData = generateArtificialData(selectedExercise, 5 - progressData.length);
        setChartData([...artificialData, ...progressData]);
      } else {
        setChartData(progressData);
      }
    }
  }, [selectedExercise, workoutLogs]);

  const generateArtificialData = (exerciseId: string, count: number): { date: string; weight: number }[] => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return [];
    
    const baseWeight = exercise.weight;
    const today = new Date();
    
    return Array.from({ length: count }, (_, i) => {
      const date = new Date();
      date.setDate(today.getDate() - (i + 1) * 7); // Uma semana antes
      
      // Variação de -5% a +5% do peso base para cada ponto
      const weightVariation = baseWeight * (0.95 + Math.random() * 0.1);
      
      return {
        date: date.toISOString().split('T')[0],
        weight: Math.round(weightVariation)
      };
    }).reverse();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const getCurrentExerciseName = () => {
    return exercises.find(ex => ex.id === selectedExercise)?.name || '';
  };

  return (
    <Card className="bg-white rounded-lg shadow mb-6">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <CardTitle className="text-lg font-semibold">Evolução de Carga</CardTitle>
          <Select
            value={selectedExercise}
            onValueChange={setSelectedExercise}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecionar exercício" />
            </SelectTrigger>
            <SelectContent>
              {exercises.map((exercise) => (
                <SelectItem key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={value => `Data: ${formatDate(value)}`}
                formatter={(value: number) => [`${value} kg`, 'Carga']}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#38bdf8" 
                activeDot={{ r: 8 }} 
                name={getCurrentExerciseName()}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExerciseProgressChart;
