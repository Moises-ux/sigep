import { ArrowLeftRight, CheckCircle, Loader2, ShieldAlert, Wrench, Zap } from "lucide-react";
import React, { useEffect, useState } from "react";
import { PriorityBadge } from "../components/PriorityBadge";
import { useAuth } from "../contexts/AuthContext";
import { getAssistenciasTecnicas } from "../services/assistenciasService";
import {
  getOrdensServicoByStatus,
  realizarCheckIn,
  realizarCheckInExpressoInterno,
  realizarCheckOut,
} from "../services/osService";
import { getSetores } from "../services/setoresService";
import type { AssistenciaTecnica, OrdemServico, Setor } from "../types";
import { formatarPrazoRetorno } from "../utils/prazoUtils";

export const CheckInCheckOutPage: React.FC = () => {
  const { usuarioData } = useAuth();
  const role = usuarioData?.papel
    ?.toLowerCase()
    ?.normalize("NFD")
    ?.replace(/[\u0300-\u036f]/g, "");
  const canPerformCheckInOut =
    role === "tecnico" ||
    role === "supervisor" ||
    role === "admin";
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

  // Fast-track específico para interna
  const [servicoRealizado, setServicoRealizado] = useState("");
  const [pecasInsumos, setPecasInsumos] = useState("");
  const [destinoExpresso, setDestinoExpresso] = useState<"RETORNADA" | "CONCLUIDA" | "EM_ASSISTENCIA">("RETORNADA");
  const [obsAceiteExpresso, setObsAceiteExpresso] = useState("");

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
    if (os.tipo_assistencia === "interna") {
      setServicoRealizado("");
      setPecasInsumos("");
      setDestinoExpresso("RETORNADA");
      setObsAceiteExpresso("");
    } else {
      if (assistencias.length > 0) {
        setEmpresaExterna(assistencias[0].nome);
      } else {
        setEmpresaExterna("");
      }
      setLaudoTecnico("");
    }
  };

  const handleConfirmarCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!osCheckIn || !usuarioData || !canPerformCheckInOut) return;

    setSubmittingCheckIn(true);
    try {
      if (osCheckIn.tipo_assistencia === "interna") {
        await realizarCheckInExpressoInterno({
          osId: osCheckIn.id,
          usuarioId: usuarioData.id,
          usuarioNome: usuarioData.nome,
          servicoRealizado: servicoRealizado.trim(),
          pecasInsumos: pecasInsumos.trim() || undefined,
          destino: destinoExpresso,
          observacaoAceite: obsAceiteExpresso.trim() || undefined,
          equipamentoId: osCheckIn.equipamento.id,
        });
      } else {
        await realizarCheckIn({
          osId: osCheckIn.id,
          supervisorId: usuarioData.id,
          supervisorNome: usuarioData.nome,
          empresaExterna: empresaExterna.trim(),
          laudoTecnico: laudoTecnico.trim(),
        });
      }

      setOsCheckIn(null);
      setEmpresaExterna("");
      setLaudoTecnico("");
      setServicoRealizado("");
      setPecasInsumos("");
      await carregarDados();
    } catch (err) {
      console.error("Erro no Check-in:", err);
    } finally {
      setSubmittingCheckIn(false);
    }
  };

  const handleConfirmarCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!osCheckOut || !usuarioData || !canPerformCheckInOut) return;

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
          {!canPerformCheckInOut && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldAlert className="w-3.5 h-3.5" /> Modo Leitura
            </span>
          )}
        </div>

        {!canPerformCheckInOut && (
          <div className="mt-4 p-3 bg-slate-900/60 border border-slate-700/80 rounded-xl flex items-center gap-2.5 text-xs text-slate-300">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              Você está visualizando a listagem em <strong>modo leitura</strong>. Apenas Técnicos, Supervisores e Administradores podem realizar movimentações de Check-in e Check-out.
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
                    <th className="px-6 py-3">Prazo Retorno</th>
                    <th className="px-6 py-3">Defeito</th>
                    <th className="px-6 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {osCriadas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
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
                          <div className="flex flex-col gap-1 items-start">
                            <span>{os.numero_os}</span>
                            {os.tipo_assistencia && (
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                                  os.tipo_assistencia === "interna"
                                    ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                                    : "bg-purple-500/15 text-purple-300 border-purple-500/30"
                                }`}
                              >
                                {os.tipo_assistencia === "interna"
                                  ? "Interna"
                                  : "Externa"}
                              </span>
                            )}
                          </div>
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
                        <td className="px-6 py-4 text-xs font-mono text-amber-400 font-medium">
                          {formatarPrazoRetorno(os.previsao_retorno)}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-300 max-w-xs truncate">
                          {os.descricao_defeito}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {canPerformCheckInOut ? (
                            os.tipo_assistencia === "interna" ? (
                              <button
                                onClick={() => handleAbrirCheckInModal(os)}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 ml-auto"
                                title="Atendimento Expresso (Assistência Interna)"
                              >
                                <Zap className="w-4 h-4 text-blue-200" />
                                <span>Fluxo Expresso</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAbrirCheckInModal(os)}
                                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition-all flex items-center gap-1.5 ml-auto"
                              >
                                <Wrench className="w-4 h-4" />
                                <span>Realizar Check-in</span>
                              </button>
                            )
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
                    <th className="px-6 py-3">Prazo Retorno</th>
                    <th className="px-6 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {osEmAssistencia.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
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
                        <td className="px-6 py-4 text-xs font-mono text-amber-400 font-medium">
                          {formatarPrazoRetorno(os.previsao_retorno)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {canPerformCheckInOut ? (
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

      {osCheckIn && osCheckIn.tipo_assistencia === "interna" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white font-mono m-0 flex items-center gap-2">
                    <span>Atendimento Expresso</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {osCheckIn.numero_os}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 m-0 mt-0.5">
                    Assistência Interna (Técnico Local)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOsCheckIn(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Resumo do Equipamento e Defeito */}
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-mono">Equipamento:</span>
                <span className="font-semibold text-white">
                  {osCheckIn.equipamento.tipo} {osCheckIn.equipamento.marca}{" "}
                  {osCheckIn.equipamento.modelo} (Pat:{" "}
                  {osCheckIn.equipamento.patrimonio})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-mono">Setor Solicitante:</span>
                <span className="font-semibold text-white">
                  {getSetorInfo(osCheckIn.equipamento.setor_id)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 text-slate-300">
                <span className="text-slate-400 font-mono block text-[10px] uppercase">
                  Defeito Relatado:
                </span>
                <p className="mt-0.5 m-0 text-slate-200 italic">
                  "{osCheckIn.descricao_defeito}"
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmarCheckIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 font-mono">
                  Serviço / Procedimento Realizado *
                </label>
                <textarea
                  required
                  rows={3}
                  value={servicoRealizado}
                  onChange={(e) => setServicoRealizado(e.target.value)}
                  placeholder="Ex: Abastecimento de tinta preta e limpeza dos bicos injetores. Impressão de teste com 100% de nitidez."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 font-mono">
                  Peças ou Insumos Utilizados (Opcional)
                </label>
                <input
                  type="text"
                  value={pecasInsumos}
                  onChange={(e) => setPecasInsumos(e.target.value)}
                  placeholder="Ex: 1x Refil Tinta Preta T544..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2 font-mono">
                  Destino da Ordem de Serviço
                </label>
                <div className="space-y-2">
                  <div
                    onClick={() => setDestinoExpresso("RETORNADA")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      destinoExpresso === "RETORNADA"
                        ? "bg-blue-600/15 border-blue-500 ring-1 ring-blue-500/40 text-white"
                        : "bg-slate-900/60 border-slate-700 hover:border-slate-600 text-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="destinoExpresso"
                      checked={destinoExpresso === "RETORNADA"}
                      onChange={() => setDestinoExpresso("RETORNADA")}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-semibold text-xs text-white flex items-center gap-2">
                        <span>Disponibilizar para Aceite do Setor (Status: RETORNADA)</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Recomendado
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        Serviço concluído na bancada. O equipamento fica disponível para o solicitante testar e confirmar o recebimento.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setDestinoExpresso("CONCLUIDA")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      destinoExpresso === "CONCLUIDA"
                        ? "bg-emerald-600/15 border-emerald-500 ring-1 ring-emerald-500/40 text-white"
                        : "bg-slate-900/60 border-slate-700 hover:border-slate-600 text-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="destinoExpresso"
                      checked={destinoExpresso === "CONCLUIDA"}
                      onChange={() => setDestinoExpresso("CONCLUIDA")}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-semibold text-xs text-white flex items-center gap-2">
                        <span>Conclusão Direta com Aceite in loco (Status: CONCLUÍDA)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        O atendimento e teste foram realizados na presença do solicitante no próprio setor. Finaliza a OS imediatamente.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setDestinoExpresso("EM_ASSISTENCIA")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      destinoExpresso === "EM_ASSISTENCIA"
                        ? "bg-amber-600/15 border-amber-500 ring-1 ring-amber-500/40 text-white"
                        : "bg-slate-900/60 border-slate-700 hover:border-slate-600 text-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="destinoExpresso"
                      checked={destinoExpresso === "EM_ASSISTENCIA"}
                      onChange={() => setDestinoExpresso("EM_ASSISTENCIA")}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-semibold text-xs text-white">
                        Iniciar Atendimento na Bancada (Status: EM_ASSISTENCIA)
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        Registrar início do reparo. A conclusão e devolução serão realizadas posteriormente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {destinoExpresso === "CONCLUIDA" && (
                <div>
                  <label className="block text-xs font-semibold text-emerald-400 uppercase mb-1 font-mono">
                    Observação do Aceite in loco (Opcional)
                  </label>
                  <input
                    type="text"
                    value={obsAceiteExpresso}
                    onChange={(e) => setObsAceiteExpresso(e.target.value)}
                    placeholder="Ex: Testado e validado junto ao solicitante no setor..."
                    className="w-full px-3 py-2 bg-slate-900 border border-emerald-500/40 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-500"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setOsCheckIn(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingCheckIn || !servicoRealizado.trim()}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-600/20"
                >
                  {submittingCheckIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Confirmar Atendimento Expresso</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : osCheckIn ? (
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
      ) : null}

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
