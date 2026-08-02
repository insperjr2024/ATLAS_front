import type { BancaFrente, Candidatura, EquipeProjeto, Escopo, Frente } from "@/types/banca";
import type { UsuarioResumo } from "@/types/auth";

export function nomeUsuario(usuarios: UsuarioResumo[], id: number): string {
  return usuarios.find((u) => u.id === id)?.nome ?? "—";
}

export function nomeEscopo(escopos: Escopo[], id: number): string {
  return escopos.find((e) => e.id === id)?.nome ?? "—";
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
