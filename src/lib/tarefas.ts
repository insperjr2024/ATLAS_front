import { apiFetch } from "@/lib/api";
import type { ReuniaoSemanal, ReunioesResposta, StatusTarefa, Tarefa } from "@/types/tarefa";

/** As 5 colunas, na ordem do fluxo (§4). */
export const COLUNAS: { status: StatusTarefa; rotulo: string }[] = [
  { status: "a_fazer", rotulo: "A fazer" },
  { status: "em_andamento", rotulo: "Em andamento" },
  { status: "validacao", rotulo: "Validação" },
  { status: "concluido", rotulo: "Concluído" },
  { status: "cancelado", rotulo: "Cancelado" },
];

export function getTarefas(projetoId: number, token: string) {
  return apiFetch<Tarefa[]>(`/projetos/${projetoId}/tarefas`, { token });
}

export interface CreateTarefaPayload {
  titulo: string;
  responsavel_id: number;
  prazo: string;
  projeto_escopo_id?: number | null;
  status?: StatusTarefa;
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
  dados: Partial<CreateTarefaPayload> & { status?: StatusTarefa },
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
