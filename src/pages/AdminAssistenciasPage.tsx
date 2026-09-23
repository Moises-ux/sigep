/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import {
  AlertCircle,
  Building2,
  Edit2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  Wrench,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  atualizarAssistenciaTecnica,
  criarAssistenciaTecnica,
  excluirAssistenciaTecnica,
  getAssistenciasTecnicas,
} from "../services/assistenciasService";
import type { AssistenciaTecnica } from "../types";

export const AdminAssistenciasPage: React.FC = () => {
  const [assistencias, setAssistencias] = useState<AssistenciaTecnica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getAssistenciasTecnicas();
      setAssistencias(list);
    } catch (err: any) {
      console.error("Erro ao carregar assistências técnicas:", err);
      setError(err?.message || "Erro ao carregar lista de assistências.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setNome("");
    setTelefone("");
    setEmail("");
    setEndereco("");
    setAtivo(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: AssistenciaTecnica) => {
    setEditingId(item.id);
    setNome(item.nome);
    setTelefone(item.telefone);
    setEmail(item.email || "");
    setEndereco(item.endereco || "");
    setAtivo(item.ativo);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingId) {
        await atualizarAssistenciaTecnica(editingId, {
          nome: nome.trim(),
          telefone: telefone.trim(),
          email: email.trim(),
          endereco: endereco.trim(),
          ativo,
        });
      } else {
        await criarAssistenciaTecnica({
          nome: nome.trim(),
          telefone: telefone.trim(),
          email: email.trim(),
          endereco: endereco.trim(),
          ativo,
        });
      }

      setIsModalOpen(false);
      await carregarDados();
    } catch (err) {
      console.error("Erro ao salvar assistência técnica:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await excluirAssistenciaTecnica(id);
      await carregarDados();
    } catch (err) {
      console.error("Erro ao excluir assistência técnica:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const filtrados = assistencias.filter(
    (a) =>
      a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.telefone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.email && a.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Wrench className="w-6 h-6" />
            </div>
            <h1 className="text-base font-semibold text-white">
              Gestão de Assistências Técnicas
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Cadastro e gerenciamento das empresas parceiras para manutenção de equipamentos.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2.5 rounded-lg shadow-lg hover:shadow-blue-600/20 transition-all text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Assistência</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-900/60 text-red-300 text-xs rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-200">Erro ao carregar dados</p>
            <p className="text-red-300/80 text-[11px] mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center items-center text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span>Carregando assistências...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 uppercase text-xs font-semibold border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3">Empresa / Razão Social</th>
                  <th className="px-6 py-3">Telefone / Contato</th>
                  <th className="px-6 py-3">E-mail / Endereço</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filtrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-slate-400"
                    >
                      Nenhuma assistência técnica cadastrada.
                    </td>
                  </tr>
                ) : (
                  filtrados.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-750 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{item.nome}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-200 font-mono">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.telefone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-300">
                        {item.email && (
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{item.email}</span>
                          </div>
                        )}
                        {item.endereco && (
                          <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{item.endereco}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {item.ativo ? (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Ativa
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-700/50 text-slate-400 border border-slate-600">
                            Inativa
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            title="Editar"
                            className="p-1.5 text-slate-400 hover:text-blue-400 bg-slate-900 border border-slate-700 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            title="Excluir"
                            className="p-1.5 text-red-400 hover:text-red-300 bg-red-950/30 border border-red-900/40 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {deletingId === item.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Formulário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-400" />{" "}
                {editingId ? "Editar Assistência" : "Nova Assistência Técnica"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Nome da Empresa / Assistência *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Eletrônica & Informática Silva"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Telefone / Whatsapp *
                </label>
                <input
                  type="text"
                  required
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="Ex: (83) 98888-7777"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  E-mail de Contato (Opcional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@empresa.com"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Endereço (Opcional)
                </label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua Central, 123 - Centro"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="ativo" className="text-xs text-slate-300 cursor-pointer">
                  Empresa Ativa no Sistema
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Salvar</span>
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
