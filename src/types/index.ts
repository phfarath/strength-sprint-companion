export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  weight: number;
  restSeconds?: number;
  notes?: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  exercises: Exercise[];
  dayOfWeek: number; // 0-6, domingo a sábado
  notes?: string;
  isPublic?: boolean;
}

export interface WorkoutLog {
  id: string;
  date: string;
  workoutPlanId: string;
  completed: boolean;
  exercises: {
    exerciseId: string;
    actualSets: number;
    actualReps: number;
    actualWeight: number;
    notes?: string;
  }[];
  notes?: string;
}

export interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number; // em gramas
  carbs: number; // em gramas
  fat: number; // em gramas
  servingSize: number; // em gramas
  servingUnit: string;
}

interface MealFood {
  foodId: number; // Change from string to number
  servings: number;
  food?: Food;
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  foods: MealFood[];
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface MealPlan {
  id: string;
  name: string; // Adicionando a propriedade name
  date: string;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'none'; // Adicionando campo de frequência
  meals: Meal[];
  notes?: string;
  isPublic?: boolean;
  totalNutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface User {
  id: string;
  name: string;
  nutritionGoals: NutritionGoals;
  weight?: number;
  height?: number;
  birthdate?: string;
}

export type DayOfWeek = 'domingo' | 'segunda' | 'terça' | 'quarta' | 'quinta' | 'sexta' | 'sábado';

export const daysOfWeek: DayOfWeek[] = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

export interface Notification {
  id: string;
  message: string;
  time: string;
  read: boolean;
  type: 'workout' | 'meal' | 'general';
}
