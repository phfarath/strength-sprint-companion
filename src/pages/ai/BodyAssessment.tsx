import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Heart, Scale, Ruler, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const BodyAssessment = () => {
  const { user, generateAIHealthAssessment } = useAppContext();
  const { toast } = useToast();
  
  const [age, setAge] = useState<string | number>(user?.birthdate ? Math.floor((new Date().getTime() - new Date(user.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : '');
  const [weight, setWeight] = useState<string | number>(user?.weight || '');
  const [height, setHeight] = useState<string | number>(user?.height || '');
  const [gender, setGender] = useState('não informado');
  const [activityLevel, setActivityLevel] = useState('moderado');
  const [sleepQuality, setSleepQuality] = useState('boa');
  const [stressLevel, setStressLevel] = useState('moderado');
  const [medicalConditions, setMedicalConditions] = useState('nenhuma');
  const [medications, setMedications] = useState('nenhum');
  const [allergies, setAllergies] = useState('nenhuma');
  const [bloodPressure, setBloodPressure] = useState('não informado');
  const [restingHeartRate, setRestingHeartRate] = useState('');
  const [bodyFatPercentage, setBodyFatPercentage] = useState('');
  const [assessmentResult, setAssessmentResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setAssessmentResult('');
      
      const userData = {
        age: parseInt(age.toString()) || null,
        weight: parseFloat(weight.toString()) || null,
        height: parseFloat(height.toString()) || null,
        gender
      };
      
      const healthData = {
        bmi: weight && height ? (parseFloat(weight.toString()) / Math.pow(parseFloat(height.toString()) / 100, 2)).toFixed(1) : null,
        bodyFatPercentage: bodyFatPercentage ? parseFloat(bodyFatPercentage) : null,
        bloodPressure,
        restingHeartRate: restingHeartRate ? parseInt(restingHeartRate) : null,
        activityLevel,
        sleepQuality,
        stressLevel,
        medicalConditions,
        medications,
        allergies
      };
      
      const response = await generateAIHealthAssessment({ userData, healthData });
      setAssessmentResult(response.data.assessment);
    } catch (error) {
      console.error('Erro ao gerar avaliação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar a avaliação. Tente novamente.",
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Avaliação Corporal com IA</h1>
          <p className="text-gray-600">
            Obtenha uma avaliação personalizada da sua saúde com base em seus dados.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário de Avaliação */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Dados para Avaliação</CardTitle>
              <p className="text-gray-600">Preencha os campos abaixo para obter uma avaliação personalizada.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age">Idade</Label>
                    <div className="relative">
                      <Input
                        id="age"
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="Ex: 30"
                        className="pl-10"
                      />
                      <Heart className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="gender">Gênero</Label>
                    <select
                      id="gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fitness-primary"
                    >
                      <option value="não informado">Prefiro não informar</option>
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <div className="relative">
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="Ex: 70.5"
                        className="pl-10"
                      />
                      <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="height">Altura (cm)</Label>
                    <div className="relative">
                      <Input
                        id="height"
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="Ex: 175"
                        className="pl-10"
                      />
                      <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bodyFatPercentage">Percentual de Gordura (%)</Label>
                    <Input
                      id="bodyFatPercentage"
                      type="number"
                      step="0.1"
                      value={bodyFatPercentage}
                      onChange={(e) => setBodyFatPercentage(e.target.value)}
                      placeholder="Ex: 15.5"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="restingHeartRate">Frequência Cardíaca em Repouso (bpm)</Label>
                    <Input
                      id="restingHeartRate"
                      type="number"
                      value={restingHeartRate}
                      onChange={(e) => setRestingHeartRate(e.target.value)}
                      placeholder="Ex: 65"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bloodPressure">Pressão Arterial</Label>
                  <Input
                    id="bloodPressure"
                    value={bloodPressure}
                    onChange={(e) => setBloodPressure(e.target.value)}
                    placeholder="Ex: 120/80"
                  />
                </div>

                <div>
                  <Label htmlFor="activityLevel">Nível de Atividade</Label>
                  <select
                    id="activityLevel"
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fitness-primary"
                  >
                    <option value="sedentário">Sedentário</option>
                    <option value="pouco ativo">Pouco Ativo</option>
                    <option value="moderado">Moderado</option>
                    <option value="ativo">Ativo</option>
                    <option value="muito ativo">Muito Ativo</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sleepQuality">Qualidade do Sono</Label>
                    <select
                      id="sleepQuality"
                      value={sleepQuality}
                      onChange={(e) => setSleepQuality(e.target.value)}
                      className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fitness-primary"
                    >
                      <option value="ruim">Ruim</option>
                      <option value="regular">Regular</option>
                      <option value="boa">Boa</option>
                      <option value="excelente">Excelente</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="stressLevel">Nível de Estresse</Label>
                    <select
                      id="stressLevel"
                      value={stressLevel}
                      onChange={(e) => setStressLevel(e.target.value)}
                      className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fitness-primary"
                    >
                      <option value="baixo">Baixo</option>
                      <option value="moderado">Moderado</option>
                      <option value="alto">Alto</option>
                      <option value="muito alto">Muito Alto</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="medicalConditions">Condições Médicas</Label>
                  <Textarea
                    id="medicalConditions"
                    value={medicalConditions}
                    onChange={(e) => setMedicalConditions(e.target.value)}
                    placeholder="Ex: Diabetes, hipertensão, etc."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="medications">Medicações</Label>
                    <Textarea
                      id="medications"
                      value={medications}
                      onChange={(e) => setMedications(e.target.value)}
                      placeholder="Ex: Metformina, losartana, etc."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="allergies">Alergias</Label>
                    <Textarea
                      id="allergies"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="Ex: Amendoim, mariscos, etc."
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-fitness-primary hover:bg-fitness-primary/90"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Activity className="w-4 h-4 mr-2" />
                  )}
                  Gerar Avaliação
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Resultado da Avaliação */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Resultado da Avaliação</CardTitle>
              <p className="text-gray-600">Sua avaliação personalizada com recomendações.</p>
            </CardHeader>
            <CardContent>
              {assessmentResult ? (
                <div className="prose max-w-none">
                  {assessmentResult.split('\n').map((line, index) => (
                    <p key={index} className="mb-3">{line}</p>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Preencha o formulário e clique em "Gerar Avaliação" para obter sua análise personalizada.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </Layout>
  );
};

export default BodyAssessment;
