
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MealPlanForm from '@/components/nutrition/MealPlanForm';
import { MealPlan } from '@/types';
import { Edit, Trash, Plus, Calendar } from 'lucide-react';
import { calculateDailyNutrition } from '@/data/mockData';

const MealPlanning = () => {
  const { mealPlans, addMealPlan, updateMealPlan, deleteMealPlan } = useAppContext();
  const [editingMealPlan, setEditingMealPlan] = useState<MealPlan | null>(null);
  const [activeTab, setActiveTab] = useState<string>('view');
  
  // Ordenar planos de refeição por data
  const sortedMealPlans = [...mealPlans].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleCreateMealPlan = (mealPlan: Omit<MealPlan, 'id'>) => {
    addMealPlan(mealPlan);
    setActiveTab('view');
  };

  const handleUpdateMealPlan = (mealPlan: MealPlan) => {
    updateMealPlan(mealPlan);
    setEditingMealPlan(null);
    setActiveTab('view');
  };

  const handleDeleteMealPlan = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este plano alimentar?')) {
      deleteMealPlan(id);
    }
  };

  const handleEditMealPlan = (mealPlan: MealPlan) => {
    setEditingMealPlan(mealPlan);
    setActiveTab('edit');
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Planejamento Alimentar</h1>
        <p className="text-gray-600">
          Crie e gerencie seus planos de refeição para alcançar suas metas nutricionais.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="view">Visualizar Planos</TabsTrigger>
          <TabsTrigger value="create">Criar Novo Plano</TabsTrigger>
          {editingMealPlan && <TabsTrigger value="edit">Editar Plano</TabsTrigger>}
        </TabsList>

        <TabsContent value="view">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Seus Planos Alimentares</h2>
            <Button 
              onClick={() => setActiveTab('create')}
              className="bg-fitness-secondary hover:bg-fitness-secondary/90"
            >
              <Plus size={16} className="mr-1" /> Novo Plano
            </Button>
          </div>

          {sortedMealPlans.length > 0 ? (
            <div className="space-y-6">
              {sortedMealPlans.map((mealPlan) => {
                const nutrition = calculateDailyNutrition(mealPlan);
                
                return (
                  <Card key={mealPlan.id} className="bg-white">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center">
                          <Calendar className="mr-2 text-fitness-secondary" size={18} />
                          {formatDate(mealPlan.date)}
                        </CardTitle>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditMealPlan(mealPlan)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteMealPlan(mealPlan.id)}
                          >
                            <Trash size={16} />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <div className="text-sm text-gray-500 mb-2">
                          {mealPlan.meals.length} refeições
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                          {mealPlan.meals.map((meal, index) => (
                            <div key={index} className="flex justify-between">
                              <span>{meal.name}</span>
                              <span className="text-gray-500">{meal.time}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="border-t pt-3 grid grid-cols-4 text-sm">
                          <div>
                            <p className="text-gray-500">Calorias</p>
                            <p className="font-medium">{Math.round(nutrition.calories)} kcal</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Proteínas</p>
                            <p className="font-medium">{Math.round(nutrition.protein)} g</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Carboidratos</p>
                            <p className="font-medium">{Math.round(nutrition.carbs)} g</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Gorduras</p>
                            <p className="font-medium">{Math.round(nutrition.fat)} g</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded">
              <p className="text-gray-500 mb-4">Você ainda não criou nenhum plano alimentar.</p>
              <Button 
                onClick={() => setActiveTab('create')}
                className="bg-fitness-secondary hover:bg-fitness-secondary/90"
              >
                <Plus size={16} className="mr-1" /> Criar Primeiro Plano
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Criar Novo Plano Alimentar</CardTitle>
            </CardHeader>
            <CardContent>
              <MealPlanForm onSubmit={handleCreateMealPlan} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit">
          {editingMealPlan && (
            <Card>
              <CardHeader>
                <CardTitle>Editar Plano Alimentar</CardTitle>
              </CardHeader>
              <CardContent>
                <MealPlanForm 
                  initialMealPlan={editingMealPlan}
                  onSubmit={handleUpdateMealPlan}
                />
                <Button 
                  variant="outline" 
                  className="mt-4 w-full"
                  onClick={() => {
                    setEditingMealPlan(null);
                    setActiveTab('view');
                  }}
                >
                  Cancelar
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default MealPlanning;
