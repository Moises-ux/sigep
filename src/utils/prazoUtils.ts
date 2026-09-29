import type { OrdemServico, OSPrioridade } from "../types";

/**
 * Retorna a quantidade de dias recomendada para o prazo de retorno conforme a prioridade.
 * - Baixa: 15 dias
 * - Média: 10 dias
 * - Alta: 5 dias
 * - Crítica: 2 dias
 */
export const getDiasPrazoByPrioridade = (prioridade: OSPrioridade): number => {
  switch (prioridade) {
    case "baixa":
      return 15;
    case "media":
      return 10;
    case "alta":
      return 5;
    case "critica":
      return 2;
    default:
      return 15;
  }
};

/**
 * Calcula a data de retorno estimada no formato YYYY-MM-DD com base na prioridade.
 */
export const calcularPrazoRetornoDefault = (prioridade: OSPrioridade): string => {
  const data = new Date();
  const dias = getDiasPrazoByPrioridade(prioridade);
  data.setDate(data.getDate() + dias);
  return data.toISOString().split("T")[0];
};

/**
 * Formata uma data YYYY-MM-DD ou ISO para exibição pt-BR (ex: DD/MM/AAAA).
 */
export const formatarPrazoRetorno = (val: string | Date | undefined | null): string => {
  if (!val) return "Não informado";
  let d: Date | null = null;
  if (typeof val === "string") {
    const parts = val.split("T")[0].split("-");
    if (parts.length === 3) {
      d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      d = new Date(val);
    }
  } else {
    d = new Date(val);
  }
  if (!d || isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
};

/**
 * Retorna a observação sobre a mudança do prazo de retorno da OS, se houver.
 */
export const getObsPrazoRetorno = (os: OrdemServico | null | undefined): string | null => {
  if (!os) return null;
  if (os.observacao_prazo_retorno?.trim()) return os.observacao_prazo_retorno.trim();

  if (os.historico_observacoes && os.historico_observacoes.length > 0) {
    const eventoPrazo = [...os.historico_observacoes]
      .reverse()
      .find((h) => h.acao === "Alteração no Prazo de Retorno" && h.observacao);

    if (eventoPrazo && eventoPrazo.observacao) {
      if (eventoPrazo.observacao.includes("Observação: ")) {
        return eventoPrazo.observacao.split("Observação: ")[1].trim();
      }
      return eventoPrazo.observacao;
    }
  }
  return null;
};
