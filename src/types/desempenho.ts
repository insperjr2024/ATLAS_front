// Avaliação de Desempenho, periódica/finalização de consultores e
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
   *  ainda em aberto, item continua aparecendo por um tempo só pro aviso,
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
  mentor_foto: string | null;
  mentorado_id: number;
  mentorado_nome: string | null;
  mentorado_foto: string | null;
}

export interface DesempenhoRelatorioCriterio {
  criterio_id: number;
  label: string;
  tipo_resposta: DesempenhoTipoResposta;
  nota_media: number | null;
  respostas_texto: string[];
}

export type DesempenhoPdiPastaTipo = "inicial" | "encontro";

export interface DesempenhoPdiPasta {
  id: number;
  nome: string;
  tipo: DesempenhoPdiPastaTipo;
  prazo: string;
  ordem: number;
  /** Gestão vigente na data do prazo (ex: "2026.2"), derivado no backend,
   *  não é um campo próprio da pasta. `null` se o prazo cair fora de
   *  qualquer semestre cadastrado. */
  semestre: string | null;
}

export type DesempenhoPdiItemTipoArquivo = "documento" | "foto" | "qualquer";

/** Um documento exigido dentro de uma pasta, a pasta é uma checklist de
 *  itens (ex: "Encontro 1" pode exigir Foto + Relatório, cada um com seu
 *  próprio envio). `tipo_arquivo` restringe o formato aceito no upload. */
export interface DesempenhoPdiItem {
  id: number;
  pasta_id: number;
  nome: string;
  tipo_arquivo: DesempenhoPdiItemTipoArquivo;
  ordem: number;
}

export interface DesempenhoPdiPendencia {
  mentorado_id: number;
  mentorado_nome: string | null;
  mentor_id: number;
  mentor_nome: string | null;
}

export interface DesempenhoPdiEnvio {
  arquivo_nome: string;
  enviado_por: number;
  enviado_por_nome: string | null;
  enviado_em: string;
}

/** Um item da checklist de uma pasta, com ou sem envio. */
export interface DesempenhoPdiItemComEnvio {
  item_id: number;
  item_nome: string;
  tipo_arquivo: DesempenhoPdiItemTipoArquivo;
  envio: DesempenhoPdiEnvio | null;
}

/** Uma linha por PASTA, com a checklist de itens dentro, é o shape que
 *  `RelatorioPdi` desenha direto, sem precisar cruzar listas. */
export interface DesempenhoPdiPastaComItens {
  pasta_id: number;
  pasta_nome: string;
  pasta_tipo: DesempenhoPdiPastaTipo;
  pasta_semestre: string | null;
  prazo: string;
  itens: DesempenhoPdiItemComEnvio[];
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
