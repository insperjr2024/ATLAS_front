/**
 * O projeto e sua equipe (§4, §6.2–6.4).
 *
 * As formas aqui espelham os dois serializers do backend
 * (`use_cases/projeto/get_projeto.py`): o **resumo**, que alimenta os cards da
 * lista, e o **completo**, que a página do projeto consome.
 */

import type { ResultadoBanca, StatusBanca } from "@/types/banca";

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
  criado_em: string;
  status: StatusProjeto;
  frente_ids: number[];
  /** 2 frentes = projeto sinérgico; aparece para os dois gerentes. */
  sinergico: boolean;
  coordenador_id: number | null;
  consultor_ids: number[];
  data_kickoff: string | null;
  kickoff_pendente: boolean;
  /** Arquivar não é excluir — só some das listagens normais (§6.2). */
  arquivado_em: string | null;
}

export interface MembroProjeto {
  usuario_id: number;
  papel: PapelProjeto;
  entrou_em: string;
}

export type StatusEscopo = "nao_iniciado" | "em_andamento" | "entregue" | "cancelado";

/** Como a banca aparece dentro do escopo (só o que a tabela precisa). */
export interface BancaDoEscopo {
  id: number;
  data_hora: string | null;
  realizado_em: string | null;
  resultado: ResultadoBanca | null;
  status: StatusBanca;
  /** Todos os escopos que esta banca cobre, este incluído — uma banca pode
   *  avaliar mais de um escopo do projeto de uma vez. */
  escopo_ids: number[];
}

/**
 * Um escopo vendido, com a contagem do §5.4 **já calculada pelo backend**.
 *
 * O front nunca recalcula dias úteis — só desenha a barra. É a mesma doutrina
 * de `permissoes.ts`: a regra mora num lugar só.
 */
export interface EscopoVendido {
  id: number;
  projeto_id: number;
  escopo_id: number | null;
  nome_customizado: string | null;
  /** Já resolvido: o nome do catálogo, ou o digitado quando é um "Outro". */
  nome: string;
  frente_id: number;
  /** ⭐ Imutável — o registro comercial. Nunca vira "vendidos + ajustados". */
  dias_uteis_vendidos: number;
  /** Dias extras autorizados pela diretoria (§8). Somam com os vendidos para
   *  formar a janela, mas são mostrados à parte: a tela diz
   *  *20 vendidos · 10 ajustados*, nunca "30 vendidos". */
  dias_uteis_ajustados: number;
  status: StatusEscopo;
  /** A reunião inicial — é ela que abre a janela do escopo. */
  data_inicio: string | null;
  data_entrega_planejada: string | null;
  data_entrega_real: string | null;
  tipo_atraso_entrega: "interno" | "externo" | null;
  consumidos: number;
  /** Pode ser negativo — é o "estourou em N dias". Medido contra
   *  *vendidos + ajustados*. */
  restantes: number;
  estourou: boolean;
  em_contagem: boolean;
  /** §10 — dias úteis além da janela, derivados. Zero enquanto ela não estoura. */
  atraso: number;
  /**
   * §11 — dias úteis pintados depois de a BANCA ser realizada: as
   * **correções** que ela apontou.
   *
   * ⚠️ **Não confundir com `dias_uteis_ajustados`.** Dias de ajuste aumentam a
   * JANELA do escopo e são pedidos à diretoria nos 3 primeiros dias úteis
   * depois da largada — é trabalho vendido que faltou. Correção é o tempo
   * gasto depois da banca arrumando o que ela apontou: não aumenta janela, não
   * se pede a ninguém, e não conta como atraso.
   */
  correcoes: number;
  /** O último dia da janela: início + vendidos + ajustados dias úteis.
   *  `null` enquanto o escopo não tem reunião inicial. */
  fim_janela: string | null;
  /** §8: último dia em que ainda cabe PEDIR dias de ajuste. */
  prazo_pedido_ajuste: string | null;
  /** O prazo ainda está aberto hoje. */
  pedido_ajuste_aberto: boolean;
  banca: BancaDoEscopo | null;
  /** 🔒 §5.5: só true quando a banca do escopo saiu aprovada. */
  entrega_liberada: boolean;
  /** O pedido de dias aguardando a diretoria — um por vez. */
  reajuste_pendente: PedidoDeDias | null;
}

/** §8: um pedido de dias de ajuste aguardando decisão. */
export interface PedidoDeDias {
  id: number;
  dias_solicitados: number;
  motivo: string;
  solicitado_por: number;
  solicitado_por_nome: string | null;
  criado_em: string;
}

/** A forma completa — página do projeto, aba Visão geral (§6.4). */
export interface ProjetoCompleto extends ProjetoResumo {
  escopos: EscopoVendido[];
  descricao: string | null;
  link_proposta: string | null;
  anexo_proposta_nome: string | null;
  dias_ambientacao: number;
  /**
   * 🤖 O último dia de ambientação (§5.3) — kickoff + `dias_ambientacao` dias
   * ÚTEIS, calculado pelo backend. Passado ele, o projeto vira Em andamento
   * sozinho. `null` = sem janela (sem kickoff ou zero dias), e aí a saída de
   * Ambientação continua sendo pela mão de alguém.
   */
  fim_ambientacao: string | null;
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
