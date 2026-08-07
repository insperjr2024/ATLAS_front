import { apiFetch } from "@/lib/api";
import type { Configuracao } from "@/types/banca";

export function getConfiguracao(token: string) {
  return apiFetch<Configuracao>("/configuracao", { token });
}

export function updateConfiguracao(
  dados: {
    vagas_por_banca?: number;
    lideranca_minima_por_frente?: number;
    cargo_padrao_id?: number | null;
  },
  token: string,
) {
  return apiFetch<Configuracao>("/configuracao", {
    method: "PATCH",
    token,
    body: JSON.stringify(dados),
  });
}
