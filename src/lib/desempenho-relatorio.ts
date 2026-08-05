import { apiFetch } from "@/lib/api";
import type { DesempenhoRelatorio, DesempenhoTipo } from "@/types/desempenho";

export function getRelatorio(
  usuarioId: number,
  token: string,
  params?: { lote_id?: number; tipo?: DesempenhoTipo },
) {
  const query = new URLSearchParams();
  if (params?.lote_id != null) query.set("lote_id", String(params.lote_id));
  if (params?.tipo) query.set("tipo", params.tipo);
  const qs = query.toString();
  return apiFetch<DesempenhoRelatorio>(
    `/usuarios/${usuarioId}/desempenho/relatorio${qs ? `?${qs}` : ""}`,
    { token },
  );
}
