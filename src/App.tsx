
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";

// Pages
import Index from "./pages/Index";
import WorkoutPlanning from "./pages/workout/WorkoutPlanning";
import WorkoutExecution from "./pages/workout/WorkoutExecution";
import MealPlanning from "./pages/nutrition/MealPlanning";
import FoodDiary from "./pages/nutrition/FoodDiary";
import ProgressDashboard from "./pages/progress/ProgressDashboard";
import NotificationCenter from "./pages/notifications/NotificationCenter";
import ProfileSettings from "./pages/user/ProfileSettings";
import FeedbackPage from "./pages/user/FeedbackPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Workout Routes */}
            <Route path="/workout" element={<WorkoutPlanning />} />
            <Route path="/workout/plan" element={<WorkoutPlanning />} />
            <Route path="/workout/start" element={<WorkoutExecution />} />
            
            {/* Nutrition Routes */}
            <Route path="/nutrition" element={<MealPlanning />} />
            <Route path="/nutrition/plan" element={<MealPlanning />} />
            <Route path="/nutrition/diary" element={<FoodDiary />} />
            
            {/* Progress Routes */}
            <Route path="/progress" element={<ProgressDashboard />} />
            
            {/* Notification Routes */}
            <Route path="/notifications" element={<NotificationCenter />} />
            
            {/* User Routes */}
            <Route path="/profile" element={<ProfileSettings />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
