import React from 'react';
import { Activity } from 'lucide-react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
}

const Logo: React.FC<LogoProps> = ({ size = 'medium' }) => {
  // Definir tamanhos com base na propriedade size
  const logoSizes = {
    small: {
      containerClass: "flex items-center",
      iconSize: 18,
      textClass: "text-lg font-bold ml-1"
    },
    medium: {
      containerClass: "flex items-center",
      iconSize: 24,
      textClass: "text-xl font-bold ml-2"
    },
    large: {
      containerClass: "flex items-center",
      iconSize: 32,
      textClass: "text-3xl font-bold ml-2"
    }
  };
  
  const { containerClass, iconSize, textClass } = logoSizes[size];
  
  return (
    <div className={containerClass}>
      <Activity size={iconSize} className="text-fitness-primary" />
      <span className={`${textClass} text-fitness-primary`}>
        Strength<span className="text-fitness-secondary">Sprint</span>
      </span>
    </div>
  );
};

export default Logo;