import { apiFetch } from "@/lib/api";
import type { Banca, BancaFrente, BancaParaAvaliar, Candidatura, EquipeProjeto, Escopo, Frente } from "@/types/banca";

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
}

export interface UpdateBancaPayload {
  nome_projeto?: string;
  escopo_id?: number;
  data_hora?: string;
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

export function podeGerenciarBanca(banca: Banca, usuarioId: number): boolean {
  return banca.coordenador_id === usuarioId && banca.status === "aberta para inscrições";
}

export function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toTimeInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
