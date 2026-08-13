import { apiFetch } from "@/lib/api";
import type { TomSituacao } from "@/lib/situacoes-carga";
import type { StatusProjeto } from "@/types/projeto";
import type { CronogramaResposta } from "@/types/cronograma";

/* Os tipos espelham `use_cases/monitoramento/monitoramento.py`. */

/**
 * O que faz um projeto pedir atenção.
 *
 * `entrega_interna` e `entrega_externa` saíram em 2026-08-12: o atraso da
 * ENTREGA ao cliente deixou de ser insight. Ele media a agenda do cliente e não
 * o trabalho do time, e deixava vermelho um projeto cuja banca aconteceu no
 * prazo. O atraso do escopo hoje é medido só contra a BANCA.
 */
export type TipoAtencao = "kickoff" | "banca" | "reuniao" | "tarefa";

/** Os rótulos do filtro, na ordem em que aparecem, do que o time controla no
 *  dia a dia (tarefa, reunião) para os marcos (banca, kickoff). */
export const ROTULO_ATENCAO: Record<TipoAtencao, string> = {
  tarefa: "Tarefas",
  reuniao: "Reuniões",
  banca: "Bancas",
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
  /** As 6 etapas em curso, sempre todas, inclusive as vazias, com `total: 0`.
   *  A soma dos totais é igual a `placar_gestao.total_ativos`, e é isso que faz
   *  o número no meio da pizza fechar com as fatias. */
  por_etapa: EtapaDoPortfolio[];
  /** % dos projetos ativos sem banca atrasada. A entrega ao cliente fica de
   *  fora de propósito: depende da agenda dele. */
  placar_gestao: { percentual: number; no_prazo: number; total_ativos: number };
  /** % dos projetos em curso atrasados por QUALQUER motivo, banca ou entrega.
   *
   *  Não é o complemento do `placar_gestao`: aquele ignora atraso de entrega.
   *  `100 - placar` não dá este número, e os dois ficam lado a lado na tela —
   *  os rótulos precisam dizer o que cada um mede. */
  atrasados_gestao: { percentual: number; atrasados: number; total_ativos: number };
  entregas: {
    /** Escopos entregues NA GESTÃO ATUAL, o assunto do card.
     *
     *  Não bate com a soma da `tendencia`: ela abre 6 meses e ignora o
     *  semestre, senão viriam quatro meses zerados (a gestão começou em
     *  julho). São duas leituras no mesmo card, de propósito. */
    total_escopos: number;
    /** Entregas por mês nos últimos 6, do mais antigo ao mais novo. O mês
     *  corrente entra incompleto, é "o que saiu até agora", não previsão. */
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
  /**
   * O VÃO ENTRE ESCOPOS: da entrega ao cliente de um até a reunião inicial
   * do seguinte, um item por PAR, não por projeto.
   *
   * Media sempre até HOJE e dava número negativo quando a entrega estava
   * registrada para o futuro (a tela chegou a mostrar "-16 dias parado").
   * Corrigido em 2026-08-12.
   */
  tempo_parado: {
    projeto_id: number;
    projeto_nome: string;
    escopo_entregue: string;
    /** `null` quando o vão está ABERTO, ninguém começou o próximo escopo. */
    escopo_seguinte: string | null;
    /** Aberto = ainda correndo até hoje. Fechado = tamanho definitivo. */
    aberto: boolean;
    /** Dias CORRIDOS: é tempo de calendário parado, não esforço. */
    dias_parado: number;
  }[];
  /** o motivo é explícito, nunca um rótulo genérico. */
  atencao_agora: {
    projeto_id: number;
    projeto_nome: string;
    /** A categoria, para a tela filtrar. Vem separada do `motivo` porque
     *  aquele é frase escrita para humano e muda de redação, agrupar por ela
     *  seria agrupar por string livre. */
    tipo: TipoAtencao;
    motivo: string;
    dias: number | null;
  }[];
  /**
   * Os números da JANELA DO ESCOPO, agregados por projeto.
   *
   * Não confundir `dias_parados` com `tempo_parado` acima: aquele conta os
   * dias CORRIDOS desde a última entrega enquanto o projeto espera o próximo
   * escopo começar; este conta os **dias úteis em branco** do cronograma
   * inteiro, do kickoff até hoje, dia sem etapa, reunião, banca ou entrega.
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
  /** Tem tarefas, mas todas concluídas ou canceladas, o quadro zerou e não
   *  veio o próximo lote. Situação diferente de `sem_tarefas`. */
  sem_tarefas_ativas: boolean;
  /** Dias ÚTEIS desde a última tarefa criada (ou desde o kickoff, se nunca
   *  houve nenhuma). `null` = projeto ainda sem kickoff. */
  dias_uteis_sem_tarefa: number | null;
  /** De ONDE o campo acima conta, lido do banco por `_marco_sem_tarefa`.
   *
   *  Vem na resposta porque o número de dias sozinho é ambíguo, não dá para
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
    /** Quem decide é o servidor, não o relógio do navegador, máquina com data
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
 *  filtra a carga por ela, com só o nome, cada troca de filtro exigiria uma
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
  /** A situação resolvida pela escala do papel, definida pela diretoria
   *  em Configurações. Vem pronta do backend porque a regra é dele, a tela
   *  reimplementá-la seria convite para divergirem.
   *
   *  `null` quando o total fica abaixo do menor mínimo da escala, a diretoria
   *  pode subir o mínimo da primeira faixa para deixar os menos carregados sem
   *  rótulo. A tela mostra um travessão. */
  situacao: { nome: string; tom: TomSituacao } | null;
  /** A pessoa caiu na faixa mais alta do seu papel.
   *
   *  Quem decide é o backend, pela POSIÇÃO da faixa na escala, não pelo nome
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
    /** NÃO é a soma das linhas: quem está em duas frentes aparece nas duas,
     *  e somar contaria a vaga dela duas vezes. O backend conta por pessoa. */
    total: { consultor: number; coordenador: number };
    /** Até quantos projetos cada papel carrega sem sobrecarregar. Vem do
     *  backend para a tela não reescrever os números por conta própria. */
    teto: { consultor: number; coordenador: number };
  };
  /** Quem caiu na faixa mais alta do seu papel, já filtrado pelo backend.
   *  É o que devolve a leitura de "quem é o gargalo", perdida quando as
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
     *  para "há quanto tempo está parado", três escopos com 4 dias cada somam
     *  12 sem que nada esteja parado há 12 dias. */
    dias_totais: number;
    /** O PIOR motivo isolado. É o número em destaque na tela, e o que ordena
     *  a lista, responde "qual é o maior buraco deste projeto". */
    pior_motivo: number;
    motivos: {
      tipo: string;
      descricao: string;
      dias: number;
      escopo: string;
      projeto_escopo_id: number | null;
      /** A data que venceu: a banca não realizada ou a entrega planejada. */
      data_referencia: string | null;
      /** Já tem justificativa da diretoria cobrindo ESTE motivo (o
       *  mesmo escopo pode estar atrasado em banca e entrega ao mesmo tempo;
       *  uma nota de uma rodada de atraso anterior, já resolvida, não conta).
       *  O motivo continua na lista mesmo justificado: o alerta é automático. */
      justificado: boolean;
      /** Qual nota justifica, pra o selo "justificado" levar direto pra ela
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
  /**
   * os escopos que passaram da JANELA, a coluna "Atraso" do card
   * "Escopos vendidos", com o porquê escrito por quem conduz o projeto.
   *
   * **Não são os `motivos` de `por_projeto`.** Aqueles perguntam "o que
   * venceu e não aconteceu?" e fecham quando o fato acontece; este pergunta
   * "o trabalho passou do tempo vendido?". Um escopo pode estourar a janela
   * com a banca realizada e a entrega em dia, e aí não há motivo nenhum
   * aberto, o projeto nem aparece na lista de atrasos.
   *
   * Vem ordenado com o que FALTA justificar primeiro: é fila de trabalho.
   */
  escopos_atrasados: {
    projeto_id: number;
    projeto_nome: string;
    projeto_escopo_id: number;
    escopo_nome: string;
    /** Dias úteis além da janela, a mesma conta da tela do projeto. */
    dias: number;
    dias_vendidos: number;
    dias_ajustados: number;
    /** `null` = ninguém explicou ainda. */
    justificativa: string | null;
    justificativa_id: number | null;
    registrado_por: string | null;
    registrado_em: string | null;
  }[];
  /** Os números da faixa do topo, calculados no backend, a divisão
   *  banca/entrega decide a leitura do  e o front recontar isso a partir
   *  das descrições seria reimplementar a classificação. */
  /** `com_externo`/`pior_externo` saíram com o motivo de entrega
   *  (2026-08-12): sem ele seriam dois zeros permanentes na faixa do topo. */
  resumo: {
    projetos: number;
    pior_caso: number;
  };
}

/** Espelha `Urgencia` de `types/tarefa.ts`, mesma gradação, backend igual. */
export type UrgenciaTarefa = "vencida" | "critica" | "atencao" | "normal";

export interface ColunaAgregada {
  /** Nome normalizado (minúsculo, sem espaço nas pontas), chave de
   *  agrupamento, já que colunas de projetos diferentes podem se chamar
   *  igual (ou quase). */
  chave: string;
  /** Nome de exibição, o da primeira coluna encontrada com esse nome. */
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

/** O escopo que decide a posição do projeto na fila, o que está mais
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
   *  nenhum começou ainda), o card vai para o fim da fila. */
  escopo_critico: EscopoCritico | null;
}

export interface CronogramasGerais {
  /** Já vem ordenado do backend, do mais perto de estourar pro mais
   *  folgado, o front só renderiza na ordem recebida. */
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
 * Só o passado é aceito, o backend recusa data futura com 422. Semana futura
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

/* ------------------------------------------------------------------ */
/* Aprovações, a fila da diretoria                                    */
/* ------------------------------------------------------------------ */

export interface AprovacaoDiasDeAjuste {
  id: number;
  projeto_id: number;
  projeto_nome: string;
  escopo_nome: string;
  dias_solicitados: number;
  dias_vendidos: number;
  dias_ajustados: number;
  motivo: string;
  solicitado_por_nome: string | null;
  criado_em: string;
}

export interface AprovacaoAtraso {
  projeto_id: number;
  projeto_nome: string;
  status: string;
  dias_totais: number;
  motivos: string[];
}

/**
 * Havia uma terceira fila, `entregas_sem_classificacao` (entregas atrasadas
 * sem o rótulo interno/agenda do cliente). Removida em 2026-08-12 junto com o
 * atraso de ENTREGA nos insights: sem a métrica que separava os dois tipos, a
 * classificação deixou de mudar qualquer número.
 */
export interface Aprovacoes {
  dias_de_ajuste: AprovacaoDiasDeAjuste[];
  atrasos_sem_justificativa: AprovacaoAtraso[];
  /** Servido pronto pelo backend, o badge da aba precisa dele antes de
   *  qualquer render, e somar no front duplicaria a conta. */
  total: number;
}

/**
 * Tudo que espera decisão da diretoria, numa chamada.
 *
 * Sem `frenteId` de propósito: a fila é dela e ela enxerga a área inteira
 *. Um filtro aqui só criaria a chance de um pedido ficar escondido atrás
 * de uma opção que alguém deixou ligada.
 */
export function getAprovacoes(token: string) {
  return apiFetch<Aprovacoes>("/monitoramento/aprovacoes", { token });
}
