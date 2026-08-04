import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, isSameMonth, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  WeekRow,
  WeekdayCell,
  WeekdayRow,
} from "@/components/calendario/CalendarGrid.styled";
import { chaveData, rotulosDiaSemana, semanasDoMes } from "@/components/calendario/semanas";
import { tonsDaCor } from "./cores";
import {
  BlocoMes,
  CronogramaScroll,
  MarcoGlifo,
  NumeroDia,
  PaintedDayCell,
  TituloMes,
} from "./PaintedCalendar.styled";

/** §6.4 pede seg–dom para o cronograma. */
const INICIO_SEMANA = 1;
const ROTULOS = rotulosDiaSemana(INICIO_SEMANA);

export interface EtapaPintavel {
  id: number;
  nome: string;
  cor: string;
  data_inicio: string;
  data_fim: string;
  ordem: number;
}

export interface MarcoRenderizavel {
  /** Chave `yyyy-MM-dd`. */
  data: string;
  glifo: string;
  titulo: string;
}

export interface FaixaDerivada {
  tipo: "ambientacao" | "pausa";
  inicio: string;
  fim: string;
  rotulo: string;
  cor: string;
}

export interface DiaNaoUtil {
  tipo: string;
  descricao: string | null;
}

interface PaintedCalendarProps {
  /** 1º dia de cada mês a renderizar, já derivado pela página. */
  meses: Date[];
  etapas: EtapaPintavel[];
  marcos: MarcoRenderizavel[];
  faixas: FaixaDerivada[];
  /** Chave `yyyy-MM-dd` → motivo. Vem do backend: `dias_uteis.py` é a
   *  definição única, e recalcular fim de semana aqui divergiria no dia em
   *  que a diretoria carregar um recesso. */
  diasNaoUteis: Map<string, DiaNaoUtil>;
  /** A etapa do "🖌 pintando: X". `null` = cursor de leitura. */
  etapaAtiva: number | null;
  somenteLeitura?: boolean;
  onPaintRange: (etapaId: number, inicio: string, fim: string) => void;
  /** Notifica o intervalo em construção, para a barra mostrar a contagem. */
  onArrasteMudou?: (intervalo: { inicio: string; fim: string } | null) => void;
}

interface Arraste {
  etapaId: number;
  ancora: string;
  hover: string;
}

/**
 * O calendário pintável do §6.4 — meses empilhados, seg–dom, arrastar para
 * pintar um intervalo.
 *
 * Controlado e sem fetch próprio de propósito: é o que o torna testável e o
 * que faz o export ser determinístico.
 */
export function PaintedCalendar({
  meses,
  etapas,
  marcos,
  faixas,
  diasNaoUteis,
  etapaAtiva,
  somenteLeitura,
  onPaintRange,
  onArrasteMudou,
}: PaintedCalendarProps) {
  const [arraste, setArraste] = useState<Arraste | null>(null);
  const rafRef = useRef<number | null>(null);
  const arrasteRef = useRef<Arraste | null>(null);
  arrasteRef.current = arraste;

  const marcosPorDia = useMemo(() => {
    const mapa = new Map<string, MarcoRenderizavel[]>();
    for (const m of marcos) {
      const lista = mapa.get(m.data) ?? [];
      lista.push(m);
      mapa.set(m.data, lista);
    }
    return mapa;
  }, [marcos]);

  /**
   * Funde as etapas persistidas com uma etapa **virtual** montada do arraste.
   * O renderizador da célula não sabe a diferença — só pergunta "quem é dona
   * desta data?". É isso que faz o preview aparecer sem estado duplicado.
   */
  const donaDoDia = useMemo(() => {
    const mapa = new Map<string, { cor: string; texto: string; preview: boolean }>();

    const pintar = (inicio: string, fim: string, cor: string, preview: boolean) => {
      const tons = tonsDaCor(cor);
      for (const chave of diasDoIntervalo(inicio, fim)) {
        mapa.set(chave, { cor: tons.fundo, texto: tons.texto, preview });
      }
    };

    // Faixas derivadas primeiro (ficam por baixo).
    for (const faixa of faixas) {
      pintar(faixa.inicio, faixa.fim, faixa.cor, false);
    }
    // Etapas por ordem: a de maior `ordem` ganha o desempate de sobreposição.
    for (const etapa of [...etapas].sort((a, b) => a.ordem - b.ordem)) {
      pintar(etapa.data_inicio, etapa.data_fim, etapa.cor, false);
    }
    // O preview por último — sempre visível por cima.
    if (arraste) {
      const etapa = etapas.find((e) => e.id === arraste.etapaId);
      if (etapa) {
        const inicio = arraste.ancora <= arraste.hover ? arraste.ancora : arraste.hover;
        const fim = arraste.ancora <= arraste.hover ? arraste.hover : arraste.ancora;
        pintar(inicio, fim, etapa.cor, true);
      }
    }
    return mapa;
  }, [etapas, faixas, arraste]);

  const pintavel = useCallback(
    (chave: string) => !somenteLeitura && etapaAtiva !== null && !diasNaoUteis.has(chave),
    [somenteLeitura, etapaAtiva, diasNaoUteis],
  );

  function iniciarArraste(e: React.PointerEvent<HTMLDivElement>, chave: string) {
    if (!pintavel(chave) || e.button !== 0) return;
    // Mata a seleção de texto nativa sobre a grade.
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setArraste({ etapaId: etapaAtiva!, ancora: chave, hover: chave });
  }

  // pointermove/up ficam na WINDOW: o ponteiro sai da célula o tempo todo
  // durante um arrasto, e com pointer capture `e.target` deixa de ajudar.
  useEffect(() => {
    if (!arraste) return;

    function aoMover(e: PointerEvent) {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        // Hit-test por `data-dia`: `elementFromPoint` porque `e.target` é o
        // elemento capturador durante todo o arrasto.
        const alvo = document
          .elementFromPoint(e.clientX, e.clientY)
          ?.closest<HTMLElement>("[data-dia]");
        const chave = alvo?.dataset.dia;
        // Sem alvo (ponteiro na legenda, no vão entre meses, fora da janela)
        // MANTÉM o último hover — senão o preview pisca a cada borda.
        if (!chave) return;
        setArraste((atual) => (atual && atual.hover !== chave ? { ...atual, hover: chave } : atual));
      });
    }

    function aoSoltar(e: PointerEvent) {
      const atual = arrasteRef.current;
      setArraste(null);
      onArrasteMudou?.(null);
      if (!atual) return;

      // ⚠ Hit-test do ponto FINAL aqui, e não confiar só no `hover`: num
      // arrasto rápido o último `pointermove` pode ter sido descartado pelo
      // throttle de rAF, e o intervalo sairia curto — a etapa terminaria
      // antes de onde o dedo soltou.
      const alvoFinal = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest<HTMLElement>("[data-dia]");
      const fimReal = alvoFinal?.dataset.dia ?? atual.hover;

      const bruto =
        atual.ancora <= fimReal
          ? { inicio: atual.ancora, fim: fimReal }
          : { inicio: fimReal, fim: atual.ancora };
      const aparado = apararPontas(bruto.inicio, bruto.fim, diasNaoUteis);
      if (!aparado) return; // intervalo inteiro em dia não útil: aborta calado
      onPaintRange(atual.etapaId, aparado.inicio, aparado.fim);
    }

    window.addEventListener("pointermove", aoMover);
    window.addEventListener("pointerup", aoSoltar);
    window.addEventListener("pointercancel", aoSoltar);
    return () => {
      window.removeEventListener("pointermove", aoMover);
      window.removeEventListener("pointerup", aoSoltar);
      window.removeEventListener("pointercancel", aoSoltar);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [arraste, diasNaoUteis, onPaintRange, onArrasteMudou]);

  // Avisa a barra do intervalo em construção, para a contagem viva.
  useEffect(() => {
    if (!arraste) return;
    const inicio = arraste.ancora <= arraste.hover ? arraste.ancora : arraste.hover;
    const fim = arraste.ancora <= arraste.hover ? arraste.hover : arraste.ancora;
    onArrasteMudou?.({ inicio, fim });
  }, [arraste, onArrasteMudou]);

  return (
    <CronogramaScroll data-cronograma-export>
      {meses.map((mes) => (
        <BlocoMes key={chaveData(mes)}>
          <TituloMes>{format(mes, "MMMM 'de' yyyy", { locale: ptBR })}</TituloMes>
          <WeekdayRow>
            {ROTULOS.map((rotulo) => (
              <WeekdayCell key={rotulo}>{rotulo}</WeekdayCell>
            ))}
          </WeekdayRow>
          {semanasDoMes(mes, INICIO_SEMANA).map((semana) => (
            <WeekRow key={`${chaveData(mes)}-${chaveData(semana[0])}`}>
              {semana.map((dia) => {
                const chave = chaveData(dia);
                const doMes = isSameMonth(dia, mes);
                const naoUtil = diasNaoUteis.get(chave);
                const dona = donaDoDia.get(chave);
                const marcosDoDia = marcosPorDia.get(chave) ?? [];

                // Dia de mês vizinho vira placeholder vazio: com meses
                // empilhados a mesma data cairia em DOIS blocos.
                if (!doMes) {
                  return <PaintedDayCell key={chave} $vazia $compacto />;
                }

                return (
                  <PaintedDayCell
                    key={chave}
                    data-dia={chave}
                    $compacto
                    $naoUtil={!!naoUtil}
                    $cor={dona?.cor}
                    $texto={dona?.texto}
                    $preview={dona?.preview}
                    $pintavel={pintavel(chave)}
                    title={
                      naoUtil
                        ? `${rotuloNaoUtil(naoUtil.tipo)}${naoUtil.descricao ? ` — ${naoUtil.descricao}` : ""}`
                        : marcosDoDia.map((m) => m.titulo).join(" · ") || undefined
                    }
                    onPointerDown={(e) => iniciarArraste(e, chave)}
                  >
                    <NumeroDia $texto={dona?.texto} $hoje={isToday(dia)}>
                      {format(dia, "d")}
                    </NumeroDia>
                    {marcosDoDia.length > 0 && (
                      <MarcoGlifo>{marcosDoDia.map((m) => m.glifo).join("")}</MarcoGlifo>
                    )}
                  </PaintedDayCell>
                );
              })}
            </WeekRow>
          ))}
        </BlocoMes>
      ))}
    </CronogramaScroll>
  );
}

const ROTULOS_NAO_UTIL: Record<string, string> = {
  fim_de_semana: "Fim de semana",
  feriado: "Feriado",
  prova: "Semana de provas",
  recesso: "Recesso",
};

function rotuloNaoUtil(tipo: string): string {
  return ROTULOS_NAO_UTIL[tipo] ?? "Dia não letivo";
}

/**
 * As chaves `yyyy-MM-dd` de um intervalo fechado.
 *
 * O `T12:00:00` é deliberado: `new Date("2026-08-10")` é lido como UTC e
 * volta um dia no Brasil. Meio-dia local não escorrega em nenhum fuso.
 */
export function diasDoIntervalo(inicio: string, fim: string): string[] {
  const dias: string[] = [];
  const atual = new Date(`${inicio}T12:00:00`);
  const limite = new Date(`${fim}T12:00:00`);
  while (atual <= limite) {
    dias.push(chaveData(atual));
    atual.setDate(atual.getDate() + 1);
  }
  return dias;
}

/**
 * Caminha as pontas para dentro até o primeiro/último dia útil.
 *
 * Uma etapa que "começa no sábado" envenena o `contar_dias_uteis` do
 * monitoramento depois — o intervalo gravado tem que ser honesto.
 */
export function apararPontas(
  inicio: string,
  fim: string,
  diasNaoUteis: Map<string, unknown>,
): { inicio: string; fim: string } | null {
  const uteis = diasDoIntervalo(inicio, fim).filter((d) => !diasNaoUteis.has(d));
  if (uteis.length === 0) return null;
  return { inicio: uteis[0], fim: uteis[uteis.length - 1] };
}
