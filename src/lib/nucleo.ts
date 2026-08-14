import type { BancaFrente, Candidatura, Escopo, Frente } from "@/types/banca";
import type { UsuarioFrente, UsuarioResumo } from "@/types/auth";

export function consultoresDoNucleo(usuarios: UsuarioResumo[]): UsuarioResumo[] {
  return usuarios.filter((u) => u.ativo && u.posicao === "consultor");
}

export function nomeUsuario(usuarios: UsuarioResumo[], id: number): string {
  return usuarios.find((u) => u.id === id)?.nome ?? "—";
}

/** `id` vazio = escopo "Outro" (nome digitado, sem linha de catálogo). */
export function nomeEscopo(escopos: Escopo[], id: number | null): string {
  if (id == null) return "Outro";
  return escopos.find((e) => e.id === id)?.nome ?? "—";
}

/** Remove acentos e normaliza para comparação em buscas. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function frentesDoUsuario(usuariosFrentes: UsuarioFrente[], frentes: Frente[], usuarioId: number): string[] {
  return usuariosFrentes
    .filter((uf) => uf.usuario_id === usuarioId)
    .map((uf) => frentes.find((f) => f.id === uf.frente_id)?.nome ?? "—");
}

export function frentesDaBanca(bancasFrentes: BancaFrente[], frentes: Frente[], bancaId: number): string[] {
  return bancasFrentes
    .filter((bf) => bf.banca_id === bancaId)
    .map((bf) => frentes.find((f) => f.id === bf.frente_id)?.nome ?? "—");
}

/**
 * A equipe da banca, a partir do `equipe_ids` que o BACKEND já resolveu.
 *
 * Isto substituiu uma versão que lia `equipe_projeto`, a tabela LEGADA do
 * módulo de bancas, preenchida à mão no formulário "Consultores do projeto".
 * Banca marcada pelo cronograma não escreve nela, então a ficha mostrava
 * "Membros —" justamente nas bancas do fluxo novo, que hoje são a maioria.
 *
 * `equipe_ids` já soma as duas fontes (ver `utils/equipe_banca.py` no backend)
 * e não custa chamada nova: vem junto de cada banca em `GET /bancas`.
 *
 * O coordenador sai da lista porque tem linha própria na ficha, o backend o
 * inclui no conjunto por outro motivo (quem não pode avaliar a banca).
 */
export function membrosDaBanca(
  equipeIds: number[] | undefined,
  coordenadorId: number,
  usuarios: UsuarioResumo[],
): string[] {
  return (equipeIds ?? [])
    .filter((id) => id !== coordenadorId)
    .map((id) => nomeUsuario(usuarios, id))
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function avaliadoresDaBanca(candidaturas: Candidatura[], usuarios: UsuarioResumo[], bancaId: number): string[] {
  return candidaturas.filter((c) => c.banca_id === bancaId).map((c) => nomeUsuario(usuarios, c.usuario_id));
}
