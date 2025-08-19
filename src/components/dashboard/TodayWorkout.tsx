import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { CheckCircle, Dumbbell, Timer, Target, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const TodayWorkout = () => {
  const { workoutPlans, workoutLogs } = useAppContext();
  const currentDay = new Date().getDay();
  
  const todayWorkout = workoutPlans.find(plan => plan.dayOfWeek === currentDay);
  const isComplete = workoutLogs.some(log => {
    const logDate = new Date(log.date);
    const today = new Date();
    return logDate.toDateString() === today.toDateString() && 
           log.workoutPlanId === todayWorkout?.id && 
           log.completed;
  });

  if (!todayWorkout) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Dumbbell size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Dia de Descanso</h3>
            <p className="text-gray-500 mb-4">Nenhum treino programado para hoje</p>
            <Button asChild variant="outline" className="hover:bg-blue-50 hover:text-blue-600 border-blue-200">
              <Link to="/workout/planning">Ver planejamento semanal</Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`
        border hover:shadow-xl transition-all duration-300
        ${isComplete 
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
          : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
        }
      `}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className={`
                w-10 h-10 rounded-xl flex items-center justify-center
                ${isComplete 
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                }
              `}>
                <Dumbbell size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{todayWorkout.name}</h3>
                <p className="text-sm text-gray-600 font-normal">Treino de hoje</p>
              </div>
            </CardTitle>
            
            {isComplete && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex items-center bg-green-500 text-white px-3 py-1 rounded-full"
              >
                <CheckCircle size={16} className="mr-1" />
                <span className="text-sm font-medium">Concluído</span>
              </motion.div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Estatísticas do treino */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="bg-white/60 rounded-lg p-3">
                <Target className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                <p className="text-lg font-bold text-gray-900">{todayWorkout.exercises.length}</p>
                <p className="text-xs text-gray-600">Exercícios</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white/60 rounded-lg p-3">
                <Timer className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                <p className="text-lg font-bold text-gray-900">
                  {todayWorkout.exercises.reduce((total, ex) => total + ex.sets, 0)}
                </p>
                <p className="text-xs text-gray-600">Séries</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white/60 rounded-lg p-3">
                <TrendingUp className="w-5 h-5 mx-auto mb-1 text-orange-600" />
                <p className="text-lg font-bold text-gray-900">~60</p>
                <p className="text-xs text-gray-600">Minutos</p>
              </div>
            </div>
          </div>

          {/* Preview dos exercícios */}
          <div className="space-y-2 mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Exercícios principais:</h4>
            {todayWorkout.exercises.slice(0, 3).map((exercise, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex justify-between items-center bg-white/60 rounded-lg p-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{exercise.name}</p>
                  <p className="text-sm text-gray-600">{exercise.muscleGroup}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{exercise.sets}x{exercise.reps}</p>
                  <p className="text-sm text-gray-600">{exercise.weight}kg</p>
                </div>
              </motion.div>
            ))}
            {todayWorkout.exercises.length > 3 && (
              <div className="text-center text-sm text-gray-500 py-2">
                +{todayWorkout.exercises.length - 3} exercícios adicionais
              </div>
            )}
          </div>

          {/* Botão de ação */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              asChild 
              className={`
                w-full text-white font-semibold shadow-lg
                ${isComplete
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                }
              `}
            >
              <Link 
                to={isComplete ? "/workout/planning" : "/workout/start"}
                onClick={() => {
                  if (!isComplete) {
                    localStorage.setItem('selectedWorkoutId', todayWorkout.id);
                  }
                }}
              >
                {isComplete ? 'Ver Planejamento' : 'Iniciar Treino'}
              </Link>
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TodayWorkout;
