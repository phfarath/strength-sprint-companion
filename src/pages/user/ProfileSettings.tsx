import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

const ProfileSettings = () => {
  const { user, updateUserProfile, updateUserGoals } = useAppContext();
  
  // Adicionando logs para depuração
  console.log("Dados recebidos do usuário:", user);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    weight: user?.weight || 0,
    height: user?.height || 0,
    birthdate: user?.birthdate || '',
  });
  
  const [nutritionGoals, setNutritionGoals] = useState({
    calories: user?.nutritionGoals?.calories || 2000,
    protein: user?.nutritionGoals?.protein || 150,
    carbs: user?.nutritionGoals?.carbs || 200,
    fat: user?.nutritionGoals?.fat || 70,
  });
  
  // Atualizar formulário quando os dados do usuário mudarem
  useEffect(() => {
    if (user) {
      console.log("Atualizando dados do formulário com:", user);
      
      setProfileData({
        name: user.name || '',
        // Convertendo para números e garantindo valores não-nulos
        weight: user.weight ? parseFloat(user.weight.toString()) : 0,
        height: user.height ? parseFloat(user.height.toString()) : 0,
        // Formatando a data se existir
        birthdate: user.birthdate || '',
      });
      
      if (user.nutritionGoals) {
        setNutritionGoals({
          calories: user.nutritionGoals.calories || 2000,
          protein: user.nutritionGoals.protein || 150,
          carbs: user.nutritionGoals.carbs || 200,
          fat: user.nutritionGoals.fat || 70,
        });
      }
    }
  }, [user]);
  
  // Forçar uma atualização dos dados ao carregar o componente
  useEffect(() => {
    // Opcional: busque os dados do usuário novamente quando o componente de perfil for montado
    // Isso pode ajudar a garantir que temos os dados mais recentes
    const fetchData = async () => {
      try {
        const response = await fetch('/api/users/profile', {
          headers: {
            'x-auth-token': localStorage.getItem('auth_token') || ''
          }
        });
        console.log("Dados recebidos diretamente da API:", await response.json());
      } catch (error) {
        console.error("Erro ao buscar dados diretamente:", error);
      }
    };
    
    fetchData();
  }, []);
  
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    console.log("Enviando dados para atualização:", profileData);
    updateUserProfile(profileData);
  };
  
  const handleNutritionSubmit = (e) => {
    e.preventDefault();
    updateUserGoals(nutritionGoals);
  };
  
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    // Se já estiver no formato yyyy-MM-dd, retorne como está
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    
    try {
      // Tente converter de outros formatos possíveis
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return format(date, 'yyyy-MM-dd');
      }
    } catch (error) {
      console.error("Erro ao formatar data:", error);
    }
    
    return '';
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Configurações de Perfil</h1>
        <p className="text-gray-600 mb-6">Atualize suas informações pessoais e metas nutricionais.</p>
        
        <Tabs defaultValue="dados-pessoais">
          <TabsList className="mb-6">
            <TabsTrigger value="dados-pessoais">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="metas-nutricionais">Metas Nutricionais</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dados-pessoais">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight">Peso (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        min="0"
                        step="0.1"
                        value={profileData.weight}
                        onChange={(e) => setProfileData({...profileData, weight: parseFloat(e.target.value)})}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="height">Altura (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        min="0"
                        step="0.1"
                        value={profileData.height}
                        onChange={(e) => setProfileData({...profileData, height: parseFloat(e.target.value)})}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="birthdate">Data de Nascimento</Label>
                    <Input
                      id="birthdate"
                      type="date"
                      value={formatDateForInput(profileData.birthdate)}
                      onChange={(e) => setProfileData({...profileData, birthdate: e.target.value})}
                      className="w-full"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full bg-fitness-primary text-white">
                    Salvar Alterações
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="metas-nutricionais">
            <Card>
              <CardHeader>
                <CardTitle>Metas Nutricionais</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleNutritionSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="calories">Calorias Diárias (kcal)</Label>
                    <Input
                      id="calories"
                      name="calories"
                      type="number"
                      value={nutritionGoals.calories}
                      onChange={(e) => setNutritionGoals({...nutritionGoals, calories: parseInt(e.target.value)})}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="protein">Proteína (g)</Label>
                      <Input
                        id="protein"
                        name="protein"
                        type="number"
                        value={nutritionGoals.protein}
                        onChange={(e) => setNutritionGoals({...nutritionGoals, protein: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="carbs">Carboidratos (g)</Label>
                      <Input
                        id="carbs"
                        name="carbs"
                        type="number"
                        value={nutritionGoals.carbs}
                        onChange={(e) => setNutritionGoals({...nutritionGoals, carbs: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="fat">Gorduras (g)</Label>
                      <Input
                        id="fat"
                        name="fat"
                        type="number"
                        value={nutritionGoals.fat}
                        onChange={(e) => setNutritionGoals({...nutritionGoals, fat: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium mb-2">Distribuição de Macronutrientes</h3>
                    <div className="flex h-4 rounded-md overflow-hidden mb-2">
                      <div 
                        className="bg-purple-500" 
                        style={{ width: `${nutritionGoals.protein * 4 / (nutritionGoals.protein * 4 + nutritionGoals.carbs * 4 + nutritionGoals.fat * 9) * 100}%` }}
                      ></div>
                      <div 
                        className="bg-yellow-400" 
                        style={{ width: `${nutritionGoals.carbs * 4 / (nutritionGoals.protein * 4 + nutritionGoals.carbs * 4 + nutritionGoals.fat * 9) * 100}%` }}
                      ></div>
                      <div 
                        className="bg-red-400" 
                        style={{ width: `${nutritionGoals.fat * 9 / (nutritionGoals.protein * 4 + nutritionGoals.carbs * 4 + nutritionGoals.fat * 9) * 100}%` }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-3 text-xs text-center">
                      <div>
                        <p className="font-medium">Proteína</p>
                        <p>
                          {Math.round(nutritionGoals.protein * 4 / (nutritionGoals.protein * 4 + nutritionGoals.carbs * 4 + nutritionGoals.fat * 9) * 100)}%
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Carboidratos</p>
                        <p>
                          {Math.round(nutritionGoals.carbs * 4 / (nutritionGoals.protein * 4 + nutritionGoals.carbs * 4 + nutritionGoals.fat * 9) * 100)}%
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Gorduras</p>
                        <p>
                          {Math.round(nutritionGoals.fat * 9 / (nutritionGoals.protein * 4 + nutritionGoals.carbs * 4 + nutritionGoals.fat * 9) * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-fitness-secondary hover:bg-fitness-secondary/90"
                  >
                    Atualizar Metas
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default ProfileSettings;
