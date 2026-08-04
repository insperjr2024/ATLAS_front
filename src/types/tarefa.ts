export interface Tarefa {
  id: number;
  projeto_id: number;
  projeto_escopo_id: number | null;
  titulo: string;
  responsavel_id: number;
  prazo: string;
  /** A coluna do kanban — configurável pela diretoria, não mais um ENUM. */
  coluna_id: number;
  criado_por: number;
  criado_em: string;
  /** Só muda quando o STATUS muda — alimenta a "última movimentação" do §7.2. */
  movida_em: string;
  /**
   * 🧮 Derivado pelo backend, nunca gravado: prazo passado + a coluna atual
   * não marcada como "encerra a tarefa".
   */
  vencida: boolean;
}

export interface ReuniaoSemanal {
  id: number;
  projeto_id: number;
  data_reuniao: string;
  registrado_por: number;
}

export interface ReunioesResposta {
  reunioes: ReuniaoSemanal[];
  semana_atual: { inicio: string; fim: string };
  /** 🧮 Ausência de linha na janela seg–dom = projeto sem reunião. */
  tem_reuniao_esta_semana: boolean;
}
