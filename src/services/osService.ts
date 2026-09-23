import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  arrayUnion 
} from 'firebase/firestore';
import { db } from './firebase';
import type { 
  OrdemServico, 
  OSStatus, 
  EquipamentoResumido, 
  CheckInInfo, 
  CheckOutInfo, 
  AceiteFuncionarioInfo, 
  HistoricoObservacao 
} from '../types';
import { atualizarStatusEquipamento } from './equipamentosService';

const OS_COLLECTION = 'ordens_servico';

const gerarNumeroOS = (): string => {
  const ano = new Date().getFullYear();
  const aleatorio = Math.floor(1000 + Math.random() * 9000);
  return `OS-${ano}-${aleatorio}`;
};

export const getOrdensServico = async (): Promise<OrdemServico[]> => {
  const q = query(collection(db, OS_COLLECTION), orderBy('criado_em', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as OrdemServico[];
};

export const getOSById = async (id: string): Promise<OrdemServico | null> => {
  const docRef = doc(db, OS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as OrdemServico;
};

export const getOrdensServicoByStatus = async (status: OSStatus): Promise<OrdemServico[]> => {
  const q = query(
    collection(db, OS_COLLECTION),
    where('status', '==', status)
  );
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as OrdemServico[];
  return list.sort((a, b) => {
    const tA = a.criado_em?.seconds || 0;
    const tB = b.criado_em?.seconds || 0;
    return tB - tA;
  });
};

export const getOrdensServicoBySetor = async (setor_id: string): Promise<OrdemServico[]> => {
  const q = query(
    collection(db, OS_COLLECTION),
    where('equipamento.setor_id', '==', setor_id)
  );
  const snapshot = await getDocs(q);
  const list = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as OrdemServico[];
  return list.sort((a, b) => {
    const tA = a.criado_em?.seconds || 0;
    const tB = b.criado_em?.seconds || 0;
    return tB - tA;
  });
};

export const abrirOS = async (dados: {
  equipamento: EquipamentoResumido;
  tecnicoId: string;
  tecnicoNome: string;
  defeitoRelatado: string;
}): Promise<string> => {
  const numero_os = gerarNumeroOS();
  const agora = new Date().toISOString();

  const primeiroHistorico: HistoricoObservacao = {
    id: crypto.randomUUID(),
    data: agora,
    usuario_id: dados.tecnicoId,
    usuario_nome: dados.tecnicoNome,
    acao: 'Abertura de OS',
    observacao: `OS criada com defeito relatado: "${dados.defeitoRelatado}"`,
  };

  const novaOS: Omit<OrdemServico, 'id'> = {
    numero_os,
    equipamento: dados.equipamento,
    tecnico_id: dados.tecnicoId,
    tecnico_nome: dados.tecnicoNome,
    descricao_defeito: dados.defeitoRelatado,
    status: 'CRIADA',
    criado_em: serverTimestamp(),
    atualizado_em: serverTimestamp(),
    historico_observacoes: [primeiroHistorico],
  };

  const docRef = await addDoc(collection(db, OS_COLLECTION), novaOS);

  await atualizarStatusEquipamento(dados.equipamento.id, 'em_manutencao');

  return docRef.id;
};

export const realizarCheckIn = async (dados: {
  osId: string;
  supervisorId: string;
  supervisorNome: string;
  empresaExterna: string;
  contato?: string;
  laudoTecnico?: string;
}): Promise<void> => {
  const docRef = doc(db, OS_COLLECTION, dados.osId);
  const agora = new Date().toISOString();

  const checkinData: CheckInInfo = {
    supervisor_id: dados.supervisorId,
    supervisor_nome: dados.supervisorNome,
    data: agora,
    empresa_externa: dados.empresaExterna,
  };

  if (dados.contato && dados.contato.trim() !== "") {
    checkinData.contato = dados.contato.trim();
  }
  if (dados.laudoTecnico && dados.laudoTecnico.trim() !== "") {
    checkinData.laudo_tecnico = dados.laudoTecnico.trim();
  }

  await updateDoc(docRef, {
    status: 'EM_ASSISTENCIA',
    checkin: checkinData,
    atualizado_em: serverTimestamp(),
  });
};

export const realizarCheckOut = async (dados: {
  osId: string;
  supervisorId: string;
  supervisorNome: string;
  observacoes?: string;
}): Promise<void> => {
  const docRef = doc(db, OS_COLLECTION, dados.osId);
  const agora = new Date().toISOString();

  const checkoutData: CheckOutInfo = {
    supervisor_id: dados.supervisorId,
    supervisor_nome: dados.supervisorNome,
    data: agora,
    observacoes: dados.observacoes || 'Equipamento retornou da assistência externa.',
  };

  await updateDoc(docRef, {
    status: 'RETORNADA',
    checkout: checkoutData,
    atualizado_em: serverTimestamp(),
  });
};

export const confirmarRecebimento = async (dados: {
  osId: string;
  equipamentoId?: string;
  funcionarioId: string;
  funcionarioNome: string;
  observacoes?: string;
}): Promise<void> => {
  const docRef = doc(db, OS_COLLECTION, dados.osId);
  const agora = new Date().toISOString();

  const aceiteData: AceiteFuncionarioInfo = {
    funcionario_id: dados.funcionarioId,
    funcionario_nome: dados.funcionarioNome,
    data: agora,
    observacoes: dados.observacoes || 'Recebimento e teste confirmados no setor.',
  };

  await updateDoc(docRef, {
    status: 'CONCLUIDA',
    aceite_funcionario: aceiteData,
    atualizado_em: serverTimestamp(),
  });

  if (dados.equipamentoId) {
    await atualizarStatusEquipamento(dados.equipamentoId, 'operacional');
  }
};

export const cancelarOS = async (dados: {
  osId: string;
  equipamentoId: string;
  usuarioId: string;
  usuarioNome: string;
  motivo: string;
}): Promise<void> => {
  const docRef = doc(db, OS_COLLECTION, dados.osId);
  const agora = new Date().toISOString();

  const eventoHistorico: HistoricoObservacao = {
    id: crypto.randomUUID(),
    data: agora,
    usuario_id: dados.usuarioId,
    usuario_nome: dados.usuarioNome,
    acao: 'Cancelamento de OS',
    observacao: `Motivo: ${dados.motivo}`,
  };

  await updateDoc(docRef, {
    status: 'CANCELADA',
    historico_observacoes: arrayUnion(eventoHistorico),
    atualizado_em: serverTimestamp(),
  });

  await atualizarStatusEquipamento(dados.equipamentoId, 'operacional');
};
