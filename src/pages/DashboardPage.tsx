/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from "react";
import {
  AlertCircle,
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner & Setor */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground m-0">
            Monitor de Assistência Técnica
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Acompanhamento em tempo real do ciclo de reparos dos equipamentos municipais.
          </p>
        </div>

        {usuarioData?.papel === "solicitante" && (
          <Badge variant="outline" className="px-3 py-1.5 gap-2 text-xs font-normal">
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Setor Ativo:</span>
            <strong className="text-foreground font-mono">
              {getSetorInfo(usuarioData.setor_id)}
            </strong>
          </Badge>
        )}
      </div>

      {/* KPI Cards Grid usando Shadcn Card */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card className="hover:border-foreground/20 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
              Total de OS
            </CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tracking-tight">
              {totalOS}
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 hover:border-blue-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-blue-400 uppercase tracking-wider font-mono">
              Criadas
            </CardTitle>
            <Clock className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-blue-400 tracking-tight">
              {criadasOS}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 hover:border-amber-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-amber-400 uppercase tracking-wider font-mono">
              Em Assistência
            </CardTitle>
            <Wrench className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-amber-400 tracking-tight">
              {assistenciaOS}
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 hover:border-purple-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-purple-300 uppercase tracking-wider font-mono">
              Retornadas
            </CardTitle>
            <AlertCircle className="w-4 h-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-purple-300 tracking-tight">
              {retornadasOS}
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 hover:border-emerald-500/40 transition-all col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
              Concluídas
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
              {concluidasOS}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de Filtros e Pesquisa em Shadcn Card */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <Input
              type="text"
              placeholder="Pesquisar por protocolo OS, patrimônio ou defeito..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs font-mono"
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
              <Button
                key={st.id}
                variant={statusFiltro === st.id ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFiltro(st.id)}
                className="gap-1.5 text-xs h-8"
              >
                <span>{st.label}</span>
                <Badge
                  variant={statusFiltro === st.id ? "secondary" : "outline"}
                  className="px-1.5 py-0 text-[10px] font-mono"
                >
                  {st.count}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabela/Lista de Ordens de Serviço usando Shadcn Table e Card */}
      {loading ? (
        <SkeletonTable />
      ) : ordensFiltradas.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 bg-muted border border-border rounded-2xl flex items-center justify-center text-muted-foreground shadow-inner">
            <Inbox className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground m-0">
              Nenhuma Ordem de Serviço Encontrada
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Não há registros com os filtros aplicados. Altere o termo de pesquisa ou selecione outro status.
            </p>
          </div>
          {statusFiltro !== "TODOS" && (
            <Button variant="link" size="sm" onClick={() => setStatusFiltro("TODOS")}>
              Limpar Filtros
            </Button>
          )}
        </Card>
      ) : (
        <Card>
          <CardHeader className="px-6 py-4 border-b border-border">
            <CardTitle className="text-base font-bold">Listagem de OS</CardTitle>
            <CardDescription className="text-xs">
              Exibindo {ordensFiltradas.length} ordens de serviço
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Protocolo</TableHead>
                  <TableHead className="w-[160px]">Status</TableHead>
                  <TableHead>Equipamento & Defeito</TableHead>
                  <TableHead className="w-[180px]">Patrimônio / Setor</TableHead>
                  <TableHead className="text-right w-[140px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordensFiltradas.map((os) => (
                  <TableRow key={os.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      <Badge variant="outline" className="font-mono text-xs font-bold">
                        {os.numero_os}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={os.status} size="sm" />
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>
                            {os.equipamento.tipo} {os.equipamento.marca} {os.equipamento.modelo}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {os.descricao_defeito}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-mono space-y-0.5">
                        <div className="text-muted-foreground">
                          Pat: <strong className="text-foreground">{os.equipamento.patrimonio}</strong>
                        </div>
                        <div className="text-muted-foreground truncate max-w-[170px]">
                          {getSetorInfo(os.equipamento.setor_id)}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOsSelecionada(os)}
                          className="h-8 px-2.5 gap-1 text-xs"
                          title="Ver detalhes e histórico"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Detalhes</span>
                        </Button>

                        {os.status === "RETORNADA" &&
                          (usuarioData?.papel === "solicitante" ||
                            usuarioData?.papel === "tecnico" ||
                            usuarioData?.papel === "admin") && (
                            <Button
                              size="sm"
                              onClick={() => setOsParaReceber(os)}
                              className="h-8 px-2.5 gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>Aceite</span>
                            </Button>
                          )}

                        {(os.status === "CRIADA" || os.status === "EM_ASSISTENCIA") &&
                          (usuarioData?.papel === "admin" ||
                            os.tecnico_id === usuarioData?.id) && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setOsParaCancelar(os)}
                              className="h-8 w-8 p-0"
                              title="Cancelar OS"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal / Drawer de Detalhes da OS com Stepper */}
      {osSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <Card className="max-w-3xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-base font-bold tracking-wider">
                    {osSelecionada.numero_os}
                  </span>
                  <StatusBadge status={osSelecionada.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  {osSelecionada.equipamento.tipo}{" "}
                  {osSelecionada.equipamento.marca}{" "}
                  {osSelecionada.equipamento.modelo} (Patrimônio:{" "}
                  {osSelecionada.equipamento.patrimonio})
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOsSelecionada(null)}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>

            <div className="bg-muted/50 p-4 rounded-xl border border-border">
              <OSStepper os={osSelecionada} />
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-card p-4 rounded-xl border border-border space-y-1">
                <span className="text-[10px] uppercase font-mono font-semibold text-muted-foreground">
                  Defeito Relatado
                </span>
                <p className="text-foreground text-sm font-medium m-0">
                  {osSelecionada.descricao_defeito}
                </p>
                <p className="text-[11px] text-muted-foreground pt-1 m-0">
                  Aberto por:{" "}
                  <strong className="text-foreground">
                    {osSelecionada.tecnico_nome}
                  </strong>
                </p>
              </div>

              {osSelecionada.checkin && (
                <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/20 space-y-2">
                  <span className="text-[10px] uppercase font-mono font-semibold text-amber-400">
                    Check-in (Envio para Assistência)
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Empresa:</span>{" "}
                      <strong className="text-foreground">
                        {osSelecionada.checkin.empresa_externa}
                      </strong>
                    </div>
                    {osSelecionada.checkin.contato && (
                      <div>
                        <span className="text-muted-foreground">Contato:</span>{" "}
                        {osSelecionada.checkin.contato}
                      </div>
                    )}
                    {osSelecionada.checkin.os_externa && (
                      <div>
                        <span className="text-muted-foreground">Nº OS Externa:</span>{" "}
                        {osSelecionada.checkin.os_externa}
                      </div>
                    )}
                    {osSelecionada.checkin.valor_orcamento && (
                      <div>
                        <span className="text-muted-foreground">Orçamento:</span> R${" "}
                        {osSelecionada.checkin.valor_orcamento.toFixed(2)}
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Supervisor:</span>{" "}
                      {osSelecionada.checkin.supervisor_nome}
                    </div>
                  </div>
                  {osSelecionada.checkin.laudo_tecnico && (
                    <p className="text-xs text-muted-foreground mt-2 border-t border-amber-500/20 pt-2 m-0">
                      <strong className="text-amber-400">Laudo Técnico:</strong>{" "}
                      {osSelecionada.checkin.laudo_tecnico}
                    </p>
                  )}
                </div>
              )}

              {osSelecionada.checkout && (
                <div className="bg-purple-500/5 p-4 rounded-xl border border-purple-500/20 space-y-2">
                  <span className="text-[10px] uppercase font-mono font-semibold text-purple-400">
                    Check-out (Retorno da Assistência)
                  </span>
                  <div className="text-xs text-muted-foreground">
                    <p className="m-0">
                      <span>
                        Supervisor Responsável:
                      </span>{" "}
                      {osSelecionada.checkout.supervisor_nome}
                    </p>
                    {osSelecionada.checkout.observacoes && (
                      <p className="mt-1 m-0">
                        <span>Observações:</span>{" "}
                        {osSelecionada.checkout.observacoes}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {osSelecionada.aceite_funcionario && (
                <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20 space-y-2">
                  <span className="text-[10px] uppercase font-mono font-semibold text-emerald-400">
                    Aceite e Conclusão pelo Setor
                  </span>
                  <div className="text-xs text-muted-foreground">
                    <p className="m-0">
                      <span>
                        Servidor Responsável:
                      </span>{" "}
                      {osSelecionada.aceite_funcionario.funcionario_nome}
                    </p>
                    {osSelecionada.aceite_funcionario.observacoes && (
                      <p className="mt-1 m-0">
                        <span>Observações:</span>{" "}
                        {osSelecionada.aceite_funcionario.observacoes}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setOsSelecionada(null)}
              >
                Fechar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Confirmação de Recebimento */}
      {osParaReceber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <Card className="max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2 m-0">
              <UserCheck className="w-5 h-5 text-emerald-400" /> Confirmar
              Recebimento e Aceite
            </h3>
            <p className="text-xs text-muted-foreground m-0">
              Você está confirmando que o equipamento da{" "}
              <strong className="text-foreground font-mono">
                {osParaReceber.numero_os}
              </strong>{" "}
              foi entregue e testado com sucesso no seu setor.
            </p>

            <form onSubmit={handleConfirmarRecebimento} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Observações do Aceite (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={obsRecebimento}
                  onChange={(e) => setObsRecebimento(e.target.value)}
                  placeholder="Ex: Equipamento testado e em pleno funcionamento."
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-xs text-foreground focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOsParaReceber(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingRecebimento}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
                >
                  {submittingRecebimento ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Confirmar e Finalizar OS</span>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal de Cancelamento */}
      {osParaCancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <Card className="max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-destructive flex items-center gap-2 m-0">
              <XCircle className="w-5 h-5" /> Cancelar Ordem de Serviço
            </h3>
            <p className="text-xs text-muted-foreground m-0">
              Tem certeza que deseja cancelar a{" "}
              <strong className="text-foreground font-mono">
                {osParaCancelar.numero_os}
              </strong>
              ? O equipamento será devolvido ao status operacional.
            </p>

            <form onSubmit={handleCancelarOS} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Motivo do Cancelamento
                </label>
                <textarea
                  rows={3}
                  required
                  value={motivoCancelamento}
                  onChange={(e) => setMotivoCancelamento(e.target.value)}
                  placeholder="Informe o motivo..."
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl text-xs text-foreground focus:ring-2 focus:ring-destructive outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setOsParaCancelar(null)}
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={submittingCancelamento}
                  className="gap-2"
                >
                  {submittingCancelamento ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Confirmar Cancelamento</span>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
