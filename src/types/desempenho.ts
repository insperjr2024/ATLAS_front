// Avaliação de Desempenho — periódica/finalização de consultores e
// coordenadores. Não confundir com os tipos de `banca.ts` (feedback de
// banca, outra feature).

export type DesempenhoTipo = "periodico" | "finalizacao";
export type DesempenhoPapel = "consultor" | "coordenador";
export type DesempenhoOverrideManual = "aberto" | "fechado" | null;
export type DesempenhoTipoResposta = "nota" | "texto";

export interface DesempenhoLote {
  id: number;
  nome: string;
  tipo: DesempenhoTipo;
  data_inicio: string;
  data_fim: string;
  override_manual: DesempenhoOverrideManual;
  projeto_ids: number[];
  aberto: boolean;
}

export interface DesempenhoCriterio {
  id: number;
  label: string;
  descricao: string | null;
  tipo_resposta: DesempenhoTipoResposta;
  limite_caracteres: number | null;
  ordem: number;
}

export interface DesempenhoSecao {
  id: number;
  titulo: string;
  descricao: string | null;
  ordem: number;
  criterios: DesempenhoCriterio[];
}

export interface DesempenhoFormulario {
  id: number;
  tipo: DesempenhoTipo;
  papel: DesempenhoPapel;
  nota_geral_titulo: string;
  nota_geral_descricao: string;
  comentarios_titulo: string;
  comentarios_descricao: string;
  comentarios_aviso: string;
  secoes: DesempenhoSecao[];
}

export interface DesempenhoPendencia {
  avaliador_id: number;
  avaliador_nome: string | null;
  avaliado_id: number;
  avaliado_nome: string | null;
  form_type: DesempenhoPapel;
  projeto_ids: number[];
  projeto_nomes: (string | null)[];
  respondida: boolean;
}

export interface DesempenhoFilaItem {
  lote_id: number;
  lote_nome: string;
  lote_tipo: DesempenhoTipo;
  /** false = o lote fechou (manualmente ou pelo prazo) com essa pendência
   *  ainda em aberto — item continua aparecendo por um tempo só pro aviso,
   *  nunca dá pra responder por ele. */
  aberto: boolean;
  avaliado_id: number;
  avaliado_nome: string | null;
  form_type: DesempenhoPapel;
  projeto_ids: number[];
}

export interface DesempenhoAvaliacao {
  id: number;
  lote_id: number;
  formulario_id: number;
  avaliador_id: number;
  avaliado_id: number;
  nota_geral: number;
  comentarios: string;
  criado_em?: string;
}

export interface DesempenhoAvaliacaoNotaDetalhe {
  criterio_id: number;
  label: string | null;
  tipo_resposta: DesempenhoTipoResposta | null;
  nota: number | null;
  resposta_texto: string | null;
}

export interface DesempenhoAvaliacaoDetalhe extends DesempenhoAvaliacao {
  notas: DesempenhoAvaliacaoNotaDetalhe[];
}

export interface DesempenhoNotaInput {
  criterio_id: number;
  nota?: number | null;
  resposta_texto?: string | null;
}

export interface DesempenhoAvaliacaoSubmissao {
  avaliacao: DesempenhoAvaliacao;
  proxima_pendencia: DesempenhoFilaItem | null;
}

export interface DesempenhoMentoria {
  id: number;
  mentor_id: number;
  mentor_nome: string | null;
  mentorado_id: number;
  mentorado_nome: string | null;
}

export interface DesempenhoRelatorioCriterio {
  criterio_id: number;
  label: string;
  tipo_resposta: DesempenhoTipoResposta;
  nota_media: number | null;
  respostas_texto: string[];
}

export interface DesempenhoRelatorioLote {
  lote_id: number;
  lote_nome: string | null;
  tipo: DesempenhoTipo | null;
  nota_geral_media: number | null;
  quantidade_avaliadores: number;
  criterios: DesempenhoRelatorioCriterio[];
  comentarios: string[];
}

export interface DesempenhoRelatorio {
  usuario_id: number;
  lotes: DesempenhoRelatorioLote[];
}
