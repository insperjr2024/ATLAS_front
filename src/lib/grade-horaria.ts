import { apiFetch } from "@/lib/api";
import type { Compatibilidade, FaixaDisponivel, FaixaGrade, MinhaGrade } from "@/types/grade";

/**
 * As faixas vêm do backend, e não de uma constante aqui, porque é a mesma
 * lista que valida a gravação. Duas cópias sairiam do ar uma da outra
 * no dia em que entrar curso com horário diferente.
 */
export function getFaixasDisponiveis(token: string) {
  return apiFetch<FaixaDisponivel[]>("/grade-horaria/faixas", { token });
}

export function getMinhaGrade(token: string) {
  return apiFetch<MinhaGrade>("/grade-horaria", { token });
}

/** Substitui a grade inteira. Lista vazia limpa, é gravação válida. */
export function salvarGrade(faixas: FaixaGrade[], token: string) {
  return apiFetch<MinhaGrade>("/grade-horaria", {
    method: "PUT",
    token,
    body: JSON.stringify({ faixas }),
  });
}

/**
 * O cruzamento das grades de um grupo, só o resultado, nunca a grade
 * individual de ninguém.
 */
export function getCompatibilidade(usuarioIds: number[], token: string) {
  const params = usuarioIds.map((id) => `usuario_ids=${id}`).join("&");
  return apiFetch<Compatibilidade>(`/grade-horaria/compatibilidade?${params}`, { token });
}

/** A chave que identifica uma célula do quadro. */
export function chaveFaixa(dia: number, horaInicio: string) {
  return `${dia}:${horaInicio}`;
}
