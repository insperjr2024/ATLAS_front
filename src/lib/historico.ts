import { apiFetch } from "@/lib/api";
import type { HistoricoBanca } from "@/types/banca";

export interface HistoricoFiltros {
  consultor_id?: number;
  coordenador_id?: number;
  escopo_id?: number;
  semestre_id?: number;
}

export function getHistoricoBancas(token: string, filtros: HistoricoFiltros = {}) {
  const params = new URLSearchParams();
  if (filtros.consultor_id != null) params.set("consultor_id", String(filtros.consultor_id));
  if (filtros.coordenador_id != null) params.set("coordenador_id", String(filtros.coordenador_id));
  if (filtros.escopo_id != null) params.set("escopo_id", String(filtros.escopo_id));
  if (filtros.semestre_id != null) params.set("semestre_id", String(filtros.semestre_id));
  const query = params.toString();
  return apiFetch<HistoricoBanca[]>(`/historico-bancas${query ? `?${query}` : ""}`, { token });
}
