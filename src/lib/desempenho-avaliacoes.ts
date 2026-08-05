import { apiFetch } from "@/lib/api";
import type {
  DesempenhoAvaliacao,
  DesempenhoAvaliacaoDetalhe,
  DesempenhoAvaliacaoSubmissao,
  DesempenhoFilaItem,
  DesempenhoNotaInput,
} from "@/types/desempenho";

export function getMinhaFila(usuarioId: number, token: string) {
  return apiFetch<DesempenhoFilaItem[]>(`/usuarios/${usuarioId}/desempenho/fila`, { token });
}

export function submitAvaliacao(
  payload: { lote_id: number; avaliado_id: number; nota_geral: number; comentarios: string; notas: DesempenhoNotaInput[] },
  token: string,
) {
  return apiFetch<DesempenhoAvaliacaoSubmissao>("/desempenho/avaliacoes", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function getAvaliacoes(token: string) {
  return apiFetch<DesempenhoAvaliacao[]>("/desempenho/avaliacoes", { token });
}

export function getAvaliacaoDetalhe(avaliacaoId: number, token: string) {
  return apiFetch<DesempenhoAvaliacaoDetalhe>(`/desempenho/avaliacoes/${avaliacaoId}`, { token });
}

export function deleteAvaliacao(avaliacaoId: number, token: string) {
  return apiFetch(`/desempenho/avaliacoes/${avaliacaoId}`, { method: "DELETE", token });
}

export function finalizarDesempenho(usuarioId: number, loteId: number, token: string) {
  return apiFetch<{ lote_id: number; usuario_id: number; finalizado: boolean }>(
    `/usuarios/${usuarioId}/desempenho/finalizar`,
    { method: "POST", token, body: JSON.stringify({ lote_id: loteId }) },
  );
}
