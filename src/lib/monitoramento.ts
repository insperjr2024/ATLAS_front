import { apiFetch } from "@/lib/api";
import type { TomSituacao } from "@/lib/situacoes-carga";
import type { StatusProjeto } from "@/types/projeto";
import type { CronogramaResposta } from "@/types/cronograma";

/* Os tipos espelham `use_cases/monitoramento/monitoramento.py`. */

/** Uma etapa do ciclo de vida e os projetos parados nela.
 *
 *  Vem em LISTA, não em objeto indexado por status: a ordem é o dado. A pizza
 *  desenha as fatias nesta sequência para se ler como funil, e um objeto não
 *  garante ordem de forma confiável. */
export interface EtapaDoPortfolio {
  status: StatusProjeto;
  total: number;
  /** Os projetos da fatia, já ordenados por nome. A fatia é clicável, e só a
   *  contagem não responde "quais são esses?". */
  projetos: { id: number; nome: string }[];
}

export interface VisaoGeral {
  kpis: {
    total: number;
    em_execucao: number;
    perto_de_finalizar: number;
    atrasados: number;
    pausados: number;
    finalizados: number;
  };
  /** As 6 etapas em curso, sempre todas — inclusive as vazias, com `total: 0`.
   *  A soma dos totais é igual a `placar_gestao.total_ativos`, e é isso que faz
   *  o número no meio da pizza fechar com as fatias. */
  por_etapa: EtapaDoPortfolio[];
  /** % dos projetos ativos sem banca atrasada. A entrega ao cliente fica de
   *  fora de propósito: depende da agenda dele (§7.1). */
  placar_gestao: { percentual: number; no_prazo: number; total_ativos: number };
  /** % dos projetos em curso atrasados por QUALQUER motivo, banca ou entrega.
   *
   *  ⚠ Não é o complemento do `placar_gestao`: aquele ignora atraso de entrega.
   *  `100 - placar` não dá este número, e os dois ficam lado a lado na tela —
   *  os rótulos precisam dizer o que cada um mede. */
  atrasados_gestao: { percentual: number; atrasados: number; total_ativos: number };
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
  semana: {
    inicio: string;
    fim: string;
    /** Quem decide é o servidor, não o relógio do navegador — máquina com data
     *  ou fuso errado mostraria a semana errada como se fosse a de hoje. */
    eh_atual: boolean;
    eh_passada: boolean;
    /** 0 = semana atual, 1 = semana passada, 2 = duas atrás... */
    semanas_atras: number;
  };
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

/** Um projeto na carga de alguém. Carrega a etapa porque o gráfico de barras
 *  filtra a carga por ela — com só o nome, cada troca de filtro exigiria uma
 *  requisição nova. O id deixa o chip da tabela virar link. */
export interface ProjetoDaCarga {
  id: number;
  nome: string;
  status: StatusProjeto;
}

export interface LinhaCarga {
  usuario_id: number;
  nome: string;
  posicao: string;
  /** A carga INTEIRA da pessoa, sem filtro. O gráfico de barras filtra por
   *  etapa no cliente, mas nunca reescreve este número nem a `situacao`:
   *  a mesma pessoa apareceria "Disponível" no gráfico filtrado e "Carga alta"
   *  na tabela logo abaixo. */
  total: number;
  projetos: ProjetoDaCarga[];
  /** A situação resolvida pela escala do papel (§7.3), definida pela diretoria
   *  em Configurações. Vem pronta do backend porque a regra é dele — a tela
   *  reimplementá-la seria convite para divergirem.
   *
   *  `null` quando o total fica abaixo do menor mínimo da escala — a diretoria
   *  pode subir o mínimo da primeira faixa para deixar os menos carregados sem
   *  rótulo. A tela mostra um travessão. */
  situacao: { nome: string; tom: TomSituacao } | null;
  /** A pessoa caiu na faixa mais alta do seu papel.
   *
   *  Quem decide é o backend, pela POSIÇÃO da faixa na escala — não pelo nome
   *  nem pela cor, que são livres. Sem isso, a tela teria de procurar por
   *  `tom === "alerta"` ou pelo nome "Carga alta", e trocar a cor de uma faixa
   *  esvaziaria o destaque em silêncio. */
  demanda_alta: boolean;
}

/** Quantos projetos ainda cabem numa frente, por papel.
 *
 *  Os dois papéis vêm SEPARADOS de propósito. Virar um número só de "projetos
 *  vendáveis" exigiria assumir o tamanho da equipe, e a suposição sumiria
 *  dentro do resultado: quem lesse "8" não saberia que os consultores já estão
 *  no limite e que o 8 veio inteiro dos coordenadores. */
export interface CapacidadeFrente {
  /** `null` para quem não tem frente cadastrada. */
  frente_id: number | null;
  frente_nome: string;
  consultor: number;
  coordenador: number;
  pessoas: number;
}

export interface Alocacao {
  coordenadores: LinhaCarga[];
  consultores: LinhaCarga[];
  capacidade: {
    por_frente: CapacidadeFrente[];
    /** ⚠ NÃO é a soma das linhas: quem está em duas frentes aparece nas duas,
     *  e somar contaria a vaga dela duas vezes. O backend conta por pessoa. */
    total: { consultor: number; coordenador: number };
    /** Até quantos projetos cada papel carrega sem sobrecarregar. Vem do
     *  backend para a tela não reescrever os números por conta própria. */
    teto: { consultor: number; coordenador: number };
  };
  /** Quem caiu na faixa mais alta do seu papel, já filtrado pelo backend.
   *  É o que devolve a leitura de "quem é o gargalo" (§7.3), perdida quando as
   *  duas tabelas passaram a ordenar do menos carregado para o mais. */
  demanda_alta: {
    coordenadores: LinhaCarga[];
    consultores: LinhaCarga[];
  };
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

/** O escopo que decide a posição do projeto na fila (§7) — o que está mais
 *  perto de estourar o prazo, entre os que ainda estão em contagem. */
export interface EscopoCritico {
  id: number;
  nome: string;
  restantes: number;
  estourou: boolean;
  data_entrega_planejada: string | null;
}

export interface CronogramaProjetoResumo {
  projeto_id: number;
  projeto_nome: string;
  cliente: string;
  cronograma: CronogramaResposta;
  /** `null` = nenhum escopo em contagem (todos entregues/cancelados, ou
   *  nenhum começou ainda) — o card vai para o fim da fila. */
  escopo_critico: EscopoCritico | null;
}

export interface CronogramasGerais {
  /** Já vem ordenado do backend, do mais perto de estourar pro mais
   *  folgado — o front só renderiza na ordem recebida. */
  projetos: CronogramaProjetoResumo[];
}

function query(frenteId?: number | null): string {
  return frenteId ? `?frente_id=${frenteId}` : "";
}

export function getVisaoGeral(token: string, frenteId?: number | null) {
  return apiFetch<VisaoGeral>(`/monitoramento/visao-geral${query(frenteId)}`, { token });
}

/**
 * `referencia` = qualquer dia da semana desejada, em `YYYY-MM-DD`; o servidor
 * normaliza para a segunda. Sem ela, a semana de hoje.
 *
 * Só o passado é aceito — o backend recusa data futura com 422. Semana futura
 * devolveria "não distribuiu" e "não fez reunião" para todo mundo, porque as
 * duas medem ausência de registro; a tela acusaria o time por algo que ainda
 * nem teve chance de acontecer.
 */
export function getExecucao(token: string, frenteId?: number | null, referencia?: string) {
  const partes = [frenteId ? `frente_id=${frenteId}` : "", referencia ? `referencia=${referencia}` : ""];
  const qs = partes.filter(Boolean).join("&");
  return apiFetch<Execucao>(`/monitoramento/execucao${qs ? `?${qs}` : ""}`, { token });
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

export function getCronogramasGerais(token: string, frenteId?: number | null) {
  return apiFetch<CronogramasGerais>(`/monitoramento/cronogramas${query(frenteId)}`, { token });
}
