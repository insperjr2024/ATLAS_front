import { apiFetch } from "@/lib/api";

/* Os tipos espelham `use_cases/monitoramento/monitoramento.py`. */

export interface VisaoGeral {
  kpis: {
    total: number;
    em_execucao: number;
    perto_de_finalizar: number;
    atrasados: number;
    pausados: number;
    finalizados: number;
  };
  por_status: Record<string, number>;
  /** % dos projetos ativos sem banca atrasada. A entrega ao cliente fica de
   *  fora de propósito: depende da agenda dele (§7.1). */
  placar_gestao: { percentual: number; no_prazo: number; total_ativos: number };
  entregas: {
    total_escopos: number;
    projetos_finalizados: number;
    recentes: {
      projeto_id: number;
      projeto_nome: string;
      escopo: string;
      data: string;
      no_prazo: boolean;
    }[];
    tendencia: { inicio: string; total: number }[];
  };
  bancas_proximas: {
    projeto_id: number | null;
    projeto_nome: string;
    escopo: string;
    data_hora: string;
  }[];
  tempo_parado: {
    projeto_id: number;
    projeto_nome: string;
    escopo_entregue: string;
    dias_parado: number;
  }[];
  /** §7.1: o motivo é explícito, nunca um rótulo genérico. */
  atencao_agora: {
    projeto_id: number;
    projeto_nome: string;
    motivo: string;
    dias: number | null;
  }[];
}

export interface LinhaTarefas {
  projeto_id: number;
  projeto_nome: string;
  status: string;
  distribuiu_na_semana: boolean;
  total: number;
  ativas: number;
  vencidas: number;
  /** Nunca recebeu tarefa nenhuma. */
  sem_tarefas: boolean;
  /** Tem tarefas, mas todas concluídas ou canceladas — o quadro zerou e não
   *  veio o próximo lote. Situação diferente de `sem_tarefas`. */
  sem_tarefas_ativas: boolean;
  /** Dias ÚTEIS desde a última tarefa criada (ou desde o kickoff, se nunca
   *  houve nenhuma). `null` = projeto ainda sem kickoff. */
  dias_uteis_sem_tarefa: number | null;
  /** De ONDE o campo acima conta, lido do banco por `_marco_sem_tarefa`.
   *
   *  Vem na resposta porque o número de dias sozinho é ambíguo — não dá para
   *  saber se ele partiu do kickoff ou da última tarefa criada. Deduzir isso
   *  no front pelo `sem_tarefas` funcionava por coincidência e quebraria em
   *  silêncio se o filtro da lista mudasse. */
  marco_sem_tarefa: "kickoff" | "ultima_tarefa" | null;
  /** A data do marco acima. `null` = projeto ainda sem kickoff. */
  data_marco_sem_tarefa: string | null;
  /** O pior atraso do quadro, em dias ÚTEIS. */
  atraso_maximo_dias_uteis: number;
  ultima_movimentacao: string | null;
}

export interface Execucao {
  semana: { inicio: string; fim: string };
  resumo_tarefas: {
    projetos: number;
    sem_tarefas: number;
    sem_tarefas_ativas: number;
    sem_distribuir_na_semana: number;
    com_vencidas: number;
  };
  tarefas: LinhaTarefas[];
  reunioes: {
    projeto_id: number;
    projeto_nome: string;
    realizou: boolean;
    dias: string[];
    dia_padrao: number | null;
  }[];
}

export interface LinhaCarga {
  usuario_id: number;
  nome: string;
  posicao: string;
  total: number;
  projetos: string[];
  carga_alta: boolean;
  disponivel: boolean;
}

export interface Alocacao {
  coordenadores: LinhaCarga[];
  consultores: LinhaCarga[];
  grade_horaria_disponivel: boolean;
}

export interface Atrasos {
  por_projeto: {
    projeto_id: number;
    projeto_nome: string;
    status: string;
    dias_totais: number;
    motivos: {
      tipo: string;
      descricao: string;
      dias: number;
      escopo: string;
      projeto_escopo_id: number | null;
      /** A data que venceu: a banca não realizada ou a entrega planejada. */
      data_referencia: string | null;
    }[];
  }[];
  por_coordenador: {
    usuario_id: number;
    nome: string;
    projetos: number;
    atrasados: number;
    dias_acumulados: number;
  }[];
}

/** Espelha `Urgencia` de `types/tarefa.ts` — mesma gradação, backend igual. */
export type UrgenciaTarefa = "vencida" | "critica" | "atencao" | "normal";

export interface ColunaAgregada {
  /** Nome normalizado (minúsculo, sem espaço nas pontas) — chave de
   *  agrupamento, já que colunas de projetos diferentes podem se chamar
   *  igual (ou quase). */
  chave: string;
  /** Nome de exibição — o da primeira coluna encontrada com esse nome. */
  nome: string;
  cor: string;
}

export interface TarefaAgregada {
  id: number;
  titulo: string;
  projeto_id: number;
  projeto_nome: string;
  cliente: string;
  responsavel_id: number;
  responsavel_nome: string;
  prazo: string;
  grupo_coluna: string;
  coluna_nome: string;
  vencida: boolean;
  urgencia: UrgenciaTarefa;
  dias_para_prazo: number | null;
}

export interface TarefasGerais {
  colunas: ColunaAgregada[];
  tarefas: TarefaAgregada[];
}

function query(frenteId?: number | null): string {
  return frenteId ? `?frente_id=${frenteId}` : "";
}

export function getVisaoGeral(token: string, frenteId?: number | null) {
  return apiFetch<VisaoGeral>(`/monitoramento/visao-geral${query(frenteId)}`, { token });
}

export function getExecucao(token: string, frenteId?: number | null) {
  return apiFetch<Execucao>(`/monitoramento/execucao${query(frenteId)}`, { token });
}

export function getAlocacao(token: string, frenteId?: number | null) {
  return apiFetch<Alocacao>(`/monitoramento/alocacao${query(frenteId)}`, { token });
}

export function getAtrasos(token: string, frenteId?: number | null) {
  return apiFetch<Atrasos>(`/monitoramento/atrasos${query(frenteId)}`, { token });
}

export function getTarefasGerais(token: string, frenteId?: number | null) {
  return apiFetch<TarefasGerais>(`/monitoramento/tarefas${query(frenteId)}`, { token });
}
