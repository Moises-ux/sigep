/* eslint-disable @typescript-eslint/no-explicit-any */
export type Role = "admin" | "supervisor" | "tecnico" | "solicitante";

export type OSStatus =
  | "CRIADA" // Criada pelo Técnico de TI
  | "EM_ASSISTENCIA" // Check-in feito pelo Supervisor de TI (enviado à assistência)
  | "RETORNADA" // Check-out feito pelo Supervisor (equipamento retornou)
  | "CONCLUIDA" // Aceite confirmado pelo Solicitante/Funcionário do Setor
  | "CANCELADA" // OS Cancelada
  | "ARQUIVADA"; // OS Excluída Lógicamente / Arquivada

export type OSPrioridade = "baixa" | "media" | "alta" | "critica";

export type EquipamentoStatus = "operacional" | "em_manutencao" | "baixado";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: Role;
  setor_id: string;
  telefone?: string;
  ativo: boolean;
  criado_em?: any;
}

export interface Setor {
  id: string;
  nome: string;
  sigla: string;
  secretaria?: string;
  responsavel?: string;
  criado_em?: any;
}

export interface AssistenciaTecnica {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  endereco?: string;
  ativo: boolean;
  criado_em?: any;
}

export interface Equipamento {
  id: string;
  patrimonio?: string;
  tipo: string;
  marca: string;
  modelo: string;
  numero_serie?: string;
  setor_id: string;
  setor_anterior?: string;
  data_alocacao?: any;
  status: EquipamentoStatus;
  observacoes?: string;
  cadastrado_por_id?: string;
  cadastrado_por_nome?: string;
  criado_em?: any;
}

export interface EquipamentoResumido {
  id: string;
  patrimonio?: string;
  tipo: string;
  marca: string;
  modelo: string;
  setor_id: string;
}

export interface CheckInInfo {
  supervisor_id: string;
  supervisor_nome: string;
  data: any;
  empresa_externa: string;
  contato?: string;
  os_externa?: string;
  valor_orcamento?: number;
  laudo_tecnico?: string;
}

export interface CheckOutInfo {
  supervisor_id: string;
  supervisor_nome: string;
  data: any;
  observacoes?: string;
}

export interface AceiteFuncionarioInfo {
  funcionario_id: string;
  funcionario_nome: string;
  data: any;
  observacoes?: string;
}

export interface HistoricoObservacao {
  id: string;
  data: any;
  usuario_id: string;
  usuario_nome: string;
  acao: string;
  observacao?: string;
}

export interface UsuarioAuditInfo {
  id: string;
  nome: string;
}

export interface PrioridadeAlteradaPorInfo {
  id: string;
  nome: string;
}

export interface OrdemServico {
  id: string;
  numero_os: string;
  equipamento: EquipamentoResumido;
  descricao_defeito: string;
  prioridade?: OSPrioridade;
  justificativa_prioridade?: string;
  prioridade_alterada_por?: PrioridadeAlteradaPorInfo;
  prioridade_alterada_em?: any;
  tecnico_id: string;
  tecnico_nome: string;
  status: OSStatus;
  checkin?: CheckInInfo;
  checkout?: CheckOutInfo;
  aceite_funcionario?: AceiteFuncionarioInfo;
  assistencia_tecnica?: string;
  valor_orcamento?: number;
  previsao_retorno?: string;
  historico_observacoes?: HistoricoObservacao[];
  atualizado_por?: UsuarioAuditInfo;
  deletado?: boolean;
  deletado_por?: UsuarioAuditInfo;
  deletado_em?: any;
  restaurado_por?: UsuarioAuditInfo;
  restaurado_em?: any;
  criado_em?: any;
  atualizado_em?: any;
}
