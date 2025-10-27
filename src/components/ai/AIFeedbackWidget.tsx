import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';

interface AIFeedbackWidgetProps {
  planContext: string;
  planType?: string;
  planContent?: string | object;
  onFeedbackSubmitted?: () => void;
}

export const AIFeedbackWidget: React.FC<AIFeedbackWidgetProps> = ({
  planContext,
  planType,
  planContent,
  onFeedbackSubmitted,
}) => {
  const { submitAIFeedback } = useAppContext();
  const { toast } = useToast();
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: 'Avaliação necessária',
        description: 'Por favor, selecione uma avaliação de 1 a 5 estrelas.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const serializedContent =
        typeof planContent === 'string' ? planContent : JSON.stringify(planContent);

      await submitAIFeedback({
        planContext,
        planType,
        planContent: serializedContent,
        rating,
        feedbackText: feedbackText.trim() || undefined,
      });

      setIsSubmitted(true);

      toast({
        title: 'Feedback enviado!',
        description: 'Obrigado por avaliar este plano. Sua opinião nos ajuda a melhorar!',
      });

      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }

      setTimeout(() => {
        setIsSubmitted(false);
        setRating(0);
        setFeedbackText('');
      }, 3000);
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      toast({
        title: 'Erro ao enviar feedback',
        description: 'Não foi possível enviar seu feedback. Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
    >
      <AnimatePresence mode="wait">
        {isSubmitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 py-4"
          >
            <Check className="w-6 h-6" />
            <span className="font-medium">Feedback enviado com sucesso!</span>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Como você avaliaria este plano?
                </h4>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110 focus:outline-none"
                      disabled={isSubmitting}
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'fill-yellow-400 stroke-yellow-500'
                            : 'fill-none stroke-gray-300 dark:stroke-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="feedback-text"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1"
                >
                  Comentários (opcional)
                </label>
                <Textarea
                  id="feedback-text"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Compartilhe sua experiência com este plano. O que funcionou? O que poderia melhorar?"
                  className="resize-none"
                  rows={3}
                  disabled={isSubmitting}
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                  {feedbackText.length}/500
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0}
                className="w-full bg-fitness-primary hover:bg-fitness-primary/90"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
