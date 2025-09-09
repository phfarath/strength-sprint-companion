import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import PageHeader from '@/components/layout/PageHeader';
import { useAppContext } from '@/context/AppContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { apiServices } from '@/services/api';
import { format } from 'date-fns';
import MealPlanForm from '@/components/nutrition/MealPlanForm';
import MealPlanFormWithAI from '@/components/nutrition/MealPlanFormWithAI';
import FoodModal from '@/components/nutrition/FoodModal';
import { MealPlan } from '@/types';
import { Edit, Trash, Plus, Calendar, Search, UtensilsCrossed, Apple } from 'lucide-react';
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

  const [activeTab, setActiveTab] = useState<string>('view');
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
        className="space-y-6"
      >
        <PageHeader title="Planejamento Alimentar" description="Crie e gerencie seus planos de refei��o para alcan�ar suas metas nutricionais." icon={UtensilsCrossed} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Versão mobile - dropdown */}
          <div className="md:hidden mb-6">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {activeTab === 'view' && 'Visualizar Planos'}
                  {activeTab === 'create' && 'Criar Novo Plano'}
                  {activeTab === 'edit' && 'Editar Plano'}
                  {activeTab === 'foods' && 'Meus Alimentos'}
                  {activeTab === 'public' && 'Planos Públicos'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    Visualizar Planos
                  </div>
                </SelectItem>
                <SelectItem value="create">
                  <div className="flex items-center gap-2">
                    <Plus size={16} />
                    Criar Novo Plano
                  </div>
                </SelectItem>
                <SelectItem value="edit" disabled={!editingMealPlan}>
                  <div className="flex items-center gap-2">
                    <Edit size={16} />
                    Editar Plano
                  </div>
                </SelectItem>
                <SelectItem value="foods">
                  <div className="flex items-center gap-2">
                    <Apple size={16} />
                    Meus Alimentos
                  </div>
                </SelectItem>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Search size={16} />
                    Planos Públicos
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Versão desktop - tabs melhoradas */}
          <div className="hidden md:block mb-6">
            <TabsList className="grid w-full grid-cols-5 h-12">
              <TabsTrigger value="view" className="flex items-center gap-2 text-sm">
                <Calendar size={16} className="hidden lg:block" />
                <span className="hidden lg:inline">Visualizar</span>
                <span className="lg:hidden">Ver</span>
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2 text-sm">
                <Plus size={16} className="hidden lg:block" />
                <span className="hidden lg:inline">Criar</span>
                <span className="lg:hidden">Novo</span>
              </TabsTrigger>
              <TabsTrigger value="edit" disabled={!editingMealPlan} className="flex items-center gap-2 text-sm">
                <Edit size={16} className="hidden lg:block" />
                <span className="hidden lg:inline">Editar</span>
                <span className="lg:hidden">Edit</span>
              </TabsTrigger>
              <TabsTrigger value="foods" className="flex items-center gap-2 text-sm">
                <Apple size={16} className="hidden lg:block" />
                <span className="hidden lg:inline">Alimentos</span>
                <span className="lg:hidden">Food</span>
              </TabsTrigger>
              <TabsTrigger value="public" className="flex items-center gap-2 text-sm">
                <Search size={16} className="hidden lg:block" />
                <span className="hidden lg:inline">Públicos</span>
                <span className="lg:hidden">Pub</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TabsContent value="view" className="mt-0">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                  <h2 className="text-2xl font-semibold text-gray-900">Seus Planos Alimentares</h2>
                  <Button 
                    onClick={() => {
                      setEditingMealPlan(null);
                      setActiveTab('create');
                    }}
                    className="bg-fitness-secondary hover:bg-fitness-secondary/90 w-full sm:w-auto"
                  >
                    <Plus size={16} className="mr-2" /> Novo Plano
                  </Button>
                </div>

                {sortedMealPlans.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {sortedMealPlans.map((mealPlan) => {
                      const nutrition = mealPlan.totalNutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 };

                      return (
                        <motion.div
                          key={mealPlan.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card className="bg-white hover:shadow-lg transition-all duration-300 h-full">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                                    {mealPlan.name}
                                  </CardTitle>
                                  <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {mealPlan.date ? format(new Date(mealPlan.date), 'dd/MM/yyyy') : 'Sem data'}
                                  </div>
                                </div>
                                <div className="flex gap-1 ml-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditMealPlan(mealPlan)}
                                    title="Editar plano"
                                    className="hover:bg-purple-50 hover:text-purple-600 transition-colors"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteMealPlan(String(mealPlan.id))}
                                    title="Excluir plano"
                                    className="hover:bg-red-50 hover:text-red-600 transition-colors"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            
                            <CardContent className="pt-0">
                              <div className="text-sm text-gray-600 mb-4">
                                {mealPlan.meals.length} {mealPlan.meals.length === 1 ? 'refeição' : 'refeições'}
                              </div>

                              {/* Lista de refeições */}
                              <div className="space-y-2 mb-4">
                                {mealPlan.meals.slice(0, 3).map((meal, index) => (
                                  <div key={index} className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-gray-700 truncate">{meal.name}</span>
                                    <span className="text-gray-500 text-xs ml-2">{meal.time || '--:--'}</span>
                                  </div>
                                ))}
                                {mealPlan.meals.length > 3 && (
                                  <div className="text-xs text-gray-500 text-center">
                                    +{mealPlan.meals.length - 3} mais
                                  </div>
                                )}
                              </div>

                              {/* Informações nutricionais */}
                              <div className="border-t pt-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="text-center">
                                    <p className="text-gray-500 text-xs">Calorias</p>
                                    <p className="font-bold text-lg text-gray-900">{Math.round(nutrition.calories)}</p>
                                    <p className="text-xs text-gray-500">kcal</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-gray-500 text-xs">Proteínas</p>
                                    <p className="font-bold text-lg text-gray-900">{Math.round(nutrition.protein)}</p>
                                    <p className="text-xs text-gray-500">g</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                                  <div className="text-center">
                                    <p className="text-gray-500 text-xs">Carboidratos</p>
                                    <p className="font-bold text-gray-900">{Math.round(nutrition.carbs)}g</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-gray-500 text-xs">Gorduras</p>
                                    <p className="font-bold text-gray-900">{Math.round(nutrition.fat)}g</p>
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
                    className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
                  >
                    <div className="max-w-md mx-auto">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-600 mb-2">Nenhum plano alimentar criado</p>
                      <p className="text-gray-500 mb-6">Comece criando seu primeiro plano personalizado.</p>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                          onClick={() => {
                            setEditingMealPlan(null);
                            setActiveTab('create');
                          }}
                          className="bg-fitness-secondary hover:bg-fitness-secondary/90"
                        >
                          <Plus size={16} className="mr-2" /> Criar Primeiro Plano
                        </Button>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </TabsContent>

              <TabsContent value="edit" className="mt-0">
                {editingMealPlan ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="bg-white">
                      <CardHeader>
                        <CardTitle>Editar Plano Alimentar</CardTitle>
                        <p className="text-gray-600">Modifique as informações do seu plano alimentar.</p>
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
                          Cancelar Edição
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Selecione um plano para editar na aba "Visualizar Planos".</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="create" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Criar Novo Plano Alimentar</CardTitle>
                      <p className="text-gray-600">Configure um novo plano de refeições personalizado.</p>
                    </CardHeader>
                    <CardContent>
                      <MealPlanFormWithAI onSubmit={handleCreateMealPlan} />
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="foods" className="mt-0">
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

              <TabsContent value="public" className="mt-0">
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
      </motion.div>
    </Layout>
  );
};

export default MealPlanning;



