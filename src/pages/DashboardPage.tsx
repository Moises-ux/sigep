/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  Edit3,
  Eye,
  FileText,
  HardDrive,
  Inbox,
  Loader2,
  Lock,
  RotateCcw,
  Search,
  Trash2,
  UserCheck,
  Wrench,
  XCircle,
} from "lucide-react";

import { OSStepper } from "../components/OSStepper";
import { SkeletonTable } from "../components/SkeletonLoader";
import { StatusBadge } from "../components/StatusBadge";
import { PriorityBadge } from "../components/PriorityBadge";
import { ConfirmModal } from "../components/ConfirmModal";
import { EditarOSModal } from "../components/EditarOSModal";
import { useAuth } from "../contexts/AuthContext";
import {
  atualizarPrioridadeOS,
  cancelarOS,
  confirmarRecebimento,
  getOSById,
  getOrdensServico,
  getOrdensServicoBySetor,
  hardDeleteOS,
  restaurarOS,
  softDeleteOS,
} from "../services/osService";
import { getSetores } from "../services/setoresService";
import type { OrdemServico, OSPrioridade, Setor } from "../types";

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
  const [setorFiltro, setSetorFiltro] = useState<string>("TODOS");
  const [prioridadeFiltro, setPrioridadeFiltro] = useState<string>("TODOS");
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

  const isAdmin = usuarioData?.papel === "admin";
  const isSupervisor = usuarioData?.papel === "supervisor" || isAdmin;
  const isTecnico = usuarioData?.papel === "tecnico" || isSupervisor;
  const canEditPriority = isTecnico;

  const [editandoPrioridade, setEditandoPrioridade] = useState(false);
  const [novaPrioridadeVal, setNovaPrioridadeVal] = useState<OSPrioridade>("baixa");
  const [novaJustificativaVal, setNovaJustificativaVal] = useState("");
  const [submittingPrioridade, setSubmittingPrioridade] = useState(false);
  const [erroPrioridade, setErroPrioridade] = useState<string | null>(null);

  // Modal de Edição de OS
  const [osParaEditar, setOsParaEditar] = useState<OrdemServico | null>(null);

  // Modal de Soft Delete (Arquivamento)
  const [osParaArquivar, setOsParaArquivar] = useState<OrdemServico | null>(null);
  const [motivoArquivamento, setMotivoArquivamento] = useState("");
  const [submittingArquivamento, setSubmittingArquivamento] = useState(false);

  // Modal de Hard Delete (Exclusão Física Definitiva)
  const [osParaExcluirHard, setOsParaExcluirHard] = useState<OrdemServico | null>(null);
  const [submittingExclusaoHard, setSubmittingExclusaoHard] = useState(false);

  // Modal de Restauração de OS (Admin)
  const [osParaRestaurar, setOsParaRestaurar] = useState<OrdemServico | null>(null);
  const [submittingRestauracao, setSubmittingRestauracao] = useState(false);

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

  const handleSalvarPrioridade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!osSelecionada || !usuarioData || !canEditPriority) return;

    if (
      osSelecionada.status === "CONCLUIDA" ||
      osSelecionada.status === "CANCELADA" ||
      osSelecionada.status === "ARQUIVADA"
    ) {
      setErroPrioridade(
        "Não é permitido alterar a prioridade de uma Ordem de Serviço concluída, cancelada ou arquivada."
      );
      return;
    }

    if (
      (novaPrioridadeVal === "alta" || novaPrioridadeVal === "critica") &&
      !novaJustificativaVal.trim()
    ) {
      setErroPrioridade(
        "A justificativa é obrigatória para prioridades Alta ou Crítica/Urgente."
      );
      return;
    }

    setSubmittingPrioridade(true);
    setErroPrioridade(null);

    try {
      await atualizarPrioridadeOS({
        osId: osSelecionada.id,
        novaPrioridade: novaPrioridadeVal,
        justificativaPrioridade: novaJustificativaVal.trim() || undefined,
        usuarioId: usuarioData.id,
        usuarioNome: usuarioData.nome,
      });

      setEditandoPrioridade(false);
      await carregarDados();
      const updated = await getOSById(osSelecionada.id);
      if (updated) setOsSelecionada(updated);
    } catch (err: any) {
      console.error("Erro ao alterar prioridade:", err);
      setErroPrioridade(err.message || "Falha ao alterar prioridade da OS.");
    } finally {
      setSubmittingPrioridade(false);
    }
  };

  const handleConfirmarSoftDelete = async () => {
    if (!osParaArquivar || !usuarioData || !isSupervisor) return;

    setSubmittingArquivamento(true);
    try {
      await softDeleteOS({
        osId: osParaArquivar.id,
        equipamentoId: osParaArquivar.equipamento.id,
        usuarioId: usuarioData.id,
        usuarioNome: usuarioData.nome,
        motivo: motivoArquivamento.trim(),
      });

      setOsParaArquivar(null);
      setMotivoArquivamento("");
      if (osSelecionada?.id === osParaArquivar.id) {
        setOsSelecionada(null);
      }
      await carregarDados();
    } catch (err) {
      console.error("Erro ao arquivar (soft delete) OS:", err);
    } finally {
      setSubmittingArquivamento(false);
    }
  };

  const handleConfirmarHardDelete = async () => {
    if (!osParaExcluirHard || !usuarioData || !isAdmin) return;

    setSubmittingExclusaoHard(true);
    try {
      await hardDeleteOS({
        osId: osParaExcluirHard.id,
        equipamentoId: osParaExcluirHard.equipamento.id,
      });

      setOsParaExcluirHard(null);
      if (osSelecionada?.id === osParaExcluirHard.id) {
        setOsSelecionada(null);
      }
      await carregarDados();
    } catch (err) {
      console.error("Erro ao excluir permanentemente OS:", err);
    } finally {
      setSubmittingExclusaoHard(false);
    }
  };

  const handleConfirmarRestauracao = async () => {
    if (!osParaRestaurar || !usuarioData || !isAdmin) return;

    setSubmittingRestauracao(true);
    try {
      await restaurarOS({
        osId: osParaRestaurar.id,
        equipamentoId: osParaRestaurar.equipamento.id,
        usuarioId: usuarioData.id,
        usuarioNome: usuarioData.nome,
      });

      setOsParaRestaurar(null);
      if (osSelecionada?.id === osParaRestaurar.id) {
        setOsSelecionada(null);
      }
      await carregarDados();
    } catch (err) {
      console.error("Erro ao restaurar OS:", err);
    } finally {
      setSubmittingRestauracao(false);
    }
  };

  const getSetorInfo = (id: string) => {
    const s = setores.find((item) => item.id === id);
    return s ? `${s.sigla} - ${s.nome}` : "Setor não identificado";
  };

  const formatarData = (val: any): string => {
    if (!val) return "—";
    let d: Date | null = null;
    if (typeof val?.toDate === "function") {
      d = val.toDate();
    } else if (val?.seconds) {
      d = new Date(val.seconds * 1000);
    } else if (val instanceof Date) {
      d = val;
    } else if (typeof val === "string" || typeof val === "number") {
      d = new Date(val);
    }
    if (!d || isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const ordensPorSetor = ordens.filter((o) => {
    return setorFiltro === "TODOS" || o.equipamento.setor_id === setorFiltro;
  });

  const ordensAtivas = ordensPorSetor.filter((o) => !o.deletado && o.status !== "ARQUIVADA");
  const ordensArquivadas = ordensPorSetor.filter((o) => o.deletado || o.status === "ARQUIVADA");

  const totalOS = ordensAtivas.length;
  const criadasOS = ordensAtivas.filter((o) => o.status === "CRIADA").length;
  const assistenciaOS = ordensAtivas.filter(
    (o) => o.status === "EM_ASSISTENCIA"
  ).length;
  const retornadasOS = ordensAtivas.filter((o) => o.status === "RETORNADA").length;
  const concluidasOS = ordensAtivas.filter((o) => o.status === "CONCLUIDA").length;
  const arquivadasOSCount = ordensArquivadas.length;

  const ordensFiltradas = ordensPorSetor.filter((o) => {
    if (statusFiltro === "ARQUIVADA") {
      if (!o.deletado && o.status !== "ARQUIVADA") return false;
    } else {
      if (o.deletado || o.status === "ARQUIVADA") return false;
      if (statusFiltro !== "TODOS" && o.status !== statusFiltro) return false;
    }

    const atendePrioridade =
      prioridadeFiltro === "TODOS" || (o.prioridade || "baixa") === prioridadeFiltro;
    const atendeBusca =
      o.numero_os.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.descricao_defeito.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.equipamento.patrimonio || "").toLowerCase().includes(searchTerm.toLowerCase());
    return atendePrioridade && atendeBusca;
  });

  const limparFiltros = () => {
    setStatusFiltro("TODOS");
    setSetorFiltro("TODOS");
    setPrioridadeFiltro("TODOS");
    setSearchTerm("");
  };

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
        <CardContent className="p-4 flex flex-col lg:flex-row gap-4 items-center justify-between flex-wrap">
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 w-full">
            {/* Campo de Pesquisa */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              <Input
                type="text"
                placeholder="Pesquisar por protocolo OS, patrimônio ou defeito..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs font-mono"
              />
            </div>

            {/* Filtro por Setor (Visível apenas para perfis de TI / Admin) */}
            {usuarioData?.papel !== "solicitante" && (
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                <select
                  value={setorFiltro}
                  onChange={(e) => setSetorFiltro(e.target.value)}
                  className="w-full sm:w-auto h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground font-medium cursor-pointer"
                >
                  <option value="TODOS">Todos os Setores</option>
                  {setores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.sigla} - {s.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtro por Nível de Prioridade */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />
              <select
                value={prioridadeFiltro}
                onChange={(e) => setPrioridadeFiltro(e.target.value)}
                className="w-full sm:w-auto h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground font-medium cursor-pointer"
              >
                <option value="TODOS">Todas as Prioridades</option>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica/Urgente</option>
              </select>
            </div>
          </div>

          {/* Botões de Filtro por Status */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
            {[
              { id: "TODOS", label: "Todas", count: totalOS },
              { id: "CRIADA", label: "Criadas", count: criadasOS },
              { id: "EM_ASSISTENCIA", label: "Em Reparo", count: assistenciaOS },
              { id: "RETORNADA", label: "Retornadas", count: retornadasOS },
              { id: "CONCLUIDA", label: "Concluídas", count: concluidasOS },
              ...(isAdmin ? [{ id: "ARQUIVADA", label: "Lixeira / Arquivadas", count: arquivadasOSCount }] : []),
            ].map((st) => (
              <Button
                key={st.id}
                variant={statusFiltro === st.id ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFiltro(st.id)}
                className="gap-1.5 text-xs h-8 shrink-0"
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
              Não há registros com os filtros aplicados. Altere o termo de pesquisa ou selecione outro setor / status.
            </p>
          </div>
          {(statusFiltro !== "TODOS" || setorFiltro !== "TODOS" || searchTerm !== "") && (
            <Button variant="link" size="sm" onClick={limparFiltros}>
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
                  <TableHead className="w-[130px]">Prioridade</TableHead>
                  <TableHead className="w-[160px]">Status</TableHead>
                  <TableHead>Equipamento & Defeito</TableHead>
                  <TableHead className="min-w-[200px]">Patrimônio / Setor</TableHead>
                  <TableHead className="w-[150px]">Data de Criação</TableHead>
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
                      <PriorityBadge prioridade={os.prioridade} size="sm" />
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
                      <div className="text-xs space-y-1">
                        <div className="text-muted-foreground font-mono">
                          Pat: <strong className="text-foreground">{os.equipamento.patrimonio}</strong>
                        </div>
                        <div className="text-foreground font-medium leading-tight whitespace-normal">
                          {getSetorInfo(os.equipamento.setor_id)}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs text-muted-foreground font-mono whitespace-nowrap space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>{formatarData(os.criado_em)}</span>
                        </div>
                        {isAdmin && (os.deletado || os.status === "ARQUIVADA") && os.deletado_em && (
                          <div className="flex items-center gap-1 text-[11px] text-red-400 font-sans font-medium">
                            <Trash2 className="w-3 h-3 shrink-0" />
                            <span>Excluído: {formatarData(os.deletado_em)}</span>
                          </div>
                        )}
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

                        {isTecnico && !os.deletado && os.status !== "CONCLUIDA" && os.status !== "CANCELADA" && os.status !== "ARQUIVADA" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOsParaEditar(os)}
                            className="h-8 px-2 gap-1 text-xs text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
                            title="Editar dados da OS"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Editar</span>
                          </Button>
                        )}

                        {os.status === "RETORNADA" &&
                          !os.deletado &&
                          (usuarioData?.papel === "solicitante" || isTecnico) && (
                            <Button
                              size="sm"
                              onClick={() => setOsParaReceber(os)}
                              className="h-8 px-2.5 gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>Aceite</span>
                            </Button>
                          )}

                        {isSupervisor && os.status === "CRIADA" && !os.deletado && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOsParaArquivar(os)}
                            className="h-8 px-2 gap-1 text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                            title="Excluir OS (Soft Delete)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Excluir</span>
                          </Button>
                        )}

                        {(os.status === "CRIADA" || os.status === "EM_ASSISTENCIA") &&
                          !os.deletado &&
                          (isAdmin || os.tecnico_id === usuarioData?.id) && (
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

                        {isAdmin && (os.deletado || os.status === "ARQUIVADA") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOsParaRestaurar(os)}
                            className="h-8 px-2 gap-1 text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                            title="Restaurar OS da Lixeira"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Restaurar</span>
                          </Button>
                        )}

                        {isAdmin && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setOsParaExcluirHard(os)}
                            className="h-8 w-8 p-0"
                            title="Exclusão Física Definitiva (Hard Delete)"
                          >
                            <Trash2 className="w-4 h-4" />
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
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-base font-bold tracking-wider">
                    {osSelecionada.numero_os}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <PriorityBadge prioridade={osSelecionada.prioridade} />

                    {canEditPriority &&
                    osSelecionada.status !== "CONCLUIDA" &&
                    osSelecionada.status !== "CANCELADA" &&
                    osSelecionada.status !== "ARQUIVADA" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => {
                          setEditandoPrioridade(!editandoPrioridade);
                          setNovaPrioridadeVal(osSelecionada.prioridade || "baixa");
                          setNovaJustificativaVal(osSelecionada.justificativa_prioridade || "");
                          setErroPrioridade(null);
                        }}
                        className="h-6 px-2 text-[10px] gap-1 font-medium cursor-pointer"
                        title="Alterar prioridade da OS"
                      >
                        <Edit3 className="w-3 h-3 text-muted-foreground" />
                        <span>Alterar Prioridade</span>
                      </Button>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="h-6 px-2 text-[10px] gap-1 font-normal opacity-80 cursor-not-allowed"
                        title={
                          osSelecionada.status === "CONCLUIDA" ||
                          osSelecionada.status === "CANCELADA" ||
                          osSelecionada.status === "ARQUIVADA"
                            ? "Não é possível alterar a prioridade de uma OS concluída, cancelada ou arquivada"
                            : "Visualização em apenas leitura para solicitantes"
                        }
                      >
                        <Lock className="w-3 h-3 text-muted-foreground" />
                        <span>
                          {osSelecionada.status === "CONCLUIDA" ||
                          osSelecionada.status === "CANCELADA" ||
                          osSelecionada.status === "ARQUIVADA"
                            ? "Prioridade Bloqueada"
                            : "Somente Leitura"}
                        </span>
                      </Badge>
                    )}
                  </div>

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
                onClick={() => {
                  setOsSelecionada(null);
                  setEditandoPrioridade(false);
                }}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>

            {editandoPrioridade &&
              canEditPriority &&
              osSelecionada.status !== "CONCLUIDA" &&
              osSelecionada.status !== "CANCELADA" &&
              osSelecionada.status !== "ARQUIVADA" && (
              <form onSubmit={handleSalvarPrioridade} className="bg-muted/80 p-4 rounded-xl border border-border space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase font-mono text-foreground">
                    Alteração de Nível de Prioridade
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => setEditandoPrioridade(false)}
                    className="h-6 text-[11px] px-2"
                  >
                    Cancelar
                  </Button>
                </div>

                {erroPrioridade && (
                  <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
                    {erroPrioridade}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase font-mono">
                      Novo Nível de Prioridade
                    </label>
                    <select
                      value={novaPrioridadeVal}
                      onChange={(e) => setNovaPrioridadeVal(e.target.value as OSPrioridade)}
                      className="w-full h-9 px-3 bg-background border border-input rounded-md text-xs font-mono text-foreground focus:ring-1 focus:ring-ring outline-none"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                      <option value="critica">Crítica/Urgente</option>
                    </select>
                  </div>

                  {(novaPrioridadeVal === "alta" || novaPrioridadeVal === "critica") && (
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-400 mb-1 uppercase font-mono">
                        Justificativa da Prioridade *
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={novaJustificativaVal}
                        onChange={(e) => setNovaJustificativaVal(e.target.value)}
                        placeholder="Descreva a justificativa para definir a OS como Alta ou Crítica..."
                        className="w-full p-2.5 bg-background border border-amber-500/40 rounded-md text-xs text-foreground focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={submittingPrioridade}
                    className="h-8 text-xs gap-1.5"
                  >
                    {submittingPrioridade ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Confirmar e Salvar Prioridade"
                    )}
                  </Button>
                </div>
              </form>
            )}

            <div className="bg-muted/50 p-4 rounded-xl border border-border">
              <OSStepper os={osSelecionada} />
            </div>

            <div className="space-y-4 text-xs">
              {isAdmin && (osSelecionada.deletado || osSelecionada.status === "ARQUIVADA") && (
                <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[10px] uppercase font-mono font-semibold text-red-400 flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5" />
                      OS Excluída / Arquivada pelo Supervisor
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setOsParaRestaurar(osSelecionada)}
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar OS</span>
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {osSelecionada.deletado_em && (
                      <div>
                        <span className="text-muted-foreground">Data da Exclusão:</span>{" "}
                        <strong className="text-foreground font-mono">
                          {formatarData(osSelecionada.deletado_em)}
                        </strong>
                      </div>
                    )}
                    {osSelecionada.deletado_por && (
                      <div>
                        <span className="text-muted-foreground">Excluído por:</span>{" "}
                        <strong className="text-foreground">
                          {osSelecionada.deletado_por.nome}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-card p-4 rounded-xl border border-border space-y-1">
                <span className="text-[10px] uppercase font-mono font-semibold text-muted-foreground">
                  Defeito Relatado
                </span>
                <p className="text-foreground text-sm font-medium m-0">
                  {osSelecionada.descricao_defeito}
                </p>
                {(osSelecionada.prioridade === "alta" || osSelecionada.prioridade === "critica") &&
                  osSelecionada.justificativa_prioridade && (
                    <div className="mt-2.5 pt-2 border-t border-border/40">
                      <span className="text-[10px] uppercase font-mono font-semibold text-amber-400">
                        Justificativa da Prioridade
                      </span>
                      <p className="text-foreground text-xs mt-0.5 m-0 font-normal">
                        {osSelecionada.justificativa_prioridade}
                      </p>
                    </div>
                  )}
                {osSelecionada.prioridade_alterada_por && (
                  <div className="mt-2.5 pt-2 border-t border-border/40 text-[11px] text-muted-foreground font-mono flex flex-wrap items-center gap-1.5">
                    <span>Prioridade alterada por:</span>
                    <strong className="text-foreground">{osSelecionada.prioridade_alterada_por.nome}</strong>
                    {osSelecionada.prioridade_alterada_em && (
                      <span>em {formatarData(osSelecionada.prioridade_alterada_em)}</span>
                    )}
                  </div>
                )}
                {osSelecionada.restaurado_por && (
                  <div className="mt-2.5 pt-2 border-t border-border/40 text-[11px] text-emerald-400 font-mono flex flex-wrap items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                    <span>Restaurado por:</span>
                    <strong className="text-foreground">{osSelecionada.restaurado_por.nome}</strong>
                    {osSelecionada.restaurado_em && (
                      <span>em {formatarData(osSelecionada.restaurado_em)}</span>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground pt-1.5 m-0 border-t border-border/40">
                  <p className="m-0">
                    Aberto por:{" "}
                    <strong className="text-foreground">
                      {osSelecionada.tecnico_nome}
                    </strong>
                  </p>
                  {osSelecionada.criado_em && (
                    <p className="m-0 font-mono">
                      <span>Data de Criação:</span>{" "}
                      <strong className="text-foreground">{formatarData(osSelecionada.criado_em)}</strong>
                    </p>
                  )}
                </div>
              </div>

              {osSelecionada.checkin && (
                <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/20 space-y-2">
                  <span className="text-[10px] uppercase font-mono font-semibold text-amber-400">
                    Check-in (Envio para Assistência)
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Data do Check-in:</span>{" "}
                      <strong className="text-foreground font-mono">
                        {formatarData(osSelecionada.checkin.data)}
                      </strong>
                    </div>
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
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Data do Check-out:</span>{" "}
                      <strong className="text-foreground font-mono">
                        {formatarData(osSelecionada.checkout.data)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Supervisor Responsável:</span>{" "}
                      <strong className="text-foreground">
                        {osSelecionada.checkout.supervisor_nome}
                      </strong>
                    </div>
                  </div>
                  {osSelecionada.checkout.observacoes && (
                    <p className="mt-1 m-0 text-xs text-muted-foreground">
                      <span className="font-semibold text-purple-300">Observações:</span>{" "}
                      {osSelecionada.checkout.observacoes}
                    </p>
                  )}
                </div>
              )}

              {osSelecionada.aceite_funcionario && (
                <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20 space-y-2">
                  <span className="text-[10px] uppercase font-mono font-semibold text-emerald-400">
                    Aceite e Conclusão pelo Setor (Recebimento)
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Data de Recebimento:</span>{" "}
                      <strong className="text-foreground font-mono">
                        {formatarData(osSelecionada.aceite_funcionario.data)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Servidor Responsável:</span>{" "}
                      <strong className="text-foreground">
                        {osSelecionada.aceite_funcionario.funcionario_nome}
                      </strong>
                    </div>
                  </div>
                  {osSelecionada.aceite_funcionario.observacoes && (
                    <p className="mt-1 m-0 text-xs text-muted-foreground">
                      <span className="font-semibold text-emerald-300">Observações:</span>{" "}
                      {osSelecionada.aceite_funcionario.observacoes}
                    </p>
                  )}
                </div>
              )}

              {osSelecionada.status === "CANCELADA" && (() => {
                const eventoCancelamento = osSelecionada.historico_observacoes?.find(
                  (h) => h.acao === "Cancelamento de OS"
                );
                return (
                  <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/20 space-y-2">
                    <span className="text-[10px] uppercase font-mono font-semibold text-red-400 flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" />
                      OS Cancelada
                    </span>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {eventoCancelamento ? (
                        <>
                          <p className="m-0">
                            <span>Cancelada por:</span>{" "}
                            <strong className="text-foreground">
                              {eventoCancelamento.usuario_nome}
                            </strong>
                          </p>
                          {eventoCancelamento.observacao && (
                            <p className="m-0 mt-1">
                              <span className="text-red-400 font-semibold">Motivo:</span>{" "}
                              <span className="text-foreground">
                                {eventoCancelamento.observacao.replace(/^Motivo:\s*/i, "")}
                              </span>
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="m-0 text-muted-foreground">
                          Motivo não informado.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
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

      {/* Modal de Edição de OS */}
      <EditarOSModal
        os={osParaEditar}
        isOpen={!!osParaEditar}
        onClose={() => setOsParaEditar(null)}
        onSuccess={async () => {
          await carregarDados();
          if (osSelecionada && osParaEditar && osSelecionada.id === osParaEditar.id) {
            const updated = await getOSById(osSelecionada.id);
            if (updated) setOsSelecionada(updated);
          }
        }}
      />

      {/* Modal de Confirmação de Soft Delete (Exclusão por Supervisor) */}
      <ConfirmModal
        isOpen={!!osParaArquivar}
        title={`Excluir OS (${osParaArquivar?.numero_os || ""})`}
        variant="warning"
        loading={submittingArquivamento}
        confirmText="Confirmar Exclusão"
        onClose={() => {
          setOsParaArquivar(null);
          setMotivoArquivamento("");
        }}
        onConfirm={handleConfirmarSoftDelete}
        description={
          <div className="space-y-3">
            <p className="m-0">
              Esta ação realiza a <strong>exclusão lógica (Soft Delete)</strong>. A OS será removida da listagem padrão e seu status passará para <strong>Arquivada</strong>.
            </p>
            <div>
              <label className="block text-[11px] font-semibold uppercase text-muted-foreground mb-1 font-mono">
                Motivo da Exclusão (Opcional)
              </label>
              <textarea
                rows={2}
                value={motivoArquivamento}
                onChange={(e) => setMotivoArquivamento(e.target.value)}
                placeholder="Ex: Registro duplicado ou cancelado..."
                className="w-full p-2 bg-background border border-input rounded-md text-xs text-foreground outline-none"
              />
            </div>
          </div>
        }
      />

      {/* Modal de Confirmação de Hard Delete (Exclusão Definitiva - Admin) */}
      <ConfirmModal
        isOpen={!!osParaExcluirHard}
        title="Exclusão Física Definitiva (Hard Delete)"
        variant="destructive"
        loading={submittingExclusaoHard}
        confirmText="Excluir Definitivamente"
        onClose={() => setOsParaExcluirHard(null)}
        onConfirm={handleConfirmarHardDelete}
        description={
          <div className="space-y-2">
            <p className="m-0 text-red-400 font-semibold">
              ATENÇÃO: Ação Irreversível!
            </p>
            <p className="m-0">
              Você está prestes a remover definitivamente a Ordem de Serviço{" "}
              <strong className="font-mono text-foreground">{osParaExcluirHard?.numero_os}</strong>{" "}
              do banco de dados Firestore (`deleteDoc`).
            </p>
            <p className="m-0 text-[11px] text-muted-foreground">
              Esta ação apagará todo o histórico e não poderá ser desfeita.
            </p>
          </div>
        }
      />

      {/* Modal de Confirmação de Restauração de OS (Admin) */}
      <ConfirmModal
        isOpen={!!osParaRestaurar}
        title={`Restaurar OS (${osParaRestaurar?.numero_os || ""})`}
        variant="warning"
        loading={submittingRestauracao}
        confirmText="Confirmar Restauração"
        onClose={() => setOsParaRestaurar(null)}
        onConfirm={handleConfirmarRestauracao}
        description={
          <div className="space-y-2">
            <p className="m-0">
              Você está prestes a restaurar a Ordem de Serviço{" "}
              <strong className="font-mono text-foreground">{osParaRestaurar?.numero_os}</strong>{" "}
              da lixeira.
            </p>
            <p className="m-0 text-[11px] text-muted-foreground">
              Ao restaurar, o status retornará para <strong>CRIADA</strong>, a OS voltará para a listagem principal e o equipamento será redefinido para status de manutenção.
            </p>
          </div>
        }
      />
    </div>
  );
};
