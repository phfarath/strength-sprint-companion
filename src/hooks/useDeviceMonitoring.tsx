
import { useState, useEffect } from 'react';

export interface DeviceData {
  steps: number;
  heartRate: number;
  caloriesBurned: number;
  sleepHours?: number;
  activeMinutes?: number;
}

// Hook que pode ser usado para receber dados de dispositivos (atualmente mockados)
export const useDeviceMonitoring = () => {
  const [deviceData, setDeviceData] = useState<DeviceData>({
    steps: 0,
    heartRate: 0,
    caloriesBurned: 0,
    sleepHours: 0,
    activeMinutes: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simular conexão com dispositivo
    const connectToDevice = () => {
      setIsLoading(true);
      
      // Simular tempo de conexão
      setTimeout(() => {
        setIsConnected(true);
        setIsLoading(false);
        
        // Gerar dados iniciais
        updateDeviceData();
      }, 1000);
    };
    
    // Função para gerar dados simulados
    const updateDeviceData = () => {
      const currentHour = new Date().getHours();
      const dayProgress = currentHour / 24; // Progresso do dia (0-1)
      
      // Dados simulados com base na hora do dia
      const stepsMax = 10000;
      const steps = Math.min(Math.floor(dayProgress * stepsMax * (0.8 + Math.random() * 0.4)), stepsMax);
      
      // Batimentos cardíacos simulados (60-100 bpm em repouso)
      const heartRate = Math.floor(60 + Math.random() * 40);
      
      // Calorias queimadas com base em passos
      const caloriesBurned = Math.floor(steps * 0.05);
      
      // Minutos ativos (aproximadamente 30 minutos para cada 3000 passos)
      const activeMinutes = Math.floor(steps / 100);
      
      // Horas de sono para o dia anterior (simulado)
      const sleepHours = Math.floor(6 + Math.random() * 3);
      
      setDeviceData({
        steps,
        heartRate,
        caloriesBurned,
        sleepHours,
        activeMinutes
      });
    };
    
    // Iniciar conexão simulada
    connectToDevice();
    
    // Atualizar dados periodicamente (a cada 2 minutos)
    const interval = setInterval(updateDeviceData, 120000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  // Função para forçar atualização dos dados
  const refreshData = () => {
    setIsLoading(true);
    
    // Simular tempo de atualização
    setTimeout(() => {
      // Gerar novos dados
      const steps = Math.floor(1000 + Math.random() * 9000);
      const heartRate = Math.floor(60 + Math.random() * 40);
      const caloriesBurned = Math.floor(steps * 0.05);
      const activeMinutes = Math.floor(steps / 100);
      const sleepHours = Math.floor(6 + Math.random() * 3);
      
      setDeviceData({
        steps,
        heartRate,
        caloriesBurned,
        sleepHours,
        activeMinutes
      });
      
      setIsLoading(false);
    }, 800);
  };
  
  // Funções para futuras integrações com dispositivos reais
  const connectGoogleFit = () => {
    console.log('Conectando com Google Fit...');
    // Implementar código de conexão real no futuro
  };
  
  const connectAppleHealth = () => {
    console.log('Conectando com Apple Health...');
    // Implementar código de conexão real no futuro
  };
  
  return {
    deviceData,
    isConnected,
    isLoading,
    refreshData,
    connectGoogleFit,
    connectAppleHealth
  };
};

export default useDeviceMonitoring;
