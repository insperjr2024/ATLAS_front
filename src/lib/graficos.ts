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
  /** Quantos REGISTROS a pergunta cobre. ⚠ Quando `sobrepoe`, não é a soma das
   *  fatias: um projeto de duas frentes conta em duas fatias e uma vez aqui. */
  total: number;
  /** As categorias se sobrepõem — o mesmo registro cai em mais de uma fatia.
   *  Acontece quando o agrupamento é por uma relação (frente, tipo de escopo).
   *  A tela usa isto para explicar a diferença e para recusar a rosca, que
   *  desenha fração de um todo e aqui não há todo nenhum. */
  sobrepoe: boolean;
  /** A ressalva escrita para ESTE agrupamento — "projeto sinérgico entra na
   *  barra de cada frente dele…". Vem do backend porque é lá que se sabe o
   *  nome da situação em cada tabela; vazia quando não há sobreposição. */
  nota: string;
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
