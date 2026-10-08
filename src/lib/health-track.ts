import { apiFetch } from "@/lib/api";

/* Health Track: a saúde de cada projeto em pilares, e o status geral que sai
 * das cores deles. Espelha `routers/health_track.py`.
 *
 * Pilares, classificações e a regra do status vêm todos da API: a diretoria
 * edita pilares e regra sem deploy, então nada disso é constante aqui. */

export type CorHealthTrack = "verde" | "amarelo" | "vermelho";

export interface Pilar {
  id: number;
  nome: string;
  descricao: string | null;
  ordem: number;
  ativo: boolean;
}

/** "Saudável", "Atenção", "Crítico", com a descrição da spec (§3). */
export interface Classificacao {
  cor: CorHealthTrack;
  nome: string;
  descricao: string;
}

export interface AvaliacaoPilar {
  id: number;
  projeto_id: number;
  pilar_id: number;
  pilar_nome: string | null;
  cor: CorHealthTrack;
  comentario: string | null;
  avaliado_por: number;
  avaliado_por_nome: string | null;
  /** UTC sem `Z`, ler com `paraDataUtc`/`formatarDataHora`. */
  avaliado_em: string;
}

/** O status geral por duas réguas: a regra que valia na data do ciclo e a de
 *  hoje. Só divergem depois que a diretoria muda a regra. */
export interface StatusGeral {
  na_epoca: CorHealthTrack;
  pela_regra_atual: CorHealthTrack;
}

export interface AvaliacaoAtual {
  /** `null` enquanto algum pilar ativo não tem cor. */
  status_geral: (StatusGeral & { avaliado_em: string }) | null;
  pilares: { pilar: Pilar; avaliacao: AvaliacaoPilar | null }[];
  /** Quem preenche é decidido pelo backend (diretoria de projetos, ou gerente
   *  de uma frente do projeto). A tela não recalcula a regra de frente. */
  pode_preencher: boolean;
}

export interface Ciclo {
  avaliado_em: string;
  avaliado_por: number;
  avaliado_por_nome: string | null;
  status_geral: StatusGeral;
  avaliacoes: AvaliacaoPilar[];
}

export interface CorPilarEnvio {
  pilar_id: number;
  cor: CorHealthTrack;
  comentario?: string | null;
}

export interface RegraStatus {
  id: number;
  verde: { max_amarelos: number; max_vermelhos: number };
  /** Calculado pelo backend, não editável: amarelo é o que não é verde nem
   *  vermelho. */
  amarelo: { min_amarelos: number; max_amarelos: number; max_vermelhos: number };
  vermelho: { min_amarelos: number; min_vermelhos: number };
  vigente_desde: string;
  criado_por: number | null;
  criado_por_nome: string | null;
}

export interface EditarRegra {
  verde_max_amarelos: number;
  verde_max_vermelhos: number;
  vermelho_min_amarelos: number;
  vermelho_min_vermelhos: number;
}

/** Um projeto no mapa da carteira (§9). `pilares` é indexado pelo id do
 *  pilar; `null` quando ele ainda não tem cor. */
export interface ProjetoNaCarteira {
  id: number;
  nome: string;
  cliente: string | null;
  status: string;
  frentes: { id: number; nome: string }[];
  coordenadores: { id: number; nome: string }[];
  gerentes: { id: number; nome: string }[];
  pilares: Record<string, { cor: CorHealthTrack; avaliado_em: string } | null>;
  /** `null` enquanto algum pilar ativo não tem cor. */
  status_geral: StatusGeral | null;
  /** O status (pela regra atual) do ciclo completo anterior, pra tendência. */
  status_anterior: CorHealthTrack | null;
  avaliado_em: string | null;
  total_ciclos: number;
  algum_vermelho: boolean;
}

export interface Carteira {
  pilares: Pilar[];
  projetos: ProjetoNaCarteira[];
}

export function getCarteira(token: string, frenteId: number | null = null) {
  const query = frenteId ? `?frente_id=${frenteId}` : "";
  return apiFetch<Carteira>(`/health-track/carteira${query}`, { token });
}

export function getPilares(token: string, todos = false) {
  return apiFetch<Pilar[]>(`/health-track/pilares${todos ? "?todos=true" : ""}`, { token });
}

export function criarPilar(dados: { nome: string; descricao?: string | null }, token: string) {
  return apiFetch<Pilar>("/health-track/pilares", {
    method: "POST",
    token,
    body: JSON.stringify(dados),
  });
}

export function editarPilar(
  id: number,
  dados: Partial<{ nome: string; descricao: string | null; ordem: number; ativo: boolean }>,
  token: string,
) {
  return apiFetch<Pilar>(`/health-track/pilares/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(dados),
  });
}

export function getClassificacoes(token: string) {
  return apiFetch<Classificacao[]>("/health-track/classificacoes", { token });
}

export function getAvaliacaoAtual(projetoId: number, token: string) {
  return apiFetch<AvaliacaoAtual>(`/health-track/projetos/${projetoId}/avaliacoes/atual`, { token });
}

export function getCiclos(projetoId: number, token: string) {
  return apiFetch<Ciclo[]>(`/health-track/projetos/${projetoId}/avaliacoes/ciclos`, { token });
}

export function registrarAvaliacao(projetoId: number, avaliacoes: CorPilarEnvio[], token: string) {
  return apiFetch<AvaliacaoPilar[]>(`/health-track/projetos/${projetoId}/avaliacoes`, {
    method: "POST",
    token,
    body: JSON.stringify({ avaliacoes }),
  });
}

export function getRegra(token: string) {
  return apiFetch<RegraStatus | null>("/health-track/regra", { token });
}

export function getHistoricoRegra(token: string) {
  return apiFetch<RegraStatus[]>("/health-track/regra/historico", { token });
}

export function atualizarRegra(dados: EditarRegra, token: string) {
  return apiFetch<RegraStatus>("/health-track/regra", {
    method: "PUT",
    token,
    body: JSON.stringify(dados),
  });
}

/** Fallback dos rótulos enquanto `/classificacoes` não chegou, ou se falhar.
 *  O texto oficial vem da API; isto só evita uma cor sem nome na tela. */
export const ROTULO_COR: Record<CorHealthTrack, string> = {
  verde: "Saudável",
  amarelo: "Atenção",
  vermelho: "Crítico",
};
