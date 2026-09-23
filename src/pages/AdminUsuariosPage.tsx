/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Search,
  ShieldAlert,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

import { cadastrarNovoUsuarioPorAdmin } from "../services/firebase";
import { getSetores } from "../services/setoresService";
import {
  deletarUsuario,
  getUsuarios,
  salvarPerfilUsuario,
} from "../services/usuariosService";
import type { Role, Setor, Usuario } from "../types";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const AdminUsuariosPage: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal de Cadastro
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [papel, setPapel] = useState<Role>("solicitante");
  const [setorId, setSetorId] = useState("");
  const [telefone, setTelefone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Modal de Edição
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<Usuario | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPapel, setEditPapel] = useState<Role>("solicitante");
  const [editSetorId, setEditSetorId] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editAtivo, setEditAtivo] = useState(true);

  // Modais de Alerta e Confirmação
  const [confirmarEdicaoModal, setConfirmarEdicaoModal] = useState(false);
  const [usuarioParaDesativar, setUsuarioParaDesativar] = useState<Usuario | null>(null);
  const [usuarioParaAtivar, setUsuarioParaAtivar] = useState<Usuario | null>(null);
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<Usuario | null>(null);
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const carregarDados = async () => {
    try {
      const [listaUsuarios, listaSetores] = await Promise.all([
        getUsuarios(),
        getSetores(),
      ]);
      setUsuarios(listaUsuarios);
      setSetores(listaSetores);
      if (listaSetores.length > 0) {
        setSetorId((prev) => prev || listaSetores[0].id);
      }
    } catch (err) {
      console.error("Erro ao carregar lista de usuários/setores:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([getUsuarios(), getSetores()])
      .then(([listaUsuarios, listaSetores]) => {
        if (!active) return;
        setUsuarios(listaUsuarios);
        setSetores(listaSetores);
        if (listaSetores.length > 0) {
          setSetorId((prev) => prev || listaSetores[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar lista de usuários/setores:", err);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleAbrirEdicao = (u: Usuario) => {
    setUsuarioEmEdicao(u);
    setEditNome(u.nome);
    setEditEmail(u.email);
    setEditPapel(u.papel);
    setEditSetorId(u.setor_id);
    setEditTelefone(u.telefone || "");
    setEditAtivo(u.ativo);
  };

  const handleCadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      await cadastrarNovoUsuarioPorAdmin(
        email.trim(),
        senha,
        nome.trim(),
        papel,
        setorId,
        telefone.trim()
      );

      setFormSuccess("Usuário cadastrado com sucesso!");
      setNome("");
      setEmail("");
      setSenha("");
      setTelefone("");
      setIsModalOpen(false);
      await carregarDados();
    } catch (err: any) {
      console.error("Erro ao cadastrar usuário:", err);
      if (err.code === "auth/email-already-in-use") {
        setFormError("Este e-mail já está em uso por outra conta.");
      } else if (err.code === "auth/weak-password") {
        setFormError("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setFormError(err.message || "Erro ao criar usuário.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSalvarEdicao = async () => {
    if (!usuarioEmEdicao) return;
    setSubmittingStatus(true);
    try {
      await salvarPerfilUsuario(usuarioEmEdicao.id, {
        nome: editNome.trim(),
        email: editEmail.trim(),
        papel: editPapel,
        setor_id: editSetorId,
        telefone: editTelefone.trim(),
        ativo: editAtivo,
      });

      setConfirmarEdicaoModal(false);
      setUsuarioEmEdicao(null);
      setFormSuccess(`Perfil do usuário "${editNome}" atualizado com sucesso!`);
      await carregarDados();
    } catch (err) {
      console.error("Erro ao atualizar perfil do usuário:", err);
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleConfirmarExclusao = async () => {
    if (!usuarioParaExcluir) return;
    setSubmittingStatus(true);
    try {
      await deletarUsuario(usuarioParaExcluir.id);
      setFormSuccess(`Usuário "${usuarioParaExcluir.nome}" excluído com sucesso!`);
      setUsuarioParaExcluir(null);
      if (usuarioEmEdicao?.id === usuarioParaExcluir.id) {
        setUsuarioEmEdicao(null);
      }
      await carregarDados();
    } catch (err) {
      console.error("Erro ao excluir usuário:", err);
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleConfirmarDesativacao = async () => {
    if (!usuarioParaDesativar) return;
    setSubmittingStatus(true);
    try {
      await salvarPerfilUsuario(usuarioParaDesativar.id, {
        nome: usuarioParaDesativar.nome,
        email: usuarioParaDesativar.email,
        papel: usuarioParaDesativar.papel,
        setor_id: usuarioParaDesativar.setor_id,
        telefone: usuarioParaDesativar.telefone,
        ativo: false,
      });
      setUsuarioParaDesativar(null);
      await carregarDados();
    } catch (err) {
      console.error("Erro ao desativar usuário:", err);
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleConfirmarAtivacao = async () => {
    if (!usuarioParaAtivar) return;
    setSubmittingStatus(true);
    try {
      await salvarPerfilUsuario(usuarioParaAtivar.id, {
        nome: usuarioParaAtivar.nome,
        email: usuarioParaAtivar.email,
        papel: usuarioParaAtivar.papel,
        setor_id: usuarioParaAtivar.setor_id,
        telefone: usuarioParaAtivar.telefone,
        ativo: true,
      });
      setUsuarioParaAtivar(null);
      await carregarDados();
    } catch (err) {
      console.error("Erro ao ativar usuário:", err);
    } finally {
      setSubmittingStatus(false);
    }
  };

  const getSetorNome = (id: string) => {
    const s = setores.find((item) => item.id === id);
    return s ? `${s.sigla} - ${s.nome}` : "Sem setor";
  };

  const getRoleBadge = (r: Role) => {
    switch (r) {
      case "admin":
        return (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 font-semibold">
            Administrador
          </Badge>
        );
      case "supervisor":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 font-semibold">
            Supervisor TI
          </Badge>
        );
      case "tecnico":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-semibold">
            Técnico TI
          </Badge>
        );
      case "solicitante":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-semibold">
            Solicitante (Setor)
          </Badge>
        );
    }
  };

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho de Gestão de Usuários */}
      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground m-0">
                  Gestão de Usuários
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5 m-0">
                  Painel administrativo para controle de contas e atribuição de perfis.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => {
              setFormError(null);
              setFormSuccess(null);
              setIsModalOpen(true);
            }}
            className="gap-2 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Usuário</span>
          </Button>
        </CardContent>
      </Card>

      {formSuccess && (
        <Card className="border-emerald-500/20 bg-emerald-500/10">
          <CardContent className="p-4 flex items-center justify-between text-xs font-medium text-emerald-400">
            <span>{formSuccess}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFormSuccess(null)}
              className="h-6 w-6 p-0 text-emerald-400 hover:text-white"
            >
              ✕
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Usuários */}
      <Card>
        <CardHeader className="px-6 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold">Lista de Usuários</CardTitle>
            <CardDescription className="text-xs">
              Total de {usuariosFiltrados.length} contas cadastradas no sistema
            </CardDescription>
          </div>

          <div className="relative flex-1 max-w-md w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <Input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs font-mono"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center items-center text-muted-foreground gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs font-medium">Carregando lista de usuários...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome / E-mail</TableHead>
                  <TableHead className="w-[180px]">Perfil</TableHead>
                  <TableHead className="min-w-[200px]">Setor</TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead className="text-right w-[180px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuariosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-xs">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  usuariosFiltrados.map((u) => (
                    <TableRow key={u.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="font-semibold text-foreground text-xs">{u.nome}</div>
                        <div className="text-xs text-muted-foreground font-mono">{u.email}</div>
                      </TableCell>
                      <TableCell>{getRoleBadge(u.papel)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-normal">
                        {getSetorNome(u.setor_id)}
                      </TableCell>
                      <TableCell>
                        {u.ativo ? (
                          <Badge variant="outline" className="gap-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-medium text-xs">
                            <CheckCircle className="w-3.5 h-3.5" /> Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1.5 bg-red-500/10 text-red-400 border-red-500/20 font-medium text-xs">
                            <XCircle className="w-3.5 h-3.5" /> Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAbrirEdicao(u)}
                            className="h-8 px-2.5 gap-1 text-xs"
                            title="Editar Usuário"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </Button>

                          {u.ativo ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setUsuarioParaDesativar(u)}
                              className="h-8 text-xs font-medium"
                            >
                              Desativar
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setUsuarioParaAtivar(u)}
                              className="h-8 text-xs font-medium border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                            >
                              Ativar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Cadastro de Novo Usuário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <Card className="max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2 m-0">
                <UserPlus className="w-5 h-5 text-primary" /> Cadastrar Novo Usuário
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>

            {formError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg p-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-destructive" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCadastrar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Nome Completo
                </label>
                <Input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    E-mail Institucional
                  </label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@prefeitura.gov.br"
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Senha Provisória
                  </label>
                  <div className="relative">
                    <Input
                      type={showSenha ? "text" : "password"}
                      required
                      minLength={6}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="pr-9 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSenha(!showSenha)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                      title={showSenha ? "Ocultar senha" : "Exibir senha"}
                    >
                      {showSenha ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Perfil de Acesso
                  </label>
                  <select
                    value={papel}
                    onChange={(e) => setPapel(e.target.value as Role)}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus:ring-2 focus:ring-ring outline-none font-medium cursor-pointer"
                  >
                    <option value="solicitante">Solicitante (Setor)</option>
                    <option value="tecnico">Técnico de TI</option>
                    <option value="supervisor">Supervisor de TI</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Setor de Lotação
                  </label>
                  <select
                    value={setorId}
                    onChange={(e) => setSetorId(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus:ring-2 focus:ring-ring outline-none font-medium cursor-pointer"
                  >
                    {setores.length === 0 ? (
                      <option value="">Nenhum setor cadastrado</option>
                    ) : (
                      setores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.sigla} - {s.nome}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Telefone / Ramal (Opcional)
                </label>
                <Input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(83) 99999-9999"
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Cadastrando...</span>
                    </>
                  ) : (
                    <span>Confirmar Cadastro</span>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal de Edição de Usuário */}
      {usuarioEmEdicao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <Card className="max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-foreground m-0">Editar Usuário</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setUsuarioEmEdicao(null)}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setConfirmarEdicaoModal(true);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Nome Completo
                </label>
                <Input
                  type="text"
                  required
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  E-mail Institucional
                </label>
                <Input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Perfil de Acesso
                  </label>
                  <select
                    value={editPapel}
                    onChange={(e) => setEditPapel(e.target.value as Role)}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus:ring-2 focus:ring-ring outline-none font-medium cursor-pointer"
                  >
                    <option value="solicitante">Solicitante (Setor)</option>
                    <option value="tecnico">Técnico de TI</option>
                    <option value="supervisor">Supervisor de TI</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Setor de Lotação
                  </label>
                  <select
                    value={editSetorId}
                    onChange={(e) => setEditSetorId(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus:ring-2 focus:ring-ring outline-none font-medium cursor-pointer"
                  >
                    {setores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.sigla} - {s.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Telefone / Ramal
                  </label>
                  <Input
                    type="text"
                    value={editTelefone}
                    onChange={(e) => setEditTelefone(e.target.value)}
                    placeholder="(83) 99999-9999"
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Status da Conta
                  </label>
                  <select
                    value={editAtivo ? "true" : "false"}
                    onChange={(e) => setEditAtivo(e.target.value === "true")}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs text-foreground focus:ring-2 focus:ring-ring outline-none font-medium cursor-pointer"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setUsuarioParaExcluir(usuarioEmEdicao)}
                  className="gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Usuário</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setUsuarioEmEdicao(null)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" className="gap-1.5">
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Salvar Alterações</span>
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal de Alerta: Confirmação de Edição */}
      {confirmarEdicaoModal && usuarioEmEdicao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <Card className="max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Pencil className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground m-0">Confirmar Edição</h3>
                <p className="text-xs text-muted-foreground mt-0.5 m-0">Confirmação de alteração de perfil</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed m-0">
              Deseja salvar as alterações no perfil do usuário <strong className="text-foreground font-semibold">{editNome}</strong> (<span className="font-mono text-foreground">{editEmail}</span>)?
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmarEdicaoModal(false)}
                disabled={submittingStatus}
              >
                Voltar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSalvarEdicao}
                disabled={submittingStatus}
                className="gap-2"
              >
                {submittingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Confirmar e Salvar</span>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Alerta: Confirmação de Exclusão */}
      {usuarioParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <Card className="max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-destructive m-0">Excluir Usuário</h3>
                <p className="text-xs text-muted-foreground mt-0.5 m-0">Ação irreversível de exclusão</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed m-0">
              Tem certeza que deseja excluir permanentemente o usuário <strong className="text-foreground font-semibold">{usuarioParaExcluir.nome}</strong> (<span className="font-mono text-foreground">{usuarioParaExcluir.email}</span>)?
            </p>
            <p className="text-xs text-destructive font-medium leading-relaxed m-0">
              Esta ação removerá o registro do usuário e não poderá ser desfeita.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setUsuarioParaExcluir(null)}
                disabled={submittingStatus}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleConfirmarExclusao}
                disabled={submittingStatus}
                className="gap-2"
              >
                {submittingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <span>Excluir Definitivamente</span>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Confirmação de Desativação de Usuário */}
      {usuarioParaDesativar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <Card className="max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground m-0">Confirmar Desativação</h3>
                <p className="text-xs text-muted-foreground mt-0.5 m-0">Ação de desativação de conta</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed m-0">
              Tem certeza que deseja desativar o usuário <strong className="text-foreground font-semibold">{usuarioParaDesativar.nome}</strong> (<span className="font-mono text-foreground">{usuarioParaDesativar.email}</span>)?
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed m-0">
              O usuário perderá imediatamente o acesso ao sistema até que sua conta seja reativada por um administrador.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setUsuarioParaDesativar(null)}
                disabled={submittingStatus}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleConfirmarDesativacao}
                disabled={submittingStatus}
                className="gap-2"
              >
                {submittingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Desativando...</span>
                  </>
                ) : (
                  <span>Confirmar Desativação</span>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Confirmação de Ativação de Usuário */}
      {usuarioParaAtivar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <Card className="max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground m-0">Confirmar Ativação</h3>
                <p className="text-xs text-muted-foreground mt-0.5 m-0">Reativação de conta de usuário</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed m-0">
              Tem certeza que deseja reativar a conta do usuário <strong className="text-foreground font-semibold">{usuarioParaAtivar.nome}</strong> (<span className="font-mono text-foreground">{usuarioParaAtivar.email}</span>)?
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed m-0">
              Ao reativar, o usuário voltará a ter permissão de login e acesso às funcionalidades do sistema.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setUsuarioParaAtivar(null)}
                disabled={submittingStatus}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmarAtivacao}
                disabled={submittingStatus}
                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
              >
                {submittingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Ativando...</span>
                  </>
                ) : (
                  <span>Confirmar Ativação</span>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
