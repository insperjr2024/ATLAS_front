import { apiFetch } from "@/lib/api";
import type { Escopo } from "@/types/banca";

export function getEscopos(token: string) {
  return apiFetch<Escopo[]>("/escopos", { token });
}

export function createEscopo(nome: string, token: string) {
  return apiFetch<Escopo>("/escopos", {
    method: "POST",
    token,
    body: JSON.stringify({ nome }),
  });
}

export function updateEscopo(escopoId: number, nome: string, token: string) {
  return apiFetch<Escopo>(`/escopos/${escopoId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ nome }),
  });
}

export function deleteEscopo(escopoId: number, token: string) {
  return apiFetch(`/escopos/${escopoId}`, { method: "DELETE", token });
}
