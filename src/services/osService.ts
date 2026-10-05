/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type {
  AceiteFuncionarioInfo,
  CheckInInfo,
  CheckOutInfo,
  EquipamentoResumido,
  HistoricoObservacao,
  OrdemServico,
  OSPrioridade,
  OSStatus,
  TipoAssistencia,
} from "../types";
import {
  atualizarStatusEquipamento,
  incrementarManutencoesConcluidas,
} from "./equipamentosService";
import { db } from "./firebase";

const OS_COLLECTION = "ordens_servico";

const gerarNumeroOS = (): string => {
  const ano = new Date().getFullYear();
  const aleatorio = Math.floor(1000 + Math.random() * 9000);
  return `OS-${ano}-${aleatorio}`;
};

export const getOrdensServico = async (): Promise<OrdemServico[]> => {
  const q = query(collection(db, OS_COLLECTION), orderBy("criado_em", "desc"));
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

export const getOrdensServicoByStatus = async (
  status: OSStatus
): Promise<OrdemServico[]> => {
  const q = query(collection(db, OS_COLLECTION), where("status", "==", status));
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

export const getOrdensServicoBySetor = async (
  setor_id: string
): Promise<OrdemServico[]> => {
  const q = query(
    collection(db, OS_COLLECTION),
    where("equipamento.setor_id", "==", setor_id)
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

export const getOrdensServicoByTecnico = async (
  tecnico_id: string
): Promise<OrdemServico[]> => {
  const q = query(
    collection(db, OS_COLLECTION),
    where("tecnico_id", "==", tecnico_id)
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
  tipoAssistencia?: TipoAssistencia;
  prioridade?: OSPrioridade;
  justificativaPrioridade?: string;
  previsaoRetorno?: string;
}): Promise<string> => {
  const numero_os = gerarNumeroOS();
  const agora = new Date().toISOString();
  const prioridadeVal = dados.prioridade || "baixa";
  const tipoAssistenciaVal = dados.tipoAssistencia || "interna";

  const primeiroHistorico: HistoricoObservacao = {
    id: crypto.randomUUID(),
    data: agora,
    usuario_id: dados.tecnicoId,
    usuario_nome: dados.tecnicoNome,
    acao: "Abertura de OS",
    observacao: `OS criada (${tipoAssistenciaVal === "interna" ? "Assistência Interna" : "Assistência Externa"}) com defeito relatado: "${dados.defeitoRelatado}" (Prioridade: ${prioridadeVal})`,
  };

  const novaOS: Omit<OrdemServico, "id"> = {
    numero_os,
    equipamento: dados.equipamento,
    tecnico_id: dados.tecnicoId,
    tecnico_nome: dados.tecnicoNome,
    tipo_assistencia: tipoAssistenciaVal,
    descricao_defeito: dados.defeitoRelatado,
    prioridade: prioridadeVal,
    ...(dados.justificativaPrioridade?.trim()
      ? { justificativa_prioridade: dados.justificativaPrioridade.trim() }
      : {}),
    ...(dados.previsaoRetorno?.trim()
      ? { previsao_retorno: dados.previsaoRetorno.trim() }
      : {}),
    status: "CRIADA",
    criado_em: serverTimestamp(),
    atualizado_em: serverTimestamp(),
    historico_observacoes: [primeiroHistorico],
  };

  const docRef = await addDoc(collection(db, OS_COLLECTION), novaOS);

  await atualizarStatusEquipamento(dados.equipamento.id, "em_manutencao");

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
    status: "EM_ASSISTENCIA",
    checkin: checkinData,
    atualizado_em: serverTimestamp(),
  });
};

export const realizarCheckInExpressoInterno = async (dados: {
  osId: string;
  usuarioId: string;
  usuarioNome: string;
  servicoRealizado: string;
  pecasInsumos?: string;
  destino: "RETORNADA" | "CONCLUIDA" | "EM_ASSISTENCIA";
  observacaoAceite?: string;
  equipamentoId?: string;
}): Promise<void> => {
  const docRef = doc(db, OS_COLLECTION, dados.osId);
  const agora = new Date().toISOString();

  const insumosTxt = dados.pecasInsumos?.trim()
    ? ` (Insumos/Peças: ${dados.pecasInsumos.trim()})`
    : "";

  const checkinData: CheckInInfo = {
    supervisor_id: dados.usuarioId,
    supervisor_nome: dados.usuarioNome,
    data: agora,
    empresa_externa: "Atendimento Interno (Técnico Local)",
    laudo_tecnico: `${dados.servicoRealizado.trim()}${insumosTxt}`,
  };

  if (dados.destino === "EM_ASSISTENCIA") {
    const eventoHistorico: HistoricoObservacao = {
      id: crypto.randomUUID(),
      data: agora,
      usuario_id: dados.usuarioId,
      usuario_nome: dados.usuarioNome,
      acao: "Início de Atendimento Interno",
      observacao: `Equipamento assumido na bancada/local. Diagnóstico/Ação: "${dados.servicoRealizado.trim()}"${insumosTxt}`,
    };

    await updateDoc(docRef, {
      status: "EM_ASSISTENCIA",
      checkin: checkinData,
      historico_observacoes: arrayUnion(eventoHistorico),
      atualizado_em: serverTimestamp(),
    });
    return;
  }

  const checkoutData: CheckOutInfo = {
    supervisor_id: dados.usuarioId,
    supervisor_nome: dados.usuarioNome,
    data: agora,
    observacoes: `Atendimento interno concluído. Serviço: ${dados.servicoRealizado.trim()}${insumosTxt}`,
  };

  if (dados.destino === "CONCLUIDA") {
    const aceiteData: AceiteFuncionarioInfo = {
      funcionario_id: dados.usuarioId,
      funcionario_nome: dados.usuarioNome,
      data: agora,
      observacoes:
        dados.observacaoAceite?.trim() ||
        "Concluído e validado in loco com o solicitante do setor.",
    };

    const eventoHistorico: HistoricoObservacao = {
      id: crypto.randomUUID(),
      data: agora,
      usuario_id: dados.usuarioId,
      usuario_nome: dados.usuarioNome,
      acao: "Fluxo Expresso - Finalização Direta",
      observacao: `Serviço realizado: "${dados.servicoRealizado.trim()}"${insumosTxt}. OS concluída com aceite confirmado in loco.`,
    };

    await updateDoc(docRef, {
      status: "CONCLUIDA",
      checkin: checkinData,
      checkout: checkoutData,
      aceite_funcionario: aceiteData,
      historico_observacoes: arrayUnion(eventoHistorico),
      atualizado_em: serverTimestamp(),
    });

    let eqId = dados.equipamentoId;
    if (!eqId) {
      const osSnap = await getDoc(docRef);
      if (osSnap.exists()) {
        eqId = osSnap.data().equipamento?.id;
      }
    }

    if (eqId) {
      await incrementarManutencoesConcluidas(eqId, "operacional");
    }
  } else {
    // dados.destino === "RETORNADA"
    const eventoHistorico: HistoricoObservacao = {
      id: crypto.randomUUID(),
      data: agora,
      usuario_id: dados.usuarioId,
      usuario_nome: dados.usuarioNome,
      acao: "Fluxo Expresso - Manutenção Interna Concluída",
      observacao: `Serviço realizado: "${dados.servicoRealizado.trim()}"${insumosTxt}. Equipamento pronto e aguardando aceite do setor.`,
    };

    await updateDoc(docRef, {
      status: "RETORNADA",
      checkin: checkinData,
      checkout: checkoutData,
      historico_observacoes: arrayUnion(eventoHistorico),
      atualizado_em: serverTimestamp(),
    });
  }
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
    observacoes:
      dados.observacoes || "Equipamento retornou da assistência externa.",
  };

  await updateDoc(docRef, {
    status: "RETORNADA",
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
    observacoes:
      dados.observacoes || "Recebimento e teste confirmados no setor.",
  };

  await updateDoc(docRef, {
    status: "CONCLUIDA",
    aceite_funcionario: aceiteData,
    atualizado_em: serverTimestamp(),
  });

  let eqId = dados.equipamentoId;
  if (!eqId) {
    const osSnap = await getDoc(docRef);
    if (osSnap.exists()) {
      eqId = osSnap.data().equipamento?.id;
    }
  }

  if (eqId) {
    await incrementarManutencoesConcluidas(eqId, "operacional");
  } else if (dados.equipamentoId) {
    await atualizarStatusEquipamento(dados.equipamentoId, "operacional");
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
    acao: "Cancelamento de OS",
    observacao: `Motivo: ${dados.motivo}`,
  };

  await updateDoc(docRef, {
    status: "CANCELADA",
    historico_observacoes: arrayUnion(eventoHistorico),
    atualizado_em: serverTimestamp(),
  });

  await atualizarStatusEquipamento(dados.equipamentoId, "operacional");
};

export const atualizarPrioridadeOS = async (dados: {
  osId: string;
  novaPrioridade: OSPrioridade;
  justificativaPrioridade?: string;
  usuarioId: string;
  usuarioNome: string;
}): Promise<void> => {
  const docRef = doc(db, OS_COLLECTION, dados.osId);
  const agora = new Date().toISOString();
  const isAltaOuCritica =
    dados.novaPrioridade === "alta" || dados.novaPrioridade === "critica";

  const eventoHistorico: HistoricoObservacao = {
    id: crypto.randomUUID(),
    data: agora,
    usuario_id: dados.usuarioId,
    usuario_nome: dados.usuarioNome,
    acao: "Alteração de Prioridade",
    observacao: `Prioridade alterada para "${dados.novaPrioridade.toUpperCase()}"${
      isAltaOuCritica && dados.justificativaPrioridade?.trim()
        ? `. Justificativa: ${dados.justificativaPrioridade.trim()}`
        : ""
    }`,
  };

  const updatePayload: Record<string, any> = {
    prioridade: dados.novaPrioridade,
    prioridade_alterada_por: {
      id: dados.usuarioId,
      nome: dados.usuarioNome,
    },
    prioridade_alterada_em: serverTimestamp(),
    atualizado_em: serverTimestamp(),
    historico_observacoes: arrayUnion(eventoHistorico),
  };

  if (isAltaOuCritica) {
    if (dados.justificativaPrioridade?.trim()) {
      updatePayload.justificativa_prioridade =
        dados.justificativaPrioridade.trim();
    }
  } else {
    updatePayload.justificativa_prioridade = deleteField();
  }

  await updateDoc(docRef, updatePayload);
};

export const atualizarPrazoRetornoOS = async (dados: {
  osId: string;
  novoPrazo: string;
  observacao?: string;
  usuarioId: string;
  usuarioNome: string;
}): Promise<void> => {
  const docRef = doc(db, OS_COLLECTION, dados.osId);
  const agora = new Date().toISOString();

  const obsText = dados.observacao?.trim()
    ? `Novo prazo: ${dados.novoPrazo.trim()}. Observação: ${dados.observacao.trim()}`
    : `Novo prazo definido para ${dados.novoPrazo.trim()}`;

  const eventoHistorico: HistoricoObservacao = {
    id: crypto.randomUUID(),
    data: agora,
    usuario_id: dados.usuarioId,
    usuario_nome: dados.usuarioNome,
    acao: "Alteração no Prazo de Retorno",
    observacao: obsText,
  };

  const updatePayload: Record<string, any> = {
    previsao_retorno: dados.novoPrazo.trim(),
    atualizado_em: serverTimestamp(),
    historico_observacoes: arrayUnion(eventoHistorico),
  };

  if (dados.observacao?.trim()) {
    updatePayload.observacao_prazo_retorno = dados.observacao.trim();
  } else {
    updatePayload.observacao_prazo_retorno = deleteField();
  }

  await updateDoc(docRef, updatePayload);
};

export const editarOS = async (dados: {
  osId: string;
  equipamento?: EquipamentoResumido;
  tipoAssistencia?: TipoAssistencia;
  descricaoDefeito?: string;
  prioridade?: OSPrioridade;
  justificativaPrioridade?: string;
  previsaoRetorno?: string;
  observacaoPrazo?: string;
  status?: OSStatus;
  usuarioId: string;
  usuarioNome: string;
}): Promise<void> => {
  const docRef = doc(db, OS_COLLECTION, dados.osId);
  const agora = new Date().toISOString();

  const osSnap = await getDoc(docRef);
  const osAtual = osSnap.exists() ? (osSnap.data() as OrdemServico) : null;

  const alteracoesText: string[] = [];
  if (dados.status !== undefined && dados.status !== osAtual?.status) {
    alteracoesText.push(`Etapa/Status (${dados.status})`);
  }
  if (dados.equipamento && dados.equipamento.id !== osAtual?.equipamento?.id) {
    alteracoesText.push("Equipamento");
  }
  if (dados.tipoAssistencia !== undefined && dados.tipoAssistencia !== osAtual?.tipo_assistencia) {
    alteracoesText.push("Tipo de assistência");
  }
  if (dados.descricaoDefeito !== undefined && dados.descricaoDefeito.trim() !== osAtual?.descricao_defeito) {
    alteracoesText.push("Descrição do defeito");
  }
  if (dados.prioridade !== undefined && dados.prioridade !== osAtual?.prioridade) {
    alteracoesText.push("Prioridade");
  }
  if (dados.previsaoRetorno !== undefined && dados.previsaoRetorno.trim() !== osAtual?.previsao_retorno) {
    const obsTxt = dados.observacaoPrazo?.trim()
      ? ` (Obs: ${dados.observacaoPrazo.trim()})`
      : "";
    alteracoesText.push(`Prazo de retorno${obsTxt}`);
  }

  const descObs =
    alteracoesText.length > 0
      ? `Dados editados (${alteracoesText.join(", ")})`
      : "Edição de OS realizada";

  const eventoHistorico: HistoricoObservacao = {
    id: crypto.randomUUID(),
    data: agora,
    usuario_id: dados.usuarioId,
    usuario_nome: dados.usuarioNome,
    acao: "Edição de OS",
    observacao: descObs,
  };

  const payload: Record<string, any> = {
    atualizado_por: {
      id: dados.usuarioId,
      nome: dados.usuarioNome,
    },
    atualizado_em: serverTimestamp(),
    historico_observacoes: arrayUnion(eventoHistorico),
  };

  if (dados.status !== undefined) {
    payload.status = dados.status;
    if (dados.status === "ARQUIVADA") {
      payload.deletado = true;
      payload.deletado_por = {
        id: dados.usuarioId,
        nome: dados.usuarioNome,
      };
      payload.deletado_em = serverTimestamp();
    } else if (osAtual?.deletado) {
      payload.deletado = false;
      payload.deletado_por = deleteField();
      payload.deletado_em = deleteField();
    }
  }

  if (dados.equipamento) {
    payload.equipamento = dados.equipamento;
  }
  if (dados.tipoAssistencia !== undefined) {
    payload.tipo_assistencia = dados.tipoAssistencia;
  }
  if (dados.descricaoDefeito !== undefined) {
    payload.descricao_defeito = dados.descricaoDefeito.trim();
  }
  if (dados.previsaoRetorno !== undefined) {
    if (dados.previsaoRetorno.trim()) {
      payload.previsao_retorno = dados.previsaoRetorno.trim();
      if (dados.observacaoPrazo?.trim()) {
        payload.observacao_prazo_retorno = dados.observacaoPrazo.trim();
      }
    } else {
      payload.previsao_retorno = deleteField();
      payload.observacao_prazo_retorno = deleteField();
    }
  }
  if (dados.prioridade !== undefined) {
    payload.prioridade = dados.prioridade;
    payload.prioridade_alterada_por = {
      id: dados.usuarioId,
      nome: dados.usuarioNome,
    };
    payload.prioridade_alterada_em = serverTimestamp();

    if (dados.prioridade === "alta" || dados.prioridade === "critica") {
      if (dados.justificativaPrioridade?.trim()) {
        payload.justificativa_prioridade = dados.justificativaPrioridade.trim();
      }
    } else {
      payload.justificativa_prioridade = deleteField();
    }
  }

  await updateDoc(docRef, payload);

  // Sincronizar status do(s) equipamento(s) quando status ou equipamento mudarem
  if (osAtual) {
    const statusFinal = dados.status || osAtual.status;
    const isFinalizado =
      statusFinal === "CONCLUIDA" ||
      statusFinal === "CANCELADA" ||
      statusFinal === "ARQUIVADA";
    const novoStatusEquipamento = isFinalizado ? "operacional" : "em_manutencao";

    // Se o equipamento foi alterado
    if (
      dados.equipamento &&
      osAtual.equipamento?.id &&
      dados.equipamento.id !== osAtual.equipamento.id
    ) {
      await atualizarStatusEquipamento(osAtual.equipamento.id, "operacional");
      await atualizarStatusEquipamento(dados.equipamento.id, novoStatusEquipamento);
    } else if (dados.status !== undefined && dados.status !== osAtual.status) {
      const eqId = dados.equipamento?.id || osAtual.equipamento?.id;
      if (eqId) {
        if (dados.status === "CONCLUIDA") {
          await incrementarManutencoesConcluidas(eqId, "operacional");
        } else {
          await atualizarStatusEquipamento(eqId, novoStatusEquipamento);
        }
      }
    }
  }
};

export const softDeleteOS = async (dados: {
  osId: string;
  equipamentoId?: string;
  usuarioId: string;
  usuarioNome: string;
  motivo?: string;
}): Promise<void> => {
  const docRef = doc(db, OS_COLLECTION, dados.osId);
  const agora = new Date().toISOString();

  const eventoHistorico: HistoricoObservacao = {
    id: crypto.randomUUID(),
    data: agora,
    usuario_id: dados.usuarioId,
    usuario_nome: dados.usuarioNome,
    acao: "Exclusão Lógica (Arquivamento)",
    observacao: dados.motivo?.trim()
      ? `Motivo: ${dados.motivo.trim()}`
      : "OS arquivada pelo supervisor",
  };

  await updateDoc(docRef, {
    deletado: true,
    deletado_por: {
      id: dados.usuarioId,
      nome: dados.usuarioNome,
    },
    deletado_em: serverTimestamp(),
    status: "ARQUIVADA",
    historico_observacoes: arrayUnion(eventoHistorico),
    atualizado_em: serverTimestamp(),
  });

  if (dados.equipamentoId) {
    await atualizarStatusEquipamento(dados.equipamentoId, "operacional");
  }
};

export const hardDeleteOS = async (dados: {
  osId: string;
  equipamentoId?: string;
}): Promise<void> => {
  const docRef = doc(db, OS_COLLECTION, dados.osId);
  await deleteDoc(docRef);

  if (dados.equipamentoId) {
    await atualizarStatusEquipamento(dados.equipamentoId, "operacional");
  }
};

export const restaurarOS = async (dados: {
  osId: string;
  equipamentoId?: string;
  usuarioId: string;
  usuarioNome: string;
}): Promise<void> => {
  const docRef = doc(db, OS_COLLECTION, dados.osId);
  const agora = new Date().toISOString();

  const eventoHistorico: HistoricoObservacao = {
    id: crypto.randomUUID(),
    data: agora,
    usuario_id: dados.usuarioId,
    usuario_nome: dados.usuarioNome,
    acao: "Restauração de OS",
    observacao: "OS restaurada da lixeira pelo administrador",
  };

  await updateDoc(docRef, {
    deletado: false,
    deletado_por: deleteField(),
    deletado_em: deleteField(),
    status: "CRIADA",
    restaurado_por: {
      id: dados.usuarioId,
      nome: dados.usuarioNome,
    },
    restaurado_em: serverTimestamp(),
    historico_observacoes: arrayUnion(eventoHistorico),
    atualizado_em: serverTimestamp(),
  });

  if (dados.equipamentoId) {
    await atualizarStatusEquipamento(dados.equipamentoId, "em_manutencao");
  }
};
