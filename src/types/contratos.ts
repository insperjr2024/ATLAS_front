/** § Contratos — a integração com a antiga plataforma Contratos (Fase 1,
 *  ainda só em `contratos-implementacao`, não em produção). */

export type TipoDocumentoContratual = "contrato" | "tep" | "nda" | "uso_imagem" | "aditivo" | "outro";

export type StatusDocumentoContratual =
  | "aguardando_preenchimento"
  | "em_revisao_interna"
  | "aguardando_aprovacao_cliente"
  | "alteracao_solicitada"
  | "aprovado_pelo_cliente"
  | "assinado_e_arquivado";

export const ROTULO_TIPO_DOCUMENTO: Record<TipoDocumentoContratual, string> = {
  contrato: "Contrato de Prestação de Serviços",
  tep: "TEP",
  nda: "NDA",
  uso_imagem: "Termo de Uso de Imagem",
  aditivo: "Termo Aditivo",
  outro: "Outro",
};

export const ROTULO_STATUS_DOCUMENTO: Record<StatusDocumentoContratual, string> = {
  aguardando_preenchimento: "Aguardando preenchimento",
  em_revisao_interna: "Em revisão interna",
  aguardando_aprovacao_cliente: "Aguardando aprovação do cliente",
  alteracao_solicitada: "Alteração solicitada",
  aprovado_pelo_cliente: "Aprovado pelo cliente",
  assinado_e_arquivado: "Assinado e arquivado",
};

export interface DocumentoContratual {
  id: number;
  projeto_id: number;
  tipo: TipoDocumentoContratual;
  status: StatusDocumentoContratual;
  /** O shape muda por `tipo` (ver `render_template.py` no backend) — ainda
   *  sem um form campo-a-campo no front, então isto fica solto por ora. */
  dados: Record<string, unknown> | null;
  confirmado: boolean;
  gestao_id: number | null;
  criado_em: string;
  atualizado_em: string;
  /** 0 = nenhuma versão gerada ainda. */
  ultima_versao: number | null;
}

export interface VersaoDocumentoContratual {
  id: number;
  documento_id: number;
  versao: number;
  status_arquivo: string;
  criado_em: string;
}
