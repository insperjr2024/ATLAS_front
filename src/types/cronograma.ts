import type { EscopoVendido } from "@/types/projeto";
import type { ReuniaoSemanal } from "@/types/tarefa";

export interface EtapaCronograma {
  id: number;
  projeto_escopo_id: number;
  nome: string;
  cor: string;
  data_inicio: string;
  data_fim: string;
  status: "planejada" | "em_andamento" | "concluida" | "cancelada";
  ordem: number;
}

/**
 * Só dois tipos gravados. Banca, entrega e kickoff são LIDOS de
 * `banca`, `projeto_escopo` e `projeto` — regravá-los criaria uma segunda
 * fonte da verdade e o "uma data só" do §8 morreria no primeiro reagendamento.
 */
export interface MarcoCronograma {
  id: number;
  projeto_id: number;
  projeto_escopo_id: number | null;
  tipo: "reuniao_alinhamento" | "visita_presencial";
  data: string;
  nota: string | null;
}

export interface EscopoComEtapas extends EscopoVendido {
  etapas: EtapaCronograma[];
}

export interface FaixaDerivadaResposta {
  /**
   * ⭐ `escopo` é a JANELA do §5: da reunião inicial até *vendidos +
   * ajustados* dias úteis depois dela.
   *
   * ⚠ Já foi "até a banca", e por isso sumia enquanto a banca não tivesse
   * data — justamente quando é mais útil. A faixa é **previsão**: ela mostra
   * até onde o escopo cabe no que foi prometido, e é dentro dela que a banca
   * precisa caber (§9), não o contrário.
   *
   * As outras duas são do projeto inteiro e vêm sem escopo.
   */
  tipo: "escopo" | "ambientacao" | "pausa";
  projeto_escopo_id: number | null;
  inicio: string;
  fim: string;
  rotulo: string;
}

export interface DiaNaoUtilResposta {
  data: string;
  tipo: string;
  descricao: string | null;
  /**
   * A frente dona do dia; `null` vale para todas.
   *
   * O calendário acadêmico deixou de ser um só: cada frente abrange cursos
   * diferentes, e cada curso tem as suas semanas de avaliação. Feriado é do
   * país e continua global.
   */
  frente_id: number | null;
}

export interface CronogramaResposta {
  projeto_id: number;
  data_kickoff: string | null;
  escopos: EscopoComEtapas[];
  marcos: MarcoCronograma[];
  faixas_derivadas: FaixaDerivadaResposta[];
  janela: { inicio: string; fim: string };
  /**
   * A gestão corrente. A `janela` é larga de propósito — o ano corrente e o
   * seguinte, para a navegação ser livre —, mas o semestre é o recorte que
   * interessa por padrão: é quando o projeto de fato acontece.
   */
  semestre: { nome: string; inicio: string; fim: string } | null;
  dias_nao_uteis: DiaNaoUtilResposta[];
  /**
   * As reuniões do projeto — a inicial de cada escopo e as gerais.
   *
   * Vêm aqui porque elas são MARCAÇÕES DO CRONOGRAMA desde que a aba Reuniões
   * deixou de existir: sem isso, o que o coordenador acabou de marcar sumia da
   * tela até o próximo carregamento.
   */
  reunioes: ReuniaoSemanal[];
}
