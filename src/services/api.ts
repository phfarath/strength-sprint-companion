// src/services/api.ts
import axios from 'axios';

// Use local backend in development and production URL otherwise
const API_URL = import.meta.env.DEV
  ? 'http://localhost:5000/api'
  : 'https://forgenfuel.onrender.com/api';
const TOKEN_KEY = 'auth_token';

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor para anexar token de autenticação no formato esperado pelo backend
api.interceptors.request.use(config => {
  const token = getAuthToken();
  if (token) {
    // O backend espera o token no header Authorization com o prefixo Bearer
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Endpoints
export const apiServices = {
  // Auth/Users
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/users/login', credentials),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  updateNutritionGoals: (goals) => api.put('/users/profile/nutrition-goals', goals),
  googleLogin: (data: { idToken: string }) => api.post('/users/google-login', data),

  // Exercises
  getExercises: () => api.get('/workouts/exercises'),
  createExercise: (exerciseData: any) => api.post('/workouts/exercises', exerciseData),
  
  // Workouts
  getWorkoutPlans: () => api.get('/workouts/plans'),
  getPublicWorkoutPlans: () => api.get('/workouts/plans/public'),
  createWorkoutPlan: (planData: any) => api.post('/workouts/plans', planData),
  updateWorkoutPlan: (id: string, planData: any) => api.put(`/workouts/plans/${id}`, planData),
  deleteWorkoutPlan: (id: string) => api.delete(`/workouts/plans/${id}`),
  
  // Workout Sessions
  getWorkoutSessions: () => api.get('/workouts/sessions'),
  createWorkoutSession: (sessionData: any) => api.post('/workouts/sessions', sessionData),

  // Nutrition - Foods
  getFoods: () => api.get('/nutrition/foods'),              // combinado (compat)
  getMyFoods: () => api.get('/nutrition/foods/my'),         // só meus
  getPublicFoods: () => api.get('/nutrition/foods/public'), // só públicos
  createFood: (food) => api.post('/nutrition/foods', food),
  updateFood: (id, food) => api.put(`/nutrition/foods/${id}`, food),
  deleteFood: (id) => api.delete(`/nutrition/foods/${id}`),

  // Nutrition - Meal Plans
  getMealPlans: () => api.get('/nutrition/meal-plans'),
  getPublicMealPlans: () => api.get('/nutrition/meal-plans/public'),
  createMealPlan: (plan) => api.post('/nutrition/meal-plans', plan),
  updateMealPlan: (id, plan) => api.put(`/nutrition/meal-plans/${id}`, plan),
  deleteMealPlan: (id) => api.delete(`/nutrition/meal-plans/${id}`),

  // Progress
  getWorkoutProgress: () => api.get('/progress/workout'),
  getNutritionProgress: () => api.get('/progress/nutrition'),
  logDeviceData: (data) => api.post('/progress/device', data),

  // User Feedback
  submitFeedback: (feedbackData: {
    name?: string;
    email?: string; 
    message: string;
    feedbackType: 'positive' | 'neutral' | 'negative';
    rating?: number;
  }) => api.post('/users/feedback', feedbackData),
  
  getUserFeedbacks: () => api.get('/users/feedback'),

  // Settings (placeholders for future backend)
  getSettings: () => api.get('/users/settings'),
  updateSettings: (settings: any) => api.put('/users/settings', settings),

  // AI Services
  generateWorkoutPlan: (userData: any) => api.post('/ai/workout-plans', userData),
  generateMealPlan: (userData: any) => api.post('/ai/meal-plans', userData),
  generateHealthAssessment: (healthData: any) => api.post('/ai/health-assessment', healthData),
  analyzeHealthDocument: (documentData: any) => api.post('/ai/document-analysis', documentData),
  askAIQuestion: (questionData: any) => api.post('/ai/chat', questionData),
};

export default api;
