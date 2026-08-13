/**
 * A visão do cronograma, dia, semana ou mês, e a navegação entre períodos.
 *
 * Existe separado do `PaintedCalendar` de propósito: o componente continua
 * burro e controlado, recebendo blocos já derivados. É isso que mantém o
 * arrastar-e-pintar agnóstico de layout (ele faz hit-test por `data-dia`, não
 * por posição na grade) e o que torna esta derivação testável sem montar React.
 *
 * Atenção: o  do case pede os meses empilhados como formato canônico. As visões
 * de semana e dia são lentes de trabalho para o detalhe, não substitutas, a
 * de mês é o default.
 */

import {
  addDays,
  addMonths,
  format,
  isSameMonth,
  isSameYear,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { chaveData, diasDaSemana, rotulosDiaSemana, semanasDoMes } from "@/components/calendario/semanas";

/**  pede seg–dom para o cronograma. */
export const INICIO_SEMANA = 1;

const ROTULOS_SEMANA = rotulosDiaSemana(INICIO_SEMANA);

export type Visao = "dia" | "semana" | "mes";

export const VISOES: { valor: Visao; rotulo: string }[] = [
  { valor: "dia", rotulo: "Dia" },
  { valor: "semana", rotulo: "Semana" },
  { valor: "mes", rotulo: "Mês" },
];

/**
 * Um bloco renderizável da grade.
 *
 * `linhas` carrega `null` onde a célula é só preenchimento (dia de mês vizinho
 * na visão de mês). O `null` importa: com meses empilhados, deixar a data real
 * ali faria a MESMA data existir em dois blocos, o que quebra o hit-test do
 * arrasto e duplica a pintura.
 */
export interface BlocoCalendario {
  chave: string;
  titulo: string;
  /** O cabeçalho de colunas. O tamanho manda na quantidade de colunas da grade. */
  rotulos: string[];
  linhas: (Date | null)[][];
}

/** Quantos dias/semanas/meses um passo de navegação anda em cada visão. */
export function avancar(visao: Visao, referencia: Date, passo: number): Date {
  if (visao === "dia") return addDays(referencia, passo);
  if (visao === "semana") return addDays(referencia, passo * 7);
  return addMonths(referencia, passo);
}

/**
 * O período visível, como intervalo fechado de chaves `yyyy-MM-dd`.
 *
 * Serve para a navegação saber se ainda há projeto adiante e para a página
 * decidir se o botão de avançar fica desabilitado.
 */
export function intervaloDaVisao(visao: Visao, referencia: Date): { inicio: string; fim: string } {
  if (visao === "dia") {
    const chave = chaveData(referencia);
    return { inicio: chave, fim: chave };
  }
  if (visao === "semana") {
    const dias = diasDaSemana(referencia, INICIO_SEMANA);
    return { inicio: chaveData(dias[0]), fim: chaveData(dias[6]) };
  }
  const semanas = semanasDoMes(referencia, INICIO_SEMANA);
  const primeira = semanas[0];
  const ultima = semanas[semanas.length - 1];
  return { inicio: chaveData(primeira[0]), fim: chaveData(ultima[6]) };
}

/**
 * Os 1ºs-de-mês cobertos pela janela do projeto.
 *
 * Usado pelo export: o PDF sai dos meses que a pessoa escolheu, e não do
 * recorte que estava na tela, um PDF de um dia só não é "pronto para
 * apresentações".
 */
export function mesesDaJanela(inicio: string, fim: string): Date[] {
  const meses: Date[] = [];
  const atual = new Date(`${inicio}T12:00:00`);
  atual.setDate(1);
  const limite = new Date(`${fim}T12:00:00`);
  while (atual <= limite) {
    meses.push(new Date(atual));
    atual.setMonth(atual.getMonth() + 1);
  }
  return meses;
}

/** Vários meses empilhados, o formato canônico, usado no export. */
export function blocosDosMeses(meses: Date[]): BlocoCalendario[] {
  return meses.map((mes) => blocoDoMes(mes));
}

export function blocosDaVisao(visao: Visao, referencia: Date): BlocoCalendario[] {
  if (visao === "dia") return [blocoDoDia(referencia)];
  if (visao === "semana") return [blocoDaSemana(referencia)];
  return [blocoDoMes(referencia)];
}

function blocoDoDia(dia: Date): BlocoCalendario {
  return {
    chave: `dia-${chaveData(dia)}`,
    titulo: capitalizar(format(dia, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })),
    // Uma coluna só: o rótulo genérico "Seg" não acrescenta nada quando o
    // título já diz o dia da semana por extenso.
    rotulos: [],
    linhas: [[dia]],
  };
}

function blocoDaSemana(referencia: Date): BlocoCalendario {
  const dias = diasDaSemana(referencia, INICIO_SEMANA);
  return {
    chave: `semana-${chaveData(dias[0])}`,
    titulo: tituloDaSemana(dias[0], dias[6]),
    rotulos: ROTULOS_SEMANA,
    // Semana nunca tem preenchimento: os 7 dias são reais, mesmo os que caem
    // no mês vizinho. Aqui não há empilhamento para duplicar data.
    linhas: [dias],
  };
}

function blocoDoMes(referencia: Date): BlocoCalendario {
  const mes = startOfMonth(referencia);
  return {
    chave: `mes-${chaveData(mes)}`,
    titulo: capitalizar(format(mes, "MMMM 'de' yyyy", { locale: ptBR })),
    rotulos: ROTULOS_SEMANA,
    linhas: semanasDoMes(mes, INICIO_SEMANA).map((semana) =>
      semana.map((dia) => (isSameMonth(dia, mes) ? dia : null)),
    ),
  };
}

/** "4 – 10 de agosto de 2026", encurtando o que as duas pontas já compartilham. */
function tituloDaSemana(inicio: Date, fim: Date): string {
  if (isSameMonth(inicio, fim)) {
    return `${format(inicio, "d")} – ${format(fim, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
  }
  if (isSameYear(inicio, fim)) {
    return `${format(inicio, "d 'de' MMM", { locale: ptBR })} – ${format(fim, "d 'de' MMM 'de' yyyy", { locale: ptBR })}`;
  }
  return `${format(inicio, "d 'de' MMM 'de' yyyy", { locale: ptBR })} – ${format(fim, "d 'de' MMM 'de' yyyy", { locale: ptBR })}`;
}

/**
 * Traz a referência para dentro da janela do projeto.
 *
 * Abrir o cronograma num mês vazio porque "hoje" é depois do fim do projeto é
 * o tipo de detalhe que faz a tela parecer quebrada sem estar.
 */
export function ancorar(hoje: Date, janelaInicio: string, janelaFim: string): Date {
  const chave = chaveData(hoje);
  if (chave < janelaInicio) return new Date(`${janelaInicio}T12:00:00`);
  if (chave > janelaFim) return new Date(`${janelaFim}T12:00:00`);
  return hoje;
}

/** O início do período, para a navegação não escorregar ao trocar de visão. */
export function normalizar(visao: Visao, referencia: Date): Date {
  if (visao === "mes") return startOfMonth(referencia);
  if (visao === "semana") return startOfWeek(referencia, { weekStartsOn: INICIO_SEMANA });
  return referencia;
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
