/** Espelha `src/use_cases/notificacao/listar_notificacoes.py`. */

export type TipoNotificacao =
  // 📌 eventos da plataforma (§6.6)
  | "alocado_em_projeto"
  | "entrega_registrada"
  // 📌 eventos de bancas (§8) — entram por `utils/notificar.py` no backend
  | "escalacao_banca"
  | "troca_banca"
  | "avaliacao_pendente"
  | "banca_aviso"
  // 🔄 condições — recalculadas a cada GET; somem sozinhas quando resolvidas
  | "kickoff_pendente"
  | "tarefa_vencida"
  | "banca_nao_marcada"
  | "projeto_sem_reuniao"
  | "banca_hoje";

export interface Notificacao {
  /** Só o 📌 evento tem linha no banco. Condição vem com `null` e é
   *  identificada pela `chave` — é ela que o PATCH manda de volta. */
  id: number | null;
  chave: string;
  tipo: TipoNotificacao;
  origem: "evento" | "condicao";
  titulo: string;
  corpo: string | null;
  projeto_id: number | null;
  /** Para onde clicar leva. Vem pronta do backend. */
  rota: string | null;
  dias: number | null;
  /** Preenchido só no resumo da liderança ("11 tarefas vencidas"). */
  total: number | null;
  lida: boolean;
  criado_em: string | null;
}

export interface ListaNotificacoes {
  nao_lidas: number;
  itens: Notificacao[];
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
