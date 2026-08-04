/**
 * A paleta das etapas do cronograma.
 *
 * ⚠ Por que não usar as cores do `theme.ts`: o tema tem essencialmente uma
 * matiz (vermelho) mais success/warning/info, e as três semânticas apontam
 * para significados já ocupados — vermelho é primary/destructive/atrasado,
 * verde é sucesso, âmbar é alerta. Cor de etapa **não pode encostar na
 * semântica de status do design system**, ou uma etapa verde vira "tudo bem"
 * num cronograma que está atrasado.
 *
 * A regra que impede o arco-íris: 8 matizes fixas, **mesma saturação e mesma
 * luminosidade** — só a matiz gira. E o formulário oferece exatamente essas 8
 * amostras, sem color picker livre.
 *
 * Os valores são hex literais gerados uma vez a partir da fórmula HSL
 * (matiz variável; amostra 62%/52%, fundo 62%/92%, texto 45%/35%). Literais
 * porque são mais fáceis de revisar num diff do que uma conversão em runtime
 * — e porque `cronograma_etapa.cor` é `CHAR(7)`, que só cabe `#RRGGBB`.
 */

export interface CorEtapa {
  /** Preenchimento da célula — pálido, para o calendário continuar um
   *  documento branco com células tingidas, não um mosaico de blocos. */
  fundo: string;
  /** A amostra da legenda, saturada. É este o valor GRAVADO no banco. */
  amostra: string;
  /** Texto sobre a célula: mesma matiz, escuro. Pálido + escuro da mesma
   *  matiz passa de 4.5:1 sem precisar de tabela caso a caso. */
  texto: string;
}

export const PALETA: CorEtapa[] = [
  { amostra: "#397AD0", fundo: "#DEE9F7", texto: "#315481" }, // azul
  { amostra: "#7839D0", fundo: "#E8DEF7", texto: "#533181" }, // roxo
  { amostra: "#39B7D0", fundo: "#DEF3F7", texto: "#317481" }, // ciano
  { amostra: "#D03985", fundo: "#F7DEEB", texto: "#813159" }, // magenta
  { amostra: "#D07539", fundo: "#F7E8DE", texto: "#815131" }, // laranja
  { amostra: "#39D09E", fundo: "#DEF7EF", texto: "#318167" }, // verde-água
  { amostra: "#AB39D0", fundo: "#F1DEF7", texto: "#6D3181" }, // violeta
  { amostra: "#D0AB39", fundo: "#F7F1DE", texto: "#816D31" }, // mostarda
];

/** A cor sugerida para a próxima etapa — determinística pela ordem, e então
 *  PERSISTIDA: apagar uma etapa anterior não pode deslizar as cores das
 *  outras, senão o PNG de agosto deixa de bater com a legenda de agosto. */
export function corSugerida(ordem: number): string {
  return PALETA[ordem % PALETA.length].amostra;
}

/** Os três tons a partir da cor gravada. */
export function tonsDaCor(cor: string): CorEtapa {
  const encontrada = PALETA.find((p) => p.amostra.toUpperCase() === cor.toUpperCase());
  if (encontrada) return encontrada;
  // Cor fora da paleta (linha legada, ou salva à mão): usa a própria como
  // fundo e um texto escuro neutro.
  return { fundo: cor, amostra: cor, texto: "#1F2937" };
}

/** Reservados e fora da rampa, para nunca disputarem matiz com as etapas. */
export const COR_AMBIENTACAO = "#DCE0E5";
export const COR_PAUSA = "#E9EAED";
export const COR_NAO_UTIL = "#F0F0F0";
