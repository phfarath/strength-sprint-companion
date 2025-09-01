
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Heart, Activity, Footprints } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

// Tipos para os dados de monitoramento
interface MonitoringData {
  steps: number;
  heartRate: number;
  caloriesBurned: number;
  dailyStepsGoal: number;
}

const DeviceMonitoring = () => {
  const { user } = useAppContext();
  const [monitoringData, setMonitoringData] = useState<MonitoringData>({
    steps: 0,
    heartRate: 0,
    caloriesBurned: 0,
    dailyStepsGoal: 10000
  });
  
  // Simular busca de dados de dispositivos (no futuro, pode ser uma API real)
  useEffect(() => {
    // Função para gerar dados simulados
    const fetchMockDeviceData = () => {
      // Dados simulados baseados na hora do dia
      const hour = new Date().getHours();
      const timeProgress = (hour >= 7 && hour <= 22) ? (hour - 7) / 15 : 0; // Progresso do dia (7h às 22h)
      
      // Valores simulados com alguma aleatoriedade
      const stepsMax = 10000;
      const steps = Math.min(Math.floor(timeProgress * stepsMax * (0.8 + Math.random() * 0.4)), stepsMax);
      
      // Batimentos cardíacos simulados (60-100 bpm em repouso)
      const heartRate = Math.floor(60 + Math.random() * 40);
      
      // Calorias queimadas com base em passos (~0.05 kcal por passo)
      const caloriesBurned = Math.floor(steps * 0.05);
      
      setMonitoringData({
        steps,
        heartRate,
        caloriesBurned,
        dailyStepsGoal: 10000
      });
    };
    
    // Buscar dados iniciais
    fetchMockDeviceData();
    
    // Simular atualização a cada 2 minutos
    const interval = setInterval(fetchMockDeviceData, 120000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Calcular progresso em porcentagem
  const stepsProgress = (monitoringData.steps / monitoringData.dailyStepsGoal) * 100;

  return (
    <Card className="bg-white rounded-lg shadow mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Monitoramento de Atividade</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <div className="flex items-center">
              <Footprints className="mr-1 h-4 w-4 text-fitness-primary" />
              <span className="text-sm font-medium">Passos</span>
            </div>
            <span className="text-sm font-bold">
              {monitoringData.steps.toLocaleString()} / {monitoringData.dailyStepsGoal.toLocaleString()}
            </span>
          </div>
          <Progress 
            value={stepsProgress} 
            className="h-2"
            aria-label="Progresso de passos diários"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <div className="flex items-center text-sm text-gray-600 mb-1">
              <Heart className="mr-1 h-4 w-4 text-red-500" />
              <span>Batimentos</span>
            </div>
            <div className="text-xl font-bold">{monitoringData.heartRate} <span className="text-sm font-normal">bpm</span></div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <div className="flex items-center text-sm text-gray-600 mb-1">
              <Activity className="mr-1 h-4 w-4 text-purple-500" />
              <span>Calorias</span>
            </div>
            <div className="text-xl font-bold">{monitoringData.caloriesBurned} <span className="text-sm font-normal">kcal</span></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceMonitoring;
