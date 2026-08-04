import { apiFetch } from "@/lib/api";
import type {
  ComentarioTarefa,
  ReuniaoSemanal,
  ReunioesResposta,
  Tarefa,
  Urgencia,
} from "@/types/tarefa";
import type { Usuario } from "@/types/auth";

export function getTarefas(projetoId: number, token: string) {
  return apiFetch<Tarefa[]>(`/projetos/${projetoId}/tarefas`, { token });
}

export interface CreateTarefaPayload {
  titulo: string;
  responsavel_id: number;
  prazo: string;
  projeto_escopo_id?: number | null;
  /** Vazio = a primeira coluna do board. */
  coluna_id?: number | null;
}

export function createTarefa(projetoId: number, dados: CreateTarefaPayload, token: string) {
  return apiFetch<Tarefa>(`/projetos/${projetoId}/tarefas`, {
    method: "POST",
    token,
    body: JSON.stringify(dados),
  });
}

/** Move (arrastar) e edita — a mesma rota. */
export function updateTarefa(
  tarefaId: number,
  dados: Partial<CreateTarefaPayload>,
  token: string,
) {
  return apiFetch<Tarefa>(`/tarefas/${tarefaId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(dados),
  });
}

export function deleteTarefa(tarefaId: number, token: string) {
  return apiFetch(`/tarefas/${tarefaId}`, { method: "DELETE", token });
}

/* ------------------------------------------------------------------ */
/* Comentários                                                         */
/* ------------------------------------------------------------------ */

export function getComentarios(tarefaId: number, token: string) {
  return apiFetch<ComentarioTarefa[]>(`/tarefas/${tarefaId}/comentarios`, { token });
}

export function createComentario(tarefaId: number, texto: string, token: string) {
  return apiFetch<ComentarioTarefa>(`/tarefas/${tarefaId}/comentarios`, {
    method: "POST",
    token,
    body: JSON.stringify({ texto }),
  });
}

export function deleteComentario(comentarioId: number, token: string) {
  return apiFetch(`/comentarios/${comentarioId}`, { method: "DELETE", token });
}

/* ------------------------------------------------------------------ */
/* Permissão e urgência                                                */
/* ------------------------------------------------------------------ */

/**
 * ✏️ Editar o CONTEÚDO da tarefa (título, responsável, prazo) é da diretoria
 * e de quem criou.
 *
 * ⚠ Mover no kanban NÃO passa por aqui: o §3 dá isso aos quatro perfis, e
 * travar o arrasto quebraria o board como ferramenta de equipe. O backend
 * aplica exatamente a mesma separação — aqui é só para a tela não oferecer
 * um botão que vai voltar 403.
 */
export function podeEditarTarefa(
  usuario: Usuario | null | undefined,
  tarefa: Tarefa,
): boolean {
  if (!usuario) return false;
  return usuario.posicao === "diretor" || tarefa.criado_por === usuario.id;
}

/** O símbolo e a cor de cada nível — glifo junto da cor, nunca cor sozinha. */
export const SINAL_URGENCIA: Record<
  Urgencia,
  { glifo: string; cor: string; rotulo: (dias: number | null) => string } | null
> = {
  vencida: {
    glifo: "⚠",
    cor: "#DC2626",
    rotulo: (d) => (d === null ? "vencida" : `vencida há ${Math.abs(d)} dia${Math.abs(d) > 1 ? "s" : ""}`),
  },
  critica: {
    glifo: "⚠",
    cor: "#EA580C",
    rotulo: (d) => (d === 0 ? "vence hoje" : "vence amanhã"),
  },
  atencao: {
    glifo: "⏱",
    cor: "#CA8A04",
    rotulo: (d) => `vence em ${d} dias`,
  },
  normal: null,
};

/* ------------------------------------------------------------------ */

export function getReunioes(projetoId: number, token: string) {
  return apiFetch<ReunioesResposta>(`/projetos/${projetoId}/reunioes`, { token });
}

export function createReuniao(projetoId: number, data: string, token: string) {
  return apiFetch<ReuniaoSemanal>(`/projetos/${projetoId}/reunioes`, {
    method: "POST",
    token,
    body: JSON.stringify({ data_reuniao: data }),
  });
}

export function deleteReuniao(reuniaoId: number, token: string) {
  return apiFetch(`/reunioes/${reuniaoId}`, { method: "DELETE", token });
}
