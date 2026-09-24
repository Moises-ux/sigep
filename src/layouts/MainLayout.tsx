import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  ArrowRightLeft,
  Building2,
  ChevronRight,
  HardDrive,
  LayoutDashboard,
  Loader2,
  LogOut,
  PlusCircle,
  ShieldCheck,
  User as UserIcon,
  Users,
  Wrench,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getSetorById } from "../services/setoresService";
import type { Role } from "../types";

const MainLayoutContent: React.FC = () => {
  const { usuarioData, signOutUser } = useAuth();
  const { setOpenMobile } = useSidebar();
  const [setorNome, setSetorNome] = useState<string>("");
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
      return () => {
        active = false;
      };
    }
  }, [usuarioData]);

  const handleConfirmLogout = async () => {
    setSubmittingLogout(true);
    try {
      await signOutUser();
      setShowLogoutModal(false);
      navigate("/login");
    } catch (err) {
      console.error("Erro ao encerrar sessão:", err);
    } finally {
      setSubmittingLogout(false);
    }
  };

  const getRoleLabel = (role?: Role) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "supervisor":
        return "Supervisor TI";
      case "tecnico":
        return "Técnico TI";
      case "solicitante":
        return "Solicitante (Setor)";
      default:
        return "Servidor";
    }
  };

  const isRole = (...roles: Role[]) => {
    return usuarioData?.papel && roles.includes(usuarioData.papel);
  };

  const handleNavClick = () => {
    setOpenMobile(false);
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/dashboard":
        return "Visão Geral & Ordens de Serviço";
      case "/os/nova":
        return "Nova Ordem de Serviço";
      case "/os/checkin-checkout":
        return "Check-in e Check-out Externo";
      case "/equipamentos":
        return "Inventário de Equipamentos";
      case "/admin/usuarios":
        return "Gestão de Usuários";
      case "/admin/setores":
        return "Gestão de Setores";
      case "/admin/assistencias":
        return "Gestão de Assistências Técnicas";
      default:
        return "Painel de Controle";
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground antialiased dark">
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Wrench className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-semibold font-mono">
                      SIGEP
                    </span>
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                      v1.0
                    </span>
                  </div>
                  <span className="truncate text-xs text-muted-foreground">
                    Prefeitura Municipal de Uruçuí
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-wider">
              Menu Principal
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={
                      <NavLink to="/dashboard" onClick={handleNavClick} />
                    }
                    isActive={location.pathname === "/dashboard"}
                    tooltip="Dashboard OS"
                  >
                    <LayoutDashboard />
                    <span>Dashboard OS</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {isRole("tecnico", "supervisor", "admin") && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={
                        <NavLink to="/os/nova" onClick={handleNavClick} />
                      }
                      isActive={location.pathname === "/os/nova"}
                      tooltip="Abrir Nova OS"
                    >
                      <PlusCircle className="text-blue-400" />
                      <span>Abrir Nova OS</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {isRole("tecnico", "supervisor", "admin") && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={
                        <NavLink
                          to="/os/checkin-checkout"
                          onClick={handleNavClick}
                        />
                      }
                      isActive={location.pathname === "/os/checkin-checkout"}
                      tooltip="Check-in / Check-out"
                    >
                      <ArrowRightLeft className="text-indigo-400" />
                      <span>Check-in / Check-out</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {isRole("tecnico", "supervisor", "admin") && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={
                        <NavLink to="/equipamentos" onClick={handleNavClick} />
                      }
                      isActive={location.pathname === "/equipamentos"}
                      tooltip="Equipamentos"
                    >
                      <HardDrive className="text-emerald-400" />
                      <span>Equipamentos</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {isRole("admin") && (
            <SidebarGroup>
              <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-wider">
                Administração
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={
                        <NavLink
                          to="/admin/usuarios"
                          onClick={handleNavClick}
                        />
                      }
                      isActive={location.pathname === "/admin/usuarios"}
                      tooltip="Gestão de Usuários"
                    >
                      <Users className="text-purple-400" />
                      <span>Gestão de Usuários</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={
                        <NavLink to="/admin/setores" onClick={handleNavClick} />
                      }
                      isActive={location.pathname === "/admin/setores"}
                      tooltip="Gestão de Setores"
                    >
                      <Building2 className="text-purple-400" />
                      <span>Gestão de Setores</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={
                        <NavLink
                          to="/admin/assistencias"
                          onClick={handleNavClick}
                        />
                      }
                      isActive={location.pathname === "/admin/assistencias"}
                      tooltip="Assistências Técnicas"
                    >
                      <Wrench className="text-indigo-400" />
                      <span>Assistências Técnicas</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                onClick={() => {
                  setOpenMobile(false);
                  setShowLogoutModal(true);
                }}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
                  <UserIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight truncate">
                  <span className="truncate font-semibold">
                    {usuarioData?.nome || "Servidor Logado"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {getRoleLabel(usuarioData?.papel)}{" "}
                    {setorNome ? `• ${setorNome}` : ""}
                  </span>
                </div>
                <LogOut className="ml-auto size-4 text-muted-foreground hover:text-destructive" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="flex flex-col flex-1 min-w-0">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-xs">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden sm:inline font-medium font-mono text-xs">
                SIGEP
              </span>
              <ChevronRight className="hidden sm:inline h-4 w-4" />
              <h1 className="text-sm font-semibold text-foreground tracking-tight m-0">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {usuarioData?.papel === "admin" && (
              <Badge
                variant="secondary"
                className="gap-1 font-mono text-[11px] text-purple-400 bg-purple-500/10 border-purple-500/20"
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Modo Admin
              </Badge>
            )}
            <div className="text-xs text-muted-foreground font-mono hidden md:block">
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "short",
                day: "2-digit",
                month: "short",
              })}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </SidebarInset>

      {/* Modal de Confirmação de Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Encerrar Sessão
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Confirmação de saída do sistema
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Tem certeza que deseja sair do{" "}
              <strong className="text-foreground font-mono">SIGEP</strong>?
              Você precisará informar suas credenciais novamente para acessar o
              painel.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                disabled={submittingLogout}
                className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                disabled={submittingLogout}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
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

export const MainLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <MainLayoutContent />
    </SidebarProvider>
  );
};
