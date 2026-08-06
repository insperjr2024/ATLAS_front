export interface Notificacao {
  id: number;
  usuario_id: number;
  mensagem: string;
  banca_id: number | null;
  lida: boolean;
  criado_em: string;
}

export type StatusSolicitacaoTroca = "pendente" | "confirmada" | "cancelada";

export interface SolicitacaoTroca {
  id: number;
  banca_id: number;
  usuario_original_id: number;
  candidatura_id: number | null;
  status: StatusSolicitacaoTroca;
  criado_em: string;
  confirmada_por: number | null;
  confirmada_em: string | null;
}
