// src/services/api.ts
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const TOKEN_KEY = 'auth_token';

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token a todas as requisições
api.interceptors.request.use(config => {
  const token = getAuthToken();
  if (token) {
    config.headers['x-auth-token'] = token;
  }
  return config;
});

// Serviço para criar plano alimentar
const createMealPlan = async (mealPlan) => {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    throw new Error('Token de autenticação não encontrado');
  }
  
  // Log para depuração
  console.log('createMealPlan - dados enviados:', JSON.stringify(mealPlan, null, 2));
  
  return axios.post('/api/nutrition/meal-plans', mealPlan, {
    headers: {
      'x-auth-token': token
    }
  });
};

// Funções de API específicas para cada recurso
export const apiServices = {
  // Users/Auth
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/users/login', credentials),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  updateNutritionGoals: (goals) => api.put('/users/profile/nutrition-goals', goals),
  
  // Exercises
  getExercises: () => api.get('/exercises'),
  getExercise: (id) => api.get(`/exercises/${id}`),
  
  // Workouts
  getWorkoutPlans: () => api.get('/workouts/plans'),
  createWorkoutPlan: (plan) => api.post('/workouts/plans', plan),
  updateWorkoutPlan: (id, plan) => api.put(`/workouts/plans/${id}`, plan),
  deleteWorkoutPlan: (id) => api.delete(`/workouts/plans/${id}`),
  logWorkout: (session) => api.post('/workouts/sessions', session),
  
  // Foods/Nutrition
  getFoods: () => api.get('/nutrition/foods'),
  createFood: (foodData) => api.post('/nutrition/foods', foodData),
  updateFood: (id, foodData) => api.put(`/nutrition/foods/${id}`, foodData),
  deleteFood: (id) => api.delete(`/nutrition/foods/${id}`),
  
  // Meal plan management
  getMealPlans: () => api.get('/nutrition/meal-plans'),
  getPublicMealPlans: () => api.get('/nutrition/meal-plans/public'),
  createMealPlan: (planData) => api.post('/nutrition/meal-plans', planData),
  updateMealPlan: (id, data) => api.put(`/nutrition/meal-plans/${id}`, data),
  deleteMealPlan: (id) => api.delete(`/nutrition/meal-plans/${id}`),
  
  // Progress
  getWorkoutSessions: () => api.get('/progress/workout'),
  getNutritionProgress: () => api.get('/progress/nutrition'),
  logDeviceData: (data) => api.post('/progress/device', data)
};

export default api;