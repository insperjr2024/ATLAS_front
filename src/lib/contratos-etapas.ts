import type { StatusDocumentoContratual } from "@/types/contratos";

/**
 * As 7 etapas do ciclo de vida de um documento jurídico — fonte única pro
 * stepper de `DocumentoContratualPage.tsx` E pras colunas da Kanban de
 * `ContratosPainel.tsx`. Duas telas, uma lista só: se um status novo
 * aparecer um dia, corrige aqui, não em dois lugares que podem divergir.
 */
export const ETAPAS_DOCUMENTO = [
  "Preenchimento",
  "Geração",
  "Revisão interna",
  "Aprovado internamente",
  "Aprovação do cliente",
  "Aprovado",
  "Arquivado",
] as const;

/** Em que das 7 etapas um documento está. Só precisa do `status` e do
 *  `confirmado` (não do objeto inteiro) — `aguardando_preenchimento` é a
 *  única etapa que se divide em duas colunas pelo booleano. */
export function indiceDaEtapaDocumento(doc: {
  status: StatusDocumentoContratual;
  confirmado: boolean;
}): number {
  if (doc.status === "aguardando_preenchimento") return doc.confirmado ? 1 : 0;
  if (doc.status === "em_revisao_interna") return 2;
  if (doc.status === "aprovado_internamente") return 3;
  if (doc.status === "aguardando_aprovacao_cliente" || doc.status === "alteracao_solicitada") return 4;
  if (doc.status === "aprovado_pelo_cliente") return 5;
  return 6; // assinado_e_arquivado
}
