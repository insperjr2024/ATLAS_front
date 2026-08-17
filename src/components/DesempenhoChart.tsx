import { useState } from "react";
import {
  ChartWrapper,
  DonutBox,
  DonutCenter,
  DonutValue,
  Legend,
  LegendEmpty,
  LegendItem,
  LegendSwatch,
  Tooltip,
  TooltipLista,
  TooltipTitulo,
} from "./DesempenhoChart.styled";

/** Quantos nomes cabem no balão antes de virar parede de texto — mesmo
 *  limite de `PizzaEtapas` (Monitoramento), pro comportamento de "e mais N"
 *  ser consistente entre os dois donuts do app. */
const MAX_NO_BALAO = 8;

// Donut "part-to-whole": fatias somam ao total de bancas atendidas no
// semestre, uma fatia por frente.
//
// Cor por IDENTIDADE da frente, não por ranking — Engenharia de Processos é
// sempre o vermelho escuro, Business é sempre o carvão, não importa qual
// frente teve mais bancas naquele semestre. Antes a cor vinha da posição no
// `sort()` por valor, então a MESMA frente podia trocar de cor de um
// semestre pro outro (se ela virasse a maior ou a menor fatia) — o oposto
// do que "sempre a mesma frente = mesma cor" promete. "Outros" continua
// existindo, mas agora só pega quem não está neste mapa (uma 5ª frente
// futura), não mais o resto de uma lista ordenada.
const CORES_POR_FRENTE: Record<string, string> = {
  Business: "var(--chart-series-1)",
  Direito: "var(--chart-series-2)",
  Tech: "var(--chart-series-3)",
  "Engenharia de Processos": "var(--chart-series-4)",
};
// Ordem fixa de exibição na legenda — sem isso, a ordem mudaria a cada
// carregamento junto com a ordem em que `fatias` chega.
const ORDEM_FRENTES = Object.keys(CORES_POR_FRENTE);

export interface FatiaDonut {
  nome: string;
  valor: number;
  /** Quem compõe a fatia, pro balão de hover responder "quais são esses N"
   *  em vez de só repetir o número que a legenda já mostra. Opcional: nem
   *  todo lugar que monta um `FatiaDonut` tem a lista à mão (ex.: um
   *  agregado que só soma valores sem guardar as bancas de origem). */
  itens?: string[];
}

export function DesempenhoChart({
  fatias,
  percentual,
  valorCentral,
  ariaLabel,
}: {
  fatias: FatiaDonut[];
  percentual?: number;
  valorCentral?: string;
  ariaLabel?: string;
}) {
  const comValor = fatias.filter((f) => f.valor > 0);
  const conhecidas = comValor
    .filter((f) => CORES_POR_FRENTE[f.nome])
    .sort((a, b) => ORDEM_FRENTES.indexOf(a.nome) - ORDEM_FRENTES.indexOf(b.nome));
  const desconhecidas = comValor.filter((f) => !CORES_POR_FRENTE[f.nome]);
  const outros = desconhecidas.reduce((soma, f) => soma + f.valor, 0);
  const fatiasFinais =
    outros > 0
      ? [...conhecidas, { nome: "Outros", valor: outros, itens: desconhecidas.flatMap((f) => f.itens ?? []) }]
      : conhecidas;

  const total = fatiasFinais.reduce((soma, f) => soma + f.valor, 0);
  const raio = 15.5;
  const circunferencia = 2 * Math.PI * raio;

  let acumulado = 0;
  const segmentos = fatiasFinais.map((f) => {
    const fracao = total > 0 ? f.valor / total : 0;
    const comprimento = fracao * circunferencia;
    const offset = acumulado;
    acumulado += comprimento;
    const cor = f.nome === "Outros" ? "var(--muted-foreground)" : CORES_POR_FRENTE[f.nome];
    return { ...f, fracao, comprimento, offset, cor };
  });

  // Tooltip de verdade, tipo dashboard: só o próprio desenho do donut reage
  // — não a legenda, que já mostra nome/valor/% escritos direto no texto.
  // `pos` é a posição do mouse relativa à caixa do gráfico, pra a caixinha
  // aparecer colada no cursor, não fixa num canto.
  const [hover, setHover] = useState<(typeof segmentos)[number] | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  function moverMouse(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <ChartWrapper>
      <DonutBox>
        <svg
          viewBox="0 0 40 40"
          width={128}
          height={128}
          role="img"
          aria-label={ariaLabel ?? `${percentual ?? 0}% de bancas atendidas`}
          onMouseMove={moverMouse}
          onMouseLeave={() => {
            setHover(null);
            setPos(null);
          }}
        >
          <circle cx="20" cy="20" r={raio} fill="none" stroke="var(--border)" strokeWidth="5" />
          {segmentos.map((s) => (
            <circle
              key={s.nome}
              cx="20"
              cy="20"
              r={raio}
              fill="none"
              stroke={s.cor}
              strokeWidth="5"
              strokeDasharray={`${s.comprimento} ${circunferencia - s.comprimento}`}
              strokeDashoffset={-s.offset}
              transform="rotate(-90 20 20)"
              strokeLinecap="butt"
              onMouseEnter={() => setHover(s)}
            />
          ))}
        </svg>
        <DonutCenter>
          <DonutValue>{valorCentral ?? `${percentual ?? 0}%`}</DonutValue>
        </DonutCenter>

        {hover && pos && (
          <Tooltip style={{ left: pos.x, top: pos.y }}>
            <TooltipTitulo>
              <LegendSwatch $cor={hover.cor} aria-hidden />
              {hover.nome}
              <b>
                {hover.valor} ({Math.round(hover.fracao * 100)}%)
              </b>
            </TooltipTitulo>
            {hover.itens && hover.itens.length > 0 && (
              <TooltipLista>
                {hover.itens.slice(0, MAX_NO_BALAO).map((nome, i) => (
                  <li key={i}>{nome}</li>
                ))}
                {hover.itens.length > MAX_NO_BALAO && (
                  <li data-resto="true">e mais {hover.itens.length - MAX_NO_BALAO}</li>
                )}
              </TooltipLista>
            )}
          </Tooltip>
        )}
      </DonutBox>

      <Legend>
        {segmentos.length === 0 && <LegendEmpty>Sem bancas atendidas ainda</LegendEmpty>}
        {segmentos.map((s) => (
          <LegendItem key={s.nome}>
            <LegendSwatch $cor={s.cor} aria-hidden />
            <span>
              {s.nome} · {s.valor} ({Math.round(s.fracao * 100)}%)
            </span>
          </LegendItem>
        ))}
      </Legend>
    </ChartWrapper>
  );
}
