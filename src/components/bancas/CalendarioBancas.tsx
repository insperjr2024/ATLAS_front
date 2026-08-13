import { useMemo, useState } from "react";
import { addMonths, format, isSameMonth, isToday, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { paraDataUtc } from "@/lib/projetos";
import { DayEvents, DayNumber, WeekdayCell, WeekdayRow } from "@/components/calendario/CalendarGrid.styled";
import { chaveData, rotulosDiaSemana, semanasDoMes } from "@/components/calendario/semanas";
import { EmptyText, PageButtonSm } from "@/styles/page.styled";
import { theme } from "@/styles/theme";
import type { Banca, StatusBanca } from "@/types/banca";
import {
  AvisoChoque,
  Cabecalho,
  CalendarioWrap,
  CelulaDia,
  Grade,
  GradeWrap,
  Legenda,
  LegendaCor,
  LegendaItem,
  LinhaSemana,
  MesAtual,
  NavegacaoMes,
  PilulaBanca,
  PilulaHora,
  PilulaProjeto,
  PilulaVagas,
  ResumoMes,
} from "./CalendarioBancas.styled";

const INICIO_SEMANA = 0;
const ROTULOS = rotulosDiaSemana(INICIO_SEMANA);

/** Mesma leitura de `tomDoStatusBanca`, traduzida para cor direta — a pílula
 *  não é um `PageBadge` e precisa da cor, não do tom. */
const COR_STATUS: Record<StatusBanca, string> = {
  atrasada: theme.colors.destructive,
  realizada: theme.colors.success,
  aberta: theme.colors.info,
  nao_marcada: theme.colors.mutedForeground,
};

const ROTULO_CURTO: Record<StatusBanca, string> = {
  atrasada: "Atrasada",
  realizada: "Realizada",
  aberta: "Aberta",
  nao_marcada: "Não marcada",
};

/** `2026-08-12T14:00` → `14:00`, sem passar pelo fuso. */
function horaDe(iso: string): string {
  const d = paraDataUtc(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * ⭐ O calendário só de bancas (§8) — a tela que responde "esse horário está
 * livre?" antes de alguém marcar.
 *
 * ⚠ **Não é o Calendário geral com um filtro.** Lá as bancas dividem espaço
 * com kickoffs, reuniões e entregas, e o que importa numa banca — hora exata,
 * quantas vagas ainda faltam, e se duas caem no mesmo horário — não cabe numa
 * pílula que precisa servir a quatro tipos de evento.
 *
 * Alimentado pela lista que a página já carregou: nenhuma requisição nova, e
 * o que aparece aqui é exatamente o que aparece nas outras abas — inclusive o
 * recorte por posição, que o backend já aplicou.
 */
export function CalendarioBancas({
  bancas,
  onAbrirBanca,
}: {
  bancas: Banca[];
  onAbrirBanca: (banca: Banca) => void;
}) {
  const [mes, setMes] = useState(() => startOfMonth(new Date()));

  const porDia = useMemo(() => {
    const mapa = new Map<string, Banca[]>();
    for (const b of bancas) {
      const chave = chaveData(paraDataUtc(b.data_hora));
      const lista = mapa.get(chave) ?? [];
      lista.push(b);
      mapa.set(chave, lista);
    }
    // Dentro do dia, por hora: é a ordem em que a pessoa lê a agenda, e é o
    // que põe duas bancas do mesmo horário lado a lado.
    for (const lista of mapa.values()) {
      lista.sort((a, b) => horaDe(a.data_hora).localeCompare(horaDe(b.data_hora)));
    }
    return mapa;
  }, [bancas]);

  const doMes = useMemo(
    () => bancas.filter((b) => isSameMonth(paraDataUtc(b.data_hora), mes)),
    [bancas, mes],
  );

  /**
   * ⚠ Os horários com mais de uma banca no mesmo dia — o choque que o §8
   * proíbe. Calculado aqui, e não no backend, porque é uma leitura da mesma
   * lista que já está na tela; o backend faz a checagem que **bloqueia**, esta
   * é a que **avisa**, inclusive sobre choques que já existem no banco.
   */
  const chocados = useMemo(() => {
    const conjunto = new Set<string>();
    for (const [dia, lista] of porDia) {
      const contagem = new Map<string, number>();
      for (const b of lista) {
        const hora = horaDe(b.data_hora);
        contagem.set(hora, (contagem.get(hora) ?? 0) + 1);
      }
      for (const [hora, n] of contagem) {
        if (n > 1) conjunto.add(`${dia}T${hora}`);
      }
    }
    return conjunto;
  }, [porDia]);

  return (
    <CalendarioWrap>
      <Cabecalho>
        <NavegacaoMes>
          <PageButtonSm type="button" $variant="ghost" onClick={() => setMes((m) => addMonths(m, -1))}>
            <ChevronLeft size={14} />
          </PageButtonSm>
          <MesAtual>{format(mes, "MMMM 'de' yyyy", { locale: ptBR })}</MesAtual>
          <PageButtonSm type="button" $variant="ghost" onClick={() => setMes((m) => addMonths(m, 1))}>
            <ChevronRight size={14} />
          </PageButtonSm>
          <PageButtonSm type="button" $variant="outline" onClick={() => setMes(startOfMonth(new Date()))}>
            Hoje
          </PageButtonSm>
        </NavegacaoMes>
        <ResumoMes>
          {doMes.length === 0
            ? "Nenhuma banca neste mês"
            : `${doMes.length} ${doMes.length === 1 ? "banca" : "bancas"} neste mês`}
        </ResumoMes>
      </Cabecalho>

      <GradeWrap>
        <Grade>
          <WeekdayRow>
            {ROTULOS.map((r) => (
              <WeekdayCell key={r}>{r}</WeekdayCell>
            ))}
          </WeekdayRow>
          {semanasDoMes(mes, INICIO_SEMANA).map((semana) => (
            <LinhaSemana key={chaveData(semana[0])}>
              {semana.map((dia) => {
                const chave = chaveData(dia);
                const doDia = porDia.get(chave) ?? [];
                return (
                  <CelulaDia key={chave} $outside={!isSameMonth(dia, mes)}>
                    <DayNumber $today={isToday(dia)}>{format(dia, "d")}</DayNumber>
                    <DayEvents>
                      {doDia.map((b) => {
                        const hora = horaDe(b.data_hora);
                        const lotada = b.alocados >= b.vagas;
                        return (
                          <PilulaBanca
                            key={b.id}
                            type="button"
                            $cor={COR_STATUS[b.status]}
                            title={`${hora} · ${b.nome_projeto} · ${ROTULO_CURTO[b.status]} · ${b.alocados}/${b.vagas} avaliadores`}
                            onClick={() => onAbrirBanca(b)}
                          >
                            {chocados.has(`${chave}T${hora}`) && (
                              <AvisoChoque>⚠ mesmo horário</AvisoChoque>
                            )}
                            <PilulaHora>{hora}</PilulaHora>
                            <PilulaProjeto>{b.nome_projeto}</PilulaProjeto>
                            <PilulaVagas $lotada={lotada}>
                              {b.alocados}/{b.vagas}
                            </PilulaVagas>
                          </PilulaBanca>
                        );
                      })}
                    </DayEvents>
                  </CelulaDia>
                );
              })}
            </LinhaSemana>
          ))}
        </Grade>
      </GradeWrap>

      <Legenda>
        {(Object.keys(COR_STATUS) as StatusBanca[]).map((status) => (
          <LegendaItem key={status}>
            <LegendaCor $cor={COR_STATUS[status]} />
            {ROTULO_CURTO[status]}
          </LegendaItem>
        ))}
        <LegendaItem>
          <LegendaCor $cor={theme.colors.mutedForeground} />
          O número embaixo é <strong>&nbsp;alocados/vagas</strong>
        </LegendaItem>
      </Legenda>

      {bancas.length === 0 && <EmptyText>Nenhuma banca marcada.</EmptyText>}
    </CalendarioWrap>
  );
}
