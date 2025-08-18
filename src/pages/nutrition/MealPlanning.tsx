import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { useAppContext } from '@/context/AppContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { apiServices } from '@/services/api';
import { format } from 'date-fns';
import MealPlanForm from '@/components/nutrition/MealPlanForm';
import FoodModal from '@/components/nutrition/FoodModal';
import { MealPlan } from '@/types';
import { Edit, Trash, Plus, Calendar, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';

const MealPlanning: React.FC = () => {
  const { mealPlans, addMealPlan, updateMealPlan, deleteMealPlan } = useAppContext();
  const { toast } = useToast();
  const [editingMealPlan, setEditingMealPlan] = useState<MealPlan | null>(null);
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [foods, setFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingFood, setEditingFood] = useState(null);

  const [activeTab, setActiveTab] = useState<string>('view'); // padrão existente
  const [publicPlans, setPublicPlans] = useState<any[]>([]);
  const [loadingPublic, setLoadingPublic] = useState<boolean>(false);

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

      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para ver seus alimentos.",
          variant: "destructive"
        });
        return;
      }

      // Agora a API já retorna só privados, mas filtramos por segurança
      const response = await apiServices.getMyFoods();
      const mineOnly = (Array.isArray(response.data) ? response.data : []).filter((f: any) => !f.isPublic);
      setFoods(mineOnly);
    } catch (error: any) {
      console.error("Erro ao buscar meus alimentos:", error);
      setFoods([]);
      toast({
        title: "Erro ao carregar alimentos",
        description: "Não foi possível carregar seus alimentos. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar alimentos pela busca (defensivo e memoizado)
  const filteredFoods = React.useMemo(() => {
    const list = Array.isArray(foods) ? foods : [];
    const q = (searchQuery || '').toLowerCase();
    return list.filter(f => (f?.name || '').toLowerCase().includes(q));
  }, [foods, searchQuery]);

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

  const handleFoodCreated = (food: any) => {
    // Evita capturar 'foods' por referência; usa atualização funcional
    if (editingFood) {
      setFoods(prev => prev.map(f => f.id === food.id ? food : f));
    } else {
      setFoods(prev => [...prev, food]);
    }
    fetchFoods();
  };

  const handleEditFood = (food: any) => {
    setEditingFood(food);
    setFoodModalOpen(true);
  };

  const handleDeleteFood = async (id: any) => {
    if (window.confirm('Tem certeza que deseja excluir este alimento?')) {
      try {
        await apiServices.deleteFood(id);
        setFoods(prev => prev.filter(f => f.id !== id));
        toast({
          title: "Alimento excluído",
          description: "O alimento foi removido com sucesso."
        });
      } catch (error: any) {
        const status = error?.response?.status;
        const msg = status === 409
          ? "Este alimento está sendo usado em planos de outros usuários e não pode ser excluído."
          : "Não foi possível excluir o alimento.";
        toast({
          title: "Erro ao excluir",
          description: msg,
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

  const fetchPublicPlans = async () => {
    try {
      setLoadingPublic(true);
      const res = await apiServices.getPublicMealPlans();
      const plans = Array.isArray(res.data) ? res.data : [];
      setPublicPlans(plans);
    } catch (err) {
      console.error('Erro ao buscar planos públicos:', err);
      setPublicPlans([]);
    } finally {
      setLoadingPublic(false);
    }
  };

  // Buscar quando a aba “public” é ativada
  useEffect(() => {
    if (activeTab === 'public') {
      fetchPublicPlans();
    }
  }, [activeTab]);

  // Importar um plano público para o usuário
  const handleImportPublicPlan = async (plan: any) => {
    try {
      // Montar payload mínimo para criação
      const todayIso = new Date().toISOString().slice(0, 10);
      const newPlan = {
        name: `Cópia de ${plan.name}`,
        date: todayIso,
        notes: plan.notes || null,
        isPublic: false,
        meals: (plan.meals || []).map((m: any) => ({
          name: m.name || 'Refeição',
          time: m.time || null,
          foods: (m.mealFoods || []).map((mf: any) => ({
            foodId: Number(mf.food?.id ?? mf.foodId),         // garantir número
            servings: Number(mf.quantity ?? mf.servings ?? 1), // quantidade
          }))
        }))
      };

      // Validação simples: remover itens com foodId inválido
      newPlan.meals = newPlan.meals.map((m: any) => ({
        ...m,
        foods: m.foods.filter((f: any) => Number.isFinite(f.foodId))
      }));

      const resp = await apiServices.createMealPlan(newPlan);
      toast({ title: 'Plano importado', description: 'Plano público copiado para sua conta.' });

      // Opcional: atualizar sua aba de planos pessoais, se houver função existente
      // Ex.: await fetchMealPlans();
    } catch (err) {
      console.error('Erro ao importar plano público:', err);
      toast({ title: 'Falha ao importar', description: 'Não foi possível importar este plano.', variant: 'destructive' });
    }
  };

  // Helper: totals para qualquer plano (fallback se API não enviar totalNutrition)
  const getPlanTotals = (plan: any) => {
    const fromApi = plan?.totalNutrition;
    if (fromApi && (fromApi.calories || fromApi.protein || fromApi.carbs || fromApi.fat)) {
      return fromApi;
    }
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    (plan?.meals || []).forEach((m: any) => {
      const items = m.mealFoods || m.foods || [];
      items.forEach((mf: any) => {
        const qty = Number(mf.quantity ?? mf.servings ?? 1);
        const f = mf.food ?? mf; // mf.food quando vem do backend
        if (!f) return;
        totals.calories += Number(f.calories || 0) * qty;
        totals.protein  += Number(f.protein  || 0) * qty;
        totals.carbs    += Number(f.carbs    || 0) * qty;
        totals.fat      += Number(f.fat      || 0) * qty;
      });
    });
    return totals;
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="view">Visualizar Planos</TabsTrigger>
          <TabsTrigger value="create">Criar Novo Plano</TabsTrigger>
          <TabsTrigger value="foods">Meus Alimentos</TabsTrigger>
          {/* Removido o trigger da aba de edição para escondê-la */}
          {/* <TabsTrigger value="edit">Editar Plano</TabsTrigger> */}
          <TabsTrigger value="public">Planos Públicos</TabsTrigger>
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
                          <CardContent>
                            {/* Cabeçalho com nome/data + ações alinhadas */}
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <div className="font-semibold">{mealPlan.name}</div>
                                <div className="text-xs text-gray-500">
                                  {mealPlan.date ? format(new Date(mealPlan.date), 'dd/MM/yyyy') : 'Sem data'}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditMealPlan(mealPlan)}
                                  title="Editar plano"
                                  className="hover:bg-gray-100"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteMealPlan(String(mealPlan.id))}
                                  title="Excluir plano"
                                  className="hover:bg-gray-100"
                                >
                                  <Trash className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>

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
                  <CardContent>
                    <MealPlanForm onSubmit={handleCreateMealPlan} />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* <TabsContent value="edit">
              {editingMealPlan && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
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
            </TabsContent> */}

            <TabsContent value="public" className="mt-4">
              {loadingPublic ? (
                <div className="text-sm text-muted-foreground">Carregando planos públicos…</div>
              ) : publicPlans.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhum plano público encontrado.</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {publicPlans.map((plan: any) => {
                    const totals = getPlanTotals(plan);
                    return (
                      <Card key={plan.id}>
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">{plan.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {plan.date ? format(new Date(plan.date), 'dd/MM/yyyy') : 'Sem data'}
                              </div>
                            </div>
                            <Button size="sm" onClick={() => handleImportPublicPlan(plan)}>Importar</Button>
                          </div>

                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <div><span className="text-muted-foreground">Kcal</span> <b>{Math.round(totals.calories)}</b></div>
                            <div><span className="text-muted-foreground">P</span> <b>{Math.round(totals.protein)}g</b></div>
                            <div><span className="text-muted-foreground">C</span> <b>{Math.round(totals.carbs)}g</b></div>
                            <div><span className="text-muted-foreground">G</span> <b>{Math.round(totals.fat)}g</b></div>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {plan.meals?.length || 0} refeições
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
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
