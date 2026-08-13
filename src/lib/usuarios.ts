import { apiFetch } from "@/lib/api";
import type { Posicao, StatusUsuario, UsuarioResumo } from "@/types/auth";

export function getUsuarios(token: string) {
  return apiFetch<UsuarioResumo[]>("/usuarios", { token });
}

export interface UpdateUsuarioPayload {
  nome?: string;
  email_insper?: string;
  /** a promoção da virada de gestão, consultor vira coordenador. */
  posicao?: Posicao;
  /**
   * sair por vontade própria (`ex_membro`) é diferente de ser desligado.
   * Em ambos os casos o histórico de participação em projetos permanece, é
   * por isso que `projeto_membro` fecha com `saiu_em` em vez de apagar linha.
   */
  status?: StatusUsuario;
  ativo?: boolean;
  /** 1º a 8º semestre da graduação, ou `null` pra limpar. */
  semestre_graduacao?: number | null;
}

export function updateUsuario(usuarioId: number, dados: UpdateUsuarioPayload, token: string) {
  return apiFetch<UsuarioResumo>(`/usuarios/${usuarioId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(dados),
  });
}

/** Sem volta, o backend só aceita se o usuário já estiver desligado. */
export function deletarUsuarioPermanente(usuarioId: number, token: string) {
  return apiFetch<{ nome: string }>(`/usuarios/${usuarioId}/permanente`, {
    method: "DELETE",
    token,
  });
}

export interface RegistrarUsuarioPayload {
  nome: string;
  email_insper: string;
  posicao: Posicao;
  semestre_graduacao?: number | null;
}

/**
 * O que volta ao cadastrar (e ao reenviar): a senha de primeiro acesso EM
 * CLARO e se o e-mail saiu.
 *
 * Esta é a única vez que essa senha existe fora do e-mail, o banco só guarda
 * o hash. Se `email_enviado` for `false` (SMTP fora do ar ou não configurado),
 * a tela precisa mostrá-la para quem cadastrou repassar; e quem fechar a tela
 * sem anotar não a recupera, só reemite.
 */
export interface SenhaProvisoriaEmitida {
  senha_provisoria_gerada: string;
  email_enviado: boolean;
}

export interface TransferirDiretoriaPayload {
  novo_diretor_id: number;
  diretor_atual_id: number;
}

/**
 * A passagem de bastão da virada de gestão, num passo só. O backend
 * promove antes de desligar, para nunca existir um instante sem diretoria, e
 * quem sai vira ex-membro (o caso de "fim de gestão").
 */
export function transferirDiretoria(dados: TransferirDiretoriaPayload, token: string) {
  return apiFetch<{ novo_diretor: { id: number; nome: string } }>(
    "/usuarios/transferir-diretoria",
    { method: "POST", token, body: JSON.stringify(dados) },
  );
}

/**
 * ninguém se auto-registra, só a diretoria pré-cadastra um membro.
 *
 * Sem campo de senha: quem cadastra não escolhe a senha de ninguém. O backend
 * sorteia uma provisória, manda por e-mail e devolve aqui.
 */
export function registrarUsuario(dados: RegistrarUsuarioPayload, token: string) {
  return apiFetch<UsuarioResumo & SenhaProvisoriaEmitida>("/auth/registrar", {
    method: "POST",
    token,
    body: JSON.stringify(dados),
  });
}

/**
 * Reemite a senha de primeiro acesso, e-mail perdido, caixa cheia, ou membro
 * trancado para fora.
 *
 * Só diretoria, e **derruba a senha atual da pessoa**: é o caminho de
 * devolver acesso, não um "reenviar e-mail" inofensivo.
 */
export function reenviarSenhaProvisoria(usuarioId: number, token: string) {
  return apiFetch<{ id: number; email_insper: string } & SenhaProvisoriaEmitida>(
    `/usuarios/${usuarioId}/senha-provisoria`,
    { method: "POST", token },
  );
}
