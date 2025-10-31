# Funcionalidade: Sidebar de Histórico de Conversas no AI Assistant

## Descrição

Foi implementada uma sidebar lateral no componente `AIAssistant.tsx` que permite ao usuário visualizar e acessar o histórico completo de conversas com o bot de IA.

## Funcionalidades Implementadas

### 1. **Backend**
- ✅ Endpoint já existente: `GET /api/ai/memory`
  - Retorna o histórico de conversas do usuário
  - Suporta filtros por modo (chat, workout, nutrition, health, document)
  - Limite configurável de resultados

### 2. **Frontend - Serviços e Context**
- ✅ Adicionado método `getAIMemory` no `api.ts`
- ✅ Adicionado método `getAIMemory` no `AppContext.tsx`

### 3. **UI/UX - Sidebar**

#### Características:
- **Toggle da Sidebar**: Botão no topbar para abrir/fechar
- **Design Responsivo**: 
  - Desktop: Sidebar lateral fixa (320px)
  - Mobile: Sidebar deslizante com overlay
- **Animação**: Transição suave usando Framer Motion
- **Botão Nova Conversa**: Limpa o chat atual e inicia uma nova conversa

#### Lista de Conversas:
- **Agrupamento por data**: Hoje, Ontem, ou data completa
- **Preview da mensagem**: Primeiras palavras da pergunta do usuário
- **Ícone do tipo**: Indica o modo da conversa (chat, workout, nutrition, etc)
- **Timestamp relativo**: "5 min atrás", "2h atrás", "Ontem"
- **Clique para carregar**: Ao clicar em uma conversa, carrega as mensagens

#### Funcionalidades Extras:
- **Recarregar histórico**: Botão para atualizar a lista
- **Estado de loading**: Indicador visual durante carregamento
- **Empty state**: Mensagem quando não há conversas
- **Auto-refresh**: Após enviar nova mensagem, recarrega o histórico

## Arquivos Modificados

1. **`/src/services/api.ts`**
   - Adicionado método `getAIMemory`

2. **`/src/context/AppContext.tsx`**
   - Adicionada interface para `getAIMemory`
   - Implementado método no context provider

3. **`/src/pages/ai/AIAssistant.tsx`**
   - Adicionados imports de ícones (History, Clock, Menu, X, Plus, RefreshCw)
   - Criada interface `ConversationHistoryItem`
   - Adicionados estados:
     - `showSidebar`: Controla visibilidade da sidebar
     - `conversationHistory`: Armazena histórico de conversas
     - `isLoadingHistory`: Estado de carregamento
   - Implementadas funções:
     - `loadConversationHistory()`: Busca histórico do backend
     - `loadConversation()`: Carrega conversa específica
     - `handleNewConversation()`: Inicia nova conversa
     - `formatConversationTitle()`: Formata título da conversa
     - `formatRelativeTime()`: Formata timestamp relativo
     - `groupConversationsByDate()`: Agrupa conversas por data
   - Adicionada UI da sidebar com:
     - Header com título e botões
     - Lista de conversas agrupadas
     - Estados de loading e empty

## Como Usar

1. **Abrir Histórico**: Clique no botão "Histórico" (ícone de menu) no topbar
2. **Navegar Conversas**: Role pela lista de conversas agrupadas por data
3. **Carregar Conversa**: Clique em qualquer conversa para visualizá-la
4. **Nova Conversa**: Clique em "Nova Conversa" para limpar o chat atual
5. **Atualizar**: Clique no ícone de refresh para recarregar a lista
6. **Fechar Sidebar**: Clique no X (mobile) ou fora da sidebar

## Tecnologias Utilizadas

- **React 18** com TypeScript
- **Framer Motion** para animações
- **Lucide React** para ícones
- **Tailwind CSS** para estilização
- **shadcn/ui** para componentes base (Button)

## Próximas Melhorias Sugeridas

1. **Busca no histórico**: Campo de busca para filtrar conversas
2. **Filtro por tipo**: Botões para filtrar por modo (workout, nutrition, etc)
3. **Deletar conversa**: Opção para remover conversas do histórico
4. **Paginação**: Carregar mais conversas sob demanda
5. **Favoritos**: Marcar conversas importantes
6. **Exportar conversa**: Download em PDF/texto
7. **Compartilhar**: Compartilhar conversa específica

## Screenshots / Fluxo

```
[Menu Icon] -> [Sidebar Opens] -> [Conversas Agrupadas]
                                 -> [Click em Conversa]
                                 -> [Carrega Mensagens]
                                 -> [Nova Conversa] -> [Chat Limpo]
```

## Responsividade

- **Mobile (< 1024px)**: Sidebar absoluta com overlay escuro
- **Desktop (≥ 1024px)**: Sidebar lateral fixa, sem overlay

## Performance

- Histórico carregado sob demanda (só ao abrir sidebar pela primeira vez)
- Cache local do histórico (não recarrega a cada abertura)
- Botão manual de refresh para atualizar quando necessário
- Auto-refresh após enviar mensagem (se histórico já carregado)
