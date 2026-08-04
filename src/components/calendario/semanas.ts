/**
 * Montagem de semanas e meses — a fonte ÚNICA do "quando a semana começa".
 *
 * ⚠ O motivo de existir: antes disso, `Calendario.tsx` tinha o `weekStartsOn`
 * cravado dentro de `semanasDoMes` e, separadamente, um array literal
 * `["Dom","Seg",…]` para o cabeçalho. Os dois concordavam por coincidência.
 * Mudar um sem o outro desalinha o cabeçalho em uma coluna — a coluna de
 * segunda passa a dizer "Dom" — e isso **não aparece** numa revisão de
 * screenshot.
 *
 * Aqui os dois saem do mesmo parâmetro, então não há como dessincronizar.
 *
 * O calendário geral segue em domingo-primeiro (`0`); o cronograma pintado e
 * a faixa de reunião usam seg–dom (`1`), como o §6.4 pede.
 */

import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export type InicioSemana = 0 | 1;

const ROTULOS_DOMINGO_PRIMEIRO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function rotulosDiaSemana(inicioSemana: InicioSemana): string[] {
  return inicioSemana === 0
    ? ROTULOS_DOMINGO_PRIMEIRO
    : [...ROTULOS_DOMINGO_PRIMEIRO.slice(1), ROTULOS_DOMINGO_PRIMEIRO[0]];
}

export function semanasDoMes(mes: Date, inicioSemana: InicioSemana): Date[][] {
  const inicio = startOfWeek(startOfMonth(mes), { weekStartsOn: inicioSemana });
  const fim = endOfWeek(endOfMonth(mes), { weekStartsOn: inicioSemana });
  const dias = eachDayOfInterval({ start: inicio, end: fim });
  const semanas: Date[][] = [];
  for (let i = 0; i < dias.length; i += 7) {
    semanas.push(dias.slice(i, i + 7));
  }
  return semanas;
}

export function diasDaSemana(ref: Date, inicioSemana: InicioSemana): Date[] {
  const inicio = startOfWeek(ref, { weekStartsOn: inicioSemana });
  return Array.from({ length: 7 }, (_, i) => addDays(inicio, i));
}

/**
 * A chave canônica de um dia: `yyyy-MM-dd`.
 *
 * Tudo no cronograma trafega como string nesse formato, e comparações de
 * intervalo são comparações de string. É o que mantém o componente livre de
 * fuso — `new Date("2026-08-10")` é lido como UTC e volta um dia no Brasil.
 */
export function chaveData(data: Date): string {
  return format(data, "yyyy-MM-dd");
}
