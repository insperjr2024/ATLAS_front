import { apiFetch } from "@/lib/api";
import { API_URL } from "@/config/config";
import type {
  EscopoVendido,
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
export function getProjetos(
  token: string,
  frenteId?: number | null,
  incluirArquivados?: boolean,
) {
  const params = new URLSearchParams();
  if (frenteId) params.set("frente_id", String(frenteId));
  if (incluirArquivados) params.set("incluir_arquivados", "true");
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<ProjetoResumo[]>(`/projetos${query}`, { token });
}

export function getProjeto(projetoId: number, token: string) {
  return apiFetch<ProjetoCompleto>(`/projetos/${projetoId}`, { token });
}

/** Arquivar não é excluir (§6.2) — só some das listagens normais. */
export function arquivarProjeto(projetoId: number, token: string) {
  return apiFetch<{ id: number; arquivado_em: string }>(`/projetos/${projetoId}/arquivar`, {
    method: "PATCH",
    token,
  });
}

export function desarquivarProjeto(projetoId: number, token: string) {
  return apiFetch<{ id: number; arquivado_em: null }>(`/projetos/${projetoId}/desarquivar`, {
    method: "PATCH",
    token,
  });
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
  escopos?: EscopoVendidoPayload[];
}

export function createProjeto(dados: CreateProjetoPayload, token: string) {
  return apiFetch<ProjetoResumo>("/projetos", {
    method: "POST",
    token,
    body: JSON.stringify(dados),
  });
}

/** A proposta é ou link (mandado junto no `createProjeto`), ou este PDF — nunca os dois. */
export function uploadAnexoProposta(projetoId: number, arquivo: File, token: string) {
  const formData = new FormData();
  formData.append("arquivo", arquivo);
  return apiFetch<{ anexo_proposta_nome: string }>(`/projetos/${projetoId}/anexo-proposta`, {
    method: "POST",
    token,
    body: formData,
  });
}

/**
 * A rota exige Bearer token, então um `<a href>` direto não funciona — baixa
 * como blob e dispara o download via um link temporário.
 */
export async function baixarAnexoProposta(projetoId: number, nomeArquivo: string, token: string) {
  const response = await fetch(`${API_URL}/projetos/${projetoId}/anexo-proposta`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Erro ao baixar o anexo da proposta");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
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
/* Escopos vendidos (F4)                                               */
/* ------------------------------------------------------------------ */

export interface EscopoVendidoPayload {
  /** Vazio + `nome_customizado` preenchido = a opção "Outro" do §4. */
  escopo_id: number | null;
  nome_customizado?: string | null;
  frente_id: number;
  dias_uteis_vendidos: number;
  data_entrega_planejada?: string | null;
}

export function getEscoposProjeto(projetoId: number, token: string) {
  return apiFetch<EscopoVendido[]>(`/projetos/${projetoId}/escopos`, { token });
}

export function createEscopoProjeto(projetoId: number, dados: EscopoVendidoPayload, token: string) {
  return apiFetch<{ id: number }>(`/projetos/${projetoId}/escopos`, {
    method: "POST",
    token,
    body: JSON.stringify(dados),
  });
}

export function deleteEscopoProjeto(escopoId: number, token: string) {
  return apiFetch(`/escopos-projeto/${escopoId}`, { method: "DELETE", token });
}

/** ⭐ Marcar a reunião inicial — é o que faz a contagem recomeçar (§5.4). */
export function iniciarEscopo(escopoId: number, dataInicio: string, token: string) {
  return apiFetch<{ id: number; data_inicio: string; status: string }>(
    `/escopos-projeto/${escopoId}/inicio`,
    { method: "PATCH", token, body: JSON.stringify({ data_inicio: dataInicio }) },
  );
}

/** 🔒 O backend recusa com 422 até a banca do escopo sair aprovada (§5.5). */
export function marcarEntregaEscopo(escopoId: number, data: string, token: string) {
  return apiFetch<{ id: number; data_entrega_real: string; status: string }>(
    `/escopos-projeto/${escopoId}/entrega`,
    { method: "PATCH", token, body: JSON.stringify({ data_entrega_real: data }) },
  );
}

/** Marca a banca do escopo — escreve na MESMA linha que `/bancas` lê (§8). */
export function marcarBancaDoEscopo(
  escopoId: number,
  dataHora: string,
  token: string,
  justificativa?: string,
) {
  return apiFetch<{ id: number; data_hora: string; status: string }>(
    `/escopos-projeto/${escopoId}/banca`,
    {
      method: "PUT",
      token,
      body: JSON.stringify({ data_hora: dataHora, justificativa: justificativa ?? null }),
    },
  );
}

export const ROTULO_STATUS_ESCOPO: Record<string, string> = {
  nao_iniciado: "Não iniciado",
  em_andamento: "Em andamento",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

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
 * Vendido → Ambientação não está aqui: é 🤖 automática, disparada pelo
 * kickoff. Já `ambientacao → em_andamento` está, mesmo o §4 chamando de
 * automática — o disparador não existe, e sem ela um projeto que chega em
 * Ambientação (ou volta para lá) não teria como sair.
 */
const TRANSICOES_MANUAIS: Partial<Record<StatusProjeto, StatusProjeto>> = {
  ambientacao: "em_andamento",
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

/** A fila do ciclo de vida, na ordem. `pausado` fica fora — é estado à parte. */
const STATUS_ORDEM: StatusProjeto[] = [
  "vendido",
  "ambientacao",
  "em_andamento",
  "validacao_bancas",
  "envio_tep",
  "periodo_ajustes",
  "finalizado",
];

export function proximoStatusManual(atual: StatusProjeto): StatusProjeto | null {
  return TRANSICOES_MANUAIS[atual] ?? null;
}

/**
 * ↩ A etapa anterior — espelho de `status_projeto.py::status_anterior_manual`.
 *
 * A volta vale da fila inteira até **Ambientação, que é o piso**: voltar dali
 * para Vendido seria desmarcar o kickoff, e a data já registrada é um fato do
 * projeto — corrige-se editando a data, não regredindo o status.
 *
 * `pausado` também não volta por aqui: sai pelo botão de retomar.
 */
export function statusAnteriorManual(atual: StatusProjeto): StatusProjeto | null {
  if (atual === STATUS_PISO_VOLTA) return null;
  const indice = STATUS_ORDEM.indexOf(atual);
  return indice > 0 ? STATUS_ORDEM[indice - 1] : null;
}

const STATUS_PISO_VOLTA: StatusProjeto = "ambientacao";

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
  // ⚠ Data pura (`2026-07-14`) não tem hora e NÃO pode passar por `new Date`:
  // ele lê como UTC e no Brasil devolve o dia anterior às 21:00. O calendário
  // geral mistura eventos com hora (banca) e sem hora (kickoff, reunião,
  // entrega) no mesmo campo, então a distinção é feita aqui.
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return formatarData(iso);

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return formatarData(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
