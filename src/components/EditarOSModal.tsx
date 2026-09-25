import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  Edit3,
  HardDrive,
  Loader2,
  Lock,
  Wrench,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Equipamento, OrdemServico, OSPrioridade, Setor } from "../types";
import { editarOS } from "../services/osService";
import { getSetores } from "../services/setoresService";
import { getEquipamentosBySetor } from "../services/equipamentosService";
import { useAuth } from "../contexts/AuthContext";

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
  const [defeitoRelatado, setDefeitoRelatado] = useState("");
  const [prioridade, setPrioridade] = useState<OSPrioridade>("baixa");
  const [justificativaPrioridade, setJustificativaPrioridade] = useState("");

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
      setDefeitoRelatado(os.descricao_defeito || "");
      setPrioridade(os.prioridade || "baixa");
      setJustificativaPrioridade(os.justificativa_prioridade || "");
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

  const isPosCriada = os.status !== "CRIADA";
  const isPriorityDisabled = os.status === "CONCLUIDA" || os.status === "CANCELADA" || os.status === "ARQUIVADA";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioData) return;

    if (!defeitoRelatado.trim()) {
      setError("A descrição do defeito não pode ficar em branco.");
      return;
    }

    if ((prioridade === "alta" || prioridade === "critica") && !justificativaPrioridade.trim()) {
      setError("A justificativa é obrigatória para prioridades Alta ou Crítica/Urgente.");
      return;
    }

    const eqSelecionado = equipamentos.find((e) => e.id === equipamentoId);

    setSubmitting(true);
    setError(null);

    try {
      await editarOS({
        osId: os.id,
        equipamento: (!isPosCriada && eqSelecionado) ? {
          id: eqSelecionado.id,
          patrimonio: eqSelecionado.patrimonio,
          tipo: eqSelecionado.tipo,
          marca: eqSelecionado.marca,
          modelo: eqSelecionado.modelo,
          setor_id: eqSelecionado.setor_id,
        } : undefined,
        descricaoDefeito: defeitoRelatado.trim(),
        prioridade,
        justificativaPrioridade: (prioridade === "alta" || prioridade === "critica") ? justificativaPrioridade.trim() : undefined,
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
            <Edit3 className="w-5 h-5 text-blue-400 font-sans" /> Editar Ordem de Serviço ({os.numero_os})
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            ✕
          </Button>
        </div>

        {isPosCriada && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-400">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Campos Bloqueados:</strong> Como esta OS já passou da etapa de abertura ({os.status}), os campos de setor e equipamento estão fixados e não podem ser alterados.
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
                    {os.equipamento.tipo} - {os.equipamento.marca} {os.equipamento.modelo} (Patrimônio: {os.equipamento.patrimonio})
                  </option>
                ) : (
                  equipamentos.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.tipo} - {eq.marca} {eq.modelo} (Patrimônio: {eq.patrimonio})
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          {/* Nível de Atenção / Prioridade */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1.5 font-mono">
              <AlertCircle className="w-4 h-4 text-blue-400" />
              <span>Nível de Atenção / Prioridade</span>
              {isPriorityDisabled && (
                <span className="text-[10px] text-amber-400 font-normal lowercase font-sans">(bloqueado para o status atual)</span>
              )}
            </label>
            <select
              value={prioridade}
              disabled={isPriorityDisabled}
              onChange={(e) => setPrioridade(e.target.value as OSPrioridade)}
              className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-xs font-mono text-foreground focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica/Urgente</option>
            </select>
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
