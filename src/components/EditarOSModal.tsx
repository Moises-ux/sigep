/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertCircle,
  Building2,
  Calendar,
  Edit3,
  ExternalLink,
  HardDrive,
  Loader2,
  Lock,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getEquipamentosBySetor } from "../services/equipamentosService";
import { editarOS } from "../services/osService";
import { getSetores } from "../services/setoresService";
import type { Equipamento, OrdemServico, OSPrioridade, OSStatus, Setor, TipoAssistencia } from "../types";
import { calcularPrazoRetornoDefault } from "../utils/prazoUtils";

interface EditarOSModalProps {
  os: OrdemServico | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditarOSModal: React.FC<EditarOSModalProps> = ({
  os,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { usuarioData } = useAuth();

  const [setores, setSetores] = useState<Setor[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [loadingSetores, setLoadingSetores] = useState(true);
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(false);

  const [setorId, setSetorId] = useState("");
  const [equipamentoId, setEquipamentoId] = useState("");
  const [tipoAssistencia, setTipoAssistencia] = useState<TipoAssistencia>("interna");
  const [statusOS, setStatusOS] = useState<OSStatus>("CRIADA");
  const [defeitoRelatado, setDefeitoRelatado] = useState("");
  const [prioridade, setPrioridade] = useState<OSPrioridade>("baixa");
  const [justificativaPrioridade, setJustificativaPrioridade] = useState("");
  const [previsaoRetorno, setPrevisaoRetorno] = useState("");
  const [observacaoPrazo, setObservacaoPrazo] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar lista de setores
  useEffect(() => {
    let active = true;
    if (isOpen) {
      setLoadingSetores(true);
      getSetores()
        .then((data) => {
          if (!active) return;
          setSetores(data);
        })
        .catch((err) => {
          console.error("Erro ao carregar setores:", err);
        })
        .finally(() => {
          if (active) setLoadingSetores(false);
        });
    }
    return () => {
      active = false;
    };
  }, [isOpen]);

  // Inicializar estados com dados da OS quando o modal abre
  useEffect(() => {
    if (os && isOpen) {
      const initSetorId = os.equipamento.setor_id || "";
      setSetorId(initSetorId);
      setEquipamentoId(os.equipamento.id || "");
      setTipoAssistencia(os.tipo_assistencia || "interna");
      setStatusOS(os.status);
      setDefeitoRelatado(os.descricao_defeito || "");
      setPrioridade(os.prioridade || "baixa");
      setJustificativaPrioridade(os.justificativa_prioridade || "");
      setPrevisaoRetorno(
        os.previsao_retorno ||
          calcularPrazoRetornoDefault(os.prioridade || "baixa")
      );
      setObservacaoPrazo("");
      setError(null);
    }
  }, [os, isOpen]);

  // Carregar equipamentos ao alterar o setor selecionado
  useEffect(() => {
    if (!setorId || !isOpen) return;
    let active = true;
    setLoadingEquipamentos(true);

    getEquipamentosBySetor(setorId)
      .then((data) => {
        if (!active) return;
        setEquipamentos(data);
      })
      .catch((err) => {
        console.error("Erro ao carregar equipamentos do setor:", err);
        if (active) setEquipamentos([]);
      })
      .finally(() => {
        if (active) setLoadingEquipamentos(false);
      });

    return () => {
      active = false;
    };
  }, [setorId, isOpen]);

  if (!isOpen || !os) return null;

  const isAdmin = usuarioData?.papel === "admin";
  const isPosCriada = os.status !== "CRIADA" && !isAdmin;
  const isPriorityDisabled =
    !isAdmin &&
    (os.status === "CONCLUIDA" ||
      os.status === "CANCELADA" ||
      os.status === "ARQUIVADA");
  const isPrazoDisabled =
    !isAdmin &&
    (os.status === "RETORNADA" ||
      os.status === "CONCLUIDA" ||
      os.status === "CANCELADA" ||
      os.status === "ARQUIVADA" ||
      (usuarioData?.papel !== "admin" &&
        usuarioData?.papel !== "supervisor" &&
        usuarioData?.papel !== "tecnico"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioData) return;

    if (!defeitoRelatado.trim()) {
      setError("A descrição do defeito não pode ficar em branco.");
      return;
    }

    if (
      (prioridade === "alta" || prioridade === "critica") &&
      !justificativaPrioridade.trim()
    ) {
      setError(
        "A justificativa é obrigatória para prioridades Alta ou Crítica/Urgente."
      );
      return;
    }

    const eqSelecionado = equipamentos.find((e) => e.id === equipamentoId);

    setSubmitting(true);
    setError(null);

    try {
      await editarOS({
        osId: os.id,
        equipamento:
          eqSelecionado && (!isPosCriada || isAdmin)
            ? {
                id: eqSelecionado.id,
                patrimonio: eqSelecionado.patrimonio,
                tipo: eqSelecionado.tipo,
                marca: eqSelecionado.marca,
                modelo: eqSelecionado.modelo,
                setor_id: eqSelecionado.setor_id,
              }
            : undefined,
        tipoAssistencia: !isPosCriada || isAdmin ? tipoAssistencia : undefined,
        status: isAdmin ? statusOS : undefined,
        descricaoDefeito: defeitoRelatado.trim(),
        prioridade,
        justificativaPrioridade:
          prioridade === "alta" || prioridade === "critica"
            ? justificativaPrioridade.trim()
            : undefined,
        previsaoRetorno: previsaoRetorno.trim()
          ? previsaoRetorno.trim()
          : undefined,
        observacaoPrazo: observacaoPrazo.trim()
          ? observacaoPrazo.trim()
          : undefined,
        usuarioId: usuarioData.id,
        usuarioNome: usuarioData.nome,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erro ao editar OS:", err);
      setError(err.message || "Falha ao atualizar dados da Ordem de Serviço.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <Card className="max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2 font-mono m-0">
            <Edit3 className="w-5 h-5 text-blue-400 font-sans" /> Editar Ordem
            de Serviço ({os.numero_os})
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            ✕
          </Button>
        </div>

        {isAdmin && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <strong className="text-amber-400">Modo Administrador:</strong> Você tem permissão total para alterar esta OS em qualquer etapa (setor, equipamento, tipo de assistência, status, prioridade e prazos).
            </div>
          </div>
        )}

        {!isAdmin && isPosCriada && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-400">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Campos Bloqueados:</strong> Como esta OS já passou da
              etapa de abertura ({os.status}), os campos de setor, equipamento e tipo de assistência
              estão fixados e não podem ser alterados.
            </span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Status / Etapa da OS (Exclusivo Admin) */}
          {isAdmin && (
            <div>
              <label className="block text-xs font-semibold text-amber-400 uppercase mb-2 flex items-center gap-1.5 font-mono">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Etapa / Status da OS (Controle de Administrador)</span>
              </label>
              <select
                value={statusOS}
                onChange={(e) => setStatusOS(e.target.value as OSStatus)}
                className="w-full px-3.5 py-2.5 bg-background border border-amber-500/40 rounded-xl text-xs font-mono text-foreground focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
              >
                <option value="CRIADA">CRIADA (Aguardando Check-in / Envio)</option>
                <option value="EM_ASSISTENCIA">EM_ASSISTENCIA (Em Assistência / Manutenção)</option>
                <option value="RETORNADA">RETORNADA (Retornou / Aguardando Aceite)</option>
                <option value="CONCLUIDA">CONCLUIDA (Aceite Confirmado / Finalizada)</option>
                <option value="CANCELADA">CANCELADA (Cancelada)</option>
                <option value="ARQUIVADA">ARQUIVADA (Lixeira / Arquivada)</option>
              </select>
            </div>
          )}
          {/* Setor Solicitante / Origem */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1.5 font-mono">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Setor Solicitante / Origem</span>
            </label>
            {loadingSetores ? (
              <div className="text-xs text-muted-foreground flex items-center gap-2 py-2 font-mono">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                Carregando setores...
              </div>
            ) : (
              <select
                value={setorId}
                disabled={isPosCriada}
                onChange={(e) => setSetorId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-xs font-mono text-foreground focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {setores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.sigla} - {s.nome}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Equipamento com Defeito */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1.5 font-mono">
              <HardDrive className="w-4 h-4 text-blue-400" />
              <span>Equipamento com Defeito</span>
            </label>
            {loadingEquipamentos ? (
              <div className="text-xs text-muted-foreground flex items-center gap-2 py-2 font-mono">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                Carregando equipamentos do setor...
              </div>
            ) : (
              <select
                value={equipamentoId}
                disabled={isPosCriada || equipamentos.length === 0}
                onChange={(e) => setEquipamentoId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-xs font-mono text-foreground focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {equipamentos.length === 0 ? (
                  <option value={os.equipamento.id}>
                    {os.equipamento.tipo} - {os.equipamento.marca}{" "}
                    {os.equipamento.modelo} (Patrimônio:{" "}
                    {os.equipamento.patrimonio})
                  </option>
                ) : (
                  equipamentos.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.tipo} - {eq.marca} {eq.modelo} (Patrimônio:{" "}
                      {eq.patrimonio})
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          {/* Tipo de Assistência */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1.5 font-mono">
              <Wrench className="w-4 h-4 text-blue-400" />
              <span>Tipo de Assistência</span>
              {isPosCriada && (
                <span className="text-[10px] text-amber-400 font-normal lowercase font-sans">
                  (bloqueado para o status atual)
                </span>
              )}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isPosCriada}
                onClick={() => setTipoAssistencia("interna")}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  isPosCriada
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer"
                } ${
                  tipoAssistencia === "interna"
                    ? "bg-blue-600/10 border-blue-500 ring-1 ring-blue-500/40 text-foreground"
                    : "bg-background border-input hover:border-slate-600 text-muted-foreground"
                }`}
              >
                <div
                  className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                    tipoAssistencia === "interna"
                      ? "bg-blue-600 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    Assistência Interna
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Realizada pelo próprio técnico local (ex.: abastecimento de tinta).
                  </div>
                </div>
              </button>

              <button
                type="button"
                disabled={isPosCriada}
                onClick={() => setTipoAssistencia("externa")}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  isPosCriada
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer"
                } ${
                  tipoAssistencia === "externa"
                    ? "bg-purple-600/10 border-purple-500 ring-1 ring-purple-500/40 text-foreground"
                    : "bg-background border-input hover:border-slate-600 text-muted-foreground"
                }`}
              >
                <div
                  className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                    tipoAssistencia === "externa"
                      ? "bg-purple-600 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    Assistência Externa
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Encaminhada para assistência especializada externa.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Nível de Atenção / Prioridade */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1.5 font-mono">
              <AlertCircle className="w-4 h-4 text-blue-400" />
              <span>Nível de Atenção / Prioridade</span>
              {isPriorityDisabled && (
                <span className="text-[10px] text-amber-400 font-normal lowercase font-sans">
                  (bloqueado para o status atual)
                </span>
              )}
            </label>
            <select
              value={prioridade}
              disabled={isPriorityDisabled}
              onChange={(e) => {
                const novaPri = e.target.value as OSPrioridade;
                setPrioridade(novaPri);
                setPrevisaoRetorno(calcularPrazoRetornoDefault(novaPri));
              }}
              className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-xs font-mono text-foreground focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="baixa">Baixa (15 dias)</option>
              <option value="media">Média (10 dias)</option>
              <option value="alta">Alta (5 dias)</option>
              <option value="critica">Crítica/Urgente (2 dias)</option>
            </select>
          </div>

          {/* Prazo Previsto de Retorno */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center justify-between font-mono">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>
                  {tipoAssistencia === "interna"
                    ? "Prazo Previsto de Conclusão (Interna)"
                    : "Prazo Previsto de Retorno da Assistência"}
                </span>
              </div>
              {isPrazoDisabled && (
                <span className="text-[10px] text-amber-400 font-normal lowercase font-sans">
                  (bloqueado após checkout ou sem permissão)
                </span>
              )}
            </label>
            <input
              type="date"
              disabled={isPrazoDisabled}
              value={previsaoRetorno}
              onChange={(e) => setPrevisaoRetorno(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-xs font-mono text-foreground focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed [color-scheme:dark]"
            />
            {!isPrazoDisabled && (
              <input
                type="text"
                value={observacaoPrazo}
                onChange={(e) => setObservacaoPrazo(e.target.value)}
                placeholder="Observação / motivo sobre a mudança de prazo (opcional)..."
                className="w-full mt-2 px-3 py-2 bg-background border border-input rounded-xl text-xs text-foreground focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-muted-foreground font-sans"
              />
            )}
          </div>

          {/* Justificativa da Prioridade (condicional) */}
          {(prioridade === "alta" || prioridade === "critica") && (
            <div>
              <label className="block text-xs font-semibold text-amber-400 uppercase mb-2 flex items-center gap-1.5 font-mono">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Justificativa da Prioridade *</span>
              </label>
              <textarea
                required
                rows={3}
                disabled={isPriorityDisabled}
                value={justificativaPrioridade}
                onChange={(e) => setJustificativaPrioridade(e.target.value)}
                placeholder="Descreva a justificativa para o nível de prioridade Alta ou Crítica..."
                className="w-full px-3.5 py-2.5 bg-background border border-amber-500/40 rounded-xl text-xs text-foreground focus:ring-2 focus:ring-amber-500 outline-none placeholder:text-muted-foreground font-sans disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          )}

          {/* Descrição do Defeito / Problema Relatado */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1.5 font-mono">
              <Wrench className="w-4 h-4 text-blue-400" />
              <span>Descrição do Defeito / Problema Relatado</span>
            </label>
            <textarea
              required
              rows={4}
              value={defeitoRelatado}
              onChange={(e) => setDefeitoRelatado(e.target.value)}
              placeholder="Descreva detalhadamente o sintoma apresentado pelo equipamento..."
              className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-xs text-foreground focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-muted-foreground font-sans"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando Alterações...</span>
                </>
              ) : (
                <span>Salvar Alterações da OS</span>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
