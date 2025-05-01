
import { Exercise, Food, MealPlan, User, WorkoutPlan, WorkoutLog, Notification } from "../types";

// Dados mockados de exercícios
export const exercises: Exercise[] = [
  { id: "ex1", name: "Supino Reto", muscleGroup: "Peito", sets: 4, reps: 12, weight: 60 },
  { id: "ex2", name: "Agachamento", muscleGroup: "Pernas", sets: 4, reps: 10, weight: 80 },
  { id: "ex3", name: "Puxada Alta", muscleGroup: "Costas", sets: 4, reps: 12, weight: 70 },
  { id: "ex4", name: "Desenvolvimento", muscleGroup: "Ombros", sets: 4, reps: 10, weight: 40 },
  { id: "ex5", name: "Rosca Direta", muscleGroup: "Bíceps", sets: 3, reps: 12, weight: 30 },
  { id: "ex6", name: "Tríceps Corda", muscleGroup: "Tríceps", sets: 3, reps: 12, weight: 25 },
  { id: "ex7", name: "Elevação Lateral", muscleGroup: "Ombros", sets: 3, reps: 15, weight: 10 },
  { id: "ex8", name: "Leg Press", muscleGroup: "Pernas", sets: 4, reps: 12, weight: 200 },
  { id: "ex9", name: "Cadeira Extensora", muscleGroup: "Pernas", sets: 3, reps: 15, weight: 50 },
  { id: "ex10", name: "Mesa Flexora", muscleGroup: "Pernas", sets: 3, reps: 15, weight: 40 },
  { id: "ex11", name: "Crucifixo", muscleGroup: "Peito", sets: 3, reps: 12, weight: 20 },
  { id: "ex12", name: "Remada Baixa", muscleGroup: "Costas", sets: 4, reps: 12, weight: 60 },
  { id: "ex13", name: "Abdominal", muscleGroup: "Abdômen", sets: 4, reps: 20, weight: 0 },
  { id: "ex14", name: "Stiff", muscleGroup: "Pernas", sets: 3, reps: 12, weight: 60 },
  { id: "ex15", name: "Panturrilha em Pé", muscleGroup: "Pernas", sets: 4, reps: 20, weight: 100 },
];

// Dados mockados de planos de treino
export const workoutPlans: WorkoutPlan[] = [
  {
    id: "wp1",
    name: "Treino A - Peito e Tríceps",
    exercises: [
      { id: "ex1", name: "Supino Reto", muscleGroup: "Peito", sets: 4, reps: 12, weight: 60 },
      { id: "ex11", name: "Crucifixo", muscleGroup: "Peito", sets: 3, reps: 12, weight: 20 },
      { id: "ex6", name: "Tríceps Corda", muscleGroup: "Tríceps", sets: 3, reps: 12, weight: 25 },
      { id: "ex13", name: "Abdominal", muscleGroup: "Abdômen", sets: 4, reps: 20, weight: 0 },
    ],
    dayOfWeek: 1, // Segunda-feira
  },
  {
    id: "wp2",
    name: "Treino B - Costas e Bíceps",
    exercises: [
      { id: "ex3", name: "Puxada Alta", muscleGroup: "Costas", sets: 4, reps: 12, weight: 70 },
      { id: "ex12", name: "Remada Baixa", muscleGroup: "Costas", sets: 4, reps: 12, weight: 60 },
      { id: "ex5", name: "Rosca Direta", muscleGroup: "Bíceps", sets: 3, reps: 12, weight: 30 },
      { id: "ex13", name: "Abdominal", muscleGroup: "Abdômen", sets: 4, reps: 20, weight: 0 },
    ],
    dayOfWeek: 3, // Quarta-feira
  },
  {
    id: "wp3",
    name: "Treino C - Pernas e Ombros",
    exercises: [
      { id: "ex2", name: "Agachamento", muscleGroup: "Pernas", sets: 4, reps: 10, weight: 80 },
      { id: "ex8", name: "Leg Press", muscleGroup: "Pernas", sets: 4, reps: 12, weight: 200 },
      { id: "ex4", name: "Desenvolvimento", muscleGroup: "Ombros", sets: 4, reps: 10, weight: 40 },
      { id: "ex7", name: "Elevação Lateral", muscleGroup: "Ombros", sets: 3, reps: 15, weight: 10 },
    ],
    dayOfWeek: 5, // Sexta-feira
  },
];

// Dados mockados de alimentos
export const foods: Food[] = [
  { id: "f1", name: "Frango Grelhado", calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: 100, servingUnit: "g" },
  { id: "f2", name: "Arroz Branco", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, servingSize: 100, servingUnit: "g" },
  { id: "f3", name: "Batata Doce", calories: 86, protein: 1.6, carbs: 20, fat: 0.1, servingSize: 100, servingUnit: "g" },
  { id: "f4", name: "Ovos", calories: 155, protein: 13, carbs: 1.1, fat: 11, servingSize: 100, servingUnit: "g" },
  { id: "f5", name: "Aveia", calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9, servingSize: 100, servingUnit: "g" },
  { id: "f6", name: "Whey Protein", calories: 120, protein: 25, carbs: 3, fat: 2, servingSize: 30, servingUnit: "g" },
  { id: "f7", name: "Banana", calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, servingSize: 100, servingUnit: "g" },
  { id: "f8", name: "Pão Integral", calories: 247, protein: 13, carbs: 41, fat: 4.3, servingSize: 100, servingUnit: "g" },
  { id: "f9", name: "Queijo Branco", calories: 280, protein: 17.5, carbs: 3.5, fat: 22, servingSize: 100, servingUnit: "g" },
  { id: "f10", name: "Azeite", calories: 884, protein: 0, carbs: 0, fat: 100, servingSize: 100, servingUnit: "ml" },
  { id: "f11", name: "Carne Bovina", calories: 250, protein: 26, carbs: 0, fat: 17, servingSize: 100, servingUnit: "g" },
  { id: "f12", name: "Abacate", calories: 160, protein: 2, carbs: 8.5, fat: 14.7, servingSize: 100, servingUnit: "g" },
  { id: "f13", name: "Quinoa", calories: 120, protein: 4.4, carbs: 21.3, fat: 1.9, servingSize: 100, servingUnit: "g" },
  { id: "f14", name: "Tomate", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, servingSize: 100, servingUnit: "g" },
  { id: "f15", name: "Alface", calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, servingSize: 100, servingUnit: "g" },
  { id: "f16", name: "Leite", calories: 42, protein: 3.4, carbs: 4.8, fat: 1, servingSize: 100, servingUnit: "ml" },
  { id: "f17", name: "Maçã", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, servingSize: 100, servingUnit: "g" },
  { id: "f18", name: "Amendoim", calories: 567, protein: 25.8, carbs: 16, fat: 49.2, servingSize: 100, servingUnit: "g" },
  { id: "f19", name: "Salmão", calories: 208, protein: 20, carbs: 0, fat: 13, servingSize: 100, servingUnit: "g" },
  { id: "f20", name: "Brócolis", calories: 34, protein: 2.8, carbs: 7, fat: 0.4, servingSize: 100, servingUnit: "g" },
];

// Mockado de planos de refeição
export const mealPlans: MealPlan[] = [
  {
    id: "mp1",
    date: "2023-05-01",
    meals: [
      {
        id: "m1",
        name: "Café da Manhã",
        time: "08:00",
        foods: [
          { foodId: "f5", servings: 0.5 }, // Aveia
          { foodId: "f7", servings: 1 }, // Banana
          { foodId: "f16", servings: 2 }, // Leite
        ]
      },
      {
        id: "m2",
        name: "Almoço",
        time: "12:00",
        foods: [
          { foodId: "f1", servings: 1.5 }, // Frango
          { foodId: "f2", servings: 1 }, // Arroz
          { foodId: "f3", servings: 1 }, // Batata doce
          { foodId: "f20", servings: 1 }, // Brócolis
        ]
      },
      {
        id: "m3",
        name: "Lanche",
        time: "15:30",
        foods: [
          { foodId: "f6", servings: 1 }, // Whey
          { foodId: "f7", servings: 1 }, // Banana
        ]
      },
      {
        id: "m4",
        name: "Jantar",
        time: "19:00",
        foods: [
          { foodId: "f19", servings: 1 }, // Salmão
          { foodId: "f13", servings: 0.5 }, // Quinoa
          { foodId: "f15", servings: 1 }, // Alface
          { foodId: "f14", servings: 1 }, // Tomate
        ]
      }
    ],
    notes: "Beber pelo menos 3L de água durante o dia."
  }
];

// Logs de treinos
export const workoutLogs: WorkoutLog[] = [
  {
    id: "wl1",
    date: "2023-05-01",
    workoutPlanId: "wp1",
    completed: true,
    exercises: [
      {
        exerciseId: "ex1",
        actualSets: 4,
        actualReps: 12,
        actualWeight: 60,
        notes: "Consegui completar todas as séries com facilidade."
      },
      {
        exerciseId: "ex11",
        actualSets: 3,
        actualReps: 12,
        actualWeight: 20,
        notes: ""
      },
      {
        exerciseId: "ex6",
        actualSets: 3,
        actualReps: 10,
        actualWeight: 25,
        notes: "Senti fadiga na última série."
      },
      {
        exerciseId: "ex13",
        actualSets: 4,
        actualReps: 20,
        actualWeight: 0,
        notes: ""
      }
    ],
    notes: "Treino bom, me senti com energia hoje."
  }
];

// Dados mockados do usuário
export const user: User = {
  id: "u1",
  name: "João Silva",
  nutritionGoals: {
    calories: 2500,
    protein: 180,
    carbs: 300,
    fat: 70
  },
  weight: 75,
  height: 178,
  birthdate: "1990-01-15"
};

// Dados mockados de notificações
export const notifications: Notification[] = [
  {
    id: "n1",
    message: "É hora do seu treino de Peito e Tríceps!",
    time: "2023-05-01T16:00:00",
    read: false,
    type: "workout"
  },
  {
    id: "n2",
    message: "Não esqueça de registrar sua refeição do almoço.",
    time: "2023-05-01T12:30:00",
    read: true,
    type: "meal"
  },
  {
    id: "n3",
    message: "Você alcançou sua meta de proteínas hoje! Parabéns!",
    time: "2023-05-01T20:00:00",
    read: false,
    type: "general"
  }
];

// Função para obter a data atual no formato YYYY-MM-DD
export const getCurrentDate = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// Função para obter a data do dia da semana atual (0 = domingo, 1 = segunda, etc)
export const getCurrentDayOfWeek = (): number => {
  return new Date().getDay();
};

// Função para obter o treino do dia atual
export const getTodaysWorkout = (): WorkoutPlan | undefined => {
  const currentDayOfWeek = getCurrentDayOfWeek();
  return workoutPlans.find(plan => plan.dayOfWeek === currentDayOfWeek);
};

// Função para obter o plano de refeição do dia atual
export const getTodaysMealPlan = (): MealPlan | undefined => {
  const currentDate = getCurrentDate();
  return mealPlans.find(plan => plan.date === currentDate);
};

// Função para calcular o total de calorias e macronutrientes de uma refeição
export const calculateMealNutrition = (meal: { foodId: string; servings: number }[]): { 
  calories: number; 
  protein: number; 
  carbs: number; 
  fat: number 
} => {
  return meal.reduce((acc, item) => {
    const food = foods.find(f => f.id === item.foodId);
    if (food) {
      acc.calories += food.calories * item.servings;
      acc.protein += food.protein * item.servings;
      acc.carbs += food.carbs * item.servings;
      acc.fat += food.fat * item.servings;
    }
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
};

// Função para calcular o total diário de nutrientes com base no plano de refeição
export const calculateDailyNutrition = (mealPlan: MealPlan): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} => {
  return mealPlan.meals.reduce((acc, meal) => {
    const mealNutrition = calculateMealNutrition(meal.foods);
    acc.calories += mealNutrition.calories;
    acc.protein += mealNutrition.protein;
    acc.carbs += mealNutrition.carbs;
    acc.fat += mealNutrition.fat;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
};

// Função para obter dados de progresso para um exercício específico (para gráficos)
export const getExerciseProgressData = (exerciseId: string): { date: string; weight: number }[] => {
  // Simulando dados de progresso para os últimos 10 treinos
  const logs = workoutLogs.filter(log => 
    log.exercises.some(ex => ex.exerciseId === exerciseId)
  );
  
  return logs.map(log => ({
    date: log.date,
    weight: log.exercises.find(ex => ex.exerciseId === exerciseId)?.actualWeight || 0
  }));
};

// Gera dados de treino para uma semana completa (para exibição no calendário)
export const generateWeekWorkouts = (): { day: number; workouts?: WorkoutPlan }[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const workout = workoutPlans.find(wp => wp.dayOfWeek === i);
    return {
      day: i,
      workouts: workout
    };
  });
};
