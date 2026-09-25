/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Edit2,
  Filter,
  HardDrive,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  atualizarEquipamento,
  criarEquipamento,
  excluirEquipamento,
  getEquipamentos,
} from "../services/equipamentosService";
import { getSetores } from "../services/setoresService";
import type { Equipamento, EquipamentoStatus, Setor } from "../types";

export const EquipamentosPage: React.FC = () => {
  const { usuarioData } = useAuth();
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSetorFiltro, setSelectedSetorFiltro] = useState<string>("TODOS");
  const [selectedTipoFiltro, setSelectedTipoFiltro] = useState<string>("TODOS");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patrimonio, setPatrimonio] = useState("");
  const [tipo, setTipo] = useState("Computador");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [setorId, setSetorId] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit & Delete state
  const [editingEquipamento, setEditingEquipamento] = useState<Equipamento | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Equipamento | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit form fields
  const [editPatrimonio, setEditPatrimonio] = useState("");
  const [editTipo, setEditTipo] = useState("Computador");
  const [editMarca, setEditMarca] = useState("");
  const [editModelo, setEditModelo] = useState("");
  const [editNumeroSerie, setEditNumeroSerie] = useState("");
  const [editSetorId, setEditSetorId] = useState("");
  const [editStatus, setEditStatus] = useState<string>("operacional");
  const [editDataAlocacao, setEditDataAlocacao] = useState<string>("");

  const getNowLocalISO = () => {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const parseDateToISOString = (val: any): string => {
    if (!val) return getNowLocalISO();
    let d: Date | null = null;
    if (typeof val?.toDate === "function") {
      d = val.toDate();
    } else if (val?.seconds) {
      d = new Date(val.seconds * 1000);
    } else if (val instanceof Date) {
      d = val;
    } else if (typeof val === "string" || typeof val === "number") {
      d = new Date(val);
    }
    if (!d || isNaN(d.getTime())) return getNowLocalISO();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [listEq, listSet] = await Promise.all([
        getEquipamentos(),
        getSetores(),
      ]);

      let mergedSetores = [...listSet];
      const almoxIndex = mergedSetores.findIndex(
        (s) =>
          s.id === "setor-almoxarifado" ||
          s.sigla.toUpperCase() === "ALMOX" ||
          s.nome.toLowerCase().includes("almoxarifado")
      );

      if (almoxIndex === -1) {
        const almoxDefault: Setor = {
          id: "setor-almoxarifado",
          nome: "Almoxarifado",
          sigla: "ALMOX",
          secretaria: "Secretaria de Administração",
        };
        mergedSetores.push(almoxDefault);
      }

      setEquipamentos(listEq);
      setSetores(mergedSetores);
      if (mergedSetores.length > 0 && !setorId) {
        setSetorId(mergedSetores[0].id);
      }
    } catch (err) {
      console.error("Erro ao carregar equipamentos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleCadastrarEquipamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await criarEquipamento({
        patrimonio: patrimonio.trim(),
        tipo,
        marca: marca.trim(),
        modelo: modelo.trim(),
        numero_serie: numeroSerie.trim(),
        setor_id: setorId,
        data_alocacao: new Date(),
        status: "operacional",
        observacoes: observacoes.trim(),
        cadastrado_por_id: usuarioData?.id,
        cadastrado_por_nome: usuarioData?.nome || "Sistema",
      });

      setPatrimonio("");
      setMarca("");
      setModelo("");
      setNumeroSerie("");
      setObservacoes("");
      setIsModalOpen(false);
      await carregarDados();
    } catch (err) {
      console.error("Erro ao cadastrar equipamento:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (eq: Equipamento) => {
    setEditingEquipamento(eq);
    setEditPatrimonio(eq.patrimonio || "");
    setEditTipo(eq.tipo);
    setEditMarca(eq.marca);
    setEditModelo(eq.modelo);
    setEditNumeroSerie(eq.numero_serie || "");
    setEditSetorId(eq.setor_id);
    setEditStatus(eq.status);
    setEditDataAlocacao(parseDateToISOString(eq.data_alocacao));
    setIsEditModalOpen(true);
  };

  const handleEditSetorChange = (newSetorId: string) => {
    setEditSetorId(newSetorId);
    if (editingEquipamento && newSetorId !== editingEquipamento.setor_id) {
      setEditDataAlocacao(getNowLocalISO());
    }
  };

  const handleEditarEquipamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEquipamento) return;
    setSubmitting(true);
    try {
      const sectorChanged = editSetorId !== editingEquipamento.setor_id;

      const payload: Partial<Omit<Equipamento, "id" | "criado_em">> = {
        patrimonio: editPatrimonio.trim(),
        tipo: editTipo,
        marca: editMarca.trim(),
        modelo: editModelo.trim(),
        numero_serie: editNumeroSerie.trim(),
        setor_id: editSetorId,
        status: editStatus as any,
      };

      if (sectorChanged) {
        payload.setor_anterior = editingEquipamento.setor_id;
        payload.data_alocacao = editDataAlocacao
          ? new Date(editDataAlocacao)
          : new Date();
      } else if (editDataAlocacao) {
        payload.data_alocacao = new Date(editDataAlocacao);
      }

      await atualizarEquipamento(editingEquipamento.id, payload);
      setIsEditModalOpen(false);
      setEditingEquipamento(null);
      await carregarDados();
    } catch (err) {
      console.error("Erro ao editar equipamento:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteAlert = (eq: Equipamento) => {
    setDeleteTarget(eq);
    setIsDeleteAlertOpen(true);
  };

  const handleExcluirEquipamento = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await excluirEquipamento(deleteTarget.id);
      setIsDeleteAlertOpen(false);
      setDeleteTarget(null);
      await carregarDados();
    } catch (err) {
      console.error("Erro ao excluir equipamento:", err);
    } finally {
      setDeleting(false);
    }
  };

  const getSetorNome = (id?: string) => {
    if (!id) return "Sem setor";
    const s = setores.find((item) => item.id === id);
    return s ? `${s.sigla} - ${s.nome}` : id;
  };

  const formatDateTime = (val?: any) => {
    if (!val) return "—";
    let d: Date | null = null;
    if (typeof val?.toDate === "function") {
      d = val.toDate();
    } else if (val?.seconds) {
      d = new Date(val.seconds * 1000);
    } else if (val instanceof Date) {
      d = val;
    } else if (typeof val === "string" || typeof val === "number") {
      d = new Date(val);
    }
    if (!d || isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (st: EquipamentoStatus) => {
    switch (st) {
      case "operacional":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Operacional
          </span>
        );
      case "em_manutencao":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Em Manutenção
          </span>
        );
      case "baixado":
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
            Baixado
          </span>
        );
    }
  };

  const TIPOS_EQUIPAMENTO_PADRAO = [
    "Computador",
    "Notebook",
    "Impressora",
    "Monitor",
    "Nobreak",
    "Mouse",
    "Teclado",
    "HD/SSD",
    "Filtro de Linha",
    "Tinta/Toner",
    "Fonte de Alimentação",
  ];

  const getTypePluralLabel = (t: string) => {
    switch (t) {
      case "Computador":
        return "Computadores";
      case "Notebook":
        return "Notebooks";
      case "Impressora":
        return "Impressoras";
      case "Monitor":
        return "Monitores";
      case "Nobreak":
        return "Nobreaks";
      case "Mouse":
        return "Mouses";
      case "Teclado":
        return "Teclados";
      case "HD/SSD":
        return "HDs / SSDs";
      case "Filtro de Linha":
        return "Filtros de Linha";
      case "Tinta/Toner":
        return "Tintas / Toners";
      case "Fonte de Alimentação":
        return "Fontes de Alimentação";
      default:
        return t;
    }
  };

  const tipologias = Array.from(
    new Set([...TIPOS_EQUIPAMENTO_PADRAO, ...equipamentos.map((e) => e.tipo)])
  ).filter(Boolean);

  const equipamentosFiltrados = equipamentos.filter((e) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (e.patrimonio || "").toLowerCase().includes(term) ||
      e.marca.toLowerCase().includes(term) ||
      e.modelo.toLowerCase().includes(term) ||
      e.tipo.toLowerCase().includes(term);

    const matchesSetor =
      selectedSetorFiltro === "TODOS" || e.setor_id === selectedSetorFiltro;

    const matchesTipo =
      selectedTipoFiltro === "TODOS" || e.tipo === selectedTipoFiltro;

    return matchesSearch && matchesSetor && matchesTipo;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <HardDrive className="w-6 h-6" />
            </div>
            <h1 className="text-base font-semibold text-white">
              Inventário de Equipamentos
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Gestão de computadores, impressoras e periféricos alocados nos
            setores.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2.5 rounded-lg shadow-lg hover:shadow-blue-600/20 transition-all text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Equipamento</span>
        </button>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-0 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por patrimônio, marca, modelo ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 min-w-0">
            {/* Filtro de Setor */}
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 border border-slate-700 rounded-lg min-w-0 flex-1 sm:flex-none">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap shrink-0">
                Setor:
              </span>
              <select
                value={selectedSetorFiltro}
                onChange={(e) => setSelectedSetorFiltro(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer min-w-0 flex-1 w-full sm:w-auto sm:max-w-[220px] truncate"
              >
                <option value="TODOS" className="bg-slate-900 text-slate-200">
                  Todos os Setores
                </option>
                {setores.map((s) => (
                  <option
                    key={s.id}
                    value={s.id}
                    className="bg-slate-900 text-slate-200"
                  >
                    {s.sigla} - {s.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de Tipo de Equipamento */}
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 border border-slate-700 rounded-lg min-w-0 flex-1 sm:flex-none">
              <HardDrive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap shrink-0">
                Tipo:
              </span>
              <select
                value={selectedTipoFiltro}
                onChange={(e) => setSelectedTipoFiltro(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer min-w-0 flex-1 w-full sm:w-auto sm:max-w-[220px] truncate"
              >
                <option value="TODOS" className="bg-slate-900 text-slate-200">
                  Todos os Tipos ({equipamentos.filter(e => selectedSetorFiltro === "TODOS" || e.setor_id === selectedSetorFiltro).length})
                </option>
                {tipologias.map((t) => {
                  const count = equipamentos.filter((e) => {
                    const matchesSetor =
                      selectedSetorFiltro === "TODOS" || e.setor_id === selectedSetorFiltro;
                    return matchesSetor && e.tipo === t;
                  }).length;

                  return (
                    <option
                      key={t}
                      value={t}
                      className="bg-slate-900 text-slate-200"
                    >
                      {getTypePluralLabel(t)} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center items-center text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span>Carregando equipamentos...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-slate-400 uppercase text-xs font-semibold border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3">Patrimônio</th>
                  <th className="px-6 py-3">Tipo / Descrição</th>
                  <th className="px-6 py-3">Setor Atual</th>
                  <th className="px-6 py-3">Cadastrado Por / Data</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {equipamentosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-slate-400"
                    >
                      Nenhum equipamento encontrado.
                    </td>
                  </tr>
                ) : (
                  equipamentosFiltrados.map((eq) => (
                    <tr
                      key={eq.id}
                      className="hover:bg-slate-750 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-white font-mono">
                        {eq.patrimonio || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-200">
                          {eq.tipo} - {eq.marca} {eq.modelo}
                        </div>
                        {eq.numero_serie && (
                          <div className="text-xs text-slate-400 font-mono">
                            S/N: {eq.numero_serie}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        <div className="font-medium text-slate-200">
                          {getSetorNome(eq.setor_id)}
                        </div>
                        {eq.setor_anterior && (
                          <div className="text-xs text-amber-400/90 font-mono mt-0.5 flex items-center gap-1">
                            <span className="text-slate-500">Anterior:</span>
                            <span>{getSetorNome(eq.setor_anterior)}</span>
                          </div>
                        )}
                        {eq.data_alocacao && (
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            Alocado em: {formatDateTime(eq.data_alocacao)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-300">
                        <div className="font-medium text-slate-200">
                          {eq.cadastrado_por_nome || "Sistema"}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {formatDateTime(eq.criado_em)}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(eq.status)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(eq)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                            title="Editar equipamento"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteAlert(eq)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Excluir equipamento"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-blue-400" /> Cadastrar
                Equipamento
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCadastrarEquipamento} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Nº Tombamento / Patrimônio (Opcional)
                </label>
                <input
                  type="text"
                  value={patrimonio}
                  onChange={(e) => setPatrimonio(e.target.value)}
                  placeholder="Ex: PAT-2026-102"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Tipo
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Computador">Computador</option>
                    <option value="Notebook">Notebook</option>
                    <option value="Impressora">Impressora</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Nobreak">Nobreak</option>
                    <option value="Mouse">Mouse</option>
                    <option value="Teclado">Teclado</option>
                    <option value="HD/SSD">HD / SSD</option>
                    <option value="Filtro de Linha">Filtro de Linha</option>
                    <option value="Tinta/Toner">Tinta / Toner</option>
                    <option value="Fonte de Alimentação">Fonte de Alimentação</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    required
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    placeholder="Ex: Dell, HP"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Modelo
                  </label>
                  <input
                    type="text"
                    required
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    placeholder="Ex: Optiplex 3080"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Nº de Série (Opcional)
                  </label>
                  <input
                    type="text"
                    value={numeroSerie}
                    onChange={(e) => setNumeroSerie(e.target.value)}
                    placeholder="Ex: BR109283"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Setor Alocado
                </label>
                <select
                  value={setorId}
                  onChange={(e) => setSetorId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {setores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.sigla} - {s.nome}
                    </option>
                  ))}
                </select>
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
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Salvar Equipamento</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingEquipamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-400" /> Editar
                Equipamento
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingEquipamento(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditarEquipamento} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Nº Tombamento / Patrimônio (Opcional)
                </label>
                <input
                  type="text"
                  value={editPatrimonio}
                  onChange={(e) => setEditPatrimonio(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Tipo
                  </label>
                  <select
                    value={editTipo}
                    onChange={(e) => setEditTipo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Computador">Computador</option>
                    <option value="Notebook">Notebook</option>
                    <option value="Impressora">Impressora</option>
                    <option value="Monitor">Monitor</option>
                    <option value="Nobreak">Nobreak</option>
                    <option value="Mouse">Mouse</option>
                    <option value="Teclado">Teclado</option>
                    <option value="HD/SSD">HD / SSD</option>
                    <option value="Filtro de Linha">Filtro de Linha</option>
                    <option value="Tinta/Toner">Tinta / Toner</option>
                    <option value="Fonte de Alimentação">Fonte de Alimentação</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Marca
                  </label>
                  <input
                    type="text"
                    required
                    value={editMarca}
                    onChange={(e) => setEditMarca(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Modelo
                  </label>
                  <input
                    type="text"
                    required
                    value={editModelo}
                    onChange={(e) => setEditModelo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Nº de Série (Opcional)
                  </label>
                  <input
                    type="text"
                    value={editNumeroSerie}
                    onChange={(e) => setEditNumeroSerie(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Setor Alocado
                  </label>
                  <select
                    value={editSetorId}
                    onChange={(e) => handleEditSetorChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {setores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.sigla} - {s.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="operacional">Operacional</option>
                    <option value="em_manutencao">Em Manutenção</option>
                    <option value="baixado">Baixado</option>
                  </select>
                </div>
              </div>

              {editingEquipamento && editSetorId !== editingEquipamento.setor_id && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-blue-200">
                    <ArrowRight className="w-3.5 h-3.5 text-blue-400" /> Alteração de Setor Detectada
                  </div>
                  <div>
                    Setor Anterior: <span className="font-mono text-slate-300">{getSetorNome(editingEquipamento.setor_id)}</span>
                  </div>
                  <div>
                    Novo Setor: <span className="font-mono text-emerald-400">{getSetorNome(editSetorId)}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    O setor anterior será salvo em <code className="text-amber-300 font-mono">setor_anterior</code> e a data de alocação será atualizada.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" /> Data de Alocação
                </label>
                <input
                  type="datetime-local"
                  value={editDataAlocacao}
                  onChange={(e) => setEditDataAlocacao(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Atualizada automaticamente ao alterar o setor, ou informe uma data específica.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingEquipamento(null);
                  }}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Salvar Alterações</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Alert Modal */}
      {isDeleteAlertOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 bg-red-500/10 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-base font-semibold text-white">
                Excluir Equipamento
              </h3>
              <p className="text-sm text-slate-400">
                Tem certeza que deseja excluir o equipamento{" "}
                <span className="font-bold text-white">
                  {deleteTarget.patrimonio}
                </span>
                ? Esta ação não pode ser desfeita.
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setIsDeleteAlertOpen(false);
                  setDeleteTarget(null);
                }}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-slate-600 rounded-lg hover:border-slate-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleExcluirEquipamento}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
