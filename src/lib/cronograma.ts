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

/** §5.3: cravar o cronograma. Depois disso, mudar exige reajuste (§5.6). */
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

export function oficializarCronograma(escopoId: number, token: string) {
  return apiFetch(`/escopos-projeto/${escopoId}/oficializar`, { method: "POST", token });
}

/* ------------------------------------------------------------------ */

/* `mesesDaJanela` vivia aqui: expandia a janela do backend na lista de meses a
   empilhar. Saiu quando o cronograma passou a ter as visões de dia/semana/mês
   (`components/cronograma-pintado/visao.ts`), que derivam o período em foco a
   partir de uma data de referência — a janela agora só delimita a navegação.
   Se um dia voltar a visão de "projeto inteiro", é este o ponto de partida. */
