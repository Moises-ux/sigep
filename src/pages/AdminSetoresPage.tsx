/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Edit2,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  atualizarSetor,
  criarSetor,
  excluirSetor,
  getSetores,
} from "../services/setoresService";
import type { Setor } from "../types";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const AdminSetoresPage: React.FC = () => {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [sigla, setSigla] = useState("");
  const [secretaria, setSecretaria] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Estado para Modal de Alerta de Exclusão
  const [setorParaExcluir, setSetorParaExcluir] = useState<Setor | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setNome("");
    setSigla("");
    setSecretaria("");
    setResponsavel("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (setor: Setor) => {
    setEditingId(setor.id);
    setNome(setor.nome);
    setSigla(setor.sigla);
    setSecretaria(setor.secretaria || "");
    setResponsavel(setor.responsavel || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingId) {
        await atualizarSetor(editingId, {
          nome: nome.trim(),
          sigla: sigla.trim().toUpperCase(),
          secretaria: secretaria.trim(),
          responsavel: responsavel.trim(),
        });
      } else {
        await criarSetor({
          nome: nome.trim(),
          sigla: sigla.trim().toUpperCase(),
          secretaria: secretaria.trim(),
          responsavel: responsavel.trim(),
        });
      }

      setIsModalOpen(false);
      await carregarSetores();
    } catch (err) {
      console.error("Erro ao salvar setor:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmarExclusao = async () => {
    if (!setorParaExcluir) return;
    setDeleting(true);
    try {
      await excluirSetor(setorParaExcluir.id);
      setSetorParaExcluir(null);
      await carregarSetores();
    } catch (err) {
      console.error("Erro ao excluir setor:", err);
    } finally {
      setDeleting(false);
    }
  };

  const setoresFiltrados = setores.filter(
    (s) =>
      s.sigla.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.secretaria && s.secretaria.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.responsavel && s.responsavel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho de Gestão de Setores */}
      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground m-0">
                  Gestão de Setores
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5 m-0">
                  Secretarias, departamentos e setores cadastrados no município.
                </p>
              </div>
            </div>
          </div>

          <Button onClick={handleOpenCreateModal} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            <span>Cadastrar Setor</span>
          </Button>
        </CardContent>
      </Card>

      {/* Tabela de Setores */}
      <Card>
        <CardHeader className="px-6 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold">Lista de Setores</CardTitle>
            <CardDescription className="text-xs">
              Total de {setoresFiltrados.length} setores cadastrados
            </CardDescription>
          </div>

          <div className="relative flex-1 max-w-md w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <Input
              type="text"
              placeholder="Buscar por sigla, nome, secretaria ou responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs font-mono"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center items-center text-muted-foreground gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs font-medium">Carregando setores...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Sigla</TableHead>
                  <TableHead className="min-w-[200px]">Nome do Setor</TableHead>
                  <TableHead className="min-w-[180px]">Secretaria</TableHead>
                  <TableHead className="min-w-[160px]">Responsável</TableHead>
                  <TableHead className="text-right w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {setoresFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-xs">
                      Nenhum setor encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  setoresFiltrados.map((s) => (
                    <TableRow key={s.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-bold font-mono text-xs">
                          {s.sigla}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground text-xs whitespace-normal">
                        {s.nome}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-normal">
                        {s.secretaria || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-normal">
                        {s.responsavel || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditModal(s)}
                            className="h-8 w-8 p-0"
                            title="Editar Setor"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setSetorParaExcluir(s)}
                            className="h-8 w-8 p-0"
                            title="Excluir Setor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal Formulário (Criar / Editar) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <Card className="max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2 m-0">
                <Building2 className="w-5 h-5 text-primary" />{" "}
                {editingId ? "Editar Setor" : "Cadastrar Novo Setor"}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Sigla *
                </label>
                <Input
                  type="text"
                  required
                  value={sigla}
                  onChange={(e) => setSigla(e.target.value)}
                  placeholder="Ex: SEMUS, SEDUC, DTI"
                  className="text-xs font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Nome do Setor *
                </label>
                <Input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Departamento de Tecnologia da Informação"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Secretaria (Opcional)
                </label>
                <Input
                  type="text"
                  value={secretaria}
                  onChange={(e) => setSecretaria(e.target.value)}
                  placeholder="Ex: Secretaria de Administração"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Responsável (Opcional)
                </label>
                <Input
                  type="text"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  placeholder="Ex: Maria Oliveira"
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Salvar</span>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal de Alerta de Confirmação de Exclusão */}
      {setorParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <Card className="max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-destructive m-0">Excluir Setor</h3>
                <p className="text-xs text-muted-foreground mt-0.5 m-0">Ação de exclusão definitiva</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed m-0">
              Tem certeza que deseja excluir permanentemente o setor <strong className="text-foreground font-semibold">{setorParaExcluir.sigla} - {setorParaExcluir.nome}</strong>?
            </p>
            <p className="text-xs text-destructive font-medium leading-relaxed m-0">
              Esta ação removerá o cadastro do setor e não poderá ser desfeita.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSetorParaExcluir(null)}
                disabled={deleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleConfirmarExclusao}
                disabled={deleting}
                className="gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <span>Excluir Definitivamente</span>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
