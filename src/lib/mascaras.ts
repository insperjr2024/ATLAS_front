/** Máscaras "ao digitar" pros campos de documento do formulário de contrato
 *  (§ Contratos, 2026-09-21) — mesmo agrupamento que o backend já usa em
 *  `extrair_coleta.py` (`formatar_cpf`/`formatar_rg`), só que aplicado tecla
 *  a tecla em vez de uma vez só sobre texto já pronto. */

export function formatarCpfDigitado(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  let r = d.slice(0, 3);
  if (d.length > 3) r += "." + d.slice(3, 6);
  if (d.length > 6) r += "." + d.slice(6, 9);
  if (d.length > 9) r += "-" + d.slice(9, 11);
  return r;
}

/** RG não é padronizado nacionalmente (SC emite com 7 dígitos, SP com 8-9,
 *  RJ com 10) — agrupa nos moldes do padrão mais comum (2.3.3-1, de SP) só
 *  nos primeiros 9 caracteres, e o que passar disso entra sem mais pontos,
 *  em vez de inventar posição pra um número que não segue esse padrão. */
export function formatarRgDigitado(valor: string): string {
  const limpo = valor.replace(/[^0-9Xx]/g, "").toUpperCase();
  const d = limpo.slice(0, 9);
  const resto = limpo.slice(9);
  let r = d;
  if (d.length > 2) r = `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length > 5) r = `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length > 8) r = `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}-${d.slice(8)}`;
  return r + resto;
}
