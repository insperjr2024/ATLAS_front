import { apiFetch } from "@/lib/api";
import type { Notificacao } from "@/types/notificacao";

export function getNotificacoes(token: string) {
  return apiFetch<Notificacao[]>("/notificacoes", { token });
}

export function marcarNotificacaoLida(notificacaoId: number, token: string) {
  return apiFetch<Notificacao>(`/notificacoes/${notificacaoId}`, {
    method: "PATCH",
    token,
  });
}
