import { apiFetch } from "@/lib/api";
import type {
  Avaliacao,
  AvaliacaoNota,
  FormularioAtivo,
  NotaPorPergunta,
  Pergunta,
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

export function getPerguntas(token: string) {
  return apiFetch<Pergunta[]>("/perguntas", { token });
}

/** Backend usa "nota" ou "dissertativa"/"texto" para perguntas abertas. */
export function isPerguntaNota(tipo: string): boolean {
  return tipo === "nota";
}

/** Perguntas de comentário opcional no formulário (não exigem resposta). */
export function isPerguntaOpcional(texto: string): boolean {
  return /opcional/i.test(texto);
}

/** Comentário livre vai para comentario_feedback, não como pergunta do formulário. */
export function isComentarioFeedbackPergunta(tipo: string, texto: string): boolean {
  return !isPerguntaNota(tipo) && isPerguntaOpcional(texto);
}

export function getNotasPorPergunta(bancaId: number, token: string) {
  return apiFetch<NotaPorPergunta[]>(`/bancas/${bancaId}/notas-por-pergunta`, { token });
}

export function createAvaliacao(
  dados: {
    banca_id: number;
    formulario_id: number;
    nome_avaliador?: string;
    tipo_avaliador?: "consultor" | "lideranca";
    projeto_avaliado?: string;
    escopo_avaliado_id?: number | null;
    escopo_avaliado_outro?: string | null;
  },
  token: string,
) {
  return apiFetch<Avaliacao>("/avaliacoes", {
    method: "POST",
    token,
    body: JSON.stringify({ ...dados, status: "rascunho" }),
  });
}

/** O que a apuração devolve junto com o envio — a conta dos votos até agora. */
export type Apuracao = {
  /** "aprovada" | "nao_aprovada" | null (ainda sem veredito) */
  resultado: string | null;
  aprovacoes: number;
  reprovacoes: number;
  /** Tamanho do eleitorado: quantos votos a banca espera. */
  esperados: number;
  /** "maioria" | "empate" | "sem_votos" | "aguardando" */
  motivo: string;
};

/**
 * Envia a avaliação COM o voto que decide a banca (§8).
 *
 * ⭐ Rota própria (`POST .../submeter`), não mais o `PATCH` genérico: o voto é
 * obrigatório e o backend apura na hora — por isso a resposta traz a contagem,
 * para a tela dizer "3 de 4 votaram" sem recarregar.
 */
export function submeterAvaliacao(
  avaliacaoId: number,
  votoAprovacao: boolean,
  comentarioFeedback: string | null,
  token: string,
) {
  const comentario = comentarioFeedback?.trim();
  return apiFetch<{ id: number; status: string; voto_aprovacao: boolean; apuracao: Apuracao }>(
    `/avaliacoes/${avaliacaoId}/submeter`,
    {
      method: "POST",
      token,
      body: JSON.stringify({
        voto_aprovacao: votoAprovacao,
        comentario_feedback: comentario || null,
      }),
    },
  );
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
