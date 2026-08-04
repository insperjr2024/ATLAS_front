import { apiFetch } from "@/lib/api";
import type {
  MembroEquipePayload,
  ProjetoCompleto,
  ProjetoResumo,
  StatusHistorico,
  StatusProjeto,
} from "@/types/projeto";

/* ------------------------------------------------------------------ */
/* Rotas                                                               */
/* ------------------------------------------------------------------ */

/**
 * O recorte de visão é do backend (§3): esta chamada devolve coisas
 * diferentes para diretor, gerente e consultor com o mesmo endereço. O
 * `frenteId` só é aceito para diretor — para o gerente ele no máximo
 * restringe dentro das frentes dele, nunca amplia.
 */
export function getProjetos(token: string, frenteId?: number | null) {
  const query = frenteId ? `?frente_id=${frenteId}` : "";
  return apiFetch<ProjetoResumo[]>(`/projetos${query}`, { token });
}

export function getProjeto(projetoId: number, token: string) {
  return apiFetch<ProjetoCompleto>(`/projetos/${projetoId}`, { token });
}

export interface CreateProjetoPayload {
  nome: string;
  cliente: string;
  descricao?: string | null;
  link_proposta?: string | null;
  frente_ids: number[];
  dias_ambientacao: number;
  equipe: MembroEquipePayload[];
  dia_reuniao_padrao?: number | null;
}

export function createProjeto(dados: CreateProjetoPayload, token: string) {
  return apiFetch<ProjetoResumo>("/projetos", {
    method: "POST",
    token,
    body: JSON.stringify(dados),
  });
}

export function updateEquipe(projetoId: number, equipe: MembroEquipePayload[], token: string) {
  return apiFetch<{ equipe: MembroEquipePayload[] }>(`/projetos/${projetoId}/equipe`, {
    method: "PUT",
    token,
    body: JSON.stringify({ equipe }),
  });
}

/** 🤖 Marcar o kickoff é o que dispara Vendido → Ambientação (§5.2). */
export function marcarKickoff(projetoId: number, dataKickoff: string, token: string) {
  return apiFetch<{ id: number; data_kickoff: string; status: StatusProjeto }>(
    `/projetos/${projetoId}/kickoff`,
    { method: "PATCH", token, body: JSON.stringify({ data_kickoff: dataKickoff }) },
  );
}

export function marcarEntregaCliente(projetoId: number, data: string, token: string) {
  return apiFetch<{ id: number; data_entrega_cliente: string }>(
    `/projetos/${projetoId}/entrega-cliente`,
    { method: "PATCH", token, body: JSON.stringify({ data_entrega_cliente: data }) },
  );
}

/** `statusNovo` aceita a próxima etapa da fila, `"pausado"` ou `"retomar"`. */
export function mudarStatus(projetoId: number, statusNovo: string, token: string) {
  return apiFetch<{ id: number; status_anterior: StatusProjeto; status: StatusProjeto }>(
    `/projetos/${projetoId}/status`,
    { method: "PATCH", token, body: JSON.stringify({ status_novo: statusNovo }) },
  );
}

export function getHistoricoProjeto(projetoId: number, token: string) {
  return apiFetch<StatusHistorico[]>(`/projetos/${projetoId}/historico`, { token });
}

/* ------------------------------------------------------------------ */
/* Ciclo de vida — espelho de utils/status_projeto.py                  */
/* ------------------------------------------------------------------ */

export const ROTULO_STATUS: Record<StatusProjeto, string> = {
  vendido: "Vendido",
  ambientacao: "Ambientação",
  em_andamento: "Em andamento",
  validacao_bancas: "Validação em bancas",
  envio_tep: "Envio do TEP",
  periodo_ajustes: "Período de ajustes",
  finalizado: "Finalizado",
  pausado: "Pausado",
};

/**
 * ✋ As transições manuais — só a próxima da fila, nunca pula etapa. O backend
 * revalida (`transicao_manual_valida`); aqui é só para o menu não oferecer o
 * que vai voltar 422.
 *
 * Vendido → Ambientação e Ambientação → Em andamento não estão aqui de
 * propósito: são 🤖 automáticas (kickoff e fim dos dias de ambientação).
 */
const TRANSICOES_MANUAIS: Partial<Record<StatusProjeto, StatusProjeto>> = {
  em_andamento: "validacao_bancas",
  validacao_bancas: "envio_tep",
  envio_tep: "periodo_ajustes",
  periodo_ajustes: "finalizado",
};

const STATUS_PAUSAVEIS: StatusProjeto[] = [
  "ambientacao",
  "em_andamento",
  "validacao_bancas",
  "envio_tep",
  "periodo_ajustes",
];

export function proximoStatusManual(atual: StatusProjeto): StatusProjeto | null {
  return TRANSICOES_MANUAIS[atual] ?? null;
}

export function podePausar(atual: StatusProjeto): boolean {
  return STATUS_PAUSAVEIS.includes(atual);
}

/** Verde para finalizado, cinza para pausado, vermelho para o resto em curso. */
export function tomDoStatus(status: StatusProjeto): "success" | "muted" | "default" {
  if (status === "finalizado") return "success";
  if (status === "pausado") return "muted";
  return "default";
}

/* ------------------------------------------------------------------ */
/* Formatação                                                          */
/* ------------------------------------------------------------------ */

const DIAS_DA_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export function rotuloDiaSemana(dia: number | null | undefined): string {
  if (!dia || dia < 1 || dia > 7) return "—";
  return DIAS_DA_SEMANA[dia - 1];
}

/**
 * A API manda data pura (`2026-08-10`), sem fuso. `new Date("2026-08-10")`
 * interpreta como UTC e volta um dia atrás no Brasil — daí o corte manual.
 */
export function formatarData(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

export function formatarDataHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return formatarData(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
