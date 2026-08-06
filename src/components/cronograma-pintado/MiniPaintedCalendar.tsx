import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CronogramaResposta } from "@/types/cronograma";
import { derivarCronogramaGeral } from "./derivar";
import { MiniFrameInner, MiniFrameOuter } from "./MiniPaintedCalendar.styled";
import { PaintedCalendar } from "./PaintedCalendar";
import { blocosDaVisao } from "./visao";

/** A largura em que o calendário é renderizado em tamanho NATURAL antes de
 *  medir e encolher — arbitrária, só precisa ser larga o bastante para as 7
 *  colunas não espremerem o número do dia. */
const LARGURA_REFERENCIA = 640;

const SEM_BLOCOS = blocosDaVisao("mes", new Date());

function semAcao() {
  // Read-only: PaintedCalendar exige os callbacks, mas nada aqui pinta.
}

interface MiniPaintedCalendarProps {
  cronograma: CronogramaResposta;
}

/**
 * O mês atual do projeto inteiro (todos os escopos juntos, como o modo
 * "Geral" da aba Cronograma), em miniatura e só leitura — um card do board
 * macro de cronogramas (§7).
 *
 * A escala é medida, não chutada: o calendário é montado em tamanho real
 * numa largura de referência fixa, a altura resultante é lida do DOM, e só
 * então o conjunto encolhe para caber na largura do card. Um `zoom` CSS fixo
 * cortava o mês pela metade sempre que a altura natural variava (mês de 5 x
 * 6 semanas, ou fonte carregando depois) — medir é o que garante o mês
 * inteiro visível em qualquer card.
 */
export function MiniPaintedCalendar({ cronograma }: MiniPaintedCalendarProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [dimensoes, setDimensoes] = useState<{ fator: number; altura: number } | null>(null);

  const derivado = useMemo(() => derivarCronogramaGeral(cronograma), [cronograma]);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    // O `inner` é medido em tamanho natural (sem transform aplicado ainda) —
    // é essa altura que dita quanto o conjunto precisa encolher.
    const inner = outer.firstElementChild as HTMLElement | null;
    if (!inner) return;

    function medir() {
      if (!outer || !inner) return;
      const larguraDisponivel = outer.clientWidth;
      const alturaNatural = inner.scrollHeight;
      if (larguraDisponivel <= 0 || alturaNatural <= 0) return;
      const fator = larguraDisponivel / LARGURA_REFERENCIA;
      setDimensoes({ fator, altura: alturaNatural * fator });
    }

    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(outer);
    return () => observador.disconnect();
  }, [derivado]);

  return (
    <MiniFrameOuter ref={outerRef} style={{ height: dimensoes ? `${dimensoes.altura}px` : undefined }}>
      <MiniFrameInner
        style={{
          width: LARGURA_REFERENCIA,
          transform: dimensoes ? `scale(${dimensoes.fator})` : undefined,
        }}
      >
        <PaintedCalendar
          blocos={SEM_BLOCOS}
          visao="mes"
          etapas={derivado.etapas}
          marcos={derivado.marcos}
          faixas={derivado.faixas}
          diasNaoUteis={derivado.diasNaoUteis}
          grupoAtivo={null}
          somenteLeitura
          semScrollProprio
          onPaintRange={semAcao}
        />
      </MiniFrameInner>
    </MiniFrameOuter>
  );
}
