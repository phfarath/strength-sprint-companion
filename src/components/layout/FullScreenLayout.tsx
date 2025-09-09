import React from 'react';
import { Toaster } from '@/components/ui/toaster';

interface FullScreenLayoutProps {
  topbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

// A lightweight layout that occupies the whole viewport
// and does not render the global Navbar. Useful for immersive
// experiences like the IA Assistant.
const FullScreenLayout: React.FC<FullScreenLayoutProps> = ({ topbar, children, className }) => {
  return (
    <div className={`h-screen w-full bg-gray-50 flex flex-col ${className || ''}`}>
      {topbar ? (
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
          {topbar}
        </div>
      ) : null}
      <div className="flex-1 min-h-0">
        {children}
      </div>
      <Toaster />
    </div>
  );
};

export default FullScreenLayout;

