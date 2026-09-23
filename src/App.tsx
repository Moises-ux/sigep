import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppRoutes } from './routes/AppRoutes';
import { TooltipProvider } from '@/components/ui/tooltip';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <AppRoutes />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
