
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
  getTodaysWorkout
} from '../data/mockData';
import { toast } from '@/components/ui/use-toast';

interface AppContextType {
  // Dados
  exercises: Exercise[];
  foods: Food[];
  mealPlans: MealPlan[];
  notifications: Notification[];
  user: User;
  workoutLogs: WorkoutLog[];
  workoutPlans: WorkoutPlan[];
  
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
  const [exercises, setExercises] = useState<Exercise[]>(mockExercises);
  const [foods, setFoods] = useState<Food[]>(mockFoods);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>(mockMealPlans);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [user, setUser] = useState<User>(mockUser);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>(mockWorkoutLogs);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>(mockWorkoutPlans);

  // Carregando dados do localStorage na inicialização (se existirem)
  useEffect(() => {
    const storedExercises = localStorage.getItem('exercises');
    if (storedExercises) setExercises(JSON.parse(storedExercises));

    const storedFoods = localStorage.getItem('foods');
    if (storedFoods) setFoods(JSON.parse(storedFoods));

    const storedMealPlans = localStorage.getItem('mealPlans');
    if (storedMealPlans) setMealPlans(JSON.parse(storedMealPlans));
    
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) setNotifications(JSON.parse(storedNotifications));
    
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    
    const storedWorkoutLogs = localStorage.getItem('workoutLogs');
    if (storedWorkoutLogs) setWorkoutLogs(JSON.parse(storedWorkoutLogs));
    
    const storedWorkoutPlans = localStorage.getItem('workoutPlans');
    if (storedWorkoutPlans) setWorkoutPlans(JSON.parse(storedWorkoutPlans));
  }, []);

  // Salvando dados no localStorage quando mudarem
  useEffect(() => {
    localStorage.setItem('exercises', JSON.stringify(exercises));
  }, [exercises]);

  useEffect(() => {
    localStorage.setItem('foods', JSON.stringify(foods));
  }, [foods]);

  useEffect(() => {
    localStorage.setItem('mealPlans', JSON.stringify(mealPlans));
  }, [mealPlans]);

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('workoutLogs', JSON.stringify(workoutLogs));
  }, [workoutLogs]);

  useEffect(() => {
    localStorage.setItem('workoutPlans', JSON.stringify(workoutPlans));
  }, [workoutPlans]);

  // Funções para gerenciar planos de treino
  const addWorkoutPlan = (plan: Omit<WorkoutPlan, 'id'>) => {
    const newPlan: WorkoutPlan = {
      ...plan,
      id: `wp${Date.now()}`
    };
    setWorkoutPlans([...workoutPlans, newPlan]);
    toast({
      title: "Plano de treino adicionado",
      description: `O plano ${newPlan.name} foi adicionado com sucesso!`,
    });
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
    
    // Funções de workout
    addWorkoutPlan,
    updateWorkoutPlan,
    deleteWorkoutPlan,
    logWorkout,
    updateWorkoutLog,
    
    // Funções de meal
    addMealPlan,
    updateMealPlan,
    deleteMealPlan,
    
    // Funções de usuário
    updateUserGoals,
    updateUserProfile,
    
    // Funções de notificações
    markNotificationAsRead,
    addNotification,
    
    // Funções utilitárias
    getTodaysWorkout,
    getCurrentDate,
    isTodayWorkoutComplete
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
