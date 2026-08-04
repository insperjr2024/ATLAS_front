import { apiFetch } from "@/lib/api";
import type { Semestre } from "@/types/banca";

export function getSemestres(token: string) {
  return apiFetch<Semestre[]>("/semestres", { token });
}

export function semestreAtual(semestres: Semestre[]): Semestre | null {
  if (semestres.length === 0) return null;
  const hoje = new Date();
  const atual = semestres.find((s) => new Date(s.inicio) <= hoje && hoje <= new Date(s.fim));
  if (atual) return atual;
  return [...semestres].sort((a, b) => new Date(b.fim).getTime() - new Date(a.fim).getTime())[0];
}
