/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import { HardDrive, Loader2, Plus, Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  criarEquipamento,
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patrimonio, setPatrimonio] = useState("");
  const [tipo, setTipo] = useState("Computador");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [setorId, setSetorId] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [listEq, listSet] = await Promise.all([
        getEquipamentos(),
        getSetores(),
      ]);
      setEquipamentos(listEq);
      setSetores(listSet);
      if (listSet.length > 0 && !setorId) {
        setSetorId(listSet[0].id);
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

  const getSetorNome = (id: string) => {
    const s = setores.find((item) => item.id === id);
    return s ? `${s.sigla}` : "Sem setor";
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

  const equipamentosFiltrados = equipamentos.filter(
    (e) =>
      e.patrimonio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.modelo.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="p-4 border-b border-slate-700 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por nº de patrimônio, marca ou modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
                  <th className="px-6 py-3">Setor</th>
                  <th className="px-6 py-3">Cadastrado Por / Data</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {equipamentosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-slate-400"
                    >
                      Nenhum equipamento cadastrado.
                    </td>
                  </tr>
                ) : (
                  equipamentosFiltrados.map((eq) => (
                    <tr
                      key={eq.id}
                      className="hover:bg-slate-750 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-white font-mono">
                        {eq.patrimonio}
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
                        {getSetorNome(eq.setor_id)}
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
                  Nº Tombamento / Patrimônio
                </label>
                <input
                  type="text"
                  required
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
                    <option value="Outro">Outro</option>
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
                    Nº de Série
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
    </div>
  );
};
