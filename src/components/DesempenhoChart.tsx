import {
  ChartWrapper,
  DonutBox,
  DonutCenter,
  DonutValue,
  Legend,
  LegendEmpty,
  LegendItem,
  LegendSwatch,
} from "./DesempenhoChart.styled";

// Donut "part-to-whole": fatias somam ao total de bancas atendidas no
// semestre, uma fatia por frente. Cores fixas na ordem categórica validada
// (ver skill de dataviz) — nunca cicladas, sempre a mesma frente = mesma cor.
// Cap em 3 frentes (validado all-pairs); o resto agrupa em "Outros" cinza.
const CORES = ["--chart-series-1", "--chart-series-2", "--chart-series-3"] as const;

export interface FatiaDonut {
  nome: string;
  valor: number;
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
  const ordenadas = [...fatias].filter((f) => f.valor > 0).sort((a, b) => b.valor - a.valor);
  const principais = ordenadas.slice(0, CORES.length);
  const outros = ordenadas.slice(CORES.length).reduce((soma, f) => soma + f.valor, 0);
  const fatiasFinais = outros > 0 ? [...principais, { nome: "Outros", valor: outros }] : principais;

  const total = fatiasFinais.reduce((soma, f) => soma + f.valor, 0);
  const percentualExibido = percentual != null ? Math.round(percentual) : 0;
  const raio = 15.5;
  const circunferencia = 2 * Math.PI * raio;

  let acumulado = 0;
  const segmentos = fatiasFinais.map((f, i) => {
    const fracao = total > 0 ? f.valor / total : 0;
    const comprimento = fracao * circunferencia;
    const offset = acumulado;
    acumulado += comprimento;
    const cor = f.nome === "Outros" ? "var(--muted-foreground)" : `var(${CORES[i % CORES.length]})`;
    return { ...f, fracao, comprimento, offset, cor };
  });

  return (
    <ChartWrapper>
      <DonutBox>
        <svg viewBox="0 0 40 40" width={128} height={128} role="img" aria-label={ariaLabel ?? `${percentualExibido}% de bancas atendidas`}>
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
            >
              <title>
                {s.nome}: {s.valor} ({Math.round(s.fracao * 100)}%)
              </title>
            </circle>
          ))}
        </svg>
        <DonutCenter>
          <DonutValue>{valorCentral ?? `${percentualExibido}%`}</DonutValue>
        </DonutCenter>
      </DonutBox>

      <Legend>
        {segmentos.length === 0 && <LegendEmpty>Sem bancas atendidas ainda</LegendEmpty>}
        {segmentos.map((s) => (
          <LegendItem key={s.nome}>
            <LegendSwatch $cor={s.cor} aria-hidden />
            <span>{s.nome}</span>
          </LegendItem>
        ))}
      </Legend>
    </ChartWrapper>
  );
}
