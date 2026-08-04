/**
 * O projeto e sua equipe (§4, §6.2–6.4).
 *
 * As formas aqui espelham os dois serializers do backend
 * (`use_cases/projeto/get_projeto.py`): o **resumo**, que alimenta os cards da
 * lista, e o **completo**, que a página do projeto consome.
 */

/** Os 7 status do ciclo de vida + Pausado, que é um estado à parte (§4). */
export type StatusProjeto =
  | "vendido"
  | "ambientacao"
  | "em_andamento"
  | "validacao_bancas"
  | "envio_tep"
  | "periodo_ajustes"
  | "finalizado"
  | "pausado";

export type PapelProjeto = "coordenador" | "consultor";

/** A forma enxuta — cards da lista (§6.2). */
export interface ProjetoResumo {
  id: number;
  nome: string;
  cliente: string;
  status: StatusProjeto;
  frente_ids: number[];
  /** 2 frentes = projeto sinérgico; aparece para os dois gerentes. */
  sinergico: boolean;
  coordenador_id: number | null;
  consultor_ids: number[];
  data_kickoff: string | null;
  kickoff_pendente: boolean;
}

export interface MembroProjeto {
  usuario_id: number;
  papel: PapelProjeto;
  entrou_em: string;
}

/** A forma completa — página do projeto, aba Visão geral (§6.4). */
export interface ProjetoCompleto extends ProjetoResumo {
  descricao: string | null;
  link_proposta: string | null;
  dias_ambientacao: number;
  data_entrega_cliente: string | null;
  /** 1 = segunda … 7 = domingo. */
  dia_reuniao_padrao: number | null;
  criado_por: number | null;
  equipe: MembroProjeto[];
}

/**
 * Uma linha de `projeto_status_historico`. `alterado_por` vazio = 🤖 o sistema
 * mudou sozinho (o kickoff, por exemplo), não uma pessoa clicando.
 */
export interface StatusHistorico {
  id: number;
  status_anterior: StatusProjeto | null;
  status_novo: StatusProjeto;
  alterado_por: number | null;
  alterado_em: string;
}

/** O que o formulário de equipe manda de volta — sem `entrou_em`, que é do backend. */
export interface MembroEquipePayload {
  usuario_id: number;
  papel: PapelProjeto;
}
