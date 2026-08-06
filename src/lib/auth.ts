import { apiFetch } from "@/lib/api";

/* Os tipos espelham `use_cases/auth/` do backend.
 *
 * As duas chamadas daqui são PÚBLICAS — sem `token`, porque quem esqueceu a
 * senha não tem como se autenticar para pedir a troca. O `apiFetch` só manda
 * o header `Authorization` quando recebe token, então basta omitir. */

export interface RespostaMensagem {
  mensagem: string;
}

/**
 * Pede o e-mail com o link de redefinição.
 *
 * ⚠ Responde a MESMA coisa exista o e-mail ou não — é decisão do backend, para
 * a rota não virar um verificador de quem é membro do núcleo. A tela não pode
 * prometer "enviamos para você", só "se estiver cadastrado, enviamos".
 */
export function solicitarRecuperacao(emailInsper: string) {
  return apiFetch<RespostaMensagem>("/auth/esqueci-senha", {
    method: "POST",
    body: JSON.stringify({ email_insper: emailInsper }),
  });
}

/** Troca a senha usando o token de uso único que veio no link do e-mail. */
export function redefinirSenha(token: string, novaSenha: string) {
  return apiFetch<RespostaMensagem>("/auth/redefinir-senha", {
    method: "POST",
    body: JSON.stringify({ token, nova_senha: novaSenha }),
  });
}

/** Primeiros nomes dos membros ativos — só decoração da tela de login (o
 *  globo), nada de e-mail/cargo/posição. Pública pelo mesmo motivo das
 *  duas de cima: a tela de login não tem token nenhum ainda. */
export function getPrimeirosNomes() {
  return apiFetch<string[]>("/auth/membros-nomes");
}
