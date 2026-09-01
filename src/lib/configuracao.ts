import { apiFetch } from "@/lib/api";
import type { Configuracao } from "@/types/banca";

export function getConfiguracao(token: string) {
  return apiFetch<Configuracao>("/configuracao", { token });
}

export function updateConfiguracao(
  dados: {
    vagas_por_banca?: number;
    lideranca_minima_por_frente?: number;
  },
  token: string,
) {
  return apiFetch<Configuracao>("/configuracao", {
    method: "PATCH",
    token,
    body: JSON.stringify(dados),
  });
}

/* ------------------------- composição de banca por combinação de frentes */

/** Uma linha do seletor: a combinação e o resumo do que ela exige hoje. */
export interface CombinacaoComposicao {
  /** A chave normalizada, ids ordenados unidos por `-` (`"1-2"`). */
  combinacao: string;
  frente_ids: number[];
  /** `Business + Direito` — pronto para exibir. */
  rotulo: string;
  sinergica: boolean;
  /** Mínimo de pessoas: soma de membros + liderança de cada frente. */
  minimo_total: number;
  /** `false` = está herdando o padrão, ninguém gravou números para ela. */
  configurada: boolean;
}

export interface RegraDaFrente {
  frente_id: number;
  frente_nome: string;
  min_membros: number;
  max_membros: number;
  min_lideranca: number;
  max_lideranca: number;
  configurada: boolean;
}

export interface ComposicaoDaCombinacao {
  combinacao: string;
  rotulo: string;
  minimo_total: number;
  frentes: RegraDaFrente[];
}

export function listarCombinacoesComposicao(token: string) {
  return apiFetch<CombinacaoComposicao[]>("/composicao-banca/combinacoes", { token });
}

export function getComposicaoBanca(combinacao: string, token: string) {
  return apiFetch<ComposicaoDaCombinacao>(`/composicao-banca/${combinacao}`, { token });
}

/**
 * Grava a regra da combinação inteira.
 *
 * ⚠ `frentes` traz TODAS as frentes da combinação, sempre — o backend recusa
 * uma lista parcial, porque a frente omitida cairia no padrão em silêncio.
 */
export function salvarComposicaoBanca(
  combinacao: string,
  frentes: Omit<RegraDaFrente, "frente_nome" | "configurada">[],
  token: string,
) {
  return apiFetch<{ combinacao: string }>(`/composicao-banca/${combinacao}`, {
    method: "PUT",
    token,
    body: JSON.stringify({ frentes }),
  });
}
