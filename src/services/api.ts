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
  getDietPlans: () => api.get('/nutrition/plans'),
  createDietPlan: (plan) => api.post('/nutrition/plans', plan),
  updateDietPlan: (id, plan) => api.put(`/nutrition/plans/${id}`, plan),
  deleteDietPlan: (id) => api.delete(`/nutrition/plans/${id}`),
  
  // Progress
  getWorkoutSessions: () => api.get('/progress/workout'),
  getNutritionProgress: () => api.get('/progress/nutrition'),
  logDeviceData: (data) => api.post('/progress/device', data)
};

export default api;