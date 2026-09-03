export interface Tarefa {
  id: number;
  projeto_id: number;
  projeto_escopo_id: number | null;
  titulo: string;
  /** Um ou vários. "Todos do projeto" no formulário = todos os consultores
   *  atuais, gravados como lista (snapshot). Sempre ao menos um. */
  responsavel_ids: number[];
  /** `null` = tarefa comum. Preenchido = uma parte de "cada um faz a sua":
   *  as outras partes têm o mesmo valor, e cada card anda no kanban sozinho. */
  grupo_id: number | null;
  prazo: string;
  /** A coluna do kanban, configurável pela diretoria, não mais um ENUM. */
  coluna_id: number;
  criado_por: number;
  criado_em: string;
  /** Só muda quando o STATUS muda, alimenta a "última movimentação". */
  movida_em: string;
  /**
   * Derivado pelo backend, nunca gravado: prazo passado + a coluna atual
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
  /**
   * Sobre qual escopo foi a reunião. Vazio = reunião geral do projeto.
   * A PRIMEIRA reunião de um escopo é a "reunião inicial" do , é ela que
   * preenche a `data_inicio` dele e faz a contagem de dias começar a correr.
   */
  projeto_escopo_id: number | null;
  data_reuniao: string;
  /** Texto livre, a ata informal da reunião geral. */
  observacoes: string | null;
  /** Derivado do vínculo, não gravado: um campo próprio poderia divergir e
   *  criar uma reunião "geral" com escopo preenchido. */
  tipo: "inicial" | "geral";
  registrado_por: number;
}

/** A resposta do POST: `escopo_iniciado` avisa que a contagem começou agora. */
export interface ReuniaoRegistrada extends ReuniaoSemanal {
  escopo_iniciado: boolean;
}

export interface ReunioesResposta {
  reunioes: ReuniaoSemanal[];
  semana_atual: { inicio: string; fim: string };
  /** Ausência de linha na janela seg–dom = projeto sem reunião. */
  tem_reuniao_esta_semana: boolean;
}
