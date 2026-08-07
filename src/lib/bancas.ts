import { apiFetch } from "@/lib/api";
import { paraDataUtc } from "@/lib/projetos";
import type {
  Banca,
  BancaFrente,
  BancaParaAvaliar,
  Candidatura,
  EquipeProjeto,
  Escopo,
  EscopoVendidoResumo,
  Frente,
  StatusBanca,
} from "@/types/banca";

/**
 * Marca que a banca ACONTECEU — o passo que separa "a data passou" de "foi
 * feita". Sem ele a banca fica `atrasada` para sempre e o §7.4 conta isso
 * como atraso do projeto.
 *
 * `presentes` é a lista de quem compareceu; o backend confirma essas
 * candidaturas e desmarca o resto.
 *
 * `forcar` registra mesmo abaixo do mínimo de alocados — o backend só aceita
 * de diretor (§8: a exceção de composição é da diretoria).
 */
export function realizarBanca(
  bancaId: number,
  dados: { realizado_em?: string | null; presentes?: number[]; forcar?: boolean },
  token: string,
) {
  return apiFetch(`/bancas/${bancaId}/realizar`, {
    method: "POST",
    token,
    body: JSON.stringify(dados),
  });
}

/**
 * Aprovada ou não aprovada.
 *
 * 🔒 É este resultado que libera a entrega ao cliente (§5.5). Enquanto ele não
 * existe, o escopo não pode ser entregue — a trava vive no backend.
 */
export function registrarResultado(
  bancaId: number,
  resultado: "aprovada" | "nao_aprovada",
  token: string,
) {
  return apiFetch(`/bancas/${bancaId}/resultado`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ resultado }),
  });
}


/**
 * A escalação automática do §8: uma semana antes, preenche as bancas que ainda
 * estão sem gente, por rodízio e priorizando a mesma frente.
 */
export interface ResultadoPush {
  banca_id: number;
  nome_projeto: string;
  alocados_antes: number;
  alocados_depois: number;
  usuarios_alocados: number[];
}

export function pushAlocacao(token: string) {
  return apiFetch<ResultadoPush[]>("/bancas/push-alocacao", { method: "POST", token });
}

/**
 * Aloca OUTRA pessoa numa banca. Só a diretoria — escalar alguém mexe na
 * agenda dele sem que tenha pedido (§8).
 */
export function alocarUsuario(bancaId: number, usuarioId: number, token: string) {
  return apiFetch("/candidaturas", {
    method: "POST",
    token,
    body: JSON.stringify({ banca_id: bancaId, usuario_id: usuarioId }),
  });
}

export function getBancas(token: string) {
  return apiFetch<Banca[]>("/bancas", { token });
}

export function getCandidaturas(token: string) {
  return apiFetch<Candidatura[]>("/candidaturas", { token });
}

export function getBancasParaAvaliar(usuarioId: number, token: string) {
  return apiFetch<BancaParaAvaliar[]>(`/usuarios/${usuarioId}/bancas-para-avaliar`, { token });
}

export function alocar(bancaId: number, token: string) {
  return apiFetch<Candidatura>("/candidaturas", {
    method: "POST",
    token,
    body: JSON.stringify({ banca_id: bancaId }),
  });
}

export function desalocar(candidaturaId: number, token: string) {
  return apiFetch("/candidaturas/" + candidaturaId, { method: "DELETE", token });
}

export function getEscopos(token: string) {
  return apiFetch<Escopo[]>("/escopos", { token });
}

export function getEscoposVendidos(token: string) {
  return apiFetch<EscopoVendidoResumo[]>("/escopos-projeto", { token });
}

export function getFrentes(token: string) {
  return apiFetch<Frente[]>("/frentes", { token });
}

export function getBancasFrentes(token: string) {
  return apiFetch<BancaFrente[]>("/bancas-frentes", { token });
}

export function getEquipesProjeto(token: string) {
  return apiFetch<EquipeProjeto[]>("/equipes-projeto", { token });
}

export interface CreateBancaPayload {
  nome_projeto: string;
  escopo_id: number;
  data_hora: string;
  consultor_ids: number[];
  frente_ids: number[];
  /** Só a diretoria manda isto — ver `require_diretor` no backend. */
  piso_minimo_override?: number | null;
}

export interface UpdateBancaPayload {
  nome_projeto?: string;
  escopo_id?: number;
  data_hora?: string;
  piso_minimo_override?: number | null;
}

export function createBanca(dados: CreateBancaPayload, token: string) {
  return apiFetch<Banca>("/bancas", {
    method: "POST",
    token,
    body: JSON.stringify(dados),
  });
}

export function updateBanca(bancaId: number, dados: UpdateBancaPayload, token: string) {
  return apiFetch<Banca>(`/bancas/${bancaId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(dados),
  });
}

export function deleteBanca(bancaId: number, token: string) {
  return apiFetch(`/bancas/${bancaId}`, { method: "DELETE", token });
}

function createEquipeProjeto(dados: { banca_id: number; usuario_id: number }, token: string) {
  return apiFetch<EquipeProjeto>("/equipes-projeto", {
    method: "POST",
    token,
    body: JSON.stringify(dados),
  });
}

function deleteEquipeProjeto(equipeId: number, token: string) {
  return apiFetch(`/equipes-projeto/${equipeId}`, { method: "DELETE", token });
}

function createBancaFrente(dados: { banca_id: number; frente_id: number }, token: string) {
  return apiFetch<BancaFrente>("/bancas-frentes", {
    method: "POST",
    token,
    body: JSON.stringify(dados),
  });
}

function deleteBancaFrente(bancaFrenteId: number, token: string) {
  return apiFetch(`/bancas-frentes/${bancaFrenteId}`, { method: "DELETE", token });
}

export async function syncEquipeProjeto(
  bancaId: number,
  consultorIds: number[],
  equipesProjeto: EquipeProjeto[],
  token: string,
) {
  const atuais = equipesProjeto.filter((e) => e.banca_id === bancaId);
  const desejados = new Set(consultorIds);
  const atuaisIds = new Set(atuais.map((e) => e.usuario_id));

  await Promise.all(
    atuais.filter((e) => !desejados.has(e.usuario_id)).map((e) => deleteEquipeProjeto(e.id, token)),
  );

  await Promise.all(
    consultorIds.filter((id) => !atuaisIds.has(id)).map((usuarioId) => createEquipeProjeto({ banca_id: bancaId, usuario_id: usuarioId }, token)),
  );
}

export async function syncBancaFrentes(
  bancaId: number,
  frenteIds: number[],
  bancasFrentes: BancaFrente[],
  token: string,
) {
  const atuais = bancasFrentes.filter((bf) => bf.banca_id === bancaId);
  const desejados = new Set(frenteIds);
  const atuaisIds = new Set(atuais.map((bf) => bf.frente_id));

  await Promise.all(
    atuais.filter((bf) => !desejados.has(bf.frente_id)).map((bf) => deleteBancaFrente(bf.id, token)),
  );

  await Promise.all(
    frenteIds.filter((id) => !atuaisIds.has(id)).map((frenteId) => createBancaFrente({ banca_id: bancaId, frente_id: frenteId }, token)),
  );
}

/**
 * Espelho de `utils/banca_status.py::aceita_inscricao`.
 *
 * Uma banca `atrasada` (venceu e não aconteceu) **continua aceitando gente** —
 * ela ainda vai acontecer. Quem fecha a inscrição é a realização, não o
 * calendário. O backend revalida.
 */
export function aceitaInscricao(status: StatusBanca): boolean {
  return status === "aberta" || status === "atrasada";
}

export const ROTULO_STATUS_BANCA: Record<StatusBanca, string> = {
  nao_marcada: "Não marcada",
  aberta: "Aberta para inscrições",
  realizada: "Realizada",
  atrasada: "Atrasada",
};

/** Vermelho só para `atrasada` — é o estado que precisa gritar na tela. */
export function tomDoStatusBanca(status: StatusBanca): "default" | "success" | "muted" | "danger" {
  if (status === "atrasada") return "danger";
  if (status === "realizada") return "success";
  if (status === "nao_marcada") return "muted";
  return "default";
}

export function podeGerenciarBanca(banca: Banca, usuarioId: number): boolean {
  // Banca atrasada continua gerenciável: é justamente quando o coordenador
  // precisa entrar para marcar que ela aconteceu (ou remarcar).
  return banca.coordenador_id === usuarioId && aceitaInscricao(banca.status);
}

export function toDateInputValue(iso: string): string {
  const d = paraDataUtc(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toTimeInputValue(iso: string): string {
  const d = paraDataUtc(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
