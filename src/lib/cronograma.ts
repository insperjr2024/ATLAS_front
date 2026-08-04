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

/** ⭐ O que o arrasto chama: um gesto = uma requisição, por intervalo. */
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
export function oficializarCronograma(escopoId: number, token: string) {
  return apiFetch(`/escopos-projeto/${escopoId}/oficializar`, { method: "POST", token });
}

/* ------------------------------------------------------------------ */

/**
 * Os meses a empilhar, derivados da janela que o backend calculou.
 *
 * O backend já decide início/fim (e aplica o teto de 18 meses) — aqui é só
 * expandir para a lista de 1ºs-de-mês.
 */
export function mesesDaJanela(inicio: string, fim: string): Date[] {
  const meses: Date[] = [];
  const atual = new Date(`${inicio}T12:00:00`);
  atual.setDate(1);
  const limite = new Date(`${fim}T12:00:00`);
  while (atual <= limite) {
    meses.push(new Date(atual));
    atual.setMonth(atual.getMonth() + 1);
  }
  return meses;
}
