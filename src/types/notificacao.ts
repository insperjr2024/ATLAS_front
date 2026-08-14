/** Espelha o enum `tipo_notificacao` do backend (ver `models/notificacao_model.py`).
 *
 * ⚠ **Esta lista precisa estar completa, e não é decoração.** O `APARENCIA` de
 * `pages/Notificacoes.tsx` é um `Record<TipoNotificacao, …>`: é este tipo que
 * faz o TypeScript exigir uma entrada para cada valor. Quando três valores
 * ficaram de fora daqui, o mapa passou a compilar incompleto e a tela quebrava
 * ao receber qualquer notificação desses tipos.
 */

export type TipoNotificacao =
  // eventos da plataforma
  | "alocado_em_projeto"
  | "entrega_registrada"
  // 📌 Vagas em projetos (§7.3) — pedido de entrada, para quem pede E para
  // quem responde (`solicitacao_projeto.py`)
  | "solicitacao_projeto"
  // pedido de dias de ajuste no cronograma (§13)
  | "reajuste_solicitado"
  | "reajuste_respondido"
  // 📌 o plano mudou depois de combinado — §5.6 e a data prometida ao cliente
  | "banca_remarcada"
  | "entrega_alterada"
  // Avaliação de Desempenho (Prioridade 2), não é de projeto
  | "lote_desempenho_aberto"
  // PDI (relatório de mentoria), mesmo motivo
  | "pdi_prazo_proximo"
  | "pdi_prazo_vencido"
  // eventos de bancas, entram por `utils/notificar.py` no backend
  | "escalacao_banca"
  | "troca_banca"
  | "avaliacao_pendente"
  | "descricao_coordenador_pendente"
  | "banca_aviso"
  // condições, recalculadas a cada GET; somem sozinhas quando resolvidas
  | "kickoff_pendente"
  | "tarefa_vencida"
  | "banca_nao_marcada"
  | "projeto_sem_reuniao"
  | "banca_hoje";

export interface Notificacao {
  /** Só o evento tem linha no banco. Condição vem com `null` e é
   *  identificada pela `chave`, é ela que o PATCH manda de volta. */
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
  /** Nulo = pedido aberto, qualquer elegível confirma. Preenchido = convite
   *  direto pra essa pessoa, só ela pode confirmar. */
  usuario_convidado_id: number | null;
  status: StatusSolicitacaoTroca;
  criado_em: string;
  confirmada_por: number | null;
  confirmada_em: string | null;
}
