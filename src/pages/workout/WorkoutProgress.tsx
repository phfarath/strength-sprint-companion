import React from 'react';
import Layout from '@/components/layout/Layout';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const WorkoutProgress = () => {
  const { workoutLogs } = useAppContext();
  
  // Dados de exemplo para os gráficos (substitua por dados reais dos workoutLogs)
  const progressData = [
    { date: '01/01', weight: 50 },
    { date: '08/01', weight: 55 },
    { date: '15/01', weight: 60 },
    { date: '22/01', weight: 65 },
    { date: '29/01', weight: 70 },
  ];
  
  const completionData = [
    { name: 'Segunda', completion: 100 },
    { name: 'Terça', completion: 80 },
    { name: 'Quarta', completion: 100 },
    { name: 'Quinta', completion: 0 },
    { name: 'Sexta', completion: 100 },
    { name: 'Sábado', completion: 60 },
    { name: 'Domingo', completion: 0 },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Seu Progresso de Treino</h1>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Progresso de Carga</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="weight" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Conclusão de Treinos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={completionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completion" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Treinos</CardTitle>
          </CardHeader>
          <CardContent>
            {workoutLogs.length > 0 ? (
              <div className="space-y-4">
                {workoutLogs.map((log) => (
                  <div key={log.id} className="border rounded-md p-4">
                    <div className="flex justify-between mb-2">
                      <h3 className="font-semibold">{log.date}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${log.completed ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {log.completed ? 'Concluído' : 'Parcial'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{log.exercises.length} exercícios realizados</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">
                Nenhum treino registrado ainda. Comece a treinar para ver seu progresso!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default WorkoutProgress;