import { apiFetch } from "@/lib/api";
import type { Posicao, StatusUsuario, UsuarioResumo } from "@/types/auth";

export function getUsuarios(token: string) {
  return apiFetch<UsuarioResumo[]>("/usuarios", { token });
}

export interface UpdateUsuarioPayload {
  nome?: string;
  email_insper?: string;
  cargo_id?: number;
  /** §10: a promoção da virada de gestão — consultor vira coordenador. */
  posicao?: Posicao;
  /**
   * §10: sair por vontade própria (`ex_membro`) é diferente de ser desligado.
   * Em ambos os casos o histórico de participação em projetos permanece — é
   * por isso que `projeto_membro` fecha com `saiu_em` em vez de apagar linha.
   */
  status?: StatusUsuario;
  ativo?: boolean;
}

export function updateUsuario(usuarioId: number, dados: UpdateUsuarioPayload, token: string) {
  return apiFetch<UsuarioResumo>(`/usuarios/${usuarioId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(dados),
  });
}
