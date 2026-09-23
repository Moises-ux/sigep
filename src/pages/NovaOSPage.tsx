/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AlertCircle,
  Building2,
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
import type { Equipamento, Setor } from "../types";

export const NovaOSPage: React.FC = () => {
  const { usuarioData } = useAuth();
  const navigate = useNavigate();

  const [setores, setSetores] = useState<Setor[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [loadingSetores, setLoadingSetores] = useState(true);
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(false);

  const [setorId, setSetorId] = useState("");
  const [equipamentoId, setEquipamentoId] = useState("");
  const [defeitoRelatado, setDefeitoRelatado] = useState("");

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
        defeitoRelatado: defeitoRelatado.trim(),
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
