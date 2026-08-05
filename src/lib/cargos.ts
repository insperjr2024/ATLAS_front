import { apiFetch } from "@/lib/api";
import type { Cargo } from "@/types/auth";

export function getCargos(token: string) {
  return apiFetch<Cargo[]>("/cargos", { token });
}

/** O cargo sem o `id` — derivado de `Cargo` de propósito: uma permissão nova
 *  entra no payload sozinha, em vez de ser esquecida aqui e nunca chegar na
 *  API. */
export type CargoPayload = Omit<Cargo, "id">;

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
