import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Smile, Meh, Frown, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { apiServices } from '@/services/api';
import { useAppContext } from '@/context/AppContext';

type FeedbackType = 'positive' | 'neutral' | 'negative' | null;

const UserFeedbackForm = () => {
  const { user } = useAppContext();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState<string>((user as { email?: string } | null)?.email || '');
  const [message, setMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(null);
  const [rating, setRating] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message || !feedbackType) {
      toast({
        title: "Erro no formulário",
        description: "Por favor, preencha a mensagem e selecione um sentimento.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Enviar feedback para a API
      await apiServices.submitFeedback({
        name: name || undefined,
        email: email || undefined,
        message,
        feedbackType,
        rating: rating > 0 ? rating : undefined
      });
      
      // Mostrar toast de sucesso
      toast({
        title: "Feedback enviado!",
        description: "Agradecemos sua opinião sobre o aplicativo.",
      });
      
      // Limpar formulário e mostrar mensagem de agradecimento
      setSubmitted(true);
    } catch (error: any) {
      console.error('Erro ao enviar feedback:', error);
      
      toast({
        title: "Erro ao enviar feedback",
        description: error.response?.data?.message || "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleReset = () => {
    setName(user?.name || '');
    setEmail((user as { email?: string } | null)?.email || '');
    setMessage('');
    setFeedbackType(null);
    setRating(0);
    setSubmitted(false);
  };
  
  if (submitted) {
    return (
      <Card className="bg-white rounded-lg shadow">
        <CardContent className="pt-6 text-center">
          <div className="mb-4">
            <Smile className="mx-auto h-12 w-12 text-purple-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">Obrigado pelo feedback!</h3>
          <p className="text-gray-600 mb-6">
            Sua opinião é muito importante para melhorarmos o aplicativo.
          </p>
          <Button onClick={handleReset} variant="outline">
            Enviar outro feedback
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Sua Opinião é Importante</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Nome {!user && "(opcional)"}
            </label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Seu nome"
              disabled={isSubmitting}
              aria-label="Nome para feedback"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email {!user && "(opcional)"}
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={isSubmitting}
              aria-label="Email para contato"
            />
          </div>
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-1">
              Mensagem *
            </label>
            <Textarea
              id="message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Como podemos melhorar o aplicativo?"
              rows={4}
              required
              disabled={isSubmitting}
              aria-label="Mensagem de feedback"
              aria-required="true"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Como você se sente em relação ao aplicativo? *
            </label>
            <div className="flex justify-center space-x-6">
              <Button
                type="button"
                variant={feedbackType === 'positive' ? 'default' : 'outline'}
                className={`flex flex-col items-center p-4 ${
                  feedbackType === 'positive' ? 'bg-purple-500 hover:bg-purple-600' : ''
                }`}
                onClick={() => setFeedbackType('positive')}
                disabled={isSubmitting}
                aria-label="Feedback positivo"
              >
                <Smile className="h-6 w-6 mb-1" />
                <span>Bom</span>
              </Button>
              
              <Button
                type="button"
                variant={feedbackType === 'neutral' ? 'default' : 'outline'}
                className={`flex flex-col items-center p-4 ${
                  feedbackType === 'neutral' ? 'bg-yellow-500 hover:bg-yellow-600' : ''
                }`}
                onClick={() => setFeedbackType('neutral')}
                disabled={isSubmitting}
                aria-label="Feedback neutro"
              >
                <Meh className="h-6 w-6 mb-1" />
                <span>Neutro</span>
              </Button>
              
              <Button
                type="button"
                variant={feedbackType === 'negative' ? 'default' : 'outline'}
                className={`flex flex-col items-center p-4 ${
                  feedbackType === 'negative' ? 'bg-red-500 hover:bg-red-600' : ''
                }`}
                onClick={() => setFeedbackType('negative')}
                disabled={isSubmitting}
                aria-label="Feedback negativo"
              >
                <Frown className="h-6 w-6 mb-1" />
                <span>Ruim</span>
              </Button>
            </div>
          </div>
          
          {/* Rating stars opcional */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Avaliação (opcional)
            </label>
            <div className="flex justify-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`text-2xl ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  } hover:text-yellow-400 transition-colors`}
                  onClick={() => setRating(star)}
                  disabled={isSubmitting}
                  aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>
        </form>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleSubmit}
          className="w-full bg-fitness-primary hover:bg-fitness-primary/90"
          disabled={isSubmitting || !message || !feedbackType}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" /> Enviar Feedback
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UserFeedbackForm;
