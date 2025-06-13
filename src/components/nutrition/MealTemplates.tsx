import React from "react";
import { Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

// Templates de refeições predefinidos
export const mealTemplates = [
  { 
    name: "Café da Manhã", 
    time: "07:00", 
    icon: "☕", 
    description: "Primeira refeição do dia" 
  },
  { 
    name: "Lanche da Manhã", 
    time: "10:00", 
    icon: "🍎", 
    description: "Pequeno lanche entre refeições" 
  },
  { 
    name: "Almoço", 
    time: "12:30", 
    icon: "🍽️", 
    description: "Refeição principal do dia" 
  },
  { 
    name: "Lanche da Tarde", 
    time: "15:30", 
    icon: "🥪", 
    description: "Lanche para manter a energia" 
  },
  { 
    name: "Jantar", 
    time: "19:00", 
    icon: "🍲", 
    description: "Última refeição principal" 
  },
  { 
    name: "Ceia", 
    time: "21:30", 
    icon: "🍵", 
    description: "Pequena refeição antes de dormir" 
  },
  { 
    name: "Pré-treino", 
    time: "16:00", 
    icon: "💪", 
    description: "Refeição antes de exercícios" 
  },
  { 
    name: "Pós-treino", 
    time: "18:30", 
    icon: "🏋️", 
    description: "Nutrição após exercícios" 
  },
  { 
    name: "Refeição Livre", 
    time: "", 
    icon: "✨", 
    description: "Personalize horário e conteúdo" 
  },
];

interface MealTemplatesProps {
  onSelectTemplate: (template: {name: string, time: string}) => void;
}

const MealTemplates: React.FC<MealTemplatesProps> = ({ onSelectTemplate }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-4">Selecione um tipo de refeição</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mealTemplates.map((template, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="cursor-pointer hover:border-fitness-secondary transition-colors"
              onClick={() => onSelectTemplate(template)}
            >
              <CardContent className="p-4 flex items-center space-x-3">
                <div className="text-2xl">{template.icon}</div>
                <div className="flex-1">
                  <h4 className="font-medium">{template.name}</h4>
                  <p className="text-sm text-gray-500">{template.description}</p>
                  {template.time && (
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{template.time}</span>
                    </div>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-fitness-secondary"
                >
                  <Plus size={18} />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MealTemplates;