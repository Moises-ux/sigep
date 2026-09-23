/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Search,
  ShieldAlert,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { cadastrarNovoUsuarioPorAdmin } from "../services/firebase";
import { getSetores } from "../services/setoresService";
import { getUsuarios, salvarPerfilUsuario } from "../services/usuariosService";
import type { Role, Setor, Usuario } from "../types";

export const AdminUsuariosPage: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleToggleStatus = async (usuario: Usuario) => {
    try {
      await salvarPerfilUsuario(usuario.id, {
        nome: usuario.nome,
        email: usuario.email,
        papel: usuario.papel,
        setor_id: usuario.setor_id,
        telefone: usuario.telefone,
        ativo: !usuario.ativo,
      });
      await carregarDados();
    } catch (err) {
      console.error("Erro ao alterar status:", err);
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
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Administrador
          </span>
        );
      case "supervisor":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Supervisor TI
          </span>
        );
      case "tecnico":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Técnico TI
          </span>
        );
      case "solicitante":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Solicitante (Setor)
          </span>
        );
    }
  };

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-base font-semibold text-white">Gestão de Usuários</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Painel administrativo para controle de contas e atribuição de
            perfis.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setFormSuccess(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2.5 rounded-lg shadow-lg hover:shadow-blue-600/20 transition-all text-sm shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Usuário</span>
        </button>
      </div>

      {formSuccess && (
        <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-sm rounded-lg p-4 flex items-center justify-between">
          <span>{formSuccess}</span>
          <button
            onClick={() => setFormSuccess(null)}
            className="text-emerald-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center items-center text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span>Carregando lista de usuários...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 uppercase text-xs font-semibold tracking-wider border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3">Nome / E-mail</th>
                  <th className="px-6 py-3">Perfil</th>
                  <th className="px-6 py-3">Setor</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-slate-400"
                    >
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-750 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{u.nome}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </td>
                      <td className="px-6 py-4">{getRoleBadge(u.papel)}</td>
                      <td className="px-6 py-4 text-slate-300">
                        {getSetorNome(u.setor_id)}
                      </td>
                      <td className="px-6 py-4">
                        {u.ativo ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <CheckCircle className="w-3.5 h-3.5" /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                            <XCircle className="w-3.5 h-3.5" /> Inativo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                            u.ativo
                              ? "border-red-700/60 text-red-400 hover:bg-red-950/40"
                              : "border-emerald-700/60 text-emerald-400 hover:bg-emerald-950/40"
                          }`}
                        >
                          {u.ativo ? "Desativar" : "Ativar"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" /> Cadastrar Novo
                Usuário
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-lg p-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCadastrar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    E-mail Institucional
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@prefeitura.gov.br"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Senha Provisória
                  </label>
                  <div className="relative">
                    <input
                      type={showSenha ? "text" : "password"}
                      required
                      minLength={6}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-3 pr-9 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSenha(!showSenha)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
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
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Perfil de Acesso
                  </label>
                  <select
                    value={papel}
                    onChange={(e) => setPapel(e.target.value as Role)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="solicitante">Solicitante (Setor)</option>
                    <option value="tecnico">Técnico de TI</option>
                    <option value="supervisor">Supervisor de TI</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Setor de Lotação
                  </label>
                  <select
                    value={setorId}
                    onChange={(e) => setSetorId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
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
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Telefone / Ramal (Opcional)
                </label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(83) 99999-9999"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Cadastrando...</span>
                    </>
                  ) : (
                    <span>Confirmar Cadastro</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
