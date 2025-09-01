import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from '@/context/AppContext';
import { TrendingUp } from 'lucide-react';

const ExerciseProgressChart = () => {
  const { workoutLogs } = useAppContext();

  // Processar dados dos logs para criar dados de progresso
  const processProgressData = () => {
    const exerciseData = new Map();
    
    // Agrupar por exercício e calcular progresso de peso ao longo do tempo
    workoutLogs
      .filter(log => log.completed)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(log => {
        log.exercises.forEach(exercise => {
          if (!exerciseData.has(exercise.exerciseId)) {
            exerciseData.set(exercise.exerciseId, []);
          }
          
          exerciseData.get(exercise.exerciseId).push({
            date: new Date(log.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            weight: exercise.actualWeight,
            reps: exercise.actualReps,
            sets: exercise.actualSets
          });
        });
      });

    // Pegar os 5 exercícios mais frequentes
    const topExercises = Array.from(exerciseData.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5);

    return topExercises.length > 0 ? topExercises[0][1] : [
      { date: '01/01', weight: 50, reps: 10, sets: 3 },
      { date: '08/01', weight: 55, reps: 10, sets: 3 },
      { date: '15/01', weight: 60, reps: 12, sets: 3 },
      { date: '22/01', weight: 65, reps: 12, sets: 3 },
      { date: '29/01', weight: 70, reps: 15, sets: 3 },
    ];
  };

  const progressData = processProgressData();

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-fitness-primary" />
          Evolução de Carga - Exercício Principal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value, name) => [
                  `${value}kg`, 
                  'Peso'
                ]}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#2563eb" 
                strokeWidth={3}
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-2 bg-purple-50 rounded">
            <p className="text-gray-600">Progresso Total</p>
            <p className="font-bold text-purple-600">
              +{progressData.length > 0 ? 
                (progressData[progressData.length - 1].weight - progressData[0].weight) : 0}kg
            </p>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded">
            <p className="text-gray-600">Sessões</p>
            <p className="font-bold text-purple-600">{progressData.length}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExerciseProgressChart;
