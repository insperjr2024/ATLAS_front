import { apiFetch } from "@/lib/api";
import type { TomSituacao } from "@/lib/situacoes-carga";
import type { StatusProjeto } from "@/types/projeto";
import type { CronogramaResposta } from "@/types/cronograma";

/* Os tipos espelham `use_cases/monitoramento/monitoramento.py`. */

/** O que faz um projeto pedir atenção (§7.1).
 *
 *  `entrega_interna` e `entrega_externa` são separadas porque o §7.4 as trata
 *  diferente — a externa depende da agenda do cliente e não se cobra do time. */
export type TipoAtencao =
  | "kickoff"
  | "banca"
  | "entrega_interna"
  | "entrega_externa"
  | "reuniao"
  | "tarefa";

/** Os rótulos do filtro, na ordem em que aparecem. A ordem é do que o time
 *  controla (tarefa, reunião) para o que depende de terceiro (cliente). */
export const ROTULO_ATENCAO: Record<TipoAtencao, string> = {
  tarefa: "Tarefas",
  reuniao: "Reuniões",
  banca: "Bancas",
  entrega_interna: "Entregas",
  entrega_externa: "Entregas (cliente)",
  kickoff: "Kickoff",
};

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
    /** Escopos entregues NA GESTÃO ATUAL — o assunto do card.
     *
     *  ⚠ Não bate com a soma da `tendencia`: ela abre 6 meses e ignora o
     *  semestre, senão viriam quatro meses zerados (a gestão começou em
     *  julho). São duas leituras no mesmo card, de propósito. */
    total_escopos: number;
    /** Entregas por mês nos últimos 6, do mais antigo ao mais novo. O mês
     *  corrente entra incompleto — é "o que saiu até agora", não previsão. */
    tendencia: { inicio: string; total: number }[];
  };
  bancas_proximas: {
    /** O id da banca, para a linha do card levar até ela em /bancas. */
    banca_id: number;
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
    /** A categoria, para a tela filtrar. Vem separada do `motivo` porque
     *  aquele é frase escrita para humano e muda de redação — agrupar por ela
     *  seria agrupar por string livre. */
    tipo: TipoAtencao;
    motivo: string;
    dias: number | null;
  }[];
  /**
   * ⭐ Os números da JANELA DO ESCOPO (§5), agregados por projeto.
   *
   * ⚠ Não confundir `dias_parados` com `tempo_parado` acima: aquele conta os
   * dias CORRIDOS desde a última entrega enquanto o projeto espera o próximo
   * escopo começar; este conta os **dias úteis em branco** do cronograma
   * inteiro, do kickoff até hoje — dia sem etapa, reunião, banca ou entrega.
   * O primeiro responde "está entre escopos?"; o segundo, "está andando?".
   *
   * `dias_de_atraso` é o PIOR atraso entre os escopos do projeto, não a soma:
   * somar dois escopos atrasados em paralelo contaria o mesmo calendário duas
   * vezes.
   */
  janela: {
    por_projeto: {
      projeto_id: number;
      projeto_nome: string;
      dias_ajustados: number;
      dias_de_atraso: number;
      dias_parados: number;
    }[];
    totais: { dias_ajustados: number; dias_de_atraso: number; dias_parados: number };
  };
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
    /** A SOMA dos dias de todos os motivos. Serve para volume acumulado, não
     *  para "há quanto tempo está parado" — três escopos com 4 dias cada somam
     *  12 sem que nada esteja parado há 12 dias. */
    dias_totais: number;
    /** O PIOR motivo isolado. É o número em destaque na tela, e o que ordena
     *  a lista — responde "qual é o maior buraco deste projeto". */
    pior_motivo: number;
    motivos: {
      tipo: string;
      descricao: string;
      dias: number;
      escopo: string;
      projeto_escopo_id: number | null;
      /** A data que venceu: a banca não realizada ou a entrega planejada. */
      data_referencia: string | null;
      /** §7.4 — já tem justificativa da diretoria cobrindo ESTE motivo (o
       *  mesmo escopo pode estar atrasado em banca e entrega ao mesmo tempo;
       *  uma nota de uma rodada de atraso anterior, já resolvida, não conta).
       *  O motivo continua na lista mesmo justificado: o alerta é automático. */
      justificado: boolean;
      /** Qual nota justifica — pra o selo "justificado" levar direto pra ela
       *  no histórico do projeto. `null` quando `justificado` é `false`. */
      justificativa_id: number | null;
    }[];
  }[];
  por_coordenador: {
    usuario_id: number;
    nome: string;
    projetos: number;
    atrasados: number;
    /** O maior atraso isolado entre os projetos dele, com o contexto junto.
     *
     *  Substituiu o acumulado: "40 dias somados" não diz se são quatro atrasos
     *  de 10 ou um de 40, e a ação é diferente em cada caso. */
    pior_dias: number;
    pior_projeto: string;
    pior_motivo: string;
  }[];
  /** Os números da faixa do topo, calculados no backend — a divisão
   *  banca/entrega decide a leitura do §7.4 e o front recontar isso a partir
   *  das descrições seria reimplementar a classificação. */
  resumo: {
    projetos: number;
    pior_caso: number;
    /** Projetos com entrega travada do lado do CLIENTE. O §7.4 tira isso do
     *  que se cobra do time, mas é o caso mais delicado do portfólio — quem
     *  resolve é a diretoria falando com o cliente. */
    com_externo: number;
    pior_externo: number;
  };
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

function query(frenteId?: number | null, escopoId?: number | null, extra?: Record<string, string | undefined>): string {
  const partes = [
    frenteId ? `frente_id=${frenteId}` : "",
    escopoId ? `escopo_id=${escopoId}` : "",
    ...Object.entries(extra ?? {}).map(([k, v]) => (v ? `${k}=${v}` : "")),
  ].filter(Boolean);
  return partes.length ? `?${partes.join("&")}` : "";
}

export function getVisaoGeral(token: string, frenteId?: number | null, escopoId?: number | null) {
  return apiFetch<VisaoGeral>(`/monitoramento/visao-geral${query(frenteId, escopoId)}`, { token });
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
export function getExecucao(
  token: string,
  frenteId?: number | null,
  referencia?: string,
  escopoId?: number | null,
) {
  return apiFetch<Execucao>(
    `/monitoramento/execucao${query(frenteId, escopoId, { referencia })}`,
    { token },
  );
}

export function getAlocacao(token: string, frenteId?: number | null, escopoId?: number | null) {
  return apiFetch<Alocacao>(`/monitoramento/alocacao${query(frenteId, escopoId)}`, { token });
}

export function getAtrasos(token: string, frenteId?: number | null, escopoId?: number | null) {
  return apiFetch<Atrasos>(`/monitoramento/atrasos${query(frenteId, escopoId)}`, { token });
}

export function getTarefasGerais(token: string, frenteId?: number | null, escopoId?: number | null) {
  return apiFetch<TarefasGerais>(`/monitoramento/tarefas${query(frenteId, escopoId)}`, { token });
}

export function getCronogramasGerais(token: string, frenteId?: number | null, escopoId?: number | null) {
  return apiFetch<CronogramasGerais>(`/monitoramento/cronogramas${query(frenteId, escopoId)}`, { token });
}
