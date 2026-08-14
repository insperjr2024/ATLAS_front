import { apiFetch } from "@/lib/api";

/** O papel decide o que a coluna pode fazer no gráfico. */
export type PapelColuna = "dimensao" | "data" | "metrica" | "relacao";

export interface ColunaFonte {
  nome: string;
  rotulo: string;
  /**
   * `relacao` vem de outra tabela por junção (Projetos por frente, por
   * exemplo). Agrupa igual, mas só aceita contagem, somar dias de ambientação
   * "por frente" contaria o mesmo projeto uma vez por frente.
   */
  papel: PapelColuna;
}

export interface FonteGrafico {
  tabela: string;
  rotulo: string;
  /** Texto curto explicando a tabela, quem monta o gráfico não conhece o banco. */
  descricao: string;
  colunas: ColunaFonte[];
}

export interface PontoGrafico {
  rotulo: string;
  valor: number;
}

export interface ResultadoGrafico {
  titulo: string;
  dados: PontoGrafico[];
  total: number;
}

export type Operacao = "contagem" | "soma" | "media";
export type Granularidade = "mes" | "ano";

/**
 * As tabelas liberadas para gráfico.
 *
 * A lista é curada no backend (`src/use_cases/monitoramento/graficos.py`) e
 * o front não tem cópia dela. Qualquer tabela ou coluna fora do catálogo é
 * recusada lá, então não há como esta tela pedir algo que não deveria.
 */
export function getFontesGrafico(token: string) {
  return apiFetch<FonteGrafico[]>("/monitoramento/graficos/fontes", { token });
}

export function getDadosGrafico(
  params: {
    tabela: string;
    dimensao: string;
    operacao: Operacao;
    metrica?: string | null;
    granularidade?: Granularidade;
  },
  token: string,
) {
  const busca = new URLSearchParams({
    tabela: params.tabela,
    dimensao: params.dimensao,
    operacao: params.operacao,
  });
  if (params.metrica) busca.set("metrica", params.metrica);
  if (params.granularidade) busca.set("granularidade", params.granularidade);
  return apiFetch<ResultadoGrafico>(`/monitoramento/graficos/dados?${busca}`, { token });
}
