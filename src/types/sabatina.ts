// Sabatina: o processo eleitoral da Insper Jr. Espelha `routers/sabatina.py`.

export type StatusEleicao = "rascunho" | "aberta" | "fechada";

export interface SabatinaPeso {
  posicao: string;
  nome: string;
  peso: number;
  /** true quando não há linha gravada e o valor é o padrão do sistema. */
  padrao: boolean;
}

export interface PessoaSabatina {
  usuario_id: number;
  nome: string;
  posicao: string | null;
}

export interface CandidatoSabatina extends PessoaSabatina {
  /** id do vínculo candidato-eleição (é o que vai no voto). */
  id: number;
}

export interface LinhaResultado extends PessoaSabatina {
  candidato_id: number;
  votos: number;
  ponderado: number;
  percentual: number;
  passou: boolean;
  eleito: boolean;
}

export interface ResultadoEleicao {
  situacao: "eleito" | "ninguem_eleito" | "sem_votos";
  percentual_aprovacao: number;
  total_votos: number;
  total_ponderado: number;
  brancos: { votos: number; ponderado: number; percentual: number };
  candidatos: LinhaResultado[];
  eleito_candidato_id: number | null;
}

/** Visão da diretoria. */
export interface Eleicao {
  id: number;
  nome: string;
  percentual_aprovacao: number;
  status: StatusEleicao;
  criado_em: string;
  aberta_em: string | null;
  fechada_em: string | null;
  candidatos: CandidatoSabatina[];
  total_eleitores: number;
  total_votos: number;
  pendentes: PessoaSabatina[];
  /** Só vem fechada. */
  resultado: ResultadoEleicao | null;
}

export interface VotoDetalhe {
  eleitor_id: number;
  eleitor_nome: string;
  posicao: string;
  peso: number;
  candidato_id: number | null;
  candidato_nome: string | null;
  criado_em: string;
}

/** A cédula de quem vota. */
export interface MinhaEleicao {
  id: number;
  nome: string;
  aberta_em: string | null;
  candidatos: { id: number; usuario_id: number; nome: string }[];
  sou_candidato: boolean;
  ja_votei: boolean;
}

export interface EleicaoPayload {
  nome: string;
  percentual_aprovacao: number;
  candidato_ids: number[];
}
