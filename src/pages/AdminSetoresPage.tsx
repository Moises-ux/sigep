/* eslint-disable react-hooks/set-state-in-effect */
import { Building2, Loader2, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { criarSetor, getSetores } from "../services/setoresService";
import type { Setor } from "../types";

export const AdminSetoresPage: React.FC = () => {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [sigla, setSigla] = useState("");
  const [secretaria, setSecretaria] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const carregarSetores = async () => {
    setLoading(true);
    try {
      const data = await getSetores();
      setSetores(data);
    } catch (err) {
      console.error("Erro ao carregar setores:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarSetores();
  }, []);

  const handleCadastrarSetor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await criarSetor({
        nome: nome.trim(),
        sigla: sigla.trim().toUpperCase(),
        secretaria: secretaria.trim(),
        responsavel: responsavel.trim(),
      });

      setNome("");
      setSigla("");
      setSecretaria("");
      setResponsavel("");
      setIsModalOpen(false);
      await carregarSetores();
    } catch (err) {
      console.error("Erro ao cadastrar setor:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800 p-6 rounded-xl border border-slate-700">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <h1 className="text-base font-semibold text-white">Gestão de Setores</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Secretarias e departamentos cadastrados no município.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2.5 rounded-lg shadow-lg hover:shadow-blue-600/20 transition-all text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Setor</span>
        </button>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            <span>Carregando setores...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {setores.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-400">
                Nenhum setor cadastrado. Clique no botão acima para adicionar.
              </div>
            ) : (
              setores.map((s) => (
                <div
                  key={s.id}
                  className="bg-slate-900 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20">
                      {s.sigla}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-3">
                    {s.nome}
                  </h3>
                  {s.secretaria && (
                    <p className="text-xs text-slate-400 mt-1">
                      Secretaria: {s.secretaria}
                    </p>
                  )}
                  {s.responsavel && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      Resp: {s.responsavel}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" /> Novo Setor
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCadastrarSetor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Sigla
                </label>
                <input
                  type="text"
                  required
                  value={sigla}
                  onChange={(e) => setSigla(e.target.value)}
                  placeholder="Ex: SEMUS, SEDUC, IT"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Nome do Setor
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Departamento de Tecnologia da Informação"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Secretaria (Opcional)
                </label>
                <input
                  type="text"
                  value={secretaria}
                  onChange={(e) => setSecretaria(e.target.value)}
                  placeholder="Ex: Secretaria de Administração"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Responsável (Opcional)
                </label>
                <input
                  type="text"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  placeholder="Ex: Maria Oliveira"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
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
                    <span>Salvar Setor</span>
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
