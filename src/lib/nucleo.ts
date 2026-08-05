import type { BancaFrente, Candidatura, EquipeProjeto, Escopo, Frente } from "@/types/banca";
import type { Cargo, UsuarioFrente, UsuarioResumo } from "@/types/auth";

/**
 * Um cargo é de consultor quando não tem nenhuma das permissões que só a
 * liderança recebe. Kickoff, tarefas e ver os próprios projetos ficam de fora
 * da checagem de propósito: o consultor também as tem por padrão, então
 * incluí-las faria todo cargo parecer administrativo.
 */
const PERMISSOES_DE_LIDERANCA = [
  "pode_criar_projeto",
  "pode_editar_equipe",
  "pode_gerir_membros",
  "pode_definir_cronograma",
  "pode_aprovar_reajuste",
  "pode_ver_monitoramento",
] as const;

function semNenhumaPermissao(cargo: Cargo): boolean {
  return PERMISSOES_DE_LIDERANCA.every((campo) => !cargo[campo]);
}

export function consultoresDoNucleo(usuarios: UsuarioResumo[], cargos: Cargo[]): UsuarioResumo[] {
  const idsConsultor = new Set(
    cargos
      .filter((c) => c.nome.toLowerCase().includes("consultor") || semNenhumaPermissao(c))
      .map((c) => c.id),
  );
  return usuarios.filter((u) => u.ativo && idsConsultor.has(u.cargo_id));
}

export function nomeUsuario(usuarios: UsuarioResumo[], id: number): string {
  return usuarios.find((u) => u.id === id)?.nome ?? "—";
}

/** `id` vazio = escopo "Outro" (nome digitado, sem linha de catálogo). */
export function nomeEscopo(escopos: Escopo[], id: number | null): string {
  if (id == null) return "Outro";
  return escopos.find((e) => e.id === id)?.nome ?? "—";
}

export function nomeCargo(cargos: Cargo[], id: number): string {
  return cargos.find((c) => c.id === id)?.nome ?? "—";
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

export function membrosDaBanca(equipes: EquipeProjeto[], usuarios: UsuarioResumo[], bancaId: number): string[] {
  return equipes.filter((e) => e.banca_id === bancaId).map((e) => nomeUsuario(usuarios, e.usuario_id));
}

export function avaliadoresDaBanca(candidaturas: Candidatura[], usuarios: UsuarioResumo[], bancaId: number): string[] {
  return candidaturas.filter((c) => c.banca_id === bancaId).map((c) => nomeUsuario(usuarios, c.usuario_id));
}
