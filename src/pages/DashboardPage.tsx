/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  CheckSquare,
  Clock,
  Eye,
  FileText,
  HardDrive,
  Inbox,
  Loader2,
  Search,
  UserCheck,
  Wrench,
  XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { OSStepper } from "../components/OSStepper";
import { SkeletonTable } from "../components/SkeletonLoader";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../contexts/AuthContext";
import {
  cancelarOS,
  confirmarRecebimento,
  getOrdensServico,
  getOrdensServicoBySetor,
} from "../services/osService";
import { getSetores } from "../services/setoresService";
import type { OrdemServico, Setor } from "../types";

export const DashboardPage: React.FC = () => {
  const { usuarioData } = useAuth();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);

  const [statusFiltro, setStatusFiltro] = useState<string>("TODOS");
  const [searchTerm, setSearchTerm] = useState("");

  const [osSelecionada, setOsSelecionada] = useState<OrdemServico | null>(null);

  const [osParaReceber, setOsParaReceber] = useState<OrdemServico | null>(null);
  const [obsRecebimento, setObsRecebimento] = useState("");
  const [submittingRecebimento, setSubmittingRecebimento] = useState(false);

  const [osParaCancelar, setOsParaCancelar] = useState<OrdemServico | null>(
    null
  );
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [submittingCancelamento, setSubmittingCancelamento] = useState(false);

  const carregarDados = async () => {
    try {
      let osList: OrdemServico[] = [];

      if (usuarioData?.papel === "solicitante" && usuarioData.setor_id) {
        osList = await getOrdensServicoBySetor(usuarioData.setor_id);
      } else {
        osList = await getOrdensServico();
      }

      const listSet = await getSetores();

      setOrdens(osList);
      setSetores(listSet);
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (usuarioData) {
      carregarDados();
    }
  }, [usuarioData]);

  const handleConfirmarRecebimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!osParaReceber || !usuarioData) return;

    setSubmittingRecebimento(true);
    try {
      await confirmarRecebimento({
        osId: osParaReceber.id,
        equipamentoId: osParaReceber.equipamento.id,
        funcionarioId: usuarioData.id,
        funcionarioNome: usuarioData.nome,
        observacoes: obsRecebimento.trim(),
      });

      setOsParaReceber(null);
      setObsRecebimento("");
      await carregarDados();
    } catch (err) {
      console.error("Erro ao confirmar recebimento:", err);
    } finally {
      setSubmittingRecebimento(false);
    }
  };

  const handleCancelarOS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!osParaCancelar || !usuarioData) return;

    setSubmittingCancelamento(true);
    try {
      await cancelarOS({
        osId: osParaCancelar.id,
        equipamentoId: osParaCancelar.equipamento.id,
        usuarioId: usuarioData.id,
        usuarioNome: usuarioData.nome,
        motivo: motivoCancelamento.trim(),
      });

      setOsParaCancelar(null);
      setMotivoCancelamento("");
      await carregarDados();
    } catch (err) {
      console.error("Erro ao cancelar OS:", err);
    } finally {
      setSubmittingCancelamento(false);
    }
  };

  const getSetorInfo = (id: string) => {
    const s = setores.find((item) => item.id === id);
    return s ? `${s.sigla} - ${s.nome}` : "Setor não identificado";
  };

  const totalOS = ordens.length;
  const criadasOS = ordens.filter((o) => o.status === "CRIADA").length;
  const assistenciaOS = ordens.filter(
    (o) => o.status === "EM_ASSISTENCIA"
  ).length;
  const retornadasOS = ordens.filter((o) => o.status === "RETORNADA").length;
  const concluidasOS = ordens.filter((o) => o.status === "CONCLUIDA").length;

  const ordensFiltradas = ordens.filter((o) => {
    const atendeStatus = statusFiltro === "TODOS" || o.status === statusFiltro;
    const atendeBusca =
      o.numero_os.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.descricao_defeito.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.equipamento.patrimonio.toLowerCase().includes(searchTerm.toLowerCase());
    return atendeStatus && atendeBusca;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & KPI Cards */}
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Monitor de Assistência Técnica
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Acompanhamento em tempo real do ciclo de reparos dos equipamentos
              municipais.
            </p>
          </div>

          {usuarioData?.papel === "solicitante" && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 flex items-center gap-2.5 text-xs">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400">Setor Ativo:</span>
              <strong className="text-white font-mono">
                {getSetorInfo(usuarioData.setor_id)}
              </strong>
            </div>
          )}
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 space-y-2 hover:border-slate-700 transition-all shadow-sm group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Total de OS
              </span>
              <FileText className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </div>
            <div className="text-xl font-bold font-mono text-white tracking-tight">
              {totalOS}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-blue-500/20 rounded-2xl p-4 space-y-2 hover:border-blue-500/40 transition-all shadow-sm group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider font-mono">
                Criadas
              </span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold font-mono text-blue-400 tracking-tight">
              {criadasOS}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-amber-500/20 rounded-2xl p-4 space-y-2 hover:border-amber-500/40 transition-all shadow-sm group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider font-mono">
                Em Assistência
              </span>
              <Wrench className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-400 tracking-tight">
              {assistenciaOS}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-purple-500/20 rounded-2xl p-4 space-y-2 hover:border-purple-500/40 transition-all shadow-sm group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider font-mono">
                Retornadas
              </span>
              <AlertCircle className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold font-mono text-purple-300 tracking-tight">
              {retornadasOS}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-emerald-500/20 rounded-2xl p-4 space-y-2 hover:border-emerald-500/40 transition-all shadow-sm col-span-2 lg:col-span-1 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider font-mono">
                Concluídas
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 tracking-tight">
              {concluidasOS}
            </div>
          </div>
        </div>
      </div>

      {/* Controles de Filtros e Pesquisa */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Pesquisar por protocolo OS, patrimônio ou defeito..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 text-slate-200 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder:text-slate-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "TODOS", label: "Todos", count: totalOS },
            { id: "CRIADA", label: "Criadas", count: criadasOS },
            { id: "EM_ASSISTENCIA", label: "Em Reparo", count: assistenciaOS },
            { id: "RETORNADA", label: "Retornadas", count: retornadasOS },
            { id: "CONCLUIDA", label: "Concluídas", count: concluidasOS },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFiltro(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all flex items-center gap-1.5 ${
                statusFiltro === st.id
                  ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20"
                  : "bg-slate-950/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800/60"
              }`}
            >
              <span>{st.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  statusFiltro === st.id
                    ? "bg-blue-700 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {st.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Ordens de Serviço */}
      {loading ? (
        <SkeletonTable />
      ) : ordensFiltradas.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 bg-slate-850 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 shadow-inner">
            <Inbox className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              Nenhuma Ordem de Serviço Encontrada
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Não há registros com os filtros aplicados. Altere o termo de
              pesquisa ou selecione outro status.
            </p>
          </div>
          {statusFiltro !== "TODOS" && (
            <button
              onClick={() => setStatusFiltro("TODOS")}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {ordensFiltradas.map((os) => (
            <div
              key={os.id}
              className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl shadow-sm group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-sm font-bold text-white tracking-wider bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      {os.numero_os}
                    </span>
                    <StatusBadge status={os.status} />
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                      <strong className="text-slate-200">
                        {os.equipamento.tipo}
                      </strong>{" "}
                      {os.equipamento.marca} {os.equipamento.modelo}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium line-clamp-1">
                    Defeito:{" "}
                    <span className="text-slate-400 font-normal">
                      {os.descricao_defeito}
                    </span>
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono pt-1">
                    <span>
                      Patrimônio:{" "}
                      <strong className="text-slate-300">
                        {os.equipamento.patrimonio}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Setor:{" "}
                      <strong className="text-slate-300">
                        {getSetorInfo(os.equipamento.setor_id)}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/60 shrink-0">
                  <button
                    onClick={() => setOsSelecionada(os)}
                    className="p-2 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl transition-colors text-xs font-medium flex items-center gap-1.5"
                    title="Ver detalhes e histórico"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Detalhes</span>
                  </button>

                  {os.status === "RETORNADA" &&
                    (usuarioData?.papel === "solicitante" ||
                      usuarioData?.papel === "tecnico" ||
                      usuarioData?.papel === "admin") && (
                      <button
                        onClick={() => setOsParaReceber(os)}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 group/btn"
                      >
                        <CheckSquare className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        <span>Confirmar Aceite</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-80 group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    )}

                  {(os.status === "CRIADA" || os.status === "EM_ASSISTENCIA") &&
                    (usuarioData?.papel === "admin" ||
                      os.tecnico_id === usuarioData?.id) && (
                      <button
                        onClick={() => setOsParaCancelar(os)}
                        title="Cancelar OS"
                        className="p-2 text-red-400 hover:text-red-300 bg-red-950/30 border border-red-900/40 hover:bg-red-950/60 rounded-xl transition-colors text-xs font-medium"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal / Drawer de Detalhes da OS com Stepper */}
      {osSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-base font-bold text-white tracking-wider">
                    {osSelecionada.numero_os}
                  </span>
                  <StatusBadge status={osSelecionada.status} />
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {osSelecionada.equipamento.tipo}{" "}
                  {osSelecionada.equipamento.marca}{" "}
                  {osSelecionada.equipamento.modelo} (Patrimônio:{" "}
                  {osSelecionada.equipamento.patrimonio})
                </p>
              </div>
              <button
                onClick={() => setOsSelecionada(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <OSStepper os={osSelecionada} />
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-mono font-semibold text-slate-500">
                  Defeito Relatado
                </span>
                <p className="text-white text-sm font-medium">
                  {osSelecionada.descricao_defeito}
                </p>
                <p className="text-[11px] text-slate-400 pt-1">
                  Aberto por:{" "}
                  <strong className="text-slate-300">
                    {osSelecionada.tecnico_nome}
                  </strong>
                </p>
              </div>

              {osSelecionada.checkin && (
                <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
                  <span className="text-[10px] uppercase font-mono font-semibold text-amber-400">
                    Check-in (Envio para Assistência)
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Empresa:</span>{" "}
                      <strong className="text-white">
                        {osSelecionada.checkin.empresa_externa}
                      </strong>
                    </div>
                    {osSelecionada.checkin.contato && (
                      <div>
                        <span className="text-slate-500">Contato:</span>{" "}
                        {osSelecionada.checkin.contato}
                      </div>
                    )}
                    {osSelecionada.checkin.os_externa && (
                      <div>
                        <span className="text-slate-500">Nº OS Externa:</span>{" "}
                        {osSelecionada.checkin.os_externa}
                      </div>
                    )}
                    {osSelecionada.checkin.valor_orcamento && (
                      <div>
                        <span className="text-slate-500">Orçamento:</span> R${" "}
                        {osSelecionada.checkin.valor_orcamento.toFixed(2)}
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500">Supervisor:</span>{" "}
                      {osSelecionada.checkin.supervisor_nome}
                    </div>
                  </div>
                  {osSelecionada.checkin.laudo_tecnico && (
                    <p className="text-xs text-slate-300 mt-2 border-t border-amber-500/20 pt-2">
                      <strong className="text-amber-400">Laudo Técnico:</strong>{" "}
                      {osSelecionada.checkin.laudo_tecnico}
                    </p>
                  )}
                </div>
              )}

              {osSelecionada.checkout && (
                <div className="bg-slate-950 p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-2">
                  <span className="text-[10px] uppercase font-mono font-semibold text-purple-400">
                    Check-out (Retorno da Assistência)
                  </span>
                  <div className="text-xs text-slate-300">
                    <p>
                      <span className="text-slate-500">
                        Supervisor Responsável:
                      </span>{" "}
                      {osSelecionada.checkout.supervisor_nome}
                    </p>
                    {osSelecionada.checkout.observacoes && (
                      <p className="mt-1">
                        <span className="text-slate-500">Observações:</span>{" "}
                        {osSelecionada.checkout.observacoes}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {osSelecionada.aceite_funcionario && (
                <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                  <span className="text-[10px] uppercase font-mono font-semibold text-emerald-400">
                    Aceite e Conclusão pelo Setor
                  </span>
                  <div className="text-xs text-slate-300">
                    <p>
                      <span className="text-slate-500">
                        Servidor Responsável:
                      </span>{" "}
                      {osSelecionada.aceite_funcionario.funcionario_nome}
                    </p>
                    {osSelecionada.aceite_funcionario.observacoes && (
                      <p className="mt-1">
                        <span className="text-slate-500">Observações:</span>{" "}
                        {osSelecionada.aceite_funcionario.observacoes}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setOsSelecionada(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Recebimento */}
      {osParaReceber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" /> Confirmar
              Recebimento e Aceite
            </h3>
            <p className="text-xs text-slate-400">
              Você está confirmando que o equipamento da{" "}
              <strong className="text-white font-mono">
                {osParaReceber.numero_os}
              </strong>{" "}
              foi entregue e testado com sucesso no seu setor.
            </p>

            <form onSubmit={handleConfirmarRecebimento} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Observações do Aceite (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={obsRecebimento}
                  onChange={(e) => setObsRecebimento(e.target.value)}
                  placeholder="Ex: Equipamento testado e em pleno funcionamento."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setOsParaReceber(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingRecebimento}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-600/20"
                >
                  {submittingRecebimento ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Confirmar e Finalizar OS</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cancelamento */}
      {osParaCancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 text-red-400">
              <XCircle className="w-5 h-5" /> Cancelar Ordem de Serviço
            </h3>
            <p className="text-xs text-slate-400">
              Tem certeza que deseja cancelar a{" "}
              <strong className="text-white font-mono">
                {osParaCancelar.numero_os}
              </strong>
              ? O equipamento será devolvido ao status operacional.
            </p>

            <form onSubmit={handleCancelarOS} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Motivo do Cancelamento
                </label>
                <textarea
                  rows={3}
                  required
                  value={motivoCancelamento}
                  onChange={(e) => setMotivoCancelamento(e.target.value)}
                  placeholder="Informe o motivo..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setOsParaCancelar(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={submittingCancelamento}
                  className="bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-red-600/20"
                >
                  {submittingCancelamento ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Confirmar Cancelamento</span>
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
