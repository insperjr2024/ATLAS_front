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

/** Formatos de `dados` por tipo (ver `render_template.py` e
 *  `dados_documento_contratual.py` no backend). Usados pelo formulário
 *  campo-a-campo em `DadosDocumentoForm.tsx` — o estado em si continua solto
 *  (`Record<string, unknown>`), estas interfaces são só o contrato de forma
 *  que cada seção do formulário espera ler/escrever. */
export interface Representante {
  nome: string;
  nacionalidade: string;
  estado_civil: string;
  profissao: string;
  cargo: string;
  rg: string;
  cpf: string;
  endereco: string;
  email: string;
  telefone: string;
}

export interface Contratante {
  razao_social: string;
  cnpj: string;
  endereco: string;
  representante: Representante;
  email_cobranca: string;
}

export interface Testemunha {
  nome: string;
  cpf: string;
}

export interface Assinatura {
  dia: string | number;
  mes: string | number;
  ano: number | null;
}

export interface Escopo {
  nome: string;
  prazo_dias_uteis: number;
}

export interface DiaExcecao {
  inicio: string;
  fim: string;
}

export interface Financeiro {
  valor_total: number;
  parcelado: boolean;
  numero_parcelas: number;
  valor_parcela: number;
  primeiro_vencimento: string;
  dia_vencimento_mensal: number;
  forma_pagamento: string;
}

export interface DadosContrato {
  projeto: {
    servico: string;
    escopos: Escopo[];
    num_consultores: number;
    num_coordenadores: number;
    dias_excecao: DiaExcecao[];
    data_inicio: string;
    data_termino: string;
  };
  contratante: Contratante;
  financeiro: Financeiro;
  testemunhas: Testemunha[];
  assinatura: Assinatura;
}

export interface DadosTep {
  projeto: { nome: string; escopos_entregues: string[] };
  contratante: Contratante;
  execucao: { data_inicio: string; data_fim: string };
  testemunhas: Testemunha[];
  assinatura: Assinatura;
}

export interface DadosNda {
  contratante: Contratante;
  testemunhas: Testemunha[];
  assinatura: Assinatura;
}

export interface DadosUsoImagem {
  contratante: Contratante;
  /** Preenche a Cláusula 2ª ("captados no contexto de ..."). */
  contexto: string;
  testemunhas: Testemunha[];
  assinatura: Assinatura;
}

export interface DadosAditivo {
  contratante: Contratante;
  contrato_principal: { referencia: string; data: string };
  secoes: { objeto: boolean; alteracao: boolean; preco: boolean; prazo: boolean };
  objeto: { descricao: string; itens: string[] };
  alteracao: { clausula: string; nova_redacao: string };
  preco: {
    valor_antigo: number | null;
    valor_novo: number | null;
    parcelado: boolean;
    numero_parcelas: number | null;
    valor_parcela: number | null;
    primeiro_vencimento: string;
    dia_vencimento_mensal: number | null;
  };
  prazo: { dias_uteis: number | null };
  testemunhas: Testemunha[];
  assinatura: Assinatura;
}

export interface VersaoDocumentoContratual {
  id: number;
  documento_id: number;
  versao: number;
  status_arquivo: string;
  criado_em: string;
}
