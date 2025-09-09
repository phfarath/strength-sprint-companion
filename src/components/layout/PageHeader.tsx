import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }> | null;
  right?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, icon: Icon, right, className }) => {
  return (
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${className || ''}`}>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          {Icon ? <Icon className="w-6 h-6 text-fitness-primary" /> : null}
          {title}
        </h1>
        {description ? (
          <p className="text-sm md:text-base text-gray-600 mt-1">{description}</p>
        ) : null}
      </div>
      {right ? <div className="w-full md:w-auto">{right}</div> : null}
    </div>
  );
};

export default PageHeader;

