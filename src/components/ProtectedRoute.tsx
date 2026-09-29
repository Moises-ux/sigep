import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { currentUser, usuarioData, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const isPendingFirstAccess =
    usuarioData?.primeiro_acesso &&
    ['supervisor', 'tecnico', 'solicitante'].includes(usuarioData.papel);

  // Redireciona forçadamente para a troca de senha no primeiro acesso
  if (isPendingFirstAccess && location.pathname !== '/alterar-senha-primeiro-acesso') {
    return <Navigate to="/alterar-senha-primeiro-acesso" replace />;
  }

  // Redireciona para o dashboard se tentar acessar a rota de troca de senha sem pendência
  if (!isPendingFirstAccess && location.pathname === '/alterar-senha-primeiro-acesso') {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && usuarioData && !allowedRoles.includes(usuarioData.papel)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
