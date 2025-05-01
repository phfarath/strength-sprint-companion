
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User } from '@/types';

const ProfileSettings = () => {
  const { user, updateUserProfile, updateUserGoals } = useAppContext();
  
  const [profileData, setProfileData] = useState({
    name: user.name,
    weight: user.weight || 0,
    height: user.height || 0,
    birthdate: user.birthdate || '',
  });
  
  const [nutritionGoals, setNutritionGoals] = useState({
    calories: user.nutritionGoals.calories,
    protein: user.nutritionGoals.protein,
    carbs: user.nutritionGoals.carbs,
    fat: user.nutritionGoals.fat,
  });
  
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: name === 'weight' || name === 'height' ? parseFloat(value) : value,
    });
  };
  
  const handleGoalsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNutritionGoals({
      ...nutritionGoals,
      [name]: parseInt(value),
    });
  };
  
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(profileData as Omit<User, 'id' | 'nutritionGoals'>);
  };
  
  const handleGoalsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserGoals(nutritionGoals);
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configurações de Perfil</h1>
        <p className="text-gray-600">Atualize suas informações pessoais e metas nutricionais.</p>
      </div>
      
      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="goals">Metas Nutricionais</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input
                      id="weight"
                      name="weight"
                      type="number"
                      step="0.1"
                      value={profileData.weight}
                      onChange={handleProfileChange}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="height">Altura (cm)</Label>
                    <Input
                      id="height"
                      name="height"
                      type="number"
                      value={profileData.height}
                      onChange={handleProfileChange}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="birthdate">Data de Nascimento</Label>
                  <Input
                    id="birthdate"
                    name="birthdate"
                    type="date"
                    value={profileData.birthdate}
                    onChange={handleProfileChange}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-fitness-primary hover:bg-fitness-primary/90"
                >
                  Salvar Alterações
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle>Metas Nutricionais</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGoalsSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="calories">Calorias Diárias (kcal)</Label>
                  <Input
                    id="calories"
                    name="calories"
                    type="number"
                    value={nutritionGoals.calories}
                    onChange={handleGoalsChange}
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
                      onChange={handleGoalsChange}
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
                      onChange={handleGoalsChange}
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
                      onChange={handleGoalsChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium mb-2">Distribuição de Macronutrientes</h3>
                  <div className="flex h-4 rounded-md overflow-hidden mb-2">
                    <div 
                      className="bg-blue-500" 
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
    </Layout>
  );
};

export default ProfileSettings;
