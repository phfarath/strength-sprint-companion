import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppContext, AppProvider } from './context/AppContext';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Páginas públicas
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Páginas protegidas
import Index from './pages/Index';
import WorkoutPlanning from './pages/workout/WorkoutPlanning';
import WorkoutExecution from './pages/workout/WorkoutExecution';
import WorkoutProgress from './pages/workout/WorkoutProgress';
import MealPlanning from './pages/nutrition/MealPlanning';
import FoodDiary from './pages/nutrition/FoodDiary';
import ProfileSettings from './pages/user/ProfileSettings';
import FeedbackPage from './pages/user/FeedbackPage';

// Componente de loader
import { Loader } from './components/ui/loader';

// Componente para rotas protegidas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAppContext();
  
  if (isLoading) {
    return <div className="h-screen flex items-center justify-center">
      <Loader size="lg" />
    </div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" />;
  }
  
  return <>{children}</>;
};

// Componente para rotas públicas (redireciona se já estiver autenticado)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAppContext();
  
  if (isLoading) {
    return <div className="h-screen flex items-center justify-center">
      <Loader size="lg" />
    </div>;
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <Router>
            <Routes>
              {/* Rotas públicas */}
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/auth/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              <Route path="/auth/register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />
              
              {/* Rotas protegidas */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/workout" element={
                <ProtectedRoute>
                  <WorkoutPlanning />
                </ProtectedRoute>
              } />
              <Route path="/workout/start" element={
                <ProtectedRoute>
                  <WorkoutExecution />
                </ProtectedRoute>
              } />
              <Route path="/workout/progress" element={
                <ProtectedRoute>
                  <WorkoutProgress />
                </ProtectedRoute>
              } />
              <Route path="/nutrition/meal-plan" element={
                <ProtectedRoute>
                  <MealPlanning />
                </ProtectedRoute>
              } />
              <Route path="/nutrition/food-diary" element={
                <ProtectedRoute>
                  <FoodDiary />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfileSettings />
                </ProtectedRoute>
              } />
              <Route path="/feedback" element={
                <ProtectedRoute>
                  <FeedbackPage />
                </ProtectedRoute>
              } />
              
              {/* Rota padrão - redireciona para landing se não estiver autenticado */}
              <Route path="*" element={
                <Navigate to={localStorage.getItem('auth_token') ? "/" : "/landing"} />
              } />
            </Routes>
            <Toaster />
          </Router>
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
