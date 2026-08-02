import { apiFetch } from "@/lib/api";
import type { Frente } from "@/types/banca";

export function getFrentes(token: string) {
  return apiFetch<Frente[]>("/frentes", { token });
}

export function createFrente(nome: string, token: string) {
  return apiFetch<Frente>("/frentes", {
    method: "POST",
    token,
    body: JSON.stringify({ nome }),
  });
}

export function updateFrente(frenteId: number, nome: string, token: string) {
  return apiFetch<Frente>(`/frentes/${frenteId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ nome }),
  });
}

export function deleteFrente(frenteId: number, token: string) {
  return apiFetch(`/frentes/${frenteId}`, { method: "DELETE", token });
}
