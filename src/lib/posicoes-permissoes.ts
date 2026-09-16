import { apiFetch } from "@/lib/api";
import type { Permissoes, Posicao, PosicaoPermissao } from "@/types/auth";

/** As linhas do catálogo — os 6 cargos padrão mais os que a diretoria criou. */
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

/** Cargo novo, nascendo com todas as caixas desligadas — quem criou marca o
 *  que quiser depois em "Editar". Não entra em nenhuma regra de identidade
 *  hardcoded (mentor, composição de banca, portfólio inteiro), de propósito. */
export function createPosicaoPermissao(nome: string, token: string) {
  return apiFetch<PosicaoPermissao>("/posicoes-permissoes", {
    method: "POST",
    token,
    body: JSON.stringify({ nome }),
  });
}

/** Só cargos criados pela tela (`e_padrao: false`) — os 6 padrão são
 *  recusados pelo backend, e quem ainda tem gente no cargo também. */
export function deletePosicaoPermissao(posicao: Posicao, token: string) {
  return apiFetch<void>(`/posicoes-permissoes/${posicao}`, {
    method: "DELETE",
    token,
  });
}
