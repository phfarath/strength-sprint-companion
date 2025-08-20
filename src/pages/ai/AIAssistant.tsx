import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Send, Dumbbell, Apple, FileText, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AIAssistant = () => {
  const { user, generateAIWorkoutPlan, generateAIMealPlan, generateAIHealthAssessment, analyzeAIHealthDocument, askAIQuestion } = useAppContext();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('chat');
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [documentContent, setDocumentContent] = useState('');

  // Função para enviar perguntas ao chat da IA
  const handleAskQuestion = async () => {
    if (!question.trim()) {
      toast({
        title: "Pergunta vazia",
        description: "Por favor, digite uma pergunta.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      setAiResponse('');
      
      const response = await askAIQuestion(question);
      
      setAiResponse(response.data.answer);
    } catch (error) {
      console.error('Erro ao perguntar à IA:', error);
      toast({
        title: "Erro",
        description: "Não foi possível obter resposta da IA. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para gerar plano de treino
  const handleGenerateWorkoutPlan = async () => {
    try {
      setIsLoading(true);
      setAiResponse('');
      
      const userData = {
        age: user?.birthdate ? Math.floor((new Date().getTime() - new Date(user.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
        weight: user?.weight,
        height: user?.height,
        goal: 'melhorar a saúde',
        fitnessLevel: 'intermediário',
        availableDays: 5,
        equipment: 'academia completa',
        injuries: 'nenhuma',
        preferences: 'musculação'
      };
      
      const response = await generateAIWorkoutPlan(userData);
      setAiResponse(response.data.workoutPlan);
    } catch (error) {
      console.error('Erro ao gerar plano de treino:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o plano de treino. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para gerar plano alimentar
  const handleGenerateMealPlan = async () => {
    try {
      setIsLoading(true);
      setAiResponse('');
      
      const userData = {
        age: user?.birthdate ? Math.floor((new Date().getTime() - new Date(user.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
        weight: user?.weight,
        height: user?.height,
        goal: 'melhorar a saúde'
      };
      
      const nutritionalGoals = user?.nutritionGoals || {};
      
      const response = await generateAIMealPlan({ userData, nutritionalGoals });
      setAiResponse(response.data.mealPlan);
    } catch (error) {
      console.error('Erro ao gerar plano alimentar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o plano alimentar. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para gerar avaliação de saúde
  const handleGenerateHealthAssessment = async () => {
    try {
      setIsLoading(true);
      setAiResponse('');
      
      const userData = {
        age: user?.birthdate ? Math.floor((new Date().getTime() - new Date(user.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
        weight: user?.weight,
        height: user?.height,
        gender: 'não informado'
      };
      
      const healthData = {
        bmi: user?.weight && user?.height ? (user.weight / Math.pow(user.height / 100, 2)).toFixed(1) : null,
        bodyFatPercentage: null,
        bloodPressure: 'não informado',
        restingHeartRate: null,
        activityLevel: 'moderado',
        sleepQuality: 'boa',
        stressLevel: 'moderado',
        medicalConditions: 'nenhuma',
        medications: 'nenhum',
        allergies: 'nenhuma'
      };
      
      const response = await generateAIHealthAssessment({ userData, healthData });
      setAiResponse(response.data.assessment);
    } catch (error) {
      console.error('Erro ao gerar avaliação de saúde:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar a avaliação de saúde. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para analisar documento de saúde
  const handleAnalyzeDocument = async () => {
    if (!documentContent.trim()) {
      toast({
        title: "Documento vazio",
        description: "Por favor, insira o conteúdo do documento de saúde.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      setAiResponse('');
      
      const userData = {
        age: user?.birthdate ? Math.floor((new Date().getTime() - new Date(user.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
        weight: user?.weight,
        height: user?.height,
        gender: 'não informado',
        goal: 'melhorar a saúde'
      };
      
      const response = await analyzeAIHealthDocument({ documentContent, userData });
      setAiResponse(response.data.analysis);
    } catch (error) {
      console.error('Erro ao analisar documento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível analisar o documento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-6 max-w-7xl"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assistente de IA</h1>
          <p className="text-gray-600">
            Sua assistente pessoal para treinos, nutrição, saúde e muito mais.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <Send className="w-4 h-4" /> Chat
            </TabsTrigger>
            <TabsTrigger value="workout" className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4" /> Treino
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="flex items-center gap-2">
              <Apple className="w-4 h-4" /> Nutrição
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Heart className="w-4 h-4" /> Saúde
            </TabsTrigger>
            <TabsTrigger value="document" className="flex items-center gap-2">
              <FileText className="w-4 h-4" /> Documentos
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Chat Tab */}
              <TabsContent value="chat" className="mt-0">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>Chat com a IA</CardTitle>
                    <p className="text-gray-600">Faça perguntas sobre treinos, nutrição, saúde e muito mais.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="question">Sua pergunta</Label>
                      <div className="flex gap-2">
                        <Textarea
                          id="question"
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          placeholder="Ex: Como devo estruturar meus treinos para ganho de massa muscular?"
                          className="flex-1"
                          rows={3}
                          disabled={isLoading}
                        />
                        <Button 
                          onClick={handleAskQuestion}
                          disabled={isLoading || !question.trim()}
                          className="self-end h-12"
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Workout Tab */}
              <TabsContent value="workout" className="mt-0">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>Gerar Plano de Treino</CardTitle>
                    <p className="text-gray-600">Crie um plano de treino personalizado com base em seus dados.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-gray-600">Gerar um plano de treino personalizado com base em seus dados atuais.</p>
                      <Button 
                        onClick={handleGenerateWorkoutPlan}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Dumbbell className="w-4 h-4 mr-2" />
                        )}
                        Gerar Plano
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Nutrition Tab */}
              <TabsContent value="nutrition" className="mt-0">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>Gerar Plano Alimentar</CardTitle>
                    <p className="text-gray-600">Crie um plano alimentar personalizado com base em suas metas nutricionais.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-gray-600">Gerar um plano alimentar personalizado com base em suas metas nutricionais atuais.</p>
                      <Button 
                        onClick={handleGenerateMealPlan}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Apple className="w-4 h-4 mr-2" />
                        )}
                        Gerar Plano
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Health Tab */}
              <TabsContent value="health" className="mt-0">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>Avaliação de Saúde</CardTitle>
                    <p className="text-gray-600">Obtenha uma avaliação de saúde personalizada com recomendações.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-gray-600">Gerar uma avaliação de saúde com base em seus dados atuais.</p>
                      <Button 
                        onClick={handleGenerateHealthAssessment}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Heart className="w-4 h-4 mr-2" />
                        )}
                        Gerar Avaliação
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Document Tab */}
              <TabsContent value="document" className="mt-0">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>Análise de Documentos de Saúde</CardTitle>
                    <p className="text-gray-600">Cole o conteúdo de um documento de saúde para análise.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="document">Conteúdo do documento</Label>
                      <Textarea
                        id="document"
                        value={documentContent}
                        onChange={(e) => setDocumentContent(e.target.value)}
                        placeholder="Cole aqui o conteúdo do seu documento de saúde (exames, relatórios médicos, etc.)"
                        className="min-h-[200px]"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleAnalyzeDocument}
                        disabled={isLoading || !documentContent.trim()}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileText className="w-4 h-4 mr-2" />
                        )}
                        Analisar Documento
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>

        {/* Área de resposta da IA */}
        {aiResponse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Resposta da IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {aiResponse.split('\n').map((line, index) => (
                    <p key={index} className="mb-3">{line}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
};

export default AIAssistant;
