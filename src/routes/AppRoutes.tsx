import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { MainLayout } from '../layouts/MainLayout';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { NovaOSPage } from '../pages/NovaOSPage';
import { CheckInCheckOutPage } from '../pages/CheckInCheckOutPage';
import { EquipamentosPage } from '../pages/EquipamentosPage';
import { AdminUsuariosPage } from '../pages/AdminUsuariosPage';
import { AdminSetoresPage } from '../pages/AdminSetoresPage';
import { AdminAssistenciasPage } from '../pages/AdminAssistenciasPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Rota Pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rotas Protegidas no MainLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Acessível por todos os perfis autenticados */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Técnico, Supervisor & Admin */}
          <Route element={<ProtectedRoute allowedRoles={['tecnico', 'supervisor', 'admin']} />}>
            <Route path="/os/nova" element={<NovaOSPage />} />
          </Route>

          {/* Técnico, Supervisor & Admin */}
          <Route element={<ProtectedRoute allowedRoles={['tecnico', 'supervisor', 'admin']} />}>
            <Route path="/os/checkin-checkout" element={<CheckInCheckOutPage />} />
          </Route>

          {/* Técnico, Supervisor & Admin */}
          <Route element={<ProtectedRoute allowedRoles={['tecnico', 'supervisor', 'admin']} />}>
            <Route path="/equipamentos" element={<EquipamentosPage />} />
          </Route>

          {/* Exclusivo do Administrador */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />
            <Route path="/admin/setores" element={<AdminSetoresPage />} />
            <Route path="/admin/assistencias" element={<AdminAssistenciasPage />} />
          </Route>
        </Route>
      </Route>

      {/* Redirecionamento Padrão */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
