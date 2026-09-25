import { ArrowLeftRight, CheckCircle, Loader2, ShieldAlert, Wrench } from "lucide-react";
import React, { useEffect, useState } from "react";
import { PriorityBadge } from "../components/PriorityBadge";
import { useAuth } from "../contexts/AuthContext";
import { getAssistenciasTecnicas } from "../services/assistenciasService";
import {
  getOrdensServicoByStatus,
  realizarCheckIn,
  realizarCheckOut,
} from "../services/osService";
import { getSetores } from "../services/setoresService";
import type { AssistenciaTecnica, OrdemServico, Setor } from "../types";

export const CheckInCheckOutPage: React.FC = () => {
  const { usuarioData } = useAuth();
  const isSupervisorOrAdmin =
    usuarioData?.papel === "supervisor" || usuarioData?.papel === "admin";
  const [activeTab, setActiveTab] = useState<"checkin" | "checkout">("checkin");

  const [osCriadas, setOsCriadas] = useState<OrdemServico[]>([]);
  const [osEmAssistencia, setOsEmAssistencia] = useState<OrdemServico[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [assistencias, setAssistencias] = useState<AssistenciaTecnica[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Check-in
  const [osCheckIn, setOsCheckIn] = useState<OrdemServico | null>(null);
  const [empresaExterna, setEmpresaExterna] = useState("");
  const [laudoTecnico, setLaudoTecnico] = useState("");
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);

  // Modal Check-out
  const [osCheckOut, setOsCheckOut] = useState<OrdemServico | null>(null);
  const [obsCheckOut, setObsCheckOut] = useState("");
  const [submittingCheckOut, setSubmittingCheckOut] = useState(false);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [criadas, assistencia, listSet, listAssist] = await Promise.all([
        getOrdensServicoByStatus("CRIADA"),
        getOrdensServicoByStatus("EM_ASSISTENCIA"),
        getSetores(),
        getAssistenciasTecnicas(),
      ]);

      setOsCriadas(criadas);
      setOsEmAssistencia(assistencia);
      setSetores(listSet);
      setAssistencias(listAssist.filter((a) => a.ativo));
    } catch (err) {
      console.error("Erro ao carregar OS para check-in/out:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleAbrirCheckInModal = (os: OrdemServico) => {
    setOsCheckIn(os);
    if (assistencias.length > 0) {
      setEmpresaExterna(assistencias[0].nome);
    } else {
      setEmpresaExterna("");
    }
    setLaudoTecnico("");
  };

  const handleConfirmarCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!osCheckIn || !usuarioData || !isSupervisorOrAdmin) return;

    setSubmittingCheckIn(true);
    try {
      await realizarCheckIn({
        osId: osCheckIn.id,
        supervisorId: usuarioData.id,
        supervisorNome: usuarioData.nome,
        empresaExterna: empresaExterna.trim(),
        laudoTecnico: laudoTecnico.trim(),
      });

      setOsCheckIn(null);
      setEmpresaExterna("");
      setLaudoTecnico("");
      await carregarDados();
    } catch (err) {
      console.error("Erro no Check-in:", err);
    } finally {
      setSubmittingCheckIn(false);
    }
  };

  const handleConfirmarCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!osCheckOut || !usuarioData || !isSupervisorOrAdmin) return;

    setSubmittingCheckOut(true);
    try {
      await realizarCheckOut({
        osId: osCheckOut.id,
        supervisorId: usuarioData.id,
        supervisorNome: usuarioData.nome,
        observacoes: obsCheckOut.trim(),
      });

      setOsCheckOut(null);
      setObsCheckOut("");
      await carregarDados();
    } catch (err) {
      console.error("Erro no Check-out:", err);
    } finally {
      setSubmittingCheckOut(false);
    }
  };

  const getSetorInfo = (id: string) => {
    const s = setores.find((item) => item.id === id);
    return s ? `${s.sigla}` : "Setor";
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">
                Controle de Check-in e Check-out
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Gestão de envio e retorno de equipamentos junto às empresas
                parceiras.
              </p>
            </div>
          </div>
          {!isSupervisorOrAdmin && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldAlert className="w-3.5 h-3.5" /> Modo Leitura
            </span>
          )}
        </div>

        {!isSupervisorOrAdmin && (
          <div className="mt-4 p-3 bg-slate-900/60 border border-slate-700/80 rounded-xl flex items-center gap-2.5 text-xs text-slate-300">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              Você está visualizando a listagem em <strong>modo leitura</strong>. Apenas Supervisores e Administradores podem realizar movimentações de Check-in e Check-out.
            </span>
          </div>
        )}

        <div className="flex gap-4 mt-6 border-b border-slate-700">
          <button
            onClick={() => setActiveTab("checkin")}
            className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === "checkin"
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Check-in (Envio para Assistência) [{osCriadas.length}]
          </button>
          <button
            onClick={() => setActiveTab("checkout")}
            className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === "checkout"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Check-out (Retorno da Assistência) [{osEmAssistencia.length}]
          </button>
        </div>
      </div>

      {activeTab === "checkin" && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center items-center text-slate-400 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <span>Carregando OS abertas...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/60 text-slate-400 uppercase text-xs font-semibold border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3">Número OS</th>
                    <th className="px-6 py-3">Prioridade</th>
                    <th className="px-6 py-3">Equipamento</th>
                    <th className="px-6 py-3">Setor Origem</th>
                    <th className="px-6 py-3">Defeito</th>
                    <th className="px-6 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {osCriadas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-slate-400"
                      >
                        Nenhuma OS aguardando envio para assistência técnica.
                      </td>
                    </tr>
                  ) : (
                    osCriadas.map((os) => (
                      <tr
                        key={os.id}
                        className="hover:bg-slate-750 transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-white font-mono">
                          {os.numero_os}
                        </td>
                        <td className="px-6 py-4">
                          <PriorityBadge prioridade={os.prioridade} size="sm" />
                        </td>
                        <td className="px-6 py-4">
                          {os.equipamento.tipo} {os.equipamento.marca}{" "}
                          {os.equipamento.modelo} (Pat:{" "}
                          {os.equipamento.patrimonio})
                        </td>
                        <td className="px-6 py-4">
                          {getSetorInfo(os.equipamento.setor_id)}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-300 max-w-xs truncate">
                          {os.descricao_defeito}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isSupervisorOrAdmin ? (
                            <button
                              onClick={() => handleAbrirCheckInModal(os)}
                              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition-all flex items-center gap-1.5 ml-auto"
                            >
                              <Wrench className="w-4 h-4" />
                              <span>Realizar Check-in</span>
                            </button>
                          ) : (
                            <span className="inline-block px-2.5 py-1 text-[11px] font-mono font-medium rounded-full bg-slate-900 text-slate-400 border border-slate-700">
                              Aguardando Check-in
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "checkout" && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center items-center text-slate-400 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              <span>Carregando OS em assistência...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/60 text-slate-400 uppercase text-xs font-semibold border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3">Número OS</th>
                    <th className="px-6 py-3">Prioridade</th>
                    <th className="px-6 py-3">Equipamento</th>
                    <th className="px-6 py-3">Empresa Externa</th>
                    <th className="px-6 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {osEmAssistencia.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-slate-400"
                      >
                        Nenhum equipamento atualmente em assistência externa.
                      </td>
                    </tr>
                  ) : (
                    osEmAssistencia.map((os) => (
                      <tr
                        key={os.id}
                        className="hover:bg-slate-750 transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-white font-mono">
                          {os.numero_os}
                        </td>
                        <td className="px-6 py-4">
                          <PriorityBadge prioridade={os.prioridade} size="sm" />
                        </td>
                        <td className="px-6 py-4">
                          {os.equipamento.tipo} {os.equipamento.marca}{" "}
                          {os.equipamento.modelo} (Pat:{" "}
                          {os.equipamento.patrimonio})
                        </td>
                        <td className="px-6 py-4 text-amber-400 font-semibold">
                          {os.checkin?.empresa_externa || "Não informada"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isSupervisorOrAdmin ? (
                            <button
                              onClick={() => setOsCheckOut(os)}
                              className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition-all flex items-center gap-1.5 ml-auto"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Realizar Check-out</span>
                            </button>
                          ) : (
                            <span className="inline-block px-2.5 py-1 text-[11px] font-mono font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Em Assistência
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {osCheckIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 font-mono">
                <Wrench className="w-5 h-5 text-amber-400 font-sans" /> Check-in:{" "}
                {osCheckIn.numero_os}
              </h3>
              <button
                onClick={() => setOsCheckIn(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmarCheckIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Empresa / Assistência Técnica Cadastrada *
                </label>
                {assistencias.length === 0 ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-300">
                    Nenhuma assistência técnica cadastrada. Peça ao administrador do sistema para cadastrar em <strong>Gestão de Assistências</strong>.
                  </div>
                ) : (
                  <select
                    required
                    value={empresaExterna}
                    onChange={(e) => setEmpresaExterna(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="">Selecione a empresa cadastrada...</option>
                    {assistencias.map((a) => (
                      <option key={a.id} value={a.nome}>
                        {a.nome}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Laudo Técnico Inicial (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={laudoTecnico}
                  onChange={(e) => setLaudoTecnico(e.target.value)}
                  placeholder="Diagnóstico realizado pela equipe interna antes do envio..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setOsCheckIn(null)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingCheckIn}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {submittingCheckIn ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Confirmar Envio (Check-in)</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {osCheckOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 font-mono">
                <CheckCircle className="w-5 h-5 text-purple-400 font-sans" /> Check-out:{" "}
                {osCheckOut.numero_os}
              </h3>
              <button
                onClick={() => setOsCheckOut(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmarCheckOut} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Observações sobre o Reparo / Retorno
                </label>
                <textarea
                  rows={3}
                  value={obsCheckOut}
                  onChange={(e) => setObsCheckOut(e.target.value)}
                  placeholder="Ex: Placa mãe substituída. Testado na bancada de TI."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setOsCheckOut(null)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingCheckOut}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {submittingCheckOut ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Confirmar Retorno (Check-out)</span>
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
