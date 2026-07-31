import { apiFetch } from "@/lib/api";
import type { Banca, Candidatura } from "@/types/banca";

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