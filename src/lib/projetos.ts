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

/**
 * Marcar o kickoff só registra a data — quem move Vendido → Ambientação é
 * uma pessoa, no seletor de etapa (§5.2); o kickoff apenas habilita o destino.
 *
 * A resposta traz o `status` porque ele PODE ter mudado mesmo assim: um
 * projeto já em Ambientação com o kickoff corrigido para trás pode ter a
 * janela vencida na hora e virar Em andamento sozinho (§5.3).
 */
export function marcarKickoff(projetoId: number, dataKickoff: string, token: string) {
  return apiFetch<{ id: number; data_kickoff: string; status: StatusProjeto }>(
    `/projetos/${projetoId}/kickoff`,
    { method: "PATCH", token, body: JSON.stringify({ data_kickoff: dataKickoff }) },
  );
}

// ⭐ Não existe `marcarEntregaCliente`: entrega ao cliente e entrega do escopo
// são a MESMA data (§5.5) — quem a escreve é `marcarEntregaEscopo`, e a do
// projeto é derivada da última pelo backend.

/** `statusNovo` aceita qualquer etapa ativa (ver `destinosValidos`), `"pausado"` ou `"retomar"`. */
export function mudarStatus(projetoId: number, statusNovo: string, token: string) {
  return apiFetch<{ id: number; status_anterior: StatusProjeto; status: StatusProjeto }>(
    `/projetos/${projetoId}/status`,
    { method: "PATCH", token, body: JSON.stringify({ status_novo: statusNovo }) },
  );
}

export function updateDescricao(projetoId: number, descricao: string, token: string) {
  return apiFetch<{ id: number; descricao: string | null }>(`/projetos/${projetoId}/descricao`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ descricao }),
  });
}

/** A resposta traz o `status`: encurtar a ambientação pode encerrá-la agora
 *  e virar o projeto para Em andamento (§5.3). */
export function updateDiasAmbientacao(projetoId: number, diasAmbientacao: number, token: string) {
  return apiFetch<{ id: number; dias_ambientacao: number; status: StatusProjeto }>(
    `/projetos/${projetoId}/dias-ambientacao`,
    { method: "PATCH", token, body: JSON.stringify({ dias_ambientacao: diasAmbientacao }) },
  );
}

export function updateDiaReuniaoPadrao(projetoId: number, diaReuniaoPadrao: number | null, token: string) {
  return apiFetch<{ id: number; dia_reuniao_padrao: number | null }>(
    `/projetos/${projetoId}/dia-reuniao-padrao`,
    { method: "PATCH", token, body: JSON.stringify({ dia_reuniao_padrao: diaReuniaoPadrao }) },
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

// ⭐ A contagem do §5.4 começa pela REUNIÃO INICIAL, marcada no calendário do
// CRONOGRAMA com o escopo escolhido (`createReuniao` em `lib/tarefas.ts`). A
// aba Reuniões, que era onde isso ficava, deixou de existir: todas as datas do
// projeto passaram a ser cravadas numa tela só (§2). Não existe um "iniciar
// escopo" digitado à parte.

/**
 * 🔒 O backend recusa com 422 até a banca do escopo ser realizada (§5.5).
 *
 * `justificativa` só é exigida para ALTERAR uma entrega já registrada, e nesse
 * caso o backend também exige que quem altera seja a diretoria (§13).
 */
export function marcarEntregaEscopo(
  escopoId: number,
  data: string,
  token: string,
  justificativa?: string,
) {
  return apiFetch<{ id: number; data_entrega_real: string; status: string }>(
    `/escopos-projeto/${escopoId}/entrega`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify({ data_entrega_real: data, justificativa }),
    },
  );
}

/**
 * Marca a banca do escopo — escreve na MESMA linha que `/bancas` lê (§8).
 *
 * `escopoIds` é o conjunto COMPLETO de escopos que a banca passa a cobrir (o
 * da URL entra de qualquer jeito). Omitido, os vínculos atuais ficam como
 * estão — é o caminho de quem só quer mexer na data.
 */
export function marcarBancaDoEscopo(
  escopoId: number,
  dataHora: string,
  token: string,
  justificativa?: string,
  escopoIds?: number[],
) {
  return apiFetch<{
    id: number;
    data_hora: string;
    status: string;
    projeto_escopo_ids: number[];
  }>(`/escopos-projeto/${escopoId}/banca`, {
    method: "PUT",
    token,
    body: JSON.stringify({
      data_hora: dataHora,
      justificativa: justificativa ?? null,
      escopo_ids: escopoIds ?? null,
    }),
  });
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

/**
 * ✋ Espelho de `status_projeto.py::destinos_validos` — as etapas que o
 * seletor mostra como opção pra este status. Livre entre as ativas, nos dois
 * sentidos (inclusive reabrir um projeto finalizado); o backend revalida
 * (`transicao_manual_valida`), aqui é só pra montar a lista.
 *
 * Vendido só oferece Ambientação, e só quando `temKickoff` — sem data de
 * kickoff marcada não tem o que confirmar. `pausado` não tem destino por
 * aqui: sai pelo retomar.
 */
export function destinosValidos(atual: StatusProjeto, temKickoff: boolean): StatusProjeto[] {
  if (atual === "pausado") return [];
  if (atual === "vendido") return temKickoff ? ["ambientacao"] : [];
  return STATUS_ORDEM.slice(1).filter((s) => s !== atual);
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

/**
 * Uma cor fixa por fase — mesma fonte usada no kanban de projetos e no
 * seletor de etapa da Visão geral, pra nenhum dos dois inventar a própria
 * paleta e os dois acabarem discordando da cor de uma fase.
 */
export const CORES_STATUS: Record<StatusProjeto, string> = {
  vendido: "#9CA3AF", // cinza — ainda não começou de fato
  ambientacao: "#6366F1", // índigo
  em_andamento: "#3B82F6", // azul
  validacao_bancas: "#8B5CF6", // roxo
  envio_tep: "#14B8A6", // teal
  periodo_ajustes: "#F97316", // laranja
  finalizado: "#10B981", // verde
  pausado: "#F59E0B", // âmbar — vermelho fica reservado pro alerta de vencida
};

/* ------------------------------------------------------------------ */
/* Formatação                                                          */
/* ------------------------------------------------------------------ */

const DIAS_DA_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export function rotuloDiaSemana(dia: number | null | undefined): string {
  if (!dia || dia < 1 || dia > 7) return "—";
  return DIAS_DA_SEMANA[dia - 1];
}

/** Só dias úteis — reunião de projeto não cai em fim de semana. Catálogo
 *  único do cadastro (`ProjetoNovo`) e da edição (`ProjetoVisaoGeral`). */
export const DIAS_REUNIAO = [
  { valor: 1, rotulo: "Segunda-feira" },
  { valor: 2, rotulo: "Terça-feira" },
  { valor: 3, rotulo: "Quarta-feira" },
  { valor: 4, rotulo: "Quinta-feira" },
  { valor: 5, rotulo: "Sexta-feira" },
];

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
