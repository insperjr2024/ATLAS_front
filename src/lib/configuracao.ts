import { apiFetch } from "@/lib/api";
import type { Configuracao } from "@/types/banca";

export function getConfiguracao(token: string) {
  return apiFetch<Configuracao>("/configuracao", { token });
}

export function updateConfiguracao(dados: { vagas_por_banca?: number }, token: string) {
  return apiFetch<Configuracao>("/configuracao", {
    method: "PATCH",
    token,
    body: JSON.stringify(dados),
  });
}
