import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  Exercise, Food, MealPlan, Notification, User, WorkoutLog, WorkoutPlan 
} from '../types';
import { 
  exercises as mockExercises,
  foods as mockFoods,
  mealPlans as mockMealPlans,
  notifications as mockNotifications,
  user as mockUser,
  workoutLogs as mockWorkoutLogs,
  workoutPlans as mockWorkoutPlans,
  getCurrentDate,
  getTodaysWorkout as getMockTodaysWorkout
} from '../data/mockData';
import { toast } from '@/components/ui/use-toast';
import { apiServices } from '../services/api';

// Antes do useState
const DEFAULT_USER: User = {
  id: '',
  name: '',
  nutritionGoals: {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 70
  }
};

// Authentication result types
interface LoginResult {
  success: boolean;
  message?: string;
}

interface RegisterResult {
  success: boolean;
  message?: string;
}
interface AppContextType {
  // Dados
  exercises: Exercise[];
  foods: Food[];
  mealPlans: MealPlan[];
  notifications: Notification[];
  user: User;
  workoutLogs: WorkoutLog[];
  workoutPlans: WorkoutPlan[];
  isAuthenticated: boolean; // Adicione esta propriedade
  isLoading: boolean; // Adicione esta propriedade
  
  // Funções de autenticação
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (userData: { name: string, email: string, password: string }) => Promise<RegisterResult>;
  logout: () => void;
  loginWithGoogle: (idToken: string) => Promise<LoginResult>;
  
  // Funções de workout
  addWorkoutPlan: (plan: Omit<WorkoutPlan, 'id'>) => void;
  updateWorkoutPlan: (plan: WorkoutPlan) => void;
  deleteWorkoutPlan: (id: string) => void;
  logWorkout: (log: Omit<WorkoutLog, 'id'>) => void;
  updateWorkoutLog: (log: WorkoutLog) => void;
  
  // Funções de meal
  addMealPlan: (plan: Omit<MealPlan, 'id'>) => Promise<MealPlan>;
  updateMealPlan: (plan: MealPlan) => Promise<MealPlan>;
  deleteMealPlan: (id: string) => Promise<void>;
  
  // Funções de usuário
  updateUserGoals: (goals: User['nutritionGoals']) => void;
  updateUserProfile: (profile: Omit<User, 'id' | 'nutritionGoals'>) => void;
  
  // Funções de notificações
  markNotificationAsRead: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void;
  
  // Funções utilitárias
  getTodaysWorkout: () => WorkoutPlan | undefined;
  getCurrentDate: () => string;
  isTodayWorkoutComplete: () => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Estado para armazenar dados
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [user, setUser] = useState<User | null>(DEFAULT_USER);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const transformMealPlan = (plan: any): MealPlan => ({
    ...plan,
    meals: (plan.meals || []).map((meal: any) => ({
      id: meal.id,
      name: meal.name,
      time: meal.time,
      foods: (meal.mealFoods || []).map((mf: any) => ({
        foodId: mf.foodId,
        servings: mf.quantity,
        food: mf.food
      }))
    }))
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // Verificar autenticação na inicialização
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      setIsAuthenticated(true);
      fetchUserData();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Função para buscar dados do usuário
  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const userResponse = await apiServices.getProfile();
      
      // Se o usuário não tiver metas nutricionais definidas, adicione valores padrão
      if (!userResponse.data.nutritionGoals) {
        userResponse.data.nutritionGoals = DEFAULT_USER.nutritionGoals;
      }
      
      setUser(userResponse.data);
      
      // Buscar outros dados com tratamento de erro individual
      try {
        const exercisesResponse = await apiServices.getExercises();
        setExercises(exercisesResponse.data);
      } catch (error) {
        console.error('Erro ao buscar exercícios:', error);
        setExercises(mockExercises);
      }
      
      try {
        const foodsResponse = await apiServices.getFoods();
        setFoods(foodsResponse.data);
      } catch (error) {
        console.error('Erro ao buscar alimentos:', error);
        setFoods(mockFoods);
      }
      
      // E assim por diante para outros fetchs
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      
      // Se o erro for de autenticação (401), fazer logout
      if (error.response?.status === 401) {
        logout();
      } else {
        // Para outros erros, usar dados mockados
        setUser(mockUser);
        setExercises(mockExercises);
        setFoods(mockFoods);
        setWorkoutPlans(mockWorkoutPlans);
        setWorkoutLogs(mockWorkoutLogs);
        setMealPlans(mockMealPlans);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Funções para buscar dados da API
  const fetchExercises = async () => {
    try {
      const response = await apiServices.getExercises();
      setExercises(response.data);
    } catch (error) {
      console.error('Erro ao buscar exercícios:', error);
      setExercises(mockExercises); // Fallback temporário
    }
  };

  const fetchFoods = async () => {
    try {
      const response = await apiServices.getFoods();
      setFoods(response.data);
    } catch (error) {
      console.error('Erro ao buscar alimentos:', error);
      setFoods(mockFoods); // Fallback temporário
    }
  };

  const fetchWorkoutPlans = async () => {
    try {
      console.log("Buscando planos de treino do servidor...");
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.log("Token não encontrado, usando dados mock");
        setWorkoutPlans(mockWorkoutPlans);
        return;
      }

      const response = await apiServices.getWorkoutPlans();
      console.log("Planos de treino recebidos:", response.data);
      setWorkoutPlans(response.data || []);
    } catch (error) {
      console.error('Erro ao buscar planos de treino:', error);
      setWorkoutPlans(mockWorkoutPlans); // Fallback
    }
  };

  const fetchWorkoutLogs = async () => {
    try {
      console.log("Buscando logs de treino do servidor...");
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.log("Token não encontrado, usando dados mock");
        setWorkoutLogs(mockWorkoutLogs);
        return;
      }

      const response = await apiServices.getWorkoutSessions();
      console.log("Logs de treino recebidos:", response.data);
      setWorkoutLogs(response.data || []);
    } catch (error) {
      console.error('Erro ao buscar logs de treino:', error);
      setWorkoutLogs(mockWorkoutLogs); // Fallback
    }
  };

  // Modificar a função fetchMealPlans no AppContext
  const fetchMealPlans = async () => {
    try {
      console.log("Buscando planos alimentares do servidor...");
      // Verificar token de autenticação
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.warn("Token de autenticação não encontrado");
        setMealPlans([]);
        return;
      }
      
      const response = await apiServices.getMealPlans();
      console.log("Planos alimentares recebidos:", response.data);
      
      if (Array.isArray(response.data)) {
        const transformed = response.data.map(transformMealPlan);
        setMealPlans(transformed);
      } else {
        console.error("Formato de resposta inesperado:", response.data);
        setMealPlans([]);
      }
    } catch (error) {
      console.error('Erro ao buscar planos alimentares:', error);
      // Log detalhado para ajudar na depuração
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Dados do erro:", error.response.data);
      }
      setMealPlans([]);
    }
  };

  // Funções de autenticação
  const login = async (email: string, password: string) => {
    try {
      const response = await apiServices.login({ email, password });
      const { token, user: userData } = response.data;
      
      // Salvar token
      localStorage.setItem('auth_token', token);
      setIsAuthenticated(true);
      setUser(userData);
      
      // Buscar outros dados após login
      fetchUserData();
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erro ao fazer login'
      };
    }
  };

  const register = async (userData: { name: string, email: string, password: string }) => {
    try {
      const response = await apiServices.register(userData);
      const { token, user: newUser } = response.data;
      
      // Salvar token
      localStorage.setItem('auth_token', token);
      setIsAuthenticated(true);
      setUser(newUser);
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao registrar:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erro ao registrar usuário'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setUser(null);
    // Limpar dados
    setExercises([]);
    setFoods([]);
    setWorkoutPlans([]);
    setWorkoutLogs([]);
    setMealPlans([]);
    setNotifications([]);
  };

  // Função para login com Google
  const loginWithGoogle = async (idToken: string): Promise<LoginResult> => {
    try {
      const response = await apiServices.googleLogin({ idToken });
      const { token, user: userData } = response.data;

      localStorage.setItem('auth_token', token);
      setIsAuthenticated(true);
      setUser(userData);
      fetchUserData();

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao fazer login com Google:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao fazer login com Google'
      };
    }
  };

  // Atualizar o getTodaysWorkout para usar os dados reais (e não os mockados)
  const getTodaysWorkout = (): WorkoutPlan | undefined => {
    const currentDayOfWeek = new Date().getDay();
    return workoutPlans.find(plan => plan.dayOfWeek === currentDayOfWeek);
  };

  // Restante das funções modificadas para usar a API
  const addWorkoutPlan = async (plan: Omit<WorkoutPlan, 'id'>) => {
    try {
      console.log("Criando plano de treino:", plan);
      const response = await apiServices.createWorkoutPlan(plan);
      const newPlan = response.data;
      
      setWorkoutPlans(prev => [...prev, newPlan]);
      toast({
        title: "Plano de treino criado",
        description: `O plano ${newPlan.name} foi criado com sucesso!`,
      });
      return true;
    } catch (error: any) {
      console.error('Erro ao criar plano de treino:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o plano. Tente novamente.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateWorkoutPlan = async (plan: WorkoutPlan) => {
    try {
      console.log("Atualizando plano de treino:", plan);
      const response = await apiServices.updateWorkoutPlan(plan.id, plan);
      const updatedPlan = response.data;
      
      setWorkoutPlans(prev => prev.map(wp => wp.id === plan.id ? updatedPlan : wp));
      toast({
        title: "Plano de treino atualizado",
        description: `O plano ${updatedPlan.name} foi atualizado com sucesso!`,
      });
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar plano de treino:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o plano. Tente novamente.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteWorkoutPlan = async (id: string) => {
    try {
      console.log("Excluindo plano de treino:", id);
      const planToDelete = workoutPlans.find(wp => wp.id === id);
      
      await apiServices.deleteWorkoutPlan(id);
      setWorkoutPlans(prev => prev.filter(wp => wp.id !== id));
      
      toast({
        title: "Plano de treino excluído",
        description: `O plano ${planToDelete?.name} foi excluído com sucesso!`,
      });
      return true;
    } catch (error: any) {
      console.error('Erro ao excluir plano de treino:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o plano. Tente novamente.",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Funções para gerenciar logs de treino (com API)
  const logWorkout = async (log: Omit<WorkoutLog, 'id'>) => {
    try {
      console.log("Registrando treino:", log);
      const response = await apiServices.createWorkoutSession(log);
      const newLog = response.data;
      
      setWorkoutLogs(prev => [...prev, newLog]);
      toast({
        title: "Treino registrado",
        description: `Seu treino foi registrado com sucesso!`,
      });
      return true;
    } catch (error: any) {
      console.error('Erro ao registrar treino:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o treino. Tente novamente.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateWorkoutLog = (log: WorkoutLog) => {
    setWorkoutLogs(workoutLogs.map(wl => (wl.id === log.id ? log : wl)));
    toast({
      title: "Registro de treino atualizado",
      description: `Seu registro de treino foi atualizado com sucesso!`,
    });
  };

  // Funções para gerenciar planos de refeição
  const addMealPlan = async (plan: Omit<MealPlan, 'id'>) => {
    try {
      // Log dos dados originais
      console.log('Dados originais do plano:', JSON.stringify(plan, null, 2));
      
      // Normalizar IDs para números e remover IDs temporários
      const normalizedPlan = {
        ...plan,
        isPublic: plan.isPublic ?? false,
        meals: plan.meals.map(meal => {
          // Remova o ID temporário para novas refeições
          const { id, ...mealWithoutId } = meal;
          
          return {
            ...mealWithoutId, // Envie sem ID para o backend gerar
            foods: meal.foods.map(food => {
              // Converter para número para enviar para a API
              let foodId = food.foodId;
              
              if (typeof foodId === 'string') {
                // Converter para número
                foodId = parseInt(foodId, 10);
                
                if (isNaN(foodId)) {
                  console.error(`ID de alimento inválido: ${food.foodId}`);
                  return null;
                }
              }
              
              return {
                foodId: foodId, // Enviar como número
                servings: parseFloat(food.servings.toString())
              };
            }).filter(food => food !== null) // Remover itens inválidos
          };
        })
      };
      
      console.log('Enviando plano normalizado para API:', JSON.stringify(normalizedPlan, null, 2));
      
      const response = await apiServices.createMealPlan(normalizedPlan);
      console.log('Resposta da API:', response.data);
      
      // Verificar se a resposta tem refeições
      if (response.data.meals) {
        console.log(`Recebido do servidor: ${response.data.meals.length} refeições`);
      } else {
        console.warn('Resposta do servidor não contém refeições');
      }
      
      // Atualizar o estado com os dados retornados
      const newMealPlan = transformMealPlan(response.data);
      setMealPlans([...mealPlans, newMealPlan]);
      
      toast({
        title: "Plano alimentar criado",
        description: `Seu plano alimentar '${newMealPlan.name}' foi criado com sucesso!`,
      });
      
      return newMealPlan;
    } catch (error) {
      console.error("Erro ao criar plano alimentar:", error);
      // Log detalhado do erro
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Dados do erro:", error.response.data);
      }
      
      toast({
        title: "Erro",
        description: "Não foi possível criar o plano alimentar.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateMealPlan = async (plan: MealPlan) => {
    try {
      console.log("Iniciando atualização do plano alimentar:", plan.id);
      console.log("Dados enviados:", plan);
      
      const normalizedPlan = {
        ...plan,
        isPublic: plan.isPublic ?? false,
        meals: plan.meals.map(meal => ({
          ...meal,
          foods: meal.foods.map(food => ({
            foodId: typeof food.foodId === 'string' ? parseInt(food.foodId, 10) : food.foodId,
            servings: parseFloat(food.servings.toString())
          }))
        }))
      };

      const response = await apiServices.updateMealPlan(plan.id, normalizedPlan);
      console.log("Resposta do servidor após atualização:", response.data);

      const updatedPlan = transformMealPlan(response.data);
      
      setMealPlans(mealPlans.map(mp => (mp.id === plan.id ? updatedPlan : mp)));
      toast({
        title: "Plano alimentar atualizado",
        description: `Seu plano alimentar '${plan.name}' foi atualizado com sucesso!`,
      });
      
      return updatedPlan;
    } catch (error) {
      console.error("Erro ao atualizar plano alimentar:", error);
      console.error("Detalhes do erro:", error.response?.data || "Sem detalhes");
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o plano alimentar.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteMealPlan = async (id: string) => {
    try {
      await apiServices.deleteMealPlan(id);
      
      setMealPlans(mealPlans.filter(mp => mp.id !== id));
      toast({
        title: "Plano alimentar removido",
        description: `O plano alimentar foi removido com sucesso!`,
      });
    } catch (error) {
      console.error("Erro ao remover plano alimentar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o plano alimentar.",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Funções para gerenciar perfil do usuário
  const updateUserGoals = async (goals: User['nutritionGoals']) => {
    try {
      // Envia para o servidor primeiro
      const response = await apiServices.updateNutritionGoals(goals);
      
      // Atualiza o estado com os dados retornados do servidor
      setUser(prevUser => ({ 
        ...prevUser,
        nutritionGoals: response.data 
      }));
      
      toast({
        title: "Metas atualizadas",
        description: "Suas metas nutricionais foram atualizadas com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao atualizar metas nutricionais:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar suas alterações no servidor.",
        variant: "destructive"
      });
    }
  };

  const updateUserProfile = async (profile: Omit<User, 'id' | 'nutritionGoals'>) => {
    try {
      await apiServices.updateProfile(profile);
      
      // Busca novamente todos os dados do usuário
      fetchUserData();
      
      toast({
        title: "Perfil atualizado",
        description: "Seu perfil foi atualizado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar suas alterações no servidor.",
        variant: "destructive"
      });
    }
  };

  // Funções para gerenciar notificações
  const markNotificationAsRead = (id: string) => {
    setNotifications(
      notifications.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `n${Date.now()}`,
      read: false
    };
    setNotifications([...notifications, newNotification]);
  };

  // Verificar se o treino de hoje foi concluído
  const isTodayWorkoutComplete = (): boolean => {
    const today = getCurrentDate();
    const todayWorkout = getTodaysWorkout();
    
    if (!todayWorkout) return false;
    
    const todayLog = workoutLogs.find(
      log => log.date === today && log.workoutPlanId === todayWorkout.id
    );
    
    return !!todayLog?.completed;
  };

  // Simular notificações com setTimeout
  useEffect(() => {
    const workoutNotificationTimeout = setTimeout(() => {
      const todayWorkout = getTodaysWorkout();
      if (todayWorkout && !isTodayWorkoutComplete()) {
        addNotification({
          message: `Não esqueça do seu treino de ${todayWorkout.name} hoje!`,
          time: new Date().toISOString(),
          type: 'workout'
        });
        
        toast({
          title: "Lembrete de treino",
          description: `Não esqueça do seu treino de ${todayWorkout.name} hoje!`,
        });
      }
    }, 10000); // 10 segundos após carregar a página

    return () => clearTimeout(workoutNotificationTimeout);
  }, []);

  // Garantir que essa função seja chamada ao carregar o componente
  useEffect(() => {
    if (isAuthenticated) {
      fetchWorkoutPlans();
      fetchWorkoutLogs();
      fetchMealPlans(); // Garantir que isso seja chamado
      fetchFoods();
    }
  }, [isAuthenticated]);

  // Função para adicionar um alimento
  const addFood = async (foodData) => {
    try {
      const response = await apiServices.createFood(foodData);
      setFoods(prev => [...prev, response.data]);
      return response.data;
    } catch (error) {
      console.error('Erro ao adicionar alimento:', error);
      throw error;
    }
  };

  // Função para atualizar um alimento
  const updateFood = async (id, foodData) => {
    try {
      const response = await apiServices.updateFood(id, foodData);
      setFoods(prev => prev.map(food => food.id === id ? response.data : food));
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar alimento:', error);
      throw error;
    }
  };

  // Função para excluir um alimento
  const deleteFood = async (id) => {
    try {
      await apiServices.deleteFood(id);
      setFoods(prev => prev.filter(food => food.id !== id));
      return true;
    } catch (error) {
      console.error('Erro ao excluir alimento:', error);
      throw error;
    }
  };

  const value = {
    // Dados
    exercises,
    foods,
    mealPlans,
    notifications,
    user,
    workoutLogs,
    workoutPlans,
    isLoading,
    isAuthenticated,
    
    // Funções de autenticação
    login,
    register,
    logout,
    loginWithGoogle,
    
    // Funções de workout (manter as existentes)
    addWorkoutPlan,
    updateWorkoutPlan,
    deleteWorkoutPlan,
    logWorkout,
    updateWorkoutLog,
    
    // Funções de meal (manter as existentes)
    addMealPlan,
    updateMealPlan,
    deleteMealPlan,
    
    // Funções de usuário (manter as existentes)
    updateUserGoals,
    updateUserProfile,
    
    // Funções de notificações (manter as existentes)
    markNotificationAsRead,
    addNotification,
    
    // Funções utilitárias
    getTodaysWorkout,
    getCurrentDate,
    isTodayWorkoutComplete,

    // Funções de alimentos
    addFood,
    updateFood,
    deleteFood
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
