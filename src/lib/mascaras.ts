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

