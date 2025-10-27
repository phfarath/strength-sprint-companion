import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import FullScreenLayout from '@/components/layout/FullScreenLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { Apple, Bot, Dumbbell, FileText, Heart, Loader2, MessageCircle, Send, User, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { AIFeedbackWidget } from '@/components/ai/AIFeedbackWidget';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  mode: string;
  planContent?: any;
  planContext?: string;
  planType?: string;
}

interface ModeResponse {
  message: string;
  metadata?: {
    planContent?: any;
    planContext?: string;
    planType?: string;
  };
}

const safeStringify = (value: any) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
};

const formatWorkoutPlan = (plan: any): string => {
  if (!Array.isArray(plan)) {
    return safeStringify(plan) || 'Não foi possível gerar um plano de treino. Tente novamente.';
  }

  if (plan.length === 0) {
    return 'Não há treinos disponíveis para o período solicitado.';
  }

  return plan
    .map((day) => {
      const dayName = day.name || day.day || 'Treino';
      const exercises = Array.isArray(day.exercises)
        ? day.exercises
            .map((exercise: any, index: number) => {
              const exerciseName = exercise.exercise?.name || exercise.name || `Exercício ${index + 1}`;
              const sets = exercise.sets ?? exercise.exercise?.sets ?? '-';
              const reps = exercise.reps ?? exercise.exercise?.reps ?? '-';
              const restSeconds = exercise.rest_seconds ?? exercise.rest ?? exercise.exercise?.rest_seconds;
              const rest = restSeconds ? ` | Descanso: ${restSeconds}s` : '';
              return `• ${exerciseName} — ${sets} séries x ${reps} repetições${rest}`;
            })
            .join('\n')
        : 'Nenhum exercício listado.';

      const notes = day.notes ? `\nObservações: ${day.notes}` : '';
      return `${dayName}\n${exercises}${notes}`;
    })
    .join('\n\n');
};

const formatMealPlan = (plan: any): string => {
  if (!plan) {
    return 'Não foi possível gerar um plano alimentar no momento.';
  }

  const meals = Array.isArray(plan.meals) ? plan.meals : [];

  if (meals.length === 0) {
    return safeStringify(plan);
  }

  const formattedMeals = meals
    .map((meal: any) => {
      const mealName = meal.name || 'Refeição';
      const mealTime = meal.time ? ` (${meal.time})` : '';
      const normalizedItems = Array.isArray(meal.items)
        ? meal.items
        : Array.isArray(meal.mealFoods)
        ? meal.mealFoods.map((mealFood: any) => {
            const baseFood = mealFood.food || {};
            return {
              name: baseFood.name || 'Alimento',
              quantity: mealFood.quantity ? `${mealFood.quantity} porção(ões)` : null,
              calories: baseFood.calories,
              protein: baseFood.protein,
              carbs: baseFood.carbs,
              fat: baseFood.fat,
            };
          })
        : [];

      const items = normalizedItems.length
        ? normalizedItems
            .map((item: any) => {
              const calories = item.calories ? `${item.calories} kcal` : null;
              const macros = [
                item.protein ? `${item.protein}g proteína` : null,
                item.carbs ? `${item.carbs}g carboidratos` : null,
                item.fat ? `${item.fat}g gorduras` : null,
              ]
                .filter(Boolean)
                .join(', ');

              const details = [calories, macros].filter(Boolean).join(' | ');
              return `• ${item.name}${item.quantity ? ` — ${item.quantity}` : ''}${details ? ` (${details})` : ''}`;
            })
            .join('\n')
        : 'Nenhum alimento listado.';

      const notes = meal.notes ? `\nObservações: ${meal.notes}` : '';

      return `${mealName}${mealTime}\n${items}${notes}`;
    })
    .join('\n\n');

  const summary = plan.dailySummary
    ? `\n\nResumo diário: ${plan.dailySummary.calories || '-'} kcal — ${plan.dailySummary.protein || '-'}g proteína, ${plan.dailySummary.carbs || '-'}g carboidratos, ${plan.dailySummary.fat || '-'}g gorduras.`
    : '';

  return `${formattedMeals}${summary}`;
};

const AIAssistant = () => {
  const {
    user,
    generateAIWorkoutPlan,
    generateAIMealPlan,
    generateAIHealthAssessment,
    analyzeAIHealthDocument,
    askAIQuestion,
    getActivitySummary,
  } = useAppContext();
  const { toast } = useToast();

  const [chatMode, setChatMode] = useState('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [documentContent, setDocumentContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchActivitySummary = async () => {
    try {
      if (!user?.id) return null;
      const response = await getActivitySummary(parseInt(user.id), 14);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar resumo de atividades:', error);
      return null;
    }
  };

  const chatModes = [
    { value: 'chat', label: 'Chat Geral', icon: MessageCircle, description: 'Converse sobre qualquer tópico de fitness e saúde' },
    { value: 'workout', label: 'Treinos', icon: Dumbbell, description: 'Criação e orientação sobre planos de treino' },
    { value: 'nutrition', label: 'Nutrição', icon: Apple, description: 'Planejamento alimentar e orientações nutricionais' },
    { value: 'health', label: 'Saúde', icon: Heart, description: 'Avaliações de saúde e recomendações gerais' },
    { value: 'document', label: 'Documentos', icon: FileText, description: 'Análise de documentos e exames de saúde' },
  ];

  const currentModeInfo = chatModes.find((mode) => mode.value === chatMode);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (
    content: string,
    type: 'user' | 'ai',
    metadata?: {
      planContent?: any;
      planContext?: string;
      planType?: string;
    }
  ) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      mode: chatMode,
      planContent: metadata?.planContent,
      planContext: metadata?.planContext,
      planType: metadata?.planType,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() && chatMode !== 'document') {
      toast({
        title: 'Mensagem vazia',
        description: 'Por favor, digite uma mensagem.',
        variant: 'destructive',
      });
      return;
    }

    if (chatMode === 'document' && !documentContent.trim()) {
      toast({
        title: 'Documento vazio',
        description: 'Por favor, insira o conteúdo do documento para análise.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      if (chatMode === 'document') {
        addMessage(`Analisar documento: ${documentContent.substring(0, 100)}...`, 'user');
      } else {
        addMessage(currentMessage, 'user');
      }

      let responseData: ModeResponse | any;
      switch (chatMode) {
        case 'workout':
          responseData = await handleWorkoutMode();
          break;
        case 'nutrition':
          responseData = await handleNutritionMode();
          break;
        case 'health':
          responseData = await handleHealthMode();
          break;
        case 'document':
          responseData = await handleDocumentMode();
          break;
        default:
          responseData = await handleChatMode();
          break;
      }

      // Handle response format
      if (responseData && typeof responseData === 'object' && 'message' in responseData) {
        // ModeResponse format with metadata
        addMessage(responseData.message, 'ai', responseData.metadata);
      } else {
        // Simple string response
        addMessage(responseData || 'Sem resposta', 'ai');
      }

      setCurrentMessage('');
      if (chatMode === 'document') setDocumentContent('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível obter resposta da IA. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Modo Chat Geral
  const handleChatMode = async (): Promise<ModeResponse> => {
    const response = await askAIQuestion(currentMessage);
    return {
      message: response.data?.answer || 'Não obtive uma resposta. Tente novamente.',
    };
  };

  // Modo Treinos
  const handleWorkoutMode = async (): Promise<ModeResponse> => {
    const userData = {
      age: user?.birthdate
        ? Math.floor(
            (new Date().getTime() - new Date(user.birthdate).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000),
          )
        : null,
      weight: user?.weight,
      height: user?.height,
      gender: (user as any)?.gender || 'Não informado',
      goal: (user as any)?.goal || 'Não informado',
      fitnessLevel: (user as any)?.fitnessLevel || 'Não informado',
      availableDays: (user as any)?.availableDays || 'Não informado',
      equipment: (user as any)?.equipment || 'Não informado',
      injuries: (user as any)?.injuries || 'Nenhuma informada',
      preferences: (user as any)?.workoutPreferences || 'Nenhuma informada',
      customRequest: currentMessage,
    } as any;

    const activitySummary = await fetchActivitySummary();

    const response = await generateAIWorkoutPlan({
      userData,
      activitySummary,
    });

    const planData = response.data?.workoutPlan;
    const formattedPlan = formatWorkoutPlan(planData);

    return {
      message: formattedPlan,
      metadata: {
        planContent: planData,
        planContext: `ai-workout-${Date.now()}`,
        planType: 'workout',
      },
    };
  };

  // Modo Nutrição
  const handleNutritionMode = async (): Promise<ModeResponse> => {
    const userData = {
      age: user?.birthdate
        ? Math.floor(
            (new Date().getTime() - new Date(user.birthdate).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000),
          )
        : null,
      weight: user?.weight,
      height: user?.height,
      gender: (user as any)?.gender || 'Não informado',
      goal: (user as any)?.goal || 'Não informado',
      fitnessLevel: (user as any)?.fitnessLevel || 'Não informado',
      dietaryRestrictions: (user as any)?.dietaryRestrictions || 'Nenhuma informada',
      foodPreferences: (user as any)?.foodPreferences || 'Nenhuma informada',
      customRequest: currentMessage,
    } as any;

    const nutritionalGoals = (user as any)?.nutritionGoals || {};
    const activitySummary = await fetchActivitySummary();

    const response = await generateAIMealPlan({ userData, nutritionalGoals, activitySummary });
    const mealPlan = response.data?.mealPlan;

    return {
      message: formatMealPlan(mealPlan),
      metadata: {
        planContent: mealPlan,
        planContext: `ai-nutrition-${Date.now()}`,
        planType: 'nutrition',
      },
    };
  };

  // Modo Saúde
  const handleHealthMode = async (): Promise<ModeResponse> => {
    const userData = {
      age: user?.birthdate
        ? Math.floor(
            (new Date().getTime() - new Date(user.birthdate).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000),
          )
        : null,
      weight: user?.weight,
      height: user?.height,
      gender: (user as any)?.gender || 'Não informado',
      goal: (user as any)?.goal || 'Não informado',
      fitnessLevel: (user as any)?.fitnessLevel || 'Não informado',
      customRequest: currentMessage,
    } as any;

    const healthData = {
      bmi:
        user?.weight && user?.height
          ? (user.weight / Math.pow(user.height / 100, 2)).toFixed(1)
          : null,
      bodyFatPercentage: null,
      bloodPressure: 'não informado',
      restingHeartRate: null,
      activityLevel: (user as any)?.fitnessLevel || 'moderado',
      sleepQuality: 'boa',
      stressLevel: 'moderado',
      medicalConditions: (user as any)?.injuries || 'nenhuma',
      medications: 'nenhum',
      allergies: 'nenhuma',
    } as any;

    const response = await generateAIHealthAssessment({ userData, healthData });
    return {
      message: response.data?.assessment || 'Não foi possível gerar uma avaliação de saúde.',
      metadata: {
        planContent: response.data?.assessment,
        planContext: `ai-health-${Date.now()}`,
        planType: 'health',
      },
    };
  };

  // Modo Documentos
  const handleDocumentMode = async (): Promise<ModeResponse> => {
    const userData = {
      age: user?.birthdate
        ? Math.floor(
            (new Date().getTime() - new Date(user.birthdate).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000),
          )
        : null,
      weight: user?.weight,
      height: user?.height,
      gender: (user as any)?.gender || 'Não informado',
      goal: (user as any)?.goal || 'Não informado',
    } as any;

    const response = await analyzeAIHealthDocument({ documentContent, userData });
    return {
      message: response.data?.analysis || 'Não foi possível analisar o documento.',
    };
  };

  const getPlaceholder = () => {
    switch (chatMode) {
      case 'workout':
        return 'Ex: Crie um treino para hipertrofia focado em peito e costas...';
      case 'nutrition':
        return 'Ex: Preciso de um plano alimentar para ganho de massa muscular...';
      case 'health':
        return 'Ex: Como posso melhorar minha saúde cardiovascular?';
      case 'document':
        return 'Cole o conteúdo do documento de saúde no campo abaixo...';
      default:
        return 'Ex: Como devo estruturar meus treinos para ganho de massa muscular?';
    }
  };

  const handleModeChange = (newMode: string) => {
    setChatMode(newMode);
    setCurrentMessage('');
    setDocumentContent('');
  };

  return (
    <FullScreenLayout
      topbar={(
        <div className="h-14 w-full">
          <div className="h-full w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Voltar</span>
              </Link>
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-fitness-primary" />
                <span className="font-semibold text-gray-900">Assistente de IA</span>
              </div>
            </div>
            <div className="min-w-[180px]">
              <Select value={chatMode} onValueChange={handleModeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {chatModes.map((mode) => (
                    <SelectItem key={mode.value} value={mode.value}>
                      <div className="flex items-center gap-2">
                        <mode.icon size={16} />
                        {mode.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    >
      <div className="h-full w-full flex flex-col gap-4 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* <PageHeader
          title="Assistente de IA"
          description={
            currentModeInfo?.description ||
            'Sua assistente pessoal para treinos, nutrição, saúde e muito mais.'
          }
          icon={currentModeInfo?.icon || null}
          right={(
            <Select value={chatMode} onValueChange={handleModeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {chatModes.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>
                    <div className="flex items-center gap-2">
                      <mode.icon size={16} />
                      {mode.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        /> */}

        {/* Área de mensagens */}
        <div className="flex-1 min-h-0 w-full bg-gray-50 overflow-hidden border-y">
          <div className="h-full w-full flex flex-col">
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500 max-w-md">
                    <Bot className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Olá! Como posso ajudar você hoje?
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Selecione um modo de conversa e comece a conversar! Estou aqui para ajudar com treinos, nutrição, saúde e muito mais.
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white rounded-lg p-3 border">
                        <Dumbbell className="w-5 h-5 text-fitness-primary mb-2" />
                        <p className="font-medium">Treinos</p>
                        <p className="text-gray-500 text-xs">Planos personalizados</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border">
                        <Apple className="w-5 h-5 text-fitness-primary mb-2" />
                        <p className="font-medium">Nutrição</p>
                        <p className="text-gray-500 text-xs">Dietas balanceadas</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border">
                        <Heart className="w-5 h-5 text-fitness-primary mb-2" />
                        <p className="font-medium">Saúde</p>
                        <p className="text-gray-500 text-xs">Orientações gerais</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border">
                        <FileText className="w-5 h-5 text-fitness-primary mb-2" />
                        <p className="font-medium">Documentos</p>
                        <p className="text-gray-500 text-xs">Análise de exames</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.type === 'ai' && (
                        <div className="w-10 h-10 rounded-full bg-fitness-primary flex items-center justify-center flex-shrink-0">
                          <Bot className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div className={`max-w-[75%] ${message.type === 'user' ? 'order-first' : ''}`}>
                       <div
                         className={`rounded-2xl px-6 py-4 ${
                           message.type === 'user'
                             ? 'bg-fitness-primary text-white ml-auto'
                             : 'bg-white border text-gray-900 shadow-sm'
                         }`}
                       >
                         <div className="whitespace-pre-wrap text-base leading-relaxed">{message.content}</div>
                       </div>
                       <div
                         className={`text-xs text-gray-500 mt-2 px-2 ${
                           message.type === 'user' ? 'text-right' : 'text-left'
                         }`}
                       >
                         {message.timestamp.toLocaleTimeString()}
                       </div>
                       {message.type === 'ai' && message.planContext && message.planType && (
                         <AIFeedbackWidget
                           planContext={message.planContext}
                           planType={message.planType}
                           planContent={message.planContent}
                         />
                       )}
                      </div>
                      {message.type === 'user' && (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4 justify-start">
                      <div className="w-10 h-10 rounded-full bg-fitness-primary flex items-center justify-center">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                      <div className="bg-white border rounded-2xl px-6 py-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin text-fitness-primary" />
                          <span className="text-base text-gray-600">Pensando...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input fixo na parte inferior */}
        <div className="border-t bg-white/95 backdrop-blur px-4 sm:px-6 py-4">
          <div className="w-full">
            {chatMode === 'document' && (
              <div className="mb-4">
                <Label htmlFor="document" className="text-sm font-medium text-gray-700">
                  Documento de Saúde
                </Label>
                <Textarea
                  id="document"
                  value={documentContent}
                  onChange={(e) => setDocumentContent(e.target.value)}
                  placeholder="Cole aqui o conteúdo do seu documento de saúde (exames, relatórios médicos, etc.)"
                  className="mt-2 min-h-[120px] resize-none"
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Textarea
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder={getPlaceholder()}
                  className="resize-none border-gray-300 focus:border-fitness-primary focus:ring-fitness-primary"
                  rows={3}
                  disabled={isLoading || (chatMode === 'document' && !documentContent.trim())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={
                  isLoading ||
                  (!currentMessage.trim() && chatMode !== 'document') ||
                  (chatMode === 'document' && !documentContent.trim())
                }
                size="lg"
                className="h-auto px-6 py-3 bg-fitness-primary hover:bg-fitness-primary/90"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>

            <div className="flex justify-between items-center mt-3">
              <p className="text-xs text-gray-500">Pressione Enter para enviar, Shift+Enter para nova linha</p>
              {messages.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setMessages([])} className="text-xs text-gray-500 hover:text-gray-700">
                  Limpar Chat
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </FullScreenLayout>
  );
};

export default AIAssistant;
