import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSetorById } from '../services/setoresService';
import { 
  Wrench, 
  LayoutDashboard, 
  PlusCircle, 
  ArrowRightLeft, 
  Users, 
  Building2, 
  HardDrive, 
  LogOut, 
  User as UserIcon,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  PanelLeft,
  Loader2
} from 'lucide-react';
import type { Role } from '../types';

export const MainLayout: React.FC = () => {
  const { usuarioData, signOutUser } = useAuth();
  const [setorNome, setSetorNome] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [submittingLogout, setSubmittingLogout] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (usuarioData?.setor_id) {
      let active = true;
      getSetorById(usuarioData.setor_id).then((s) => {
        if (active && s) setSetorNome(s.sigla);
      });
      return () => { active = false; };
    }
  }, [usuarioData]);

  const toggleSidebar = () => {
    setDesktopCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleConfirmLogout = async () => {
    setSubmittingLogout(true);
    try {
      await signOutUser();
      setShowLogoutModal(false);
      navigate('/login');
    } catch (err) {
      console.error('Erro ao encerrar sessão:', err);
    } finally {
      setSubmittingLogout(false);
    }
  };

  const getRoleLabel = (role?: Role) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'supervisor':
        return 'Supervisor TI';
      case 'tecnico':
        return 'Técnico TI';
      case 'solicitante':
        return 'Solicitante (Setor)';
      default:
        return 'Servidor';
    }
  };

  const isRole = (...roles: Role[]) => {
    return usuarioData?.papel && roles.includes(usuarioData.papel);
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Visão Geral & Ordens de Serviço';
      case '/os/nova':
        return 'Nova Ordem de Serviço';
      case '/os/checkin-checkout':
        return 'Check-in e Check-out Externo';
      case '/equipamentos':
        return 'Inventário de Equipamentos';
      case '/admin/usuarios':
        return 'Gestão de Usuários';
      case '/admin/setores':
        return 'Gestão de Setores';
      case '/admin/assistencias':
        return 'Gestão de Assistências Técnicas';
      default:
        return 'Painel de Controle';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-blue-500 selection:text-white">
      {/* Sidebar Lateral */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 bg-slate-900 border-r border-slate-800/80 flex flex-col transform transition-all duration-300 ease-in-out ${desktopCollapsed ? 'md:w-16' : 'md:w-64'} w-64 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Topo da Sidebar / Branding */}
        <div className={`p-4 border-b border-slate-800/80 flex items-center bg-slate-900/50 min-h-[65px] ${desktopCollapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 bg-blue-600/15 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400 shadow-inner shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            {!desktopCollapsed && (
              <div className="animate-fadeIn truncate">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-bold text-white tracking-wider text-sm font-mono">SIGEP-TI</h2>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">v2.0</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Prefeitura Municipal</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-white transition-colors ml-auto"
          >
            <X className="w-5 h-5" />
          </button>
          
          {!desktopCollapsed && (
            <button 
              onClick={toggleSidebar}
              className="hidden md:flex text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800 shrink-0"
              title="Recolher Menu (Show/Hide)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Menu de Navegação */}
        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {!desktopCollapsed && (
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-2 font-mono">
              Menu Principal
            </div>
          )}

          <NavLink
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            title="Dashboard OS"
            className={({ isActive }) =>
              `relative flex items-center rounded-xl text-xs font-medium transition-all ${
                desktopCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'
              } ${
                isActive
                  ? 'bg-slate-800 text-white font-semibold border border-slate-700/60 shadow-sm before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-blue-500 before:rounded-r-full'
                  : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4 text-slate-400 shrink-0" />
            {!desktopCollapsed && <span>Dashboard OS</span>}
          </NavLink>

          {isRole('tecnico', 'supervisor', 'admin') && (
            <NavLink
              to="/os/nova"
              onClick={() => setMobileMenuOpen(false)}
              title="Abrir Nova OS"
              className={({ isActive }) =>
                `relative flex items-center rounded-xl text-xs font-medium transition-all ${
                  desktopCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'
                } ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold border border-slate-700/60 shadow-sm before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-blue-500 before:rounded-r-full'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`
              }
            >
              <PlusCircle className="w-4 h-4 text-blue-400 shrink-0" />
              {!desktopCollapsed && <span>Abrir Nova OS</span>}
            </NavLink>
          )}

          {isRole('tecnico', 'supervisor', 'admin') && (
            <NavLink
              to="/os/checkin-checkout"
              onClick={() => setMobileMenuOpen(false)}
              title="Check-in / Check-out"
              className={({ isActive }) =>
                `relative flex items-center rounded-xl text-xs font-medium transition-all ${
                  desktopCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'
                } ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold border border-slate-700/60 shadow-sm before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-indigo-500 before:rounded-r-full'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`
              }
            >
              <ArrowRightLeft className="w-4 h-4 text-indigo-400 shrink-0" />
              {!desktopCollapsed && <span>Check-in / Check-out</span>}
            </NavLink>
          )}

          {isRole('tecnico', 'supervisor', 'admin') && (
            <NavLink
              to="/equipamentos"
              onClick={() => setMobileMenuOpen(false)}
              title="Equipamentos"
              className={({ isActive }) =>
                `relative flex items-center rounded-xl text-xs font-medium transition-all ${
                  desktopCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'
                } ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold border border-slate-700/60 shadow-sm before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-emerald-500 before:rounded-r-full'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`
              }
            >
              <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
              {!desktopCollapsed && <span>Equipamentos</span>}
            </NavLink>
          )}

          {isRole('admin') && (
            <>
              {!desktopCollapsed && (
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 pt-5 mb-2 font-mono">
                  Administração
                </div>
              )}
              <NavLink
                to="/admin/usuarios"
                onClick={() => setMobileMenuOpen(false)}
                title="Gestão de Usuários"
                className={({ isActive }) =>
                  `relative flex items-center rounded-xl text-xs font-medium transition-all ${
                    desktopCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'
                  } ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold border border-slate-700/60 shadow-sm before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-purple-500 before:rounded-r-full'
                      : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                  }`
                }
              >
                <Users className="w-4 h-4 text-purple-400 shrink-0" />
                {!desktopCollapsed && <span>Gestão de Usuários</span>}
              </NavLink>
              <NavLink
                to="/admin/setores"
                onClick={() => setMobileMenuOpen(false)}
                title="Gestão de Setores"
                className={({ isActive }) =>
                  `relative flex items-center rounded-xl text-xs font-medium transition-all ${
                    desktopCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'
                  } ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold border border-slate-700/60 shadow-sm before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-purple-500 before:rounded-r-full'
                      : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                  }`
                }
              >
                <Building2 className="w-4 h-4 text-purple-400 shrink-0" />
                {!desktopCollapsed && <span>Gestão de Setores</span>}
              </NavLink>
              <NavLink
                to="/admin/assistencias"
                onClick={() => setMobileMenuOpen(false)}
                title="Assistências Técnicas"
                className={({ isActive }) =>
                  `relative flex items-center rounded-xl text-xs font-medium transition-all ${
                    desktopCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'
                  } ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold border border-slate-700/60 shadow-sm before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-purple-500 before:rounded-r-full'
                      : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                  }`
                }
              >
                <Wrench className="w-4 h-4 text-indigo-400 shrink-0" />
                {!desktopCollapsed && <span>Assistências Técnicas</span>}
              </NavLink>
            </>
          )}
        </nav>

        {/* Rodapé da Sidebar / Card do Usuário */}
        <div className="p-2 border-t border-slate-800/80 bg-slate-900/60">
          {desktopCollapsed ? (
            <div className="flex flex-col items-center gap-2 py-1">
              <div 
                className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400"
                title={`${usuarioData?.nome || 'Servidor Logado'} (${getRoleLabel(usuarioData?.papel)})`}
              >
                <UserIcon className="w-4 h-4" />
              </div>
              <button
                onClick={() => setShowLogoutModal(true)}
                title="Encerrar Sessão"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-white truncate">
                    {usuarioData?.nome || 'Servidor Logado'}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="truncate">{getRoleLabel(usuarioData?.papel)}</span>
                    {setorNome && (
                      <>
                        <span>•</span>
                        <span className="font-mono font-semibold text-blue-400">{setorNome}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowLogoutModal(true)}
                title="Encerrar Sessão"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-1 shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Conteúdo Principal + Header Flutuante */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Superior estilo Glassmorphism */}
        <header className="sticky top-0 z-30 backdrop-blur-md bg-slate-900/80 border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={toggleSidebar}
              className="hidden md:flex items-center gap-1.5 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors border border-transparent hover:border-slate-700/60"
              title={desktopCollapsed ? "Expandir Menu Lateral" : "Recolher Menu Lateral"}
            >
              <PanelLeft className="w-4 h-4 text-slate-400" />
            </button>
            
            {/* Breadcrumb e Título */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="hidden sm:inline font-medium font-mono text-[11px]">SIGEP-TI</span>
              <ChevronRight className="hidden sm:inline w-3.5 h-3.5 text-slate-600" />
              <h1 className="text-sm font-semibold text-white tracking-tight">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          {/* Badges do Header */}
          <div className="flex items-center gap-3">
            {usuarioData?.papel === 'admin' && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full font-mono">
                <ShieldCheck className="w-3.5 h-3.5" /> Modo Admin
              </span>
            )}
            <button
              onClick={() => setShowLogoutModal(true)}
              className="md:hidden text-slate-400 hover:text-red-400"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <div className="text-xs text-slate-400 font-mono hidden md:block">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
            </div>
          </div>
        </header>

        {/* Área de Conteúdo */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Modal de Confirmação de Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Encerrar Sessão</h3>
                <p className="text-xs text-slate-400 mt-0.5">Confirmação de saída do sistema</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza que deseja sair do <strong className="text-white font-mono">SIGEP-TI</strong>? Você precisará informar suas credenciais novamente para acessar o painel.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={submittingLogout}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                disabled={submittingLogout}
                className="bg-red-600 hover:bg-red-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-lg shadow-red-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                {submittingLogout ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saindo...</span>
                  </>
                ) : (
                  <span>Confirmar e Sair</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
