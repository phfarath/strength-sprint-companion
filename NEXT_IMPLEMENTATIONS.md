# Próximas Implementações Alcançáveis - StrengthSprint Companion

Este documento apresenta um roadmap estruturado de implementações viáveis para o StrengthSprint Companion, aproveitando a arquitetura atual (React + Express/Prisma) sem exigir grandes refatorações.

## Contexto Atual

O StrengthSprint Companion já possui:
- ✅ Assistente IA Unificado com endpoint `/api/ai/unified`
- ✅ Geração de planos de treino e nutrição com persistência
- ✅ Sistema de memória e histórico de conversas
- ✅ Feedback genérico via `/api/ai/feedback`
- ✅ Resumo de atividades com `activitySummaryService`
- ✅ Sidebar de histórico navegável na interface do assistente

---

## 1. Gestão Completa de Planos (Alta Prioridade)

### Objetivo
Permitir que usuários visualizem, editem e gerenciem planos gerados pela IA.

### Implementação

#### Backend - Novos Endpoints

**GET /api/ai/workout-plans**
- Retorna lista de planos de treino do usuário
- Parâmetros: `limit` (padrão: 10, máx: 50)
- Ordenação: mais recentes primeiro
- Inclui exercícios e detalhes completos

**GET /api/ai/workout-plans/:id**
- Retorna um plano de treino específico
- Valida propriedade do usuário
- Retorna 404 se não encontrado

**PATCH /api/ai/workout-plans/:id**
- Atualiza plano existente (nome, dia da semana, notas)
- Permite edição completa de exercícios
- Recria exercícios na ordem especificada
- Payload exemplo:
```json
{
  "name": "Treino A - Modificado",
  "day_of_week": 1,
  "notes": "Ajustado para maior intensidade",
  "exercises": [
    {
      "name": "Supino Reto",
      "sets": 4,
      "reps": 10,
      "weight_kg": 80,
      "rest_seconds": 90
    }
  ]
}
```

**DELETE /api/ai/workout-plans/:id**
- Remove plano e exercícios associados
- Validação de propriedade

**Mesmos endpoints para meal-plans**
- GET /api/ai/meal-plans
- GET /api/ai/meal-plans/:id
- PATCH /api/ai/meal-plans/:id
- DELETE /api/ai/meal-plans/:id

#### Frontend - AppContext

Adicionar métodos ao `useAppContext`:

```typescript
const {
  getWorkoutPlans,
  getWorkoutPlan,
  updateWorkoutPlan,
  deleteWorkoutPlan,
  getMealPlans,
  getMealPlan,
  updateMealPlan,
  deleteMealPlan,
} = useAppContext();
```

#### Frontend - Componentes

1. **PlanListView** (`src/components/ai/PlanListView.tsx`)
   - Lista de planos com filtros (data, tipo)
   - Botões de ação: Ver, Editar, Excluir
   - Integração com rotas de planos

2. **PlanEditorModal** (`src/components/ai/PlanEditorModal.tsx`)
   - Modal com React Hook Form
   - Validação com Zod
   - Edição inline de exercícios/refeições
   - Adicionar/remover itens dinamicamente

3. **Integração no Dashboard**
   - Cards "Meus Planos de Treino" e "Meus Planos Alimentares"
   - Links para visualização completa

### Valor
- Usuários podem refinar sugestões da IA sem perder o contexto inicial
- Aumenta a taxa de adoção e adesão aos planos
- Reduz necessidade de regenerar planos completamente

---

## 2. Análise de Tendências e Dashboards Analíticos

### Objetivo
Fornecer visualizações claras de progresso combinando treinos, nutrição e feedback.

### Implementação

#### Backend - Endpoint de Tendências

**GET /api/ai/activity-trends**
- Parâmetros: `days` (padrão: 30, range: 7-90)
- Retorna métricas agregadas:
  - Total de sessões de treino
  - Média de treinos por semana
  - Dias com tracking nutricional
  - Média de rating de feedback
  - Total de planos gerados

Exemplo de resposta:
```json
{
  "success": true,
  "trends": {
    "period": {
      "days": 30,
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T00:00:00.000Z"
    },
    "workouts": {
      "totalSessions": 18,
      "avgPerWeek": 4.2,
      "totalPlans": 3
    },
    "nutrition": {
      "totalDaysTracked": 25,
      "avgTrackingPerWeek": 5.8,
      "totalMealPlans": 2
    },
    "feedback": {
      "totalEntries": 12,
      "avgRating": 4.3
    }
  }
}
```

#### Frontend - Dashboard Analytics

1. **ActivityTrendsWidget** (`src/components/dashboard/ActivityTrendsWidget.tsx`)
   - Gráficos com Recharts ou visx
   - Seletor de período (7d, 30d, 90d)
   - Cards com métricas-chave

2. **ProgressCharts** (`src/components/dashboard/ProgressCharts.tsx`)
   - Gráfico de linha: frequência de treinos ao longo do tempo
   - Gráfico de barras: distribuição de feedback
   - Comparação: planos criados vs. execução real

### Valor
- Reforça percepção de progresso
- Mantém usuários engajados com dados concretos
- Facilita identificação de padrões e ajustes necessários

---

## 3. Feedback Específico de Planos

### Objetivo
Coletar avaliações detalhadas para refinar recomendações futuras.

### Implementação

#### Backend - Endpoints de Feedback

**POST /api/ai/workout-plans/:id/feedback**
- Valida existência do plano e propriedade
- Cria registro em `PlanFeedback`
- Campos: rating (1-5), difficultyRating, adherence, notes, improvements

**POST /api/ai/meal-plans/:id/feedback**
- Mesma estrutura para planos alimentares

#### Frontend - Formulário de Feedback

1. **PlanFeedbackForm** (`src/components/ai/PlanFeedbackForm.tsx`)
   - Estrelas para rating geral
   - Slider para dificuldade
   - Slider para aderência (%)
   - Campo de texto para notas e sugestões
   - Integração direta nos cards de planos

### Valor
- Fecha o ciclo de aprendizado da IA
- Gera dados para personalização progressiva
- Aumenta engajamento com sensação de ser ouvido

---

## 4. Check-ins Automáticos (Médio Prazo)

### Objetivo
Manter usuários engajados com lembretes proativos e micro-ajustes semanais.

### Implementação

#### Backend - Job Scheduler

**Instalar `node-cron`**
```bash
npm install node-cron
```

**Criar serviço de check-ins** (`backend/services/checkinService.js`)
```javascript
const cron = require('node-cron');
const { getUserActivitySummary } = require('./activitySummaryService');

cron.schedule('0 9 * * 1', async () => {
  const users = await prisma.user.findMany({
    where: { active: true }
  });
  
  for (const user of users) {
    const summary = await getUserActivitySummary(prisma, user.id, { days: 7 });
    
    await prisma.checkin.create({
      data: {
        userId: user.id,
        weekNumber: getCurrentWeekNumber(),
        activitySummary: JSON.stringify(summary),
        status: 'pending'
      }
    });
  }
});
```

#### Frontend - Check-in Widget

1. **CheckinCard** (`src/components/dashboard/CheckinCard.tsx`)
   - Exibe check-in pendente no dashboard
   - Pergunta: "Como foi sua semana?"
   - Botão para responder via assistente IA

### Valor
- Engajamento contínuo sem depender de iniciativa do usuário
- Monitoramento proativo da evolução
- Ajustes em tempo real baseados em resposta

---

## 5. Suporte Multilíngue

### Objetivo
Adaptar prompts e respostas conforme preferência do usuário.

### Implementação

#### Backend - Detecção e Inclusão de Idioma

**Atualizar `aiService.js`**
```javascript
const buildPrompt = (userData, options = {}) => {
  const language = options.language || userData.preferredLanguage || 'pt-BR';
  
  const languageInstructions = {
    'pt-BR': 'Responda em português do Brasil',
    'en-US': 'Respond in American English',
    'es-ES': 'Responde en español'
  };
  
  return `${languageInstructions[language]}\n\n...`;
};
```

#### Frontend - Configurações de Idioma

1. **Adicionar campo em Settings**
   - Selector de idioma preferido
   - Persistir em `User` model e localStorage

2. **Incluir idioma em chamadas de IA**
   - Propagar preferência via `AppContext`
   - Incluir em payload das requisições

### Valor
- Acessibilidade global
- Melhor experiência para usuários internacionais
- Diferencial competitivo

---

## 6. Integração com Wearables (MVP)

### Objetivo
Enriquecer análises com dados objetivos de atividade.

### Implementação

#### Backend - Import de Dados

**POST /api/devices/import**
- Aceita CSV ou JSON com dados de:
  - Passos diários
  - Frequência cardíaca
  - Minutos de sono
  - Calorias queimadas
- Valida formato e persiste em tabela `DeviceData`

**Exemplo de payload:**
```json
{
  "source": "google_fit",
  "data": [
    {
      "date": "2024-01-15",
      "steps": 8500,
      "caloriesBurned": 320,
      "sleepMinutes": 420,
      "avgHeartRate": 72
    }
  ]
}
```

#### Frontend - Painel de Importação

1. **DeviceDataImport** (`src/pages/settings/DeviceDataImport.tsx`)
   - Upload de arquivo CSV
   - Histórico de importações
   - Status de sincronização
   - Preview dos dados importados

#### Integração com `activitySummaryService`

- Incluir dados de wearables no resumo de atividades
- Usar para enriquecer prompts de IA

### Valor
- Recomendações mais precisas
- Diferencial tecnológico
- Reduz dependência de input manual

---

## 7. Biblioteca de Exercícios e Alimentos

### Objetivo
Facilitar criação e edição de planos com catálogo pré-definido.

### Implementação

#### Backend - Endpoints de Biblioteca

**GET /api/library/exercises**
- Retorna exercícios populares com filtros (grupo muscular, equipamento)
- Ordenação por popularidade

**GET /api/library/foods**
- Retorna alimentos com informações nutricionais
- Filtros: categoria, restrições dietéticas

#### Frontend - Seletores Assistidos

1. **ExercisePicker** (`src/components/library/ExercisePicker.tsx`)
   - Autocomplete com busca
   - Preview com descrição e imagem
   - Botão "Adicionar ao plano"

2. **FoodPicker** (`src/components/library/FoodPicker.tsx`)
   - Similar ao ExercisePicker
   - Exibe macros ao lado do nome

### Valor
- Acelera criação manual de planos
- Reduz erros de digitação
- Melhora experiência do usuário

---

## Priorização Sugerida

### Sprint 1 (2 semanas)
1. ✅ Gestão completa de planos (GET, PATCH, DELETE)
2. ✅ Feedback específico de planos
3. ✅ Dashboard de tendências básico

### Sprint 2 (2 semanas)
4. Biblioteca de exercícios e alimentos
5. Melhorias na UI do assistente
6. Testes e refinamentos

### Sprint 3 (2 semanas)
7. Check-ins automáticos
8. Suporte multilíngue básico
9. Documentação de API

### Sprint 4 (2 semanas)
10. Integração com wearables (MVP)
11. Analytics avançados
12. Polimento e otimizações

---

## Conclusão

Todas as implementações listadas aproveitam a infraestrutura existente e podem ser executadas de forma independente, permitindo entregas incrementais e testes contínuos. O foco está em fechar ciclos de feedback, aumentar engajamento e fornecer valor tangível aos usuários através de dados e personalização progressiva.
