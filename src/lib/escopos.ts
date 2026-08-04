import { apiFetch } from "@/lib/api";
import type { Escopo } from "@/types/banca";

/** `frenteId` filtra o catálogo pela frente — o §6.3 mostra só os escopos
 *  das frentes marcadas no formulário. A rota já aceita o parâmetro. */
export function getEscopos(token: string, frenteId?: number | null) {
  const query = frenteId ? `?frente_id=${frenteId}` : "";
  return apiFetch<Escopo[]>(`/escopos${query}`, { token });
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
