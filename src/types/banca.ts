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
}

// Campos calculados que a API adiciona em GET /bancas e GET /bancas/{id}
// (não existem no banco — ver seção "Campos calculados" do schema)
export interface Banca extends BancaBase {
  status: StatusBanca;
  vagas: number;
  alocados: number;
  semestre_id: number;
  semestre_nome: string;
  // F5 — a costura com o projeto.
  projeto_escopo_id: number | null;
  realizado_em: string | null;
  resultado: ResultadoBanca | null;
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

export interface Frente {
  id: number;
  nome: string;
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
}

export interface BancaParaAvaliar {
  usuario_id: number;
  banca_id: number;
  nome_projeto: string;
  data_hora: string;
}

export interface Avaliacao {
  id: number;
  banca_id: number;
  avaliador_id: number;
  formulario_id: number;
  status: "rascunho" | "submetida";
  comentario_feedback: string | null;
  submetida_em: string | null;
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
}