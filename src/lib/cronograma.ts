import { apiFetch } from "@/lib/api";
import type { CronogramaResposta, EtapaCronograma, MarcoCronograma } from "@/types/cronograma";

/** A aba inteira numa ida só — inclusive os dias cinzas da janela. */
export function getCronograma(projetoId: number, token: string) {
  return apiFetch<CronogramaResposta>(`/projetos/${projetoId}/cronograma`, { token });
}

export function createEtapa(
  escopoId: number,
  dados: { nome: string; cor: string; data_inicio: string; data_fim: string },
  token: string,
) {
  return apiFetch<EtapaCronograma>(`/escopos-projeto/${escopoId}/etapas`, {
    method: "POST",
    token,
    body: JSON.stringify(dados),
  });
}

/** O que o arrasto chama: um gesto = uma requisição, por intervalo. */
export function moverEtapa(etapaId: number, inicio: string, fim: string, token: string) {
  return apiFetch(`/cronograma/etapas/${etapaId}`, {
    method: "PUT",
    token,
    body: JSON.stringify({ data_inicio: inicio, data_fim: fim }),
  });
}

export function editarEtapa(
  etapaId: number,
  dados: { nome?: string; cor?: string; status?: string; ordem?: number },
  token: string,
) {
  return apiFetch(`/cronograma/etapas/${etapaId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(dados),
  });
}

/** Apaga a etapa e, com ela, a pintura dos dias que eram dela. */
export function deleteEtapa(etapaId: number, token: string) {
  return apiFetch(`/cronograma/etapas/${etapaId}`, { method: "DELETE", token });
}

export function createMarco(
  projetoId: number,
  dados: { tipo: string; data: string; projeto_escopo_id?: number | null; nota?: string | null },
  token: string,
) {
  return apiFetch<MarcoCronograma>(`/projetos/${projetoId}/marcos`, {
    method: "POST",
    token,
    body: JSON.stringify(dados),
  });
}

export function deleteMarco(marcoId: number, token: string) {
  return apiFetch(`/cronograma/marcos/${marcoId}`, { method: "DELETE", token });
}

/**
 * A entrega PLANEJADA do escopo — a data que o cronograma promete.
 *
 * Diferente de `/entrega`, que grava a entrega REAL e fica travada até a banca
 * sair aprovada (§5.5). Aqui é planejamento, que é do que esta tela trata.
 */
export function definirEntregaPlanejada(
  escopoId: number,
  data: string | null,
  token: string,
) {
  return apiFetch(`/escopos-projeto/${escopoId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ data_entrega_planejada: data }),
  });
}

/** §5.3: cravar o cronograma — marco informativo, não trava mais edição. */
export function oficializarCronograma(escopoId: number, token: string) {
  return apiFetch(`/escopos-projeto/${escopoId}/oficializar`, { method: "POST", token });
}

/* ----------------------------------------------- §8 · dias de ajuste */

/* Os dois fluxos CONVIVEM — não são versões um do outro, apesar de terem se
   cruzado no merge. `oficializarCronograma` acima só carimba
   `cronograma_oficializado_em`: virou marco informativo e não tranca mais o
   calendário atrás de uma fila de aprovação, que era o cadeado que
   transformava em rotina a exceção que o §5.6 pedia que fosse rara. A janela
   do escopo NÃO consulta esse carimbo: quem a estica é o pedido de DIAS
   abaixo, e é só ele que passa por aprovação. */

/**
 * ⭐ O coordenador pede dias extras para o escopo (§8).
 *
 * Só dá certo nos **3 primeiros dias úteis** da janela (a partir da reunião
 * inicial) e só para o coordenador daquele projeto — as duas regras são do
 * backend, e ele responde 422 com a explicação pronta para a tela mostrar.
 */
export function pedirDiasDeAjuste(
  escopoId: number,
  dados: { dias_solicitados: number; motivo: string },
  token: string,
) {
  return apiFetch(`/escopos-projeto/${escopoId}/reajuste`, {
    method: "POST",
    token,
    body: JSON.stringify(dados),
  });
}

/** A fila de pedidos aguardando decisão — só a diretoria enxerga. */
export function getPedidosDeDiasPendentes(token: string) {
  return apiFetch<PedidoPendente[]>("/reajustes/pendentes", { token });
}

/**
 * A decisão da diretoria. Aprovar **soma** os dias em `dias_uteis_ajustados` e
 * estica a janela; negar só registra — e o coordenador pode pedir de novo,
 * desde que ainda esteja dentro do prazo.
 */
export function responderPedidoDeDias(
  solicitacaoId: number,
  dados: { aprovado: boolean; justificativa: string },
  token: string,
) {
  return apiFetch(`/reajustes/${solicitacaoId}/responder`, {
    method: "PATCH",
    token,
    body: JSON.stringify(dados),
  });
}

export interface PedidoPendente {
  id: number;
  projeto_escopo_id: number;
  projeto_id: number | null;
  projeto_nome: string | null;
  escopo_nome: string | null;
  solicitado_por: number;
  solicitado_por_nome: string | null;
  dias_solicitados: number;
  /** A janela de hoje, para a decisão ter contra o que somar. */
  dias_uteis_vendidos: number | null;
  dias_uteis_ajustados: number | null;
  motivo: string;
  criado_em: string;
}

/* ------------------------------------------------------------------ */

/* `mesesDaJanela` vivia aqui: expandia a janela do backend na lista de meses a
   empilhar. Saiu quando o cronograma passou a ter as visões de dia/semana/mês
   (`components/cronograma-pintado/visao.ts`), que derivam o período em foco a
   partir de uma data de referência — a janela agora só delimita a navegação.
   Se um dia voltar a visão de "projeto inteiro", é este o ponto de partida. */
