import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import MealPlanForm from '@/components/nutrition/MealPlanForm';
import FoodModal from '@/components/nutrition/FoodModal';
import { MealPlan } from '@/types';
import { Edit, Trash, Plus, Calendar, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { apiServices } from '@/services/api';

const MealPlanning = () => {
  const { mealPlans, addMealPlan, updateMealPlan, deleteMealPlan } = useAppContext();
  const { toast } = useToast();
  const [editingMealPlan, setEditingMealPlan] = useState<MealPlan | null>(null);
  const [activeTab, setActiveTab] = useState<string>('view');
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingFood, setEditingFood] = useState(null);
  
  // Ordenar planos de refeição por data
  const sortedMealPlans = [...mealPlans].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Buscar alimentos ao carregar a página
  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      console.log("Iniciando busca de alimentos...");
      
      // Verificando se tem token de autenticação
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.warn("Token de autenticação não encontrado");
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para ver seus alimentos.",
          variant: "destructive"
        });
        return;
      }
      
      console.log("Enviando requisição para API...");
      const response = await apiServices.getFoods();
      console.log("Dados recebidos:", response.data);
      
      if (Array.isArray(response.data)) {
        setFoods(response.data);
      } else {
        console.error("Formato de resposta inesperado:", response.data);
        setFoods([]);
      }
    } catch (error) {
      console.error("Erro ao buscar alimentos:", error);
      
      // Log detalhado do erro
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Dados do erro:", error.response.data);
      }
      
      // Usando mockFoods como fallback para não quebrar a UI
      setFoods([]); // Ou use mockFoods como fallback se tiver
      
      toast({
        title: "Erro ao carregar alimentos",
        description: "Não foi possível carregar os alimentos. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar alimentos pela busca
  const filteredFoods = foods.filter(food => 
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateMealPlan = async (mealPlan: Omit<MealPlan, 'id'>) => {
    try {
      await addMealPlan(mealPlan);
      setActiveTab('view');
    } catch (error) {
      toast({
        title: "Erro ao criar plano",
        description: "Não foi possível salvar o plano alimentar no servidor.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateMealPlan = async (mealPlan: MealPlan) => {
    try {
      await updateMealPlan(mealPlan);
      setEditingMealPlan(null);
      setActiveTab('view');
    } catch (error) {
      toast({
        title: "Erro ao atualizar plano",
        description: "Não foi possível atualizar o plano alimentar no servidor.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMealPlan = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este plano alimentar?')) {
      try {
        await deleteMealPlan(id);
      } catch (error) {
        toast({
          title: "Erro ao excluir plano",
          description: "Não foi possível excluir o plano alimentar do servidor.",
          variant: "destructive"
        });
      }
    }
  };

  const handleEditMealPlan = (mealPlan: MealPlan) => {
    setEditingMealPlan(mealPlan);
    setActiveTab('edit');
  };

  const handleFoodCreated = (food) => {
    // Se estiver editando um alimento existente
    if (editingFood) {
      setFoods(foods.map(f => f.id === food.id ? food : f));
    } else {
      // Se for um novo alimento
      setFoods([...foods, food]);
    }
    fetchFoods(); // Re-buscar alimentos para garantir sincronização
  };

  const handleEditFood = (food) => {
    setEditingFood(food);
    setFoodModalOpen(true);
  };

  const handleDeleteFood = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este alimento?')) {
      try {
        await apiServices.deleteFood(id);
        setFoods(foods.filter(f => f.id !== id));
        toast({
          title: "Alimento excluído",
          description: "O alimento foi removido com sucesso."
        });
      } catch (error) {
        toast({
          title: "Erro ao excluir",
          description: "Não foi possível excluir o alimento.",
          variant: "destructive"
        });
      }
    }
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
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold">Planejamento Alimentar</h1>
        <p className="text-gray-600">
          Crie e gerencie seus planos de refeição para alcançar suas metas nutricionais.
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="view">Visualizar Planos</TabsTrigger>
          <TabsTrigger value="create">Criar Novo Plano</TabsTrigger>
          <TabsTrigger value="foods">Meus Alimentos</TabsTrigger>
          {editingMealPlan && <TabsTrigger value="edit">Editar Plano</TabsTrigger>}
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
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
                    const nutrition = mealPlan.totalNutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 };
                    
                    return (
                      <motion.div
                        key={mealPlan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="bg-white hover:shadow-lg transition-shadow duration-300">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="flex items-center">
                                {mealPlan.name}
                                <span className="ml-2 text-sm text-gray-500">
                                  {formatDate(mealPlan.date)}
                                </span>
                              </CardTitle>
                              <div className="flex space-x-2">
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditMealPlan(mealPlan)}
                                  >
                                    <Edit size={16} />
                                  </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() => handleDeleteMealPlan(mealPlan.id)}
                                  >
                                    <Trash size={16} />
                                  </Button>
                                </motion.div>
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
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-center py-12 border border-dashed rounded"
                >
                  <p className="text-gray-500 mb-4">Você ainda não criou nenhum plano alimentar.</p>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={() => {
                        setActiveTab('create');
                        // Limpar qualquer plano editado anteriormente
                        setEditingMealPlan(null);
                      }}
                      className="bg-fitness-secondary hover:bg-fitness-secondary/90"
                    >
                      <Plus size={16} className="mr-1" /> Criar Primeiro Plano
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="foods">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold">Banco de Alimentos</h2>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    onClick={() => {
                      setEditingFood(null);
                      setFoodModalOpen(true);
                    }}
                    className="bg-fitness-secondary hover:bg-fitness-secondary/90"
                  >
                    <Plus size={16} className="mr-1" /> Novo Alimento
                  </Button>
                </motion.div>
              </div>
              
              <Card className="bg-white">
                <CardContent className="py-6">
                  <div className="relative mb-4">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Buscar alimentos..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  {loading ? (
                    <div className="py-8 text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                      <p className="mt-2 text-gray-500">Carregando alimentos...</p>
                    </div>
                  ) : filteredFoods.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-gray-500">
                        {searchQuery ? "Nenhum alimento encontrado" : "Nenhum alimento cadastrado"}
                      </p>
                      {!searchQuery && (
                        <Button 
                          onClick={() => {
                            setEditingFood(null);
                            setFoodModalOpen(true);
                          }}
                          className="mt-4 bg-fitness-secondary hover:bg-fitness-secondary/90"
                        >
                          <Plus size={16} className="mr-1" /> Adicionar Primeiro Alimento
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y">
                      <AnimatePresence>
                        {filteredFoods.map(food => (
                          <motion.div 
                            key={food.id} 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="py-3 px-2 hover:bg-gray-50 rounded-md"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{food.name}</p>
                                <p className="text-sm text-gray-600">{food.calories} kcal | {food.weight}g</p>
                                <div className="text-xs text-gray-500 mt-1 space-x-2">
                                  <span>P: {food.protein}g</span>
                                  <span>C: {food.carbs}g</span>
                                  <span>G: {food.fat}g</span>
                                </div>
                              </div>
                              <div className="flex space-x-1">
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleEditFood(food)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => handleDeleteFood(food.id)}
                                  >
                                    <Trash className="h-4 w-4 text-red-500" />
                                  </Button>
                                </motion.div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="create">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Criar Novo Plano Alimentar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MealPlanForm onSubmit={handleCreateMealPlan} />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="edit">
              {editingMealPlan && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
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
                </motion.div>
              )}
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>

      {/* Modal para adicionar/editar alimentos */}
      <FoodModal
        open={foodModalOpen}
        onOpenChange={setFoodModalOpen}
        initialFood={editingFood}
        onFoodCreated={handleFoodCreated}
      />
    </Layout>
  );
};

export default MealPlanning;
