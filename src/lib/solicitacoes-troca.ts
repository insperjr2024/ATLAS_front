import { apiFetch } from "@/lib/api";
import type { SolicitacaoTroca } from "@/types/notificacao";

export function getSolicitacoesTroca(token: string) {
  return apiFetch<SolicitacaoTroca[]>("/solicitacoes-troca", { token });
}

export function createSolicitacaoTroca(candidaturaId: number, token: string) {
  return apiFetch<SolicitacaoTroca>("/solicitacoes-troca", {
    method: "POST",
    token,
    body: JSON.stringify({ candidatura_id: candidaturaId }),
  });
}

export function confirmarSolicitacaoTroca(solicitacaoId: number, token: string) {
  return apiFetch<SolicitacaoTroca>(`/solicitacoes-troca/${solicitacaoId}/confirmar`, {
    method: "POST",
    token,
  });
}

export function cancelarSolicitacaoTroca(solicitacaoId: number, token: string) {
  return apiFetch<SolicitacaoTroca>(`/solicitacoes-troca/${solicitacaoId}/cancelar`, {
    method: "POST",
    token,
  });
}
