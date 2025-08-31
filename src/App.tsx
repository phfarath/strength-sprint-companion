import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { Toaster } from '@/components/ui/toaster';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Importações de páginas
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Index from './pages/Index';
import WorkoutPlanning from './pages/workout/WorkoutPlanning';
import WorkoutExecution from './pages/workout/WorkoutExecution';
import WorkoutProgress from './pages/workout/WorkoutProgress'; 
import ProgressDashboard from './pages/progress/ProgressDashboard'; // Adicione essa importação
import MealPlanning from './pages/nutrition/MealPlanning';
import FoodDiary from './pages/nutrition/FoodDiary';
import ProfileSettings from './pages/user/ProfileSettings';
import Settings from './pages/user/Settings';
import FeedbackPage from './pages/user/FeedbackPage';

// Importações de páginas de IA
import AIAssistant from './pages/ai/AIAssistant';
import BodyAssessment from './pages/ai/BodyAssessment';
import DocumentAnalysis from './pages/ai/DocumentAnalysis';

// Importação de componentes e contexto
import { AppProvider } from './context/AppContext';
import { ProtectedRoute, PublicRoute } from './components/routing/RouteGuards';

const queryClient = new QueryClient();

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID as string}>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <TooltipProvider>
            <Router>
              <Routes>
                {/* Rotas públicas */}
                <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
                <Route path="/auth/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/auth/register" element={<PublicRoute><Register /></PublicRoute>} />
                
                {/* Rotas protegidas */}
                <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/workout/planning" element={<ProtectedRoute><WorkoutPlanning /></ProtectedRoute>} />
                <Route path="/workout/execution" element={<ProtectedRoute><WorkoutExecution /></ProtectedRoute>} />
                <Route path="/workout/progress" element={<ProtectedRoute><WorkoutProgress /></ProtectedRoute>} />
                <Route path="/nutrition/planning" element={<ProtectedRoute><MealPlanning /></ProtectedRoute>} />
                <Route path="/nutrition/diary" element={<ProtectedRoute><FoodDiary /></ProtectedRoute>} />
                <Route path="/progress" element={<ProtectedRoute><ProgressDashboard /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/feedback" element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} />
                
                {/* Rotas de IA */}
                <Route path="/ai/assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
                <Route path="/ai/assessment" element={<ProtectedRoute><BodyAssessment /></ProtectedRoute>} />
                <Route path="/ai/documents" element={<ProtectedRoute><DocumentAnalysis /></ProtectedRoute>} />
                
                {/* Redirecionar para dashboard se o usuário já estiver autenticado */}
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
              
              <Toaster />
            </Router>
          </TooltipProvider>
        </AppProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
