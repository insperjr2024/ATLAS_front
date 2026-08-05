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

export interface RegistrarUsuarioPayload {
  nome: string;
  email_insper: string;
  senha: string;
  posicao: Posicao;
  /** Sem cargo escolhido, o backend usa o cargo padrão configurado. */
  cargo_id?: number | null;
}

export interface TransferirDiretoriaPayload {
  novo_diretor_id: number;
  diretor_atual_id: number;
}

/**
 * §10 — a passagem de bastão da virada de gestão, num passo só. O backend
 * promove antes de desligar, para nunca existir um instante sem diretoria, e
 * quem sai vira ex-membro (o caso de "fim de gestão").
 */
export function transferirDiretoria(dados: TransferirDiretoriaPayload, token: string) {
  return apiFetch<{ novo_diretor: { id: number; nome: string } }>(
    "/usuarios/transferir-diretoria",
    { method: "POST", token, body: JSON.stringify(dados) },
  );
}

/** §10: ninguém se auto-registra — só a diretoria pré-cadastra um membro. */
export function registrarUsuario(dados: RegistrarUsuarioPayload, token: string) {
  return apiFetch<UsuarioResumo>("/auth/registrar", {
    method: "POST",
    token,
    body: JSON.stringify(dados),
  });
}
