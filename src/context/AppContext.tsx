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
  
  // Funções de workout
  addWorkoutPlan: (plan: Omit<WorkoutPlan, 'id'>) => void;
  updateWorkoutPlan: (plan: WorkoutPlan) => void;
  deleteWorkoutPlan: (id: string) => void;
  logWorkout: (log: Omit<WorkoutLog, 'id'>) => void;
  updateWorkoutLog: (log: WorkoutLog) => void;
  
  // Funções de meal
  addMealPlan: (plan: Omit<MealPlan, 'id'>) => void;
  updateMealPlan: (plan: MealPlan) => void;
  deleteMealPlan: (id: string) => void;
  
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
      const response = await apiServices.getWorkoutPlans();
      setWorkoutPlans(response.data);
    } catch (error) {
      console.error('Erro ao buscar planos de treino:', error);
      setWorkoutPlans(mockWorkoutPlans); // Fallback temporário
    }
  };

  const fetchWorkoutLogs = async () => {
    try {
      const response = await apiServices.getWorkoutSessions();
      setWorkoutLogs(response.data);
    } catch (error) {
      console.error('Erro ao buscar logs de treino:', error);
      setWorkoutLogs(mockWorkoutLogs); // Fallback temporário
    }
  };

  const fetchMealPlans = async () => {
    try {
      const response = await apiServices.getDietPlans();
      setMealPlans(response.data);
    } catch (error) {
      console.error('Erro ao buscar planos alimentares:', error);
      setMealPlans(mockMealPlans); // Fallback temporário
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

  // Atualizar o getTodaysWorkout para usar os dados reais (e não os mockados)
  const getTodaysWorkout = (): WorkoutPlan | undefined => {
    const currentDayOfWeek = new Date().getDay();
    return workoutPlans.find(plan => plan.dayOfWeek === currentDayOfWeek);
  };

  // Restante das funções modificadas para usar a API
  const addWorkoutPlan = async (plan: Omit<WorkoutPlan, 'id'>) => {
    try {
      const response = await apiServices.createWorkoutPlan(plan);
      const newPlan = response.data;
      setWorkoutPlans([...workoutPlans, newPlan]);
      toast({
        title: "Plano de treino adicionado",
        description: `O plano ${newPlan.name} foi adicionado com sucesso!`,
      });
    } catch (error) {
      console.error('Erro ao adicionar plano:', error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o plano. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const updateWorkoutPlan = (plan: WorkoutPlan) => {
    setWorkoutPlans(workoutPlans.map(wp => (wp.id === plan.id ? plan : wp)));
    toast({
      title: "Plano de treino atualizado",
      description: `O plano ${plan.name} foi atualizado com sucesso!`,
    });
  };

  const deleteWorkoutPlan = (id: string) => {
    const planToDelete = workoutPlans.find(wp => wp.id === id);
    if (planToDelete) {
      setWorkoutPlans(workoutPlans.filter(wp => wp.id !== id));
      toast({
        title: "Plano de treino removido",
        description: `O plano ${planToDelete.name} foi removido com sucesso!`,
      });
    }
  };

  // Funções para gerenciar logs de treino
  const logWorkout = (log: Omit<WorkoutLog, 'id'>) => {
    const newLog: WorkoutLog = {
      ...log,
      id: `wl${Date.now()}`
    };
    setWorkoutLogs([...workoutLogs, newLog]);
    toast({
      title: "Treino registrado",
      description: `Seu treino foi registrado com sucesso!`,
    });
  };

  const updateWorkoutLog = (log: WorkoutLog) => {
    setWorkoutLogs(workoutLogs.map(wl => (wl.id === log.id ? log : wl)));
    toast({
      title: "Registro de treino atualizado",
      description: `Seu registro de treino foi atualizado com sucesso!`,
    });
  };

  // Funções para gerenciar planos de refeição
  const addMealPlan = (plan: Omit<MealPlan, 'id'>) => {
    const newPlan: MealPlan = {
      ...plan,
      id: `mp${Date.now()}`
    };
    setMealPlans([...mealPlans, newPlan]);
    toast({
      title: "Plano alimentar adicionado",
      description: `Seu plano alimentar para ${new Date(plan.date).toLocaleDateString()} foi adicionado!`,
    });
  };

  const updateMealPlan = (plan: MealPlan) => {
    setMealPlans(mealPlans.map(mp => (mp.id === plan.id ? plan : mp)));
    toast({
      title: "Plano alimentar atualizado",
      description: `Seu plano alimentar foi atualizado com sucesso!`,
    });
  };

  const deleteMealPlan = (id: string) => {
    setMealPlans(mealPlans.filter(mp => mp.id !== id));
    toast({
      title: "Plano alimentar removido",
      description: `O plano alimentar foi removido com sucesso!`,
    });
  };

  // Funções para gerenciar perfil do usuário
  const updateUserGoals = (goals: User['nutritionGoals']) => {
    setUser({ ...user, nutritionGoals: goals });
    toast({
      title: "Metas atualizadas",
      description: `Suas metas nutricionais foram atualizadas com sucesso!`,
    });
  };

  const updateUserProfile = (profile: Omit<User, 'id' | 'nutritionGoals'>) => {
    setUser({ ...user, ...profile });
    toast({
      title: "Perfil atualizado",
      description: `Seu perfil foi atualizado com sucesso!`,
    });
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
    isTodayWorkoutComplete
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
