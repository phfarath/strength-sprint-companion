
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Smile, Meh, Frown } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

type FeedbackType = 'positive' | 'neutral' | 'negative' | null;

const UserFeedbackForm = () => {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(null);
  const [submitted, setSubmitted] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message || !feedbackType) {
      toast({
        title: "Erro no formulário",
        description: "Por favor, preencha a mensagem e selecione um sentimento.",
        variant: "destructive"
      });
      return;
    }
    
    // Aqui você poderia enviar para um endpoint real
    // Por enquanto, apenas simular o envio
    console.log('Feedback enviado:', { name, message, feedbackType });
    
    // Mostrar toast de sucesso
    toast({
      title: "Feedback enviado!",
      description: "Agradecemos sua opinião sobre o aplicativo.",
    });
    
    // Limpar formulário e mostrar mensagem de agradecimento
    setSubmitted(true);
  };
  
  const handleReset = () => {
    setName('');
    setMessage('');
    setFeedbackType(null);
    setSubmitted(false);
  };
  
  if (submitted) {
    return (
      <Card className="bg-white rounded-lg shadow">
        <CardContent className="pt-6 text-center">
          <div className="mb-4">
            <Smile className="mx-auto h-12 w-12 text-green-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">Obrigado pelo feedback!</h3>
          <p className="text-gray-600 mb-6">
            Sua opinião é muito importante para melhorarmos o aplicativo.
          </p>
          <Button onClick={handleReset}>Enviar outro feedback</Button>
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
              Nome (opcional)
            </label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Seu nome"
              aria-label="Nome para feedback (opcional)"
            />
          </div>
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-1">
              Mensagem
            </label>
            <Textarea
              id="message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Como podemos melhorar o aplicativo?"
              rows={4}
              required
              aria-label="Mensagem de feedback"
              aria-required="true"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Como você se sente em relação ao aplicativo?
            </label>
            <div className="flex justify-center space-x-6">
              <Button
                type="button"
                variant={feedbackType === 'positive' ? 'default' : 'outline'}
                className={`flex flex-col items-center p-4 ${
                  feedbackType === 'positive' ? 'bg-green-500 hover:bg-green-600' : ''
                }`}
                onClick={() => setFeedbackType('positive')}
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
                aria-label="Feedback neutro"
              >
                <Meh className="h-6 w-6 mb-1" />
                <span>Regular</span>
              </Button>
              
              <Button
                type="button"
                variant={feedbackType === 'negative' ? 'default' : 'outline'}
                className={`flex flex-col items-center p-4 ${
                  feedbackType === 'negative' ? 'bg-red-500 hover:bg-red-600' : ''
                }`}
                onClick={() => setFeedbackType('negative')}
                aria-label="Feedback negativo"
              >
                <Frown className="h-6 w-6 mb-1" />
                <span>Ruim</span>
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit}
          className="w-full bg-fitness-primary hover:bg-fitness-primary/90"
        >
          <Send className="mr-2 h-4 w-4" /> Enviar Feedback
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UserFeedbackForm;
