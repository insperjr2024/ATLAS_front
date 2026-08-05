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
  /** ⏰ A gradação que o card usa para avisar ANTES do prazo estourar. */
  urgencia: Urgencia;
  /** Dias corridos até o prazo. Negativo = já passou. */
  dias_para_prazo: number | null;
}

export type Urgencia = "vencida" | "critica" | "atencao" | "normal";

export interface ComentarioTarefa {
  id: number;
  tarefa_id: number;
  autor_id: number;
  texto: string;
  criado_em: string;
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
