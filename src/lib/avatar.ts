/**
 * As duas regras do círculo de avatar: que letras aparecem, e de que cor.
 *
 * ⚠ Módulo sem componente de propósito. Elas moravam em `ProjetoPage.tsx` e,
 * quando a Visão geral passou a precisar delas, exportá-las de lá quebrava o
 * hot reload (um arquivo de componentes que exporta utilitários perde o
 * refresh rápido). `components/Avatar.tsx` teria o mesmo problema: ele exporta
 * `FotoCircular`.
 */
import { CORES_SUGERIDAS } from "@/lib/colunas-tarefa";

/** "Ana Souza" → "AS". Duas letras: três não se leem em 1.5rem. */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/** Cor estável por pessoa: o id não muda, então o avatar não troca de cor
 *  entre telas. Mesma paleta das colunas de tarefa, para não inventar uma
 *  segunda linguagem de cor na plataforma. */
export function corDaPessoa(usuarioId: number): string {
  return CORES_SUGERIDAS[usuarioId % CORES_SUGERIDAS.length];
}
