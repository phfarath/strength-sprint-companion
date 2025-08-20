# StrengthSprint Companion - Funcionalidades de IA

Este projeto foi estendido com funcionalidades avançadas de Inteligência Artificial para criar treinos personalizados, dietas, avaliações corporais, análises de documentos de saúde e respostas a dúvidas.

## Funcionalidades de IA Implementadas

### 1. Assistente de IA
- **Rota:** `/ai/assistant`
- **Componente:** `src/pages/ai/AIAssistant.tsx`
- **Descrição:** Interface para fazer perguntas e obter respostas personalizadas com base nos dados do usuário.

### 2. Avaliação Corporal com IA
- **Rota:** `/ai/assessment`
- **Componente:** `src/pages/ai/BodyAssessment.tsx`
- **Descrição:** Avaliação completa da saúde com base em dados biométricos, histórico de atividades e preferências.

### 3. Análise de Documentos de Saúde
- **Rota:** `/ai/documents`
- **Componente:** `src/pages/ai/DocumentAnalysis.tsx`
- **Descrição:** Análise de documentos médicos como exames, laudos e relatórios para obter insights personalizados.

## Integração com Backend

### Serviços de IA
- **Arquivo:** `backend/services/aiService.js`
- **Descrição:** Serviço que integra com a API do OpenAI para gerar respostas personalizadas.

### Rotas da API
- **Arquivo:** `backend/routes/ai.js`
- **Endpoints:**
  - `POST /api/ai/workout-plan` - Gera plano de treino personalizado
  - `POST /api/ai/meal-plan` - Gera plano alimentar personalizado
  - `POST /api/ai/health-assessment` - Realiza avaliação de saúde
  - `POST /api/ai/document-analysis` - Analisa documentos de saúde
  - `POST /api/ai/question` - Responde perguntas do usuário

## Componentes com IA Integrada

### Formulário de Treino com IA
- **Componente:** `src/components/workout/WorkoutFormWithAI.tsx`
- **Descrição:** Formulário que sugere exercícios com base nos objetivos do usuário.

### Formulário de Plano Alimentar com IA
- **Componente:** `src/components/nutrition/MealPlanFormWithAI.tsx`
- **Descrição:** Formulário que sugere alimentos e refeições com base nas necessidades nutricionais.

## Implementação Progressiva

A implementação foi feita de forma progressiva, adicionando:

1. **Backend:** Serviços e rotas da API para integração com IA
2. **Frontend:** Componentes e páginas para interface do usuário
3. **Navegação:** Adição de itens de menu para acessar as funcionalidades
4. **Contexto:** Integração com o contexto da aplicação para acesso às funções de IA

## Como Usar

1. Acesse qualquer uma das páginas de IA através do menu de navegação
2. Preencha os formulários com seus dados
3. Receba recomendações personalizadas geradas pela IA
4. Utilize o assistente de IA para tirar dúvidas específicas

## Tecnologias Utilizadas

- **OpenAI API:** Para geração de conteúdo personalizado
- **React:** Para interface do usuário
- **Express:** Para backend
- **Prisma:** Para ORM
- **TypeScript:** Para tipagem estática

## Configuração

Para utilizar as funcionalidades de IA, é necessário configurar a variável de ambiente `OPENAI_API_KEY` no arquivo `.env` do backend.
