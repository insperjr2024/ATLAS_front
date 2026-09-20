import { apiFetch } from "./api";
import { API_URL } from "@/config/config";
import type {
  AprovacaoPublica,
  DocumentoContratual,
  ExtracaoColeta,
  IdentidadeInstitucional,
  ItemRepositorioContratual,
  LinkAprovacao,
  ParagrafoEditavel,
  SolicitacaoAlteracao,
  TipoDocumentoContratual,
  VersaoDocumentoContratual,
} from "@/types/contratos";

export function getTiposDisponiveis(projetoId: number, token: string) {
  return apiFetch<{ tipos: TipoDocumentoContratual[] }>(
    `/projetos/${projetoId}/documentos-contratuais/tipos-disponiveis`,
    { token },
  );
}

export function getDocumentosDoProjeto(projetoId: number, token: string) {
  return apiFetch<{ documentos: DocumentoContratual[] }>(
    `/projetos/${projetoId}/documentos-contratuais`,
    { token },
  );
}

export function abrirDocumento(projetoId: number, tipo: TipoDocumentoContratual, token: string) {
  return apiFetch<DocumentoContratual>(`/projetos/${projetoId}/documentos-contratuais`, {
    method: "POST",
    body: JSON.stringify({ tipo }),
    token,
  });
}

export function getDocumento(documentoId: number, token: string) {
  return apiFetch<DocumentoContratual>(`/documentos-contratuais/${documentoId}`, { token });
}

export function atualizarDadosDocumento(
  documentoId: number,
  dados: Record<string, unknown>,
  token: string,
) {
  return apiFetch<DocumentoContratual>(`/documentos-contratuais/${documentoId}`, {
    method: "PATCH",
    body: JSON.stringify({ dados }),
    token,
  });
}

export function confirmarPreenchimento(documentoId: number, token: string) {
  return apiFetch<DocumentoContratual>(`/documentos-contratuais/${documentoId}/confirmar`, {
    method: "POST",
    token,
  });
}

export function gerarDocumento(documentoId: number, token: string) {
  return apiFetch<VersaoDocumentoContratual>(`/documentos-contratuais/${documentoId}/gerar`, {
    method: "POST",
    token,
  });
}

export function deletarDocumento(documentoId: number, token: string) {
  return apiFetch<void>(`/documentos-contratuais/${documentoId}`, { method: "DELETE", token });
}

/**
 * A rota exige Bearer token, então um `<a href>` direto não funciona — baixa
 * como blob e dispara o download via um link temporário (mesmo padrão de
 * `baixarAnexoProposta` em `lib/projetos.ts`).
 */
export async function baixarArquivoDocumento(
  documentoId: number,
  formato: "pdf" | "docx",
  nomeArquivo: string,
  token: string,
) {
  const response = await fetch(`${API_URL}/documentos-contratuais/${documentoId}/arquivo?formato=${formato}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Erro ao baixar o arquivo do documento");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}

/** Rota pública (sem token) — o link direto serve tanto pro `<iframe>` da
 *  tela de aprovação quanto pra um `<a>` de download comum. */
export function urlArquivoAprovacao(token: string) {
  return `${API_URL}/aprovacao/${token}/arquivo`;
}

// ---------- exportar / aprovar / assinar ----------

export function exportarAprovacao(documentoId: number, token: string) {
  return apiFetch<LinkAprovacao>(`/documentos-contratuais/${documentoId}/exportar-aprovacao`, {
    method: "POST",
    token,
  });
}

export function recusarAssinaturaTep(documentoId: number, token: string) {
  return apiFetch<LinkAprovacao>(`/documentos-contratuais/${documentoId}/recusar-assinatura-tep`, {
    method: "POST",
    token,
  });
}

export function marcarAssinado(documentoId: number, token: string) {
  return apiFetch<DocumentoContratual>(`/documentos-contratuais/${documentoId}/marcar-assinado`, {
    method: "POST",
    token,
  });
}

export function considerarAceitoPorPrazo(documentoId: number, token: string) {
  return apiFetch<DocumentoContratual>(
    `/documentos-contratuais/${documentoId}/considerar-aceito-por-prazo`,
    { method: "POST", token },
  );
}

// ---------- aprovação pública (sem login) ----------

export function getAprovacao(token: string) {
  return apiFetch<AprovacaoPublica>(`/aprovacao/${token}`);
}

/** O texto do documento em blocos, pra selecionar e citar um trecho — o PDF
 *  no `<iframe>` não expõe seleção pro JavaScript da página. */
export function getTextoAprovacao(token: string) {
  return apiFetch<{ paragrafos: string[] }>(`/aprovacao/${token}/texto`);
}

export function responderAprovacao(
  token: string,
  request: { acao: "aprovar" | "alteracao"; texto?: string; trechos?: string[] },
) {
  return apiFetch<{ ok: true }>(`/aprovacao/${token}/responder`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// ---------- solicitação de alteração ----------

export function getSolicitacoesAlteracao(documentoId: number, token: string) {
  return apiFetch<{ solicitacoes: SolicitacaoAlteracao[] }>(
    `/documentos-contratuais/${documentoId}/solicitacoes-alteracao`,
    { token },
  );
}

export function analisarSolicitacao(solicitacaoId: number, token: string) {
  return apiFetch<SolicitacaoAlteracao>(
    `/solicitacoes-alteracao-contratual/${solicitacaoId}/analisar`,
    { method: "PATCH", token },
  );
}

// ---------- edição manual do rascunho ----------

export function getParagrafosEditaveis(documentoId: number, token: string) {
  return apiFetch<{ paragrafos: ParagrafoEditavel[] }>(
    `/documentos-contratuais/${documentoId}/paragrafos-editaveis`,
    { token },
  );
}

export function editarTexto(documentoId: number, edicoes: Record<number, string>, token: string) {
  return apiFetch<{ alterados: number }>(`/documentos-contratuais/${documentoId}/texto`, {
    method: "PATCH",
    body: JSON.stringify({ edicoes }),
    token,
  });
}

export function reanexarDocumento(documentoId: number, arquivo: File, token: string) {
  const body = new FormData();
  body.append("arquivo", arquivo);
  return apiFetch<VersaoDocumentoContratual>(`/documentos-contratuais/${documentoId}/reanexar`, {
    method: "POST",
    body,
    token,
  });
}

// ---------- Coleta de Dados ----------

/** O .docx em branco pra mandar ao cliente preencher. */
export async function baixarModeloColeta(token: string) {
  const response = await fetch(`${API_URL}/documentos-contratuais/coleta-dados/modelo`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Erro ao baixar o modelo da Coleta de Dados");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Coleta de Dados - Modelo.docx";
  link.click();
  URL.revokeObjectURL(url);
}

export function extrairColeta(
  projetoId: number,
  tipo: TipoDocumentoContratual,
  arquivo: File,
  token: string,
) {
  const body = new FormData();
  body.append("arquivo", arquivo);
  return apiFetch<ExtracaoColeta>(
    `/projetos/${projetoId}/documentos-contratuais/extrair-coleta?tipo=${tipo}`,
    { method: "POST", body, token },
  );
}

// ---------- Identidade Institucional ----------

export function getIdentidadeInstitucional(token: string) {
  return apiFetch<IdentidadeInstitucional>("/identidade-institucional", { token });
}

export function atualizarIdentidadeInstitucional(
  dados: Partial<IdentidadeInstitucional>,
  token: string,
) {
  return apiFetch<IdentidadeInstitucional>("/identidade-institucional", {
    method: "PATCH",
    body: JSON.stringify({ dados }),
    token,
  });
}

// ---------- Repositório ----------

export function getRepositorio(
  params: { gestao_id?: number; busca?: string },
  token: string,
) {
  const query = new URLSearchParams();
  if (params.gestao_id != null) query.set("gestao_id", String(params.gestao_id));
  if (params.busca) query.set("busca", params.busca);
  const qs = query.toString();
  return apiFetch<{ itens: ItemRepositorioContratual[] }>(
    `/repositorio-contratual${qs ? `?${qs}` : ""}`,
    { token },
  );
}
