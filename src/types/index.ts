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
  rawResponse?: string;
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
  rawResponse?: string;
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

// Settings types (Phase 0 scaffolding)
export type ThemePreference = 'light' | 'dark' | 'system';
export type DensityPreference = 'comfortable' | 'compact';

export interface AppearanceSettings {
  theme: ThemePreference;
  primaryColor: string; // hex or css var
  density: DensityPreference;
  language: 'pt' | 'en';
  units: {
    weight: 'kg' | 'lb';
    length: 'cm' | 'in';
    energy: 'kcal' | 'kJ';
  };
}

export interface AccessibilitySettings {
  highContrast: boolean;
  fontScale: number; // 0.8–1.5
  reducedMotion: boolean;
  screenReader: boolean;
  largeCursor: boolean;
}

export interface NotificationSettings {
  push: boolean;
  email: boolean;
  quietHours?: { start: string; end: string } | null; // HH:mm
}

export interface AISettings {
  persona: 'technical' | 'motivational' | 'neutral';
  language: 'auto' | 'pt' | 'en';
  allowTraining: boolean; // consent to use data to improve models
  creativity: number; // 0–1
}

export interface AppSettings {
  appearance: AppearanceSettings;
  a11y: AccessibilitySettings;
  notifications: NotificationSettings;
  ai: AISettings;
}

export interface FeatureFlags {
  settingsDataControls: boolean;
  settingsSecurity: boolean;
  settingsIntegrations: boolean;
}
