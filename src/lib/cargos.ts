import { apiFetch } from "@/lib/api";
import type { Cargo } from "@/types/auth";

export function getCargos(token: string) {
  return apiFetch<Cargo[]>("/cargos", { token });
}

export interface CargoPayload {
  nome: string;
  pode_definir_formulario: boolean;
  pode_agendar_banca: boolean;
  pode_gerenciar_cargos: boolean;
  pode_gerenciar_membros: boolean;
  pode_gerenciar_nucleo: boolean;
}

export function createCargo(dados: CargoPayload, token: string) {
  return apiFetch<Cargo>("/cargos", {
    method: "POST",
    token,
    body: JSON.stringify(dados),
  });
}

export function updateCargo(cargoId: number, dados: Partial<CargoPayload>, token: string) {
  return apiFetch<Cargo>(`/cargos/${cargoId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(dados),
  });
}

export function deleteCargo(cargoId: number, token: string) {
  return apiFetch(`/cargos/${cargoId}`, { method: "DELETE", token });
}
