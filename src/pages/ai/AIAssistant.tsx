import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import FullScreenLayout from '@/components/layout/FullScreenLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Bot,
  ChevronLeft,
  Clock,
  History,
  Loader2,
  Menu,
  MessageCircle,
  Paperclip,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AIFeedbackWidget } from '@/components/ai/AIFeedbackWidget';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  planContent?: any;
  planContext?: string;
  planType?: string;
}

interface UnifiedAIResponse {
  success: boolean;
  response?: string;
  structuredData?: any;
  planType?: string;
  planContext?: string;
}

interface ConversationHistoryItem {
  id: number;
  mode: string;
  userMessage: string;
  aiResponse: string;
  metadata: string | null;
  createdAt: string;
}

const formatAttachmentPreview = (content: string) => {
  if (!content) return '';
  const normalized = content.replace(/\s+/g, ' ').trim();
  if (normalized.length === 0) return '';
  return `Analisar anexo: ${normalized.slice(0, 160)}${normalized.length > 160 ? '…' : ''}`;
};

const AIAssistant: React.FC = () => {
  const { askAIUnified, getAIMemory } = useAppContext();
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [attachmentContent, setAttachmentContent] = useState('');
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversationHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await getAIMemory(undefined, 50);
      if (response.data?.success && response.data?.memory) {
        setConversationHistory(response.data.memory);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o histórico de conversas.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadConversation = (item: ConversationHistoryItem) => {
    setMessages([]);
    addMessage(item.userMessage, 'user');
    
    try {
      const metadata = item.metadata ? JSON.parse(item.metadata) : {};
      addMessage(item.aiResponse, 'ai', {
        planContext: metadata.planContext,
        planType: metadata.planType,
      });
    } catch (error) {
      console.error('Erro ao parsear metadata:', error);
      addMessage(item.aiResponse, 'ai');
    }
    
    setShowSidebar(false);
  };

  const handleNewConversation = () => {
    setMessages([]);
    setCurrentMessage('');
    setAttachmentContent('');
    setShowAttachmentInput(false);
    setShowSidebar(false);
  };

  useEffect(() => {
    if (showSidebar && conversationHistory.length === 0 && !isLoadingHistory) {
      loadConversationHistory();
    }
  }, [showSidebar]);

  const addMessage = (
    content: string,
    type: 'user' | 'ai',
    options: {
      planContent?: any;
      planContext?: string;
      planType?: string;
    } = {}
  ): string => {
    const messageId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const newMessage: ChatMessage = {
      id: messageId,
      type,
      content,
      timestamp: new Date(),
      planContent: options.planContent,
      planContext: options.planContext,
      planType: options.planType,
    };

    setMessages((prev) => [...prev, newMessage]);
    return messageId;
  };

  const handleSendMessage = async () => {
    const trimmedMessage = currentMessage.trim();
    const trimmedAttachment = attachmentContent.trim();

    if (!trimmedMessage && !trimmedAttachment) {
      toast({
        title: 'Mensagem vazia',
        description: 'Digite uma mensagem ou adicione um anexo para análise.',
        variant: 'destructive',
      });
      return;
    }

    const messageToSend = trimmedMessage || 'Analisar anexo compartilhado.';
    const userPreview = trimmedMessage || formatAttachmentPreview(trimmedAttachment) || messageToSend;

    addMessage(userPreview, 'user');

    setIsLoading(true);
    try {
      const payload: { message: string; documentContent?: string } = { message: messageToSend };
      if (trimmedAttachment) {
        payload.documentContent = trimmedAttachment;
      }

      const response = await askAIUnified(payload);
      const result = response.data as UnifiedAIResponse;

      if (!result?.success) {
        throw new Error(result?.response || 'Erro ao processar a solicitação.');
      }

      addMessage(result.response || 'Não foi possível gerar uma resposta.', 'ai', {
        planContent: result.structuredData,
        planContext: result.planContext,
        planType: result.planType,
      });

      setCurrentMessage('');

      if (trimmedAttachment) {
        setAttachmentContent('');
        setShowAttachmentInput(false);
      }

      if (conversationHistory.length > 0) {
        loadConversationHistory();
      }
    } catch (error) {
      console.error('Erro ao processar solicitação unificada:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar sua solicitação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const formatConversationTitle = (message: string): string => {
    const trimmed = message.trim();
    if (trimmed.length <= 60) return trimmed;
    return `${trimmed.slice(0, 60)}...`;
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  const groupConversationsByDate = (conversations: ConversationHistoryItem[]) => {
    const groups: { [key: string]: ConversationHistoryItem[] } = {};
    
    conversations.forEach((conv) => {
      const date = new Date(conv.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let groupKey: string;
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Hoje';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Ontem';
      } else {
        groupKey = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(conv);
    });
    
    return groups;
  };

  const canSend = Boolean(currentMessage.trim() || attachmentContent.trim());
  const inputPlaceholder = 'Faça uma pergunta ou peça uma orientação personalizada.';
  const groupedHistory = groupConversationsByDate(conversationHistory);

  const renderSidebarContent = () => (
    <div className="flex h-full w-80 flex-col">
      <div className="border-b bg-gray-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <History className="h-5 w-5" />
            Conversas
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadConversationHistory}
              disabled={isLoadingHistory}
              title="Recarregar histórico"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar(false)}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          onClick={handleNewConversation}
          className="w-full bg-fitness-primary hover:bg-fitness-primary/90"
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Conversa
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-fitness-primary" />
          </div>
        ) : conversationHistory.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            <MessageCircle className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p>Nenhuma conversa ainda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedHistory).map(([dateGroup, conversations]) => (
              <div key={dateGroup}>
                <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-gray-500">
                  {dateGroup}
                </h3>
                <div className="space-y-1">
                  {conversations.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadConversation(item)}
                      className="w-full rounded-lg border border-transparent p-3 text-left transition hover:border-fitness-primary/20 hover:bg-fitness-primary/5"
                    >
                      <div className="flex items-start gap-2">
                        <MessageCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-fitness-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {formatConversationTitle(item.userMessage)}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{formatRelativeTime(item.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <FullScreenLayout
      topbar={(
        <div className="h-14 w-full border-b bg-white/90 backdrop-blur">
          <div className="flex h-full w-full items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar((prev) => !prev)}
                className="inline-flex items-center gap-2 text-gray-600 transition hover:text-gray-900"
              >
                {showSidebar ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                <span className="hidden sm:inline">Histórico</span>
              </Button>
              <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-600 transition hover:text-gray-900">
                <ChevronLeft className="h-5 w-5" />
                <span className="hidden sm:inline">Voltar</span>
              </Link>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-fitness-primary" />
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900">Assistente Inteligente</span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Sparkles className="h-3 w-3 text-fitness-primary" />
                    IA personalizada para fitness
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    >
      <div className="relative flex h-full w-full overflow-hidden">
        {/* Mobile sidebar overlay */}
        {showSidebar && (
          <div className="absolute inset-0 z-30 flex lg:hidden">
            <div className="h-full flex-shrink-0 bg-white shadow-xl">
              {renderSidebarContent()}
            </div>
            <div className="flex-1 bg-black/20" onClick={() => setShowSidebar(false)} />
          </div>
        )}

        {/* Desktop sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: showSidebar ? 320 : 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="hidden h-full flex-shrink-0 overflow-hidden border-r bg-white shadow-lg lg:flex"
          style={{ pointerEvents: showSidebar ? 'auto' : 'none' }}
        >
          {renderSidebarContent()}
        </motion.aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex-1 min-h-0 w-full overflow-hidden rounded-2xl border bg-gray-50">
            <div className="flex h-full flex-col">
              <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="max-w-lg text-center text-gray-500">
                      <Bot className="mx-auto mb-6 h-16 w-16 text-gray-300" />
                      <h2 className="mb-3 text-2xl font-bold text-gray-900">Olá! Estou aqui para acompanhar sua evolução.</h2>
                      <p className="mb-6 text-gray-600">
                        Compartilhe dúvidas, rotinas ou registros do seu dia. Vou analisar o histórico das suas conversas e sugerir o próximo melhor passo para seus treinos, alimentação e bem-estar.
                      </p>
                      <div className="space-y-3 text-sm">
                        <div className="rounded-xl border bg-white p-3 text-left">
                          <p className="font-medium text-gray-900">Contexto contínuo</p>
                          <p className="text-xs text-gray-500">Reviso conversas anteriores para manter o acompanhamento personalizado.</p>
                        </div>
                        <div className="rounded-xl border bg-white p-3 text-left">
                          <p className="font-medium text-gray-900">Recomendações práticas</p>
                          <p className="text-xs text-gray-500">Respostas focadas em ações concretas para o que você precisa agora.</p>
                        </div>
                        <div className="rounded-xl border bg-white p-3 text-left">
                          <p className="font-medium text-gray-900">Anexos inteligentes</p>
                          <p className="text-xs text-gray-500">Envie exames, fotos ou relatórios e receba insights contextualizados.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`flex gap-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.type === 'ai' && (
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-fitness-primary">
                            <Bot className="h-6 w-6 text-white" />
                          </div>
                        )}
                        <div className={`max-w-[75%] ${message.type === 'user' ? 'order-first' : ''}`}>
                          <div
                            className={`rounded-2xl px-6 py-4 shadow-sm transition ${
                              message.type === 'user'
                                ? 'ml-auto bg-fitness-primary text-white'
                                : 'bg-white text-gray-900'
                            }`}
                          >
                            {message.type === 'ai' ? (
                              <div className="prose prose-sm max-w-none text-base leading-relaxed prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                              </div>
                            ) : (
                              <div className="whitespace-pre-wrap text-base leading-relaxed">{message.content}</div>
                            )}
                          </div>
                          <div className={`mt-2 text-xs text-gray-500 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                          {message.type === 'ai' && message.planContext && message.planType && (
                            <div className="mt-3">
                              <AIFeedbackWidget
                                planContext={message.planContext}
                                planType={message.planType}
                                planContent={message.planContent}
                              />
                            </div>
                          )}
                        </div>
                        {message.type === 'user' && (
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-300">
                            <User className="h-6 w-6 text-gray-600" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-4"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-fitness-primary">
                          <Bot className="h-6 w-6 text-white" />
                        </div>
                        <div className="rounded-2xl bg-white px-6 py-4 shadow-sm">
                          <div className="flex items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin text-fitness-primary" />
                            <span className="text-base text-gray-600">Pensando...</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t bg-white/95 px-4 py-4 shadow-[0_-12px_24px_-24px_rgba(15,23,42,0.35)] sm:px-6">
            <div className="flex items-center justify-between pb-3">
              <p className="hidden text-xs text-gray-500 sm:block">
                Faça perguntas sobre treino, nutrição ou saúde de forma natural.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAttachmentInput((prev) => !prev)}
                className="inline-flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900"
              >
                <Paperclip className="h-4 w-4" />
                {showAttachmentInput ? 'Ocultar anexo' : 'Adicionar anexo'}
              </Button>
            </div>

            {showAttachmentInput && (
              <div className="mb-4">
                <Label htmlFor="attachment-content" className="text-sm font-medium text-gray-700">
                  Anexo (foto, documento, etc.)
                </Label>
                <Textarea
                  id="attachment-content"
                  value={attachmentContent}
                  onChange={(event) => setAttachmentContent(event.target.value)}
                  placeholder="Cole aqui o conteúdo do seu anexo, como exames, fotos de refeições, treinos, etc."
                  className="mt-2 min-h-[140px] resize-none border-gray-300 focus:border-fitness-primary focus:ring-fitness-primary"
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="flex items-end gap-3">
              <Textarea
                value={currentMessage}
                onChange={(event) => setCurrentMessage(event.target.value)}
                placeholder={inputPlaceholder}
                className="flex-1 resize-none border-gray-300 focus:border-fitness-primary focus:ring-fitness-primary"
                rows={3}
                disabled={isLoading}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !canSend}
                size="lg"
                className="h-auto rounded-xl bg-fitness-primary px-6 py-3 text-base font-semibold text-white transition hover:bg-fitness-primary/90"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-gray-500">Pressione Enter para enviar • Shift + Enter para quebrar linha</p>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearChat}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Limpar conversa
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </FullScreenLayout>
  );
};

export default AIAssistant;
