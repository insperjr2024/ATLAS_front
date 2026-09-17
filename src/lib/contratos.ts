import { apiFetch } from "./api";
import type {
  DocumentoContratual,
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
