import { apiFetch } from "@/lib/api";
import type {
  Avaliacao,
  AvaliacaoNota,
  FormularioAtivo,
  NotaPorPergunta,
  PerguntaNovaVersao,
} from "@/types/banca";

export function getFormularioAtivo(token: string) {
  return apiFetch<FormularioAtivo>("/formularios/ativo", { token });
}

export function createNovaVersaoFormulario(perguntas: PerguntaNovaVersao[], token: string) {
  return apiFetch<FormularioAtivo>("/formularios/nova-versao", {
    method: "POST",
    token,
    body: JSON.stringify({ perguntas }),
  });
}

export function getAvaliacoes(token: string) {
  return apiFetch<Avaliacao[]>("/avaliacoes", { token });
}

export function getAvaliacoesNotas(token: string) {
  return apiFetch<AvaliacaoNota[]>("/avaliacoes-notas", { token });
}

export function getNotasPorPergunta(bancaId: number, token: string) {
  return apiFetch<NotaPorPergunta[]>(`/bancas/${bancaId}/notas-por-pergunta`, { token });
}

export function createAvaliacao(dados: { banca_id: number; formulario_id: number }, token: string) {
  return apiFetch<Avaliacao>("/avaliacoes", {
    method: "POST",
    token,
    body: JSON.stringify({ ...dados, status: "rascunho" }),
  });
}

export function submeterAvaliacao(avaliacaoId: number, comentarioFeedback: string | null, token: string) {
  return apiFetch<Avaliacao>(`/avaliacoes/${avaliacaoId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({
      status: "submetida",
      comentario_feedback: comentarioFeedback,
      submetida_em: new Date().toISOString(),
    }),
  });
}

export function createAvaliacaoNota(
  dados: { avaliacao_id: number; pergunta_id: number; nota?: number | null; resposta_texto?: string | null },
  token: string,
) {
  return apiFetch<AvaliacaoNota>("/avaliacoes-notas", {
    method: "POST",
    token,
    body: JSON.stringify(dados),
  });
}
