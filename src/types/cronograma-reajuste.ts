/** §5.6: pedido do coordenador pra reabrir um cronograma já oficializado,
 *  aprovado ou rejeitado pela diretoria (nunca pelo gerente). */
export interface ReajusteCronograma {
  id: number;
  projeto_escopo_id: number;
  solicitado_por: number;
  motivo: string;
  status: "pendente" | "aprovado" | "rejeitado";
  respondido_por: number | null;
  resposta_justificativa: string | null;
  criado_em: string;
  respondido_em: string | null;
}

/** Uma linha da fila da diretoria — já com nome de projeto/escopo/quem pediu,
 *  pra não precisar cruzar três listas na tela. */
export interface ReajustePendenteResumo {
  id: number;
  projeto_escopo_id: number;
  projeto_id: number | null;
  projeto_nome: string | null;
  escopo_nome: string | null;
  solicitado_por: number;
  solicitado_por_nome: string | null;
  motivo: string;
  criado_em: string;
}
