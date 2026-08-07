import { apiFetch } from "@/lib/api";

export interface ProjetoComVaga {
  id: number;
  nome: string;
  cliente: string;
  descricao: string | null;
  status: string;
  /** As frentes que o projeto abrange. Duas = projeto sinérgico. */
  frentes: string[];
  coordenador_id: number | null;
  coordenador_nome: string | null;
  consultores: string[];
  alocados: number;
  max_consultores: number;
  vagas: number;
  /**
   * Por que ESTA pessoa não pode pedir agora. `null` = pode.
   *
   * 📐 Vem preenchido em vez de o projeto sumir da lista: projeto que some
   * sem explicação gera "por que não aparece o X?" e ninguém sabe responder.
   */
  impedimento: string | null;
}

export interface ListaVagas {
  projetos: ProjetoComVaga[];
  minha_carga: number;
  teto: number;
}

export interface SolicitacaoRecebida {
  id: number;
  projeto_id: number;
  projeto_nome: string;
  usuario_id: number;
  usuario_nome: string | null;
  /** Em quantos projetos o solicitante já está — o §7.3 marca 3 como gargalo. */
  carga_do_solicitante: number;
  justificativa: string;
  status: "pendente" | "aprovada" | "recusada";
  criado_em: string;
  respondido_em: string | null;
  respondido_por_nome: string | null;
  resposta: string | null;
}

export interface MinhaSolicitacao {
  id: number;
  projeto_id: number;
  projeto_nome: string;
  status: "pendente" | "aprovada" | "recusada";
  justificativa: string;
  resposta: string | null;
  criado_em: string;
  respondido_em: string | null;
}

export function getProjetosComVaga(token: string) {
  return apiFetch<ListaVagas>("/projetos-com-vaga", { token });
}

export function getMinhasSolicitacoes(token: string) {
  return apiFetch<MinhaSolicitacao[]>("/solicitacoes-projeto/minhas", { token });
}

/** Os pedidos dos projetos que o usuário COORDENA. Vazio para quem não coordena. */
export function getSolicitacoesRecebidas(token: string) {
  return apiFetch<SolicitacaoRecebida[]>("/solicitacoes-projeto/recebidas", { token });
}

export function criarSolicitacao(projetoId: number, justificativa: string, token: string) {
  return apiFetch<{ id: number; status: string }>("/solicitacoes-projeto", {
    method: "POST",
    token,
    body: JSON.stringify({ projeto_id: projetoId, justificativa }),
  });
}

/** Aprovar já inclui a pessoa na equipe como consultor. */
export function responderSolicitacao(
  solicitacaoId: number,
  aprovar: boolean,
  token: string,
  resposta?: string,
) {
  return apiFetch<{ id: number; status: string }>(`/solicitacoes-projeto/${solicitacaoId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ aprovar, resposta: resposta ?? null }),
  });
}

export function cancelarSolicitacao(solicitacaoId: number, token: string) {
  return apiFetch<void>(`/solicitacoes-projeto/${solicitacaoId}`, { method: "DELETE", token });
}
