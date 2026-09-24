/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Edit2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  Wrench,
} from "lucide-react";

import {
  atualizarAssistenciaTecnica,
  criarAssistenciaTecnica,
  excluirAssistenciaTecnica,
  getAssistenciasTecnicas,
} from "../services/assistenciasService";
import type { AssistenciaTecnica } from "../types";

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

export const AdminAssistenciasPage: React.FC = () => {
  const [assistencias, setAssistencias] = useState<AssistenciaTecnica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Estado para Modal de Alerta de Exclusão
  const [itemParaExcluir, setItemParaExcluir] = useState<AssistenciaTecnica | null>(null);
  const [deleting, setDeleting] = useState(false);

  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getAssistenciasTecnicas();
      setAssistencias(list);
    } catch (err: any) {
      console.error("Erro ao carregar assistências técnicas:", err);
      setError(err?.message || "Erro ao carregar lista de assistências.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setNome("");
    setTelefone("");
    setEmail("");
    setEndereco("");
    setAtivo(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: AssistenciaTecnica) => {
    setEditingId(item.id);
    setNome(item.nome);
    setTelefone(item.telefone);
    setEmail(item.email || "");
    setEndereco(item.endereco || "");
    setAtivo(item.ativo);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingId) {
        await atualizarAssistenciaTecnica(editingId, {
          nome: nome.trim(),
          telefone: telefone.trim(),
          email: email.trim(),
          endereco: endereco.trim(),
          ativo,
        });
      } else {
        await criarAssistenciaTecnica({
          nome: nome.trim(),
          telefone: telefone.trim(),
          email: email.trim(),
          endereco: endereco.trim(),
          ativo,
        });
      }

      setIsModalOpen(false);
      await carregarDados();
    } catch (err) {
      console.error("Erro ao salvar assistência técnica:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmarExclusao = async () => {
    if (!itemParaExcluir) return;
    setDeleting(true);
    try {
      await excluirAssistenciaTecnica(itemParaExcluir.id);
      setItemParaExcluir(null);
      await carregarDados();
    } catch (err) {
      console.error("Erro ao excluir assistência técnica:", err);
    } finally {
      setDeleting(false);
    }
  };

  const filtrados = assistencias.filter(
    (a) =>
      a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.telefone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.email && a.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho de Assistências Técnicas */}
      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground m-0">
                  Gestão de Assistências Técnicas
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5 m-0">
                  Cadastro e gerenciamento das empresas parceiras para manutenção de equipamentos.
                </p>
              </div>
            </div>
          </div>

          <Button onClick={handleOpenCreateModal} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            <span>Cadastrar Assistência</span>
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/20 bg-destructive/10">
          <CardContent className="p-4 flex items-start gap-3 text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold m-0">Erro ao carregar dados</p>
              <p className="text-muted-foreground mt-0.5 m-0">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Assistências Técnicas */}
      <Card>
        <CardHeader className="px-6 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold">Lista de Assistências</CardTitle>
            <CardDescription className="text-xs">
              Total de {filtrados.length} empresas cadastradas
            </CardDescription>
          </div>

          <div className="relative flex-1 max-w-md w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <Input
              type="text"
              placeholder="Buscar por nome, telefone ou e-mail..."
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
              <span className="text-xs font-medium">Carregando assistências...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Empresa / Razão Social</TableHead>
                  <TableHead className="w-[160px]">Telefone / Contato</TableHead>
                  <TableHead>E-mail / Endereço</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="text-right w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-xs">
                      Nenhuma assistência técnica cadastrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtrados.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell className="font-bold text-foreground text-xs">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span>{item.nome}</span>
                        </div>
                      </TableCell>

                      <TableCell className="font-mono text-xs text-foreground">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>{item.telefone}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs">
                        {item.email && (
                          <div className="flex items-center gap-1.5 text-foreground">
                            <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span>{item.email}</span>
                          </div>
                        )}
                        {item.endereco && (
                          <div className="flex items-center gap-1.5 text-muted-foreground mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span>{item.endereco}</span>
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        {item.ativo ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-semibold text-xs">
                            Ativa
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground font-semibold text-xs">
                            Inativa
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditModal(item)}
                            className="h-8 w-8 p-0"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setItemParaExcluir(item)}
                            className="h-8 w-8 p-0"
                            title="Excluir"
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
                <Wrench className="w-5 h-5 text-primary" />{" "}
                {editingId ? "Editar Assistência" : "Nova Assistência Técnica"}
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
                  Nome da Empresa / Assistência *
                </label>
                <Input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Eletrônica & Informática Silva"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Telefone / Whatsapp *
                </label>
                <Input
                  type="text"
                  required
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="Ex: (83) 98888-7777"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  E-mail de Contato (Opcional)
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@empresa.com"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Endereço (Opcional)
                </label>
                <Input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua Central, 123 - Centro"
                  className="text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="w-4 h-4 rounded bg-background border-input text-primary focus:ring-ring cursor-pointer"
                />
                <label htmlFor="ativo" className="text-xs text-foreground cursor-pointer select-none">
                  Empresa Ativa no Sistema
                </label>
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
      {itemParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <Card className="max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-destructive m-0">Excluir Assistência Técnica</h3>
                <p className="text-xs text-muted-foreground mt-0.5 m-0">Ação de exclusão definitiva</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed m-0">
              Tem certeza que deseja excluir permanentemente a assistência técnica <strong className="text-foreground font-semibold">{itemParaExcluir.nome}</strong>?
            </p>
            <p className="text-xs text-destructive font-medium leading-relaxed m-0">
              Esta empresa deixará de figurar nos registros do sistema para novas aberturas e envios.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setItemParaExcluir(null)}
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
