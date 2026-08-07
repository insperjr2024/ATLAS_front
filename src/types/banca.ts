/**
 * Os 4 estados da banca (§7.4, §8).
 *
 * `atrasada` — venceu e não aconteceu — é o estado que não existia antes da
 * F5 e que destrava o monitoramento. Uma banca `atrasada` **ainda aceita
 * inscrição**: quem fecha é a realização, não o calendário.
 */
export type StatusBanca = "nao_marcada" | "aberta" | "realizada" | "atrasada";

export type ResultadoBanca = "aprovada" | "nao_aprovada";

/**
 * Campos vindos direto da tabela `banca`.
 *
 * `data_hora` é nullable no banco (é o que torna `nao_marcada` representável),
 * mas nenhum caminho de criação deixa a coluna vazia — tanto `POST /bancas`
 * quanto marcar pelo cronograma exigem a data. Na prática, "escopo sem banca"
 * é ausência de LINHA, e quem mostra isso é a aba Visão geral, lendo
 * `escopo.banca === null`. Por isso o tipo de listagem mantém a data
 * obrigatória, em vez de espalhar guardas por telas onde o caso não ocorre.
 */
export interface BancaBase {
  id: number;
  nome_projeto: string;
  escopo_id: number | null; // vazio quando o escopo vendido é um "Outro"
  coordenador_id: number;
  data_hora: string; // ISO 8601
  /** Nulo = usa a soma do piso das frentes vinculadas (§8). Só a diretoria
   *  define — ver `podeAgendar`/`usuario.posicao === "diretor"` no form. */
  piso_minimo_override: number | null;
  /**
   * O piso REAL da composição (§8), já resolvido pela API: o override quando
   * existe, senão a soma do `piso_banca` das frentes vinculadas.
   *
   * ⚠ Não confundir com `vagas`, que é o TETO de quantos cabem na banca.
   * Comparar `alocados < vagas` para dizer "abaixo do mínimo" acusa quase
   * toda banca — o teto é 5 e o §8 pede 3 numa banca só de Business.
   */
  piso_minimo: number;
}

// Campos calculados que a API adiciona em GET /bancas e GET /bancas/{id}
// (não existem no banco — ver seção "Campos calculados" do schema)
export interface Banca extends BancaBase {
  status: StatusBanca;
  vagas: number;
  alocados: number;
  /**
   * ⭐ §8: quem NÃO pode avaliar esta banca por ser do grupo dela —
   * coordenador + equipe do projeto dos escopos que ela cobre.
   *
   * ⚠ Vem do backend porque a resposta depende de duas fontes: a tabela legada
   * `equipe_projeto` (preenchida à mão na tela de bancas) e `projeto_membro`,
   * que é a equipe real e a única que existe quando a banca nasce pelo
   * cronograma. Olhar só a primeira deixava o consultor se inscrever na banca
   * do próprio projeto.
   */
  equipe_ids: number[];
  semestre_id: number;
  semestre_nome: string;
  /** A costura com o projeto: os escopos vendidos que esta banca cobre.
   *  Vazio nas bancas legadas, que não têm escopo vendido. */
  projeto_escopo_ids: number[];
  realizado_em: string | null;
  resultado: ResultadoBanca | null;
  /** O relato do coordenador do projeto sobre a banca — texto livre, no
   *  lugar do formulário de avaliação (ele não é avaliador da própria
   *  banca). Nulo até ele preencher, só disponível depois de `realizado_em`. */
  descricao_coordenador: string | null;
  descricao_coordenador_enviada_em: string | null;
}

export interface Candidatura {
  id: number;
  banca_id: number;
  usuario_id: number;
  criado_em: string;
  confirmado: boolean;
}

export interface Desempenho {
  semestre_id: number;
  semestre_nome: string;
  bancas_atendidas: number;
  total_bancas_realizadas: number;
  percentual: number;
}

/** O CATÁLOGO de escopos por frente (§4) — distinto do escopo vendido de um
 *  projeto, que é `EscopoVendido` em `types/projeto.ts`. */
export interface Escopo {
  id: number;
  nome: string;
  frente_id: number | null;
  ativo: boolean;
}

/** Nome resolvido de um escopo VENDIDO (de um projeto), de todos os
 *  projetos — usado só pra página Bancas resolver `Banca.projeto_escopo_ids`
 *  em nomes, já que ela lista bancas de projetos diferentes ao mesmo tempo.
 *  Versão enxuta de `EscopoVendido` (`types/projeto.ts`), sem a contagem de
 *  dias, que não faz sentido fora do contexto de um projeto só. */
export interface EscopoVendidoResumo {
  id: number;
  projeto_id: number;
  nome: string;
}

export interface Frente {
  id: number;
  nome: string;
  ativa: boolean;
  /** Mínimo de membros da frente exigido numa banca (§8) — editável pela
   *  diretoria em Config. */
  piso_banca: number;
}

export interface Configuracao {
  id: number;
  /** Teto de pessoas por banca (§8) — editável pela diretoria em Config. */
  vagas_por_banca: number;
  /** Quantas lideranças (gerente da frente, ou diretor) cada frente
   *  vinculada precisa ter na banca, separado do piso de membros comuns
   *  (§8) — editável pela diretoria em Config. */
  lideranca_minima_por_frente: number;
}

export interface BancaFrente {
  id: number;
  banca_id: number;
  frente_id: number;
}

export interface EquipeProjeto {
  id: number;
  banca_id: number;
  usuario_id: number;
}

export interface Pergunta {
  id: number;
  formulario_id?: number;
  texto: string;
  ordem: number;
  tipo_resposta: "nota" | "texto";
  /** Nulo = pergunta universal (aparece em toda banca); com valor, só
   *  aparece quando a banca avaliada é daquele escopo. */
  escopo_id: number | null;
}

export interface FormularioAtivo {
  id: number;
  semestre_id: number;
  perguntas: Pergunta[];
}

export interface NotaPorPergunta {
  pergunta_id: number;
  texto: string | null;
  media: number;
}

export interface PerguntaNovaVersao {
  texto: string;
  ordem: number;
  tipo_resposta: "nota" | "texto";
  escopo_id: number | null;
}

export interface BancaParaAvaliar {
  usuario_id: number;
  banca_id: number;
  nome_projeto: string;
  data_hora: string;
  /** 2 dias corridos a partir de `banca.realizado_em` (§8) — depois disso o
   *  envio da avaliação é bloqueado, não só destacado. */
  prazo_avaliacao: string;
  prazo_expirado: boolean;
}

export interface Avaliacao {
  id: number;
  banca_id: number;
  avaliador_id: number;
  formulario_id: number;
  status: "rascunho" | "submetida";
  comentario_feedback: string | null;
  submetida_em: string | null;
  /** Bloco 1 do formulário — resposta livre, não necessariamente igual ao
   *  cadastro do sistema (o avaliador pode confirmar diferente). */
  nome_avaliador: string | null;
  tipo_avaliador: "consultor" | "lideranca" | null;
  projeto_avaliado: string | null;
  /** O escopo que o próprio avaliador confirmou — decide o Bloco 2, não
   *  necessariamente o mesmo de `banca.escopo_id`. */
  escopo_avaliado_id: number | null;
  escopo_avaliado_outro: string | null;
}

export interface AvaliacaoNota {
  id: number;
  avaliacao_id: number;
  pergunta_id: number;
  nota: number | null;
  resposta_texto: string | null;
}

export interface Semestre {
  id: number;
  nome: string;
  inicio: string;
  fim: string;
}

export interface HistoricoBanca {
  id: number;
  nome_projeto: string;
  escopo_id: number;
  coordenador_id: number;
  data_hora: string;
  nota_final: number | null;
  semestre_id: number | null;
  semestre_nome: string | null;
  /** O relato do coordenador — ao lado da nota dos avaliadores, os dois
   *  lados da mesma banca (ver `descricao_coordenador` em `Banca`). */
  descricao_coordenador: string | null;
  descricao_coordenador_enviada_em: string | null;
}