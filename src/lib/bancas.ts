import { apiFetch } from "@/lib/api";
import type { Banca, BancaFrente, Candidatura, EquipeProjeto, Escopo, Frente } from "@/types/banca";

export function getBancas(token: string) {
  return apiFetch<Banca[]>("/bancas", { token });
}

export function getCandidaturas(token: string) {
  return apiFetch<Candidatura[]>("/candidaturas", { token });
}

export function getBancasParaAvaliar(usuarioId: number, token: string) {
  return apiFetch<Banca[]>(`/usuarios/${usuarioId}/bancas-para-avaliar`, { token });
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
