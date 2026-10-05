import {
  AlertCircle,
  Building2,
  Calendar,
  ExternalLink,
  HardDrive,
  Loader2,
  PlusCircle,
  Wrench,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getEquipamentosBySetor } from "../services/equipamentosService";
import { abrirOS } from "../services/osService";
import { getSetores } from "../services/setoresService";
import type { Equipamento, OSPrioridade, Setor, TipoAssistencia } from "../types";
import {
  calcularPrazoRetornoDefault,
  getDiasPrazoByPrioridade,
} from "../utils/prazoUtils";

export const NovaOSPage: React.FC = () => {
  const { usuarioData } = useAuth();
  const navigate = useNavigate();

  const [setores, setSetores] = useState<Setor[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [loadingSetores, setLoadingSetores] = useState(true);
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(false);

  const [setorId, setSetorId] = useState("");
  const [equipamentoId, setEquipamentoId] = useState("");
  const [tipoAssistencia, setTipoAssistencia] = useState<TipoAssistencia>("interna");
  const [defeitoRelatado, setDefeitoRelatado] = useState("");
  const [prioridade, setPrioridade] = useState<OSPrioridade>("baixa");
  const [justificativaPrioridade, setJustificativaPrioridade] = useState("");
  const [previsaoRetorno, setPrevisaoRetorno] = useState<string>(() =>
    calcularPrazoRetornoDefault("baixa")
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getSetores()
      .then((data) => {
        if (!active) return;
        setSetores(data);
        if (data.length > 0) {
          setSetorId((prev) => prev || data[0].id);
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar setores:", err);
      })
      .finally(() => {
        if (active) setLoadingSetores(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!setorId) return;
    let active = true;
    setLoadingEquipamentos(true);

    getEquipamentosBySetor(setorId)
      .then((data) => {
        if (!active) return;
        const operacionais = data.filter((e) => e.status === "operacional");
        setEquipamentos(operacionais);
        setEquipamentoId(operacionais.length > 0 ? operacionais[0].id : "");
      })
      .catch((err) => {
        console.error("Erro ao buscar equipamentos do setor:", err);
        if (active) setEquipamentos([]);
      })
      .finally(() => {
        if (active) setLoadingEquipamentos(false);
      });

    return () => {
      active = false;
    };
  }, [setorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioData) return;

    const eqSelecionado = equipamentos.find((e) => e.id === equipamentoId);

    if (!eqSelecionado) {
      setError("Selecione um equipamento válido.");
      return;
    }

    if ((prioridade === "alta" || prioridade === "critica") && !justificativaPrioridade.trim()) {
      setError("A justificativa é obrigatória para prioridades Alta ou Crítica/Urgente.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await abrirOS({
        equipamento: {
          id: eqSelecionado.id,
          patrimonio: eqSelecionado.patrimonio,
          tipo: eqSelecionado.tipo,
          marca: eqSelecionado.marca,
          modelo: eqSelecionado.modelo,
          setor_id: eqSelecionado.setor_id,
        },
        tecnicoId: usuarioData.id,
        tecnicoNome: usuarioData.nome,
        tipoAssistencia,
        defeitoRelatado: defeitoRelatado.trim(),
        prioridade,
        justificativaPrioridade: (prioridade === "alta" || prioridade === "critica") ? justificativaPrioridade.trim() : undefined,
        previsaoRetorno,
      });

      navigate("/dashboard");
    } catch (err: any) {
      console.error("Erro ao abrir OS:", err);
      setError(err.message || "Falha ao registrar a Ordem de Serviço.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-white tracking-tight">
              Abrir Nova Ordem de Serviço
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Registro técnico para envio de equipamento com defeito.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-900/60 text-red-300 text-xs rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-sm space-y-5"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-2 flex items-center gap-1.5 font-mono">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>Setor Solicitante / Origem</span>
          </label>
          {loadingSetores ? (
            <div className="text-xs text-slate-400 flex items-center gap-2 py-2 font-mono">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              Carregando setores...
            </div>
          ) : (
            <select
              value={setorId}
              onChange={(e) => {
                setSetorId(e.target.value);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {setores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sigla} - {s.nome}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-2 flex items-center gap-1.5 font-mono">
            <HardDrive className="w-4 h-4 text-blue-400" />
            <span>Equipamento com Defeito</span>
          </label>
          {loadingEquipamentos ? (
            <div className="text-xs text-slate-400 flex items-center gap-2 py-2 font-mono">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              Carregando equipamentos do setor...
            </div>
          ) : (
            <select
              value={equipamentoId}
              onChange={(e) => setEquipamentoId(e.target.value)}
              disabled={equipamentos.length === 0}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
            >
              {equipamentos.length === 0 ? (
                <option value="">
                  Nenhum equipamento operacional disponível neste setor
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

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-2 flex items-center gap-1.5 font-mono">
            <Wrench className="w-4 h-4 text-blue-400" />
            <span>Tipo de Assistência</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTipoAssistencia("interna")}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                tipoAssistencia === "interna"
                  ? "bg-blue-600/10 border-blue-500 shadow-sm ring-1 ring-blue-500/40"
                  : "bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-400"
              }`}
            >
              <div
                className={`mt-0.5 p-2 rounded-lg shrink-0 transition-colors ${
                  tipoAssistencia === "interna"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                <Wrench className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">
                    Assistência Interna
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Técnico Local
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Realizada pelo próprio técnico (ex: abastecimento de tinta na impressora, manutenção e limpeza preventiva).
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTipoAssistencia("externa")}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                tipoAssistencia === "externa"
                  ? "bg-purple-600/10 border-purple-500 shadow-sm ring-1 ring-purple-500/40"
                  : "bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-400"
              }`}
            >
              <div
                className={`mt-0.5 p-2 rounded-lg shrink-0 transition-colors ${
                  tipoAssistencia === "externa"
                    ? "bg-purple-600 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                <ExternalLink className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">
                    Assistência Externa
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Empresa Terceirizada
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Encaminhado para empresa ou assistência técnica autorizada externa.
                </p>
              </div>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-2 flex items-center gap-1.5 font-mono">
            <AlertCircle className="w-4 h-4 text-blue-400" />
            <span>Nível de Atenção / Prioridade</span>
          </label>
          <select
            value={prioridade}
            onChange={(e) => {
              const novaPri = e.target.value as OSPrioridade;
              setPrioridade(novaPri);
              setPrevisaoRetorno(calcularPrazoRetornoDefault(novaPri));
            }}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="baixa">Baixa (15 dias)</option>
            <option value="media">Média (10 dias)</option>
            <option value="alta">Alta (5 dias)</option>
            <option value="critica">Crítica/Urgente (2 dias)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-2 flex items-center justify-between font-mono">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>
                {tipoAssistencia === "interna"
                  ? "Prazo Previsto de Conclusão (Interna)"
                  : "Prazo Previsto de Retorno (Assistência Externa)"}
              </span>
            </div>
            <span className="text-[10px] text-blue-400 font-normal lowercase font-sans font-medium">
              ({getDiasPrazoByPrioridade(prioridade)} dias estimados)
            </span>
          </label>
          <input
            type="date"
            value={previsaoRetorno}
            onChange={(e) => setPrevisaoRetorno(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          />
        </div>

        {(prioridade === "alta" || prioridade === "critica") && (
          <div>
            <label className="block text-xs font-semibold text-amber-400 uppercase mb-2 flex items-center gap-1.5 font-mono">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Justificativa da Prioridade *</span>
            </label>
            <textarea
              required
              rows={3}
              value={justificativaPrioridade}
              onChange={(e) => setJustificativaPrioridade(e.target.value)}
              placeholder="Descreva a justificativa para o nível de prioridade Alta ou Crítica..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-amber-500/40 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500 outline-none placeholder:text-slate-500 font-sans"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-2 flex items-center gap-1.5 font-mono">
            <Wrench className="w-4 h-4 text-blue-400" />
            <span>Descrição do Defeito / Problema Relatado</span>
          </label>
          <textarea
            required
            rows={4}
            value={defeitoRelatado}
            onChange={(e) => setDefeitoRelatado(e.target.value)}
            placeholder="Descreva detalhadamente o sintoma apresentado pelo equipamento..."
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-500 font-sans"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="px-4 py-2.5 text-xs text-slate-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || equipamentos.length === 0}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all text-xs flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registrando OS...</span>
              </>
            ) : (
              <span>Confirmar e Abrir OS</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
