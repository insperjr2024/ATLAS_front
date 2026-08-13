import { apiFetch } from "@/lib/api";
import type { Permissoes, Posicao, PosicaoPermissao } from "@/types/auth";

/** As 4 linhas fixas, sem criar/apagar, só editar as caixas de cada uma. */
export function getPosicoesPermissoes(token: string) {
  return apiFetch<PosicaoPermissao[]>("/posicoes-permissoes", { token });
}

export function updatePosicaoPermissao(
  posicao: Posicao,
  dados: Partial<Permissoes>,
  token: string,
) {
  return apiFetch<PosicaoPermissao>(`/posicoes-permissoes/${posicao}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(dados),
  });
}
