import { apiFetch } from "@/lib/api";
import type { UsuarioResumo } from "@/types/auth";

export function getUsuarios(token: string) {
  return apiFetch<UsuarioResumo[]>("/usuarios", { token });
}

export interface UpdateUsuarioPayload {
  nome?: string;
  email_insper?: string;
  cargo_id?: number;
  ativo?: boolean;
}

export function updateUsuario(usuarioId: number, dados: UpdateUsuarioPayload, token: string) {
  return apiFetch<UsuarioResumo>(`/usuarios/${usuarioId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(dados),
  });
}
